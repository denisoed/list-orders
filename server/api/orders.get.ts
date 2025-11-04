import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * GET /api/orders
 * Returns list of orders for the authenticated user
 * Optional query parameter: project_id - filter by project
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

    const query = getQuery(event)
    const projectId = query.project_id as string | undefined

    const supabase = getSupabaseClient()

    // Build query
    let ordersQuery = supabase
      .from('orders')
      .select('*')
      .eq('user_telegram_id', userTelegramId)

    // Filter by project if provided
    if (projectId) {
      ordersQuery = ordersQuery.eq('project_id', projectId)
    }

    // Execute query with ordering
    const { data: orders, error } = await ordersQuery
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Orders API] Error fetching orders:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch orders'
      }))
    }

    // Transform database fields to match frontend Order interface
    const transformedOrders = orders.map((order) => ({
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
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }))

    return transformedOrders
  } catch (error) {
    console.error('[Orders API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})
