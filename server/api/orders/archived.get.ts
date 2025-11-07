import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * GET /api/orders/archived
 * Returns list of archived orders available to the authenticated user
 */
export default defineEventHandler(async (event) => {
  try {
    const userTelegramId = await getUserTelegramIdFromRequest(event)

    if (!userTelegramId) {
      return sendError(event, createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid or missing initData',
      }))
    }

    const supabase = getSupabaseClient()

    const [ownedProjectsResult, memberProjectsResult] = await Promise.all([
      supabase
        .from('projects')
        .select('id')
        .eq('user_telegram_id', userTelegramId),
      supabase
        .from('project_members')
        .select('project_id')
        .eq('member_telegram_id', userTelegramId),
    ])

    const { data: ownedProjects } = ownedProjectsResult
    const { data: memberProjects } = memberProjectsResult

    const ownedIds = (ownedProjects || []).map((project: any) => project.id)
    const memberIds = (memberProjects || []).map((project: any) => project.project_id)
    const accessibleProjectIds = [...new Set([...ownedIds, ...memberIds])]

    if (accessibleProjectIds.length === 0) {
      return []
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .in('project_id', accessibleProjectIds)
      .eq('archived', true)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[ArchivedOrders API] Error fetching archived orders:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch archived orders',
      }))
    }

    return (orders || []).map((order) => ({
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
      creatorTelegramName: null,
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
    }))
  } catch (error) {
    console.error('[ArchivedOrders API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error',
    }))
  }
})
