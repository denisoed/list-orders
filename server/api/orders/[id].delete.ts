import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

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

    // Check if order exists and belongs to the user
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('user_telegram_id', userTelegramId)
      .single()

    if (!existingOrder) {
      return sendError(event, createError({
        statusCode: 404,
        message: 'Order not found'
      }))
    }

    // Delete order (only if it belongs to the user)
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .eq('user_telegram_id', userTelegramId)

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
