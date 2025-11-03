export interface ReviewAttachmentUploadResult {
  id: string
  name: string
}

export interface SubmitOrderReviewInput {
  orderId: string
  comment: string
  attachments: File[]
}

export interface SubmitOrderReviewResponse {
  status: 'pending-review'
  reviewId: string
  attachments: ReviewAttachmentUploadResult[]
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const createIdentifier = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`
}

const uploadReviewAttachment = async (file: File): Promise<ReviewAttachmentUploadResult> => {
  // Имитация задержки сети и подготовки данных для загрузки
  await delay(180 + Math.random() * 220)

  // В реальной интеграции здесь будет отправка FormData на бэкенд
  return {
    id: createIdentifier('review-attachment'),
    name: file.name,
  }
}

export const submitOrderReview = async (
  input: SubmitOrderReviewInput,
): Promise<SubmitOrderReviewResponse> => {
  const { orderId, comment, attachments } = input

  if (!orderId) {
    throw new Error('Не указан идентификатор заказа для отправки на проверку')
  }

  // Имитация подготовки полезной нагрузки
  const sanitizedComment = comment.trim()

  if (!sanitizedComment && attachments.length === 0) {
    throw new Error('Добавьте комментарий или хотя бы одну фотографию перед отправкой')
  }

  try {
    const uploadedAttachments = await Promise.all(attachments.map(uploadReviewAttachment))

    await delay(240 + Math.random() * 260)

    return {
      status: 'pending-review',
      reviewId: createIdentifier(`review-${orderId}`),
      attachments: uploadedAttachments,
    }
  } catch (error) {
    console.error('Ошибка отправки заказа на проверку', error)
    throw error
  }
}
