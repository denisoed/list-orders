import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * GET /api/users
 * Returns list of all users (excluding the current user)
 * Query params:
 *   - excludeProjectId: optional project ID to exclude users already in that project
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
    const excludeProjectId = query.excludeProjectId as string | undefined

    const supabase = getSupabaseClient()

    // Build query to get all users
    let usersQuery = supabase
      .from('users')
      .select('telegram_id, first_name, last_name, username, photo_url')
      .neq('telegram_id', userTelegramId) // Exclude current user
      .order('first_name', { ascending: true })

    const { data: users, error: usersError } = await usersQuery

    if (usersError) {
      console.error('[Users API] Error fetching users:', usersError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch users'
      }))
    }

    // If excludeProjectId is provided, exclude users already in that project
    if (excludeProjectId) {
      const { data: existingMembers, error: membersError } = await supabase
        .from('project_members')
        .select('member_telegram_id')
        .eq('project_id', excludeProjectId)

      if (membersError) {
        console.error('[Users API] Error fetching project members:', membersError)
        return sendError(event, createError({
          statusCode: 500,
          message: 'Failed to fetch project members'
        }))
      }

      const existingMemberIds = new Set(
        existingMembers?.map((m) => m.member_telegram_id) || []
      )

      // Filter out users already in the project
      const filteredUsers = users.filter(
        (user) => !existingMemberIds.has(user.telegram_id)
      )

      // Transform users to match frontend interface
      const transformedUsers = filteredUsers.map((user) => ({
        id: user.telegram_id.toString(),
        telegramId: user.telegram_id,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Без имени',
        username: user.username || null,
        avatarUrl: user.photo_url || null,
      }))

      return transformedUsers
    }

    // Transform users to match frontend interface
    const transformedUsers = users.map((user) => ({
      id: user.telegram_id.toString(),
      telegramId: user.telegram_id,
      name: [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Без имени',
      username: user.username || null,
      avatarUrl: user.photo_url || null,
    }))

    return transformedUsers
  } catch (error) {
    console.error('[Users API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})
