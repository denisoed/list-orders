import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'
import { checkProjectAccess } from '~/server/utils/checkProjectAccess'
import { sendTelegramMessage } from '~/server/api/telegram'
import { Markup } from 'telegraf'

const applyRequiredFieldFallback = (
  value: string | null | undefined,
  fallback: string,
): string | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? value : fallback
}

/**
 * PUT /api/orders/[id]
 * Updates an existing order for the authenticated user
 */
export default defineEventHandler(async (event) => {
  try {
    const orderId = getRouterParam(event, 'id')

    if (!orderId) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Order ID is required'
      }))
    }

    // Read body first to avoid reading it twice
    const body = await readBody(event)

    // Get user telegram_id from request (pass body to avoid reading it again)
    const userTelegramId = await getUserTelegramIdFromRequest(event, body)

    if (!userTelegramId) {
      return sendError(event, createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid or missing initData'
      }))
    }

    const supabase = getSupabaseClient()

    // Prepare update data
    const updateData: {
      title?: string | null
      summary?: string
      description?: string
      status?: string
      assignee_telegram_id?: number | null
      due_date?: string | null
      due_time?: string | null
      delivery_address?: string | null
      reminder_offset?: string | null
      client_name?: string | null
      client_phone?: string | null
      payment_type?: string | null
      prepayment_amount?: number | null
      total_amount?: number | null
      assignee_telegram_name?: string | null
      assignee_telegram_avatar_url?: string | null
      image_urls?: string[]
      review_comment?: string | null
      review_images?: string[]
      review_answer?: string | null
    } = {}

    if (body.title !== undefined) {
      if (body.title === null) {
        updateData.title = null
      } else if (typeof body.title === 'string') {
        updateData.title = body.title.trim() || null
      } else {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Title must be a string'
        }))
      }
    }

    if (body.summary !== undefined) {
      updateData.summary = body.summary?.trim() || ''
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || ''
    }

    if (body.status !== undefined) {
      updateData.status = body.status || 'new'
    }

    if (body.assignee_telegram_id !== undefined) {
      updateData.assignee_telegram_id = body.assignee_telegram_id || null
    }

    if (body.due_date !== undefined) {
      updateData.due_date = body.due_date || null
    }

    if (body.due_time !== undefined) {
      updateData.due_time = body.due_time || null
    }

    if (body.delivery_address !== undefined) {
      updateData.delivery_address = body.delivery_address || null
    }

    if (body.reminder_offset !== undefined) {
      // Validate that reminder_offset is a string (not a timestamp)
      // It should be values like "1h", "3h", "1d"
      if (body.reminder_offset === null || typeof body.reminder_offset === 'string') {
        updateData.reminder_offset = body.reminder_offset || null
      } else {
        console.warn('[Orders API] Invalid reminder_offset type:', typeof body.reminder_offset)
        // Skip reminder_offset if it's not a string or null
      }
    }

    if (body.client_name !== undefined) {
      if (body.client_name === null) {
        updateData.client_name = null
      } else if (typeof body.client_name === 'string') {
        updateData.client_name = body.client_name.trim() || null
      } else {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Client name must be a string'
        }))
      }
    }

    if (body.client_phone !== undefined) {
      if (body.client_phone === null) {
        updateData.client_phone = null
      } else if (typeof body.client_phone === 'string') {
        updateData.client_phone = body.client_phone.trim() || null
      } else {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Client phone must be a string'
        }))
      }
    }

    if (body.payment_type !== undefined) {
      updateData.payment_type = body.payment_type || null
    }

    if (body.prepayment_amount !== undefined) {
      updateData.prepayment_amount = body.prepayment_amount !== null ? Number(body.prepayment_amount) : null
    }

    if (body.total_amount !== undefined) {
      updateData.total_amount = body.total_amount !== null ? Number(body.total_amount) : null
    }

    if (body.assignee_telegram_name !== undefined) {
      updateData.assignee_telegram_name = body.assignee_telegram_name || null
    }

    if (body.assignee_telegram_avatar_url !== undefined) {
      updateData.assignee_telegram_avatar_url = body.assignee_telegram_avatar_url || null
    }

    if (body.image_urls !== undefined) {
      // Validate image_urls is an array
      if (Array.isArray(body.image_urls)) {
        const filteredUrls = body.image_urls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        updateData.image_urls = filteredUrls
        console.log('[Orders API] Updating image_urls:', {
          orderId,
          count: filteredUrls.length,
          urls: filteredUrls,
        })
      } else {
        updateData.image_urls = []
        console.log('[Orders API] image_urls is not an array, setting to empty array')
      }
    }

    if (body.review_comment !== undefined) {
      updateData.review_comment = body.review_comment?.trim() || null
    }

    if (body.review_images !== undefined) {
      // Validate review_images is an array
      if (Array.isArray(body.review_images)) {
        const filteredUrls = body.review_images.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        updateData.review_images = filteredUrls
        console.log('[Orders API] Updating review_images:', {
          orderId,
          count: filteredUrls.length,
          urls: filteredUrls,
        })
      } else {
        updateData.review_images = []
        console.log('[Orders API] review_images is not an array, setting to empty array')
      }
    }

    if (body.review_answer !== undefined) {
      updateData.review_answer = body.review_answer?.trim() || null
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'No fields to update'
      }))
    }

    const titleWithFallback = applyRequiredFieldFallback(updateData.title, 'Без названия')
    if (titleWithFallback !== undefined) {
      updateData.title = titleWithFallback
    }

    const clientNameWithFallback = applyRequiredFieldFallback(updateData.client_name, 'Без имени')
    if (clientNameWithFallback !== undefined) {
      updateData.client_name = clientNameWithFallback
    }

    const clientPhoneWithFallback = applyRequiredFieldFallback(updateData.client_phone, 'Не указан')
    if (clientPhoneWithFallback !== undefined) {
      updateData.client_phone = clientPhoneWithFallback
    }

    // First, fetch the order to check project access and get current status
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('project_id, status, user_telegram_id, assignee_telegram_id')
      .eq('id', orderId)
      .single()

    if (!existingOrder) {
      return sendError(event, createError({
        statusCode: 404,
        message: 'Order not found'
      }))
    }

    // Check if user has access to the project
    const hasAccess = await checkProjectAccess(supabase, userTelegramId, existingOrder.project_id)

    if (!hasAccess) {
      return sendError(event, createError({
        statusCode: 404,
        message: 'Order not found'
      }))
    }

    // Check if status is being changed to 'in_progress'
    const isStatusChangedToInProgress = 
      updateData.status === 'in_progress' && 
      existingOrder.status !== 'in_progress'

    // Update order
    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('[Orders API] Error updating order:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to update order'
      }))
    }

    // Send notification if order was taken in work
    // Only send if: status changed to in_progress AND (no assignee OR was pending)
    const shouldSendNotification = 
      isStatusChangedToInProgress && 
      existingOrder.user_telegram_id &&
      (!existingOrder.assignee_telegram_id || existingOrder.status === 'pending')

    if (shouldSendNotification) {
      const assigneeName = order.assignee_telegram_name || 'Исполнитель'
      const orderTitle = order.title || 'Задача'
      const message = `Ваша задача "<b>${orderTitle}</b>" взята в работу.\n\nИсполнитель: <b>${assigneeName}</b>`
      
      // Create button with link to order
      const appUrl = process.env.APP_URL || 'https://list-orders.vercel.app'
      const orderUrl = `${appUrl}/orders/${orderId}`
      
      const replyMarkup = Markup.inlineKeyboard([
        [Markup.button.webApp('Перейти к задаче', orderUrl)],
      ])
      
      try {
        await sendTelegramMessage(existingOrder.user_telegram_id, message, replyMarkup)
      } catch (error) {
        console.error('[Orders API] Failed to send notification:', error)
        // Don't fail the request if notification fails
      }
    }

    // Transform database fields to match frontend Order interface
    const transformedOrder = {
      id: order.id,
      code: order.code,
      title: order.title || '',
      summary: order.summary || '',
      description: order.description || '',
      status: order.status || 'new',
      assigneeTelegramId: order.assignee_telegram_id || null,
      assigneeTelegramAvatarUrl: order.assignee_telegram_avatar_url || null,
      assigneeTelegramName: order.assignee_telegram_name || null,
      dueDate: order.due_date || null,
      dueTime: order.due_time || null,
      deliveryAddress: order.delivery_address || null,
      reminderOffset: order.reminder_offset || null,
      projectId: order.project_id,
      clientName: order.client_name || '',
      clientPhone: order.client_phone || '',
      paymentType: order.payment_type || null,
      prepaymentAmount: order.prepayment_amount ? Number(order.prepayment_amount) : null,
      totalAmount: order.total_amount ? Number(order.total_amount) : null,
      imageUrls: order.image_urls || [],
      reviewComment: order.review_comment || null,
      reviewImages: order.review_images || [],
      reviewAnswer: order.review_answer || null,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }

    return transformedOrder
  } catch (error) {
    console.error('[Orders API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})
