import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'
import { checkProjectAccess } from '~/server/utils/checkProjectAccess'

/**
 * GET /api/orders/[id]
 * Returns a single order by ID for the authenticated user
 */
export default defineEventHandler(async (event) => {
  try {
    // Get user telegram_id from request
    const userTelegramId = await getUserTelegramIdFromRequest(event)

    if (!userTelegramId) {
      return sendError(event, createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid or missing initData'
      }))
    }

    const orderId = getRouterParam(event, 'id')

    if (!orderId) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Order ID is required'
      }))
    }

    const supabase = getSupabaseClient()

    // Fetch order (without user_telegram_id filter to check project access)
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return sendError(event, createError({
          statusCode: 404,
          message: 'Order not found'
        }))
      }

      console.error('[Orders API] Error fetching order:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch order'
      }))
    }

    // Check if user has access to the project
    const hasAccess = await checkProjectAccess(supabase, userTelegramId, order.project_id)

    if (!hasAccess) {
      return sendError(event, createError({
        statusCode: 404,
        message: 'Order not found'
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
      imageUrls: order.image_urls || [],
      reviewComment: order.review_comment || null,
      reviewImages: order.review_images || [],
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
