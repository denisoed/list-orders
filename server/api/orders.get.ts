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

    // Get all project IDs where user has access (owned or member)
    let accessibleProjectIds: string[] = []

    if (projectId) {
      // If project_id is provided, check if user has access to it (parallel check)
      const [ownedProjectResult, memberProjectResult] = await Promise.all([
        supabase
          .from('projects')
          .select('id')
          .eq('id', projectId)
          .eq('user_telegram_id', userTelegramId)
          .single(),
        supabase
          .from('project_members')
          .select('project_id')
          .eq('project_id', projectId)
          .eq('member_telegram_id', userTelegramId)
          .single(),
      ])

      const { data: ownedProject } = ownedProjectResult
      const { data: memberProject } = memberProjectResult

      if (ownedProject || memberProject) {
        accessibleProjectIds = [projectId]
      } else {
        // User doesn't have access to this project
        return []
      }
    } else {
      // Get all owned project IDs and member project IDs in parallel
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

      // Combine and deduplicate project IDs
      const ownedIds = (ownedProjects || []).map((p: any) => p.id)
      const memberIds = (memberProjects || []).map((p: any) => p.project_id)
      accessibleProjectIds = [...new Set([...ownedIds, ...memberIds])]
    }

    // If no accessible projects, return empty array
    if (accessibleProjectIds.length === 0) {
      return []
    }

    // Build query for orders in accessible projects
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .in('project_id', accessibleProjectIds)
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
      creatorTelegramId: order.user_telegram_id || null,
      creatorTelegramName: null, // Not needed for list, only for details
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
      reviewAnswer: order.review_answer || null,
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
