import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'
import { checkProjectAccess } from '~/server/utils/checkProjectAccess'
import { fetchOrderHistory } from '~/server/utils/orderHistory'
import { getUserDisplayName } from '~/server/utils/users'

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

    // Fetch order
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

    const [creatorName, historyRecords] = await Promise.all([
      order.user_telegram_id
        ? getUserDisplayName(supabase, order.user_telegram_id)
        : Promise.resolve<string | null>(null),
      fetchOrderHistory(supabase, orderId),
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
      creatorTelegramId: order.user_telegram_id || null,
      creatorTelegramName: creatorName,
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
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      history: historyRecords.map((record) => ({
        id: record.id,
        eventType: record.event_type,
        description: record.description,
        icon: record.icon,
        createdAt: record.created_at,
        createdByName: record.created_by_name,
      })),
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
