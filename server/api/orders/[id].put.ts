import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

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
      title?: string
      summary?: string
      description?: string
      status?: string
      assignee_telegram_id?: number | null
      due_date?: string | null
      due_time?: string | null
      delivery_address?: string | null
      reminder_offset?: string | null
      client_name?: string
      client_phone?: string
      payment_type?: string | null
      prepayment_amount?: number | null
      total_amount?: number | null
      assignee_telegram_name?: string | null
      assignee_telegram_avatar_url?: string | null
    } = {}

    if (body.title !== undefined) {
      if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Title cannot be empty'
        }))
      }
      updateData.title = body.title.trim()
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
      updateData.reminder_offset = body.reminder_offset || null
    }

    if (body.client_name !== undefined) {
      if (!body.client_name || typeof body.client_name !== 'string' || !body.client_name.trim()) {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Client name cannot be empty'
        }))
      }
      updateData.client_name = body.client_name.trim()
    }

    if (body.client_phone !== undefined) {
      if (!body.client_phone || typeof body.client_phone !== 'string' || !body.client_phone.trim()) {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Client phone cannot be empty'
        }))
      }
      updateData.client_phone = body.client_phone.trim()
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

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'No fields to update'
      }))
    }

    // Update order (only if it belongs to the user)
    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('user_telegram_id', userTelegramId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return sendError(event, createError({
          statusCode: 404,
          message: 'Order not found'
        }))
      }

      console.error('[Orders API] Error updating order:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to update order'
      }))
    }

    // Transform database fields to match frontend Order interface
    const transformedOrder = {
      id: order.id,
      code: order.code,
      title: order.title,
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
      clientName: order.client_name,
      clientPhone: order.client_phone,
      paymentType: order.payment_type || null,
      prepaymentAmount: order.prepayment_amount ? Number(order.prepayment_amount) : null,
      totalAmount: order.total_amount ? Number(order.total_amount) : null,
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
