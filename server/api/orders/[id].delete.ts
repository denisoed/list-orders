import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'
import { checkProjectAccess } from '~/server/utils/checkProjectAccess'

/**
 * DELETE /api/orders/[id]
 * Deletes an order for the authenticated user
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

    // Check if order exists and user has access to its project
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('project_id')
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

    // Delete order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) {
      console.error('[Orders API] Error deleting order:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to delete order'
      }))
    }

    return { success: true, message: 'Order deleted successfully' }
  } catch (error) {
    console.error('[Orders API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})
