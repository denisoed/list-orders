import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * GET /api/projects/[id]/members
 * Returns list of team members for a project
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

    const projectId = getRouterParam(event, 'id')

    if (!projectId) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Project ID is required'
      }))
    }

    const supabase = getSupabaseClient()

    // Verify that the project belongs to the user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_telegram_id', userTelegramId)
      .single()

    if (projectError || !project) {
      if (projectError?.code === 'PGRST116') {
        return sendError(event, createError({
          statusCode: 404,
          message: 'Project not found'
        }))
      }

      console.error('[Project Members API] Error fetching project:', projectError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to verify project ownership'
      }))
    }

    // Fetch project members with user data
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select(`
        id,
        role,
        created_at,
        member:users!project_members_member_telegram_id_fkey (
          telegram_id,
          first_name,
          last_name,
          username,
          photo_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('[Project Members API] Error fetching members:', membersError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch project members'
      }))
    }

    // Transform members to match frontend interface
    const transformedMembers = (members || []).map((member: any) => {
      const userData = member.member
      return {
        id: userData.telegram_id.toString(),
        name: [userData.first_name, userData.last_name].filter(Boolean).join(' ') || 'Без имени',
        role: member.role || 'Участник',
        avatarUrl: userData.photo_url || null,
      }
    })

    return transformedMembers
  } catch (error) {
    console.error('[Project Members API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})
