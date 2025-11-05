import type { Order } from '~/data/orders'

export interface ReviewAttachmentUploadResult {
  id: string
  name: string
  url: string
}

export interface SubmitOrderReviewInput {
  orderId: string
  comment: string
  attachments: File[]
}

export interface SubmitOrderReviewResponse {
  status: 'review'
  orderId: string
  attachments: ReviewAttachmentUploadResult[]
}

/**
 * Gets initData from Telegram WebApp
 */
const getInitData = (): string | null => {
  if (!import.meta.client) {
    return null
  }

  const instance = window.Telegram?.WebApp ?? null
  const newInitData = instance?.initData ?? import.meta.env.telegramInitData ?? null

  // Check if initData is valid (has hash and auth_date)
  if (newInitData && typeof newInitData === 'string') {
    const hasHash = newInitData.includes('hash=')
    const hasAuthDate = newInitData.includes('auth_date=')
    if (hasHash && hasAuthDate) {
      return newInitData
    }
  }

  // Try to load from localStorage
  try {
    const stored = localStorage.getItem('telegram-init-data')
    if (stored) {
      const hasHash = stored.includes('hash=')
      const hasAuthDate = stored.includes('auth_date=')
      if (hasHash && hasAuthDate) {
        return stored
      }
    }
  } catch (error) {
    // Ignore localStorage errors
  }

  return null
}

/**
 * Uploads a single image file to Supabase storage via API
 */
const uploadReviewAttachment = async (file: File): Promise<ReviewAttachmentUploadResult> => {
  const initData = getInitData()

  const formData = new FormData()
  formData.append('file', file)

  const headers: Record<string, string> = {}
  if (initData) {
    headers['x-telegram-init-data'] = initData
  }

  const response = await $fetch<{ url: string; path: string }>('/api/images', {
    method: 'POST',
    body: formData,
    headers,
  })

  return {
    id: response.path,
    name: file.name,
    url: response.url,
  }
}

/**
 * Submits order for review by uploading images and updating order status
 */
export const submitOrderReview = async (
  input: SubmitOrderReviewInput,
): Promise<SubmitOrderReviewResponse> => {
  const { orderId, comment, attachments } = input

  if (!orderId) {
    throw new Error('Не указан идентификатор заказа для отправки на проверку')
  }

  const sanitizedComment = comment.trim()

  if (!sanitizedComment && attachments.length === 0) {
    throw new Error('Добавьте комментарий или хотя бы одну фотографию перед отправкой')
  }

  try {
    // Upload all attachments to Supabase storage
    const uploadedAttachments = await Promise.all(
      attachments.map(uploadReviewAttachment)
    )

    // Get image URLs from uploaded attachments
    const imageUrls = uploadedAttachments.map((attachment) => attachment.url)

    // Update order with review comment, review images, and status
    const initData = getInitData()
    const headers: Record<string, string> = {}
    if (initData) {
      headers['x-telegram-init-data'] = initData
    }

    await $fetch<Order>(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: {
        review_comment: sanitizedComment || null,
        review_images: imageUrls,
        status: 'review',
      },
      headers,
    })

    return {
      status: 'review',
      orderId,
      attachments: uploadedAttachments,
    }
  } catch (error) {
    console.error('Ошибка отправки заказа на проверку', error)
    throw error
  }
}
