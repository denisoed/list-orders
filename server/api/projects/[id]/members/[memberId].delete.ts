import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * DELETE /api/projects/[id]/members/[memberId]
 * Removes a team member from a project
 */
export default defineEventHandler(async (event) => {
  try {
    const projectId = getRouterParam(event, 'id')
    const memberId = getRouterParam(event, 'memberId')

    if (!projectId) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Project ID is required'
      }))
    }

    if (!memberId) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Member ID is required'
      }))
    }

    // Get user telegram_id from request
    const userTelegramId = await getUserTelegramIdFromRequest(event)

    if (!userTelegramId) {
      return sendError(event, createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid or missing initData'
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

    // Convert memberId (telegram_id as string) to number
    const memberTelegramId = parseInt(memberId, 10)
    if (isNaN(memberTelegramId)) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Invalid member ID format'
      }))
    }

    // Delete member from project
    const { error: deleteError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('member_telegram_id', memberTelegramId)

    if (deleteError) {
      console.error('[Project Members API] Error deleting member:', deleteError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to remove member from project'
      }))
    }

    return { success: true }
  } catch (error) {
    console.error('[Project Members API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})
