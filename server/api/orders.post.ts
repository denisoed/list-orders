import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'
import { checkProjectAccess } from '~/server/utils/checkProjectAccess'
import { getUserDisplayName } from '~/server/utils/users'
import { addOrderHistoryEntries } from '~/server/utils/orderHistory'

const ensureRequiredField = (value: string | null | undefined, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

/**
 * POST /api/orders
 * Creates a new order for the authenticated user
 */
export default defineEventHandler(async (event) => {
  try {
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

    const projectIdInput = typeof body.project_id === 'string' ? body.project_id.trim() : null
    const sanitizedProjectId = projectIdInput && projectIdInput.length > 0 ? projectIdInput : null

    let sanitizedTitle: string | null = null
    if (body.title !== undefined && body.title !== null) {
      if (typeof body.title !== 'string') {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Title must be a string'
        }))
      }
      sanitizedTitle = body.title.trim() || null
    }

    let sanitizedClientName: string | null = null
    if (body.client_name !== undefined && body.client_name !== null) {
      if (typeof body.client_name !== 'string') {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Client name must be a string'
        }))
      }
      sanitizedClientName = body.client_name.trim() || null
    }

    let sanitizedClientPhone: string | null = null
    if (body.client_phone !== undefined && body.client_phone !== null) {
      if (typeof body.client_phone !== 'string') {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Client phone must be a string'
        }))
      }
      sanitizedClientPhone = body.client_phone.trim() || null
    }

    const supabase = getSupabaseClient()

    if (sanitizedProjectId) {
      // Verify project exists and user has access to it
      const hasAccess = await checkProjectAccess(supabase, userTelegramId, sanitizedProjectId)

      if (!hasAccess) {
        return sendError(event, createError({
          statusCode: 404,
          message: 'Project not found'
        }))
      }
    }

    // Generate order code if not provided
    let orderCode = body.code
    if (!orderCode || typeof orderCode !== 'string' || !orderCode.trim()) {
      // Generate code based on timestamp and random string
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      orderCode = `ORD-${timestamp}-${random}`
    }

    // Prepare order data
    const orderData: {
      project_id: string | null
      user_telegram_id: number
      code: string
      title: string | null
      summary?: string
      description?: string
      status?: string
      archived?: boolean
      assignee_telegram_id?: number | null
      assignee_telegram_name?: string | null
      assignee_telegram_avatar_url?: string | null
      due_date?: string | null
      delivery_address?: string | null
      reminder_offset?: string | null
      client_name: string | null
      client_phone: string | null
      payment_type?: string | null
      prepayment_amount?: number | null
      total_amount?: number | null
      image_urls?: string[]
    } = {
      project_id: sanitizedProjectId,
      user_telegram_id: userTelegramId,
      code: orderCode.trim(),
      title: ensureRequiredField(sanitizedTitle, 'Без названия'),
      client_name: ensureRequiredField(sanitizedClientName, 'Без имени'),
      client_phone: ensureRequiredField(sanitizedClientPhone, 'Не указан'),
      archived: false,
    }

    // Add optional fields
    if (body.summary !== undefined) {
      orderData.summary = body.summary?.trim() || ''
    }

    if (body.description !== undefined) {
      orderData.description = body.description?.trim() || ''
    }

    if (body.status !== undefined) {
      orderData.status = body.status || 'new'
    }

    if (body.archived !== undefined) {
      orderData.archived = body.archived === true
    }

    if (body.assignee_telegram_id !== undefined) {
      orderData.assignee_telegram_id = body.assignee_telegram_id || null
    }

    if (body.assignee_telegram_name !== undefined) {
      orderData.assignee_telegram_name = body.assignee_telegram_name || null
    }

    if (body.assignee_telegram_avatar_url !== undefined) {
      orderData.assignee_telegram_avatar_url = body.assignee_telegram_avatar_url || null
    }

    if (body.due_date !== undefined && body.due_date !== null) {
      orderData.due_date = body.due_date
    }

    if (body.delivery_address !== undefined) {
      orderData.delivery_address = body.delivery_address || null
    }

    if (body.reminder_offset !== undefined) {
      // Validate that reminder_offset is a string (not a timestamp)
      // It should be values like "1h", "3h", "1d"
      if (body.reminder_offset === null || typeof body.reminder_offset === 'string') {
        orderData.reminder_offset = body.reminder_offset || null
      } else {
        console.warn('[Orders API] Invalid reminder_offset type:', typeof body.reminder_offset)
        // Skip reminder_offset if it's not a string or null
        orderData.reminder_offset = null
      }
    }

    if (body.payment_type !== undefined) {
      orderData.payment_type = body.payment_type || null
    }

    if (body.prepayment_amount !== undefined && body.prepayment_amount !== null) {
      orderData.prepayment_amount = Number(body.prepayment_amount)
    }

    if (body.total_amount !== undefined && body.total_amount !== null) {
      orderData.total_amount = Number(body.total_amount)
    }

    if (body.image_urls !== undefined) {
      // Validate image_urls is an array
      if (Array.isArray(body.image_urls)) {
        orderData.image_urls = body.image_urls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
      } else {
        orderData.image_urls = []
      }
    }

    // Insert order
    const { data: order, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (error) {
      console.error('[Orders API] Error creating order:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to create order'
      }))
    }

    const creatorDisplayName = await getUserDisplayName(supabase, userTelegramId)

    await addOrderHistoryEntries(supabase, [
      {
        orderId: order.id,
        eventType: 'created',
        description: 'Задача создана',
        icon: 'add',
        createdBy: userTelegramId,
        createdByName: creatorDisplayName,
      },
    ])

    // Transform database fields to match frontend Order interface
    const transformedOrder = {
      id: order.id,
      code: order.code,
      title: order.title || '',
      summary: order.summary || '',
      description: order.description || '',
      status: order.status || 'new',
      archived: order.archived === true,
      assigneeTelegramId: order.assignee_telegram_id || null,
      assigneeTelegramAvatarUrl: order.assignee_telegram_avatar_url || null,
      assigneeTelegramName: order.assignee_telegram_name || null,
      dueDate: order.due_date || null,
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
      creatorTelegramId: order.user_telegram_id || null,
      creatorTelegramName: creatorDisplayName,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      history: [],
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
