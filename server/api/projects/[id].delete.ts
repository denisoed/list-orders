import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * DELETE /api/projects/[id]
 * Deletes a project for the authenticated user
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

    // Check if project exists and belongs to the user
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_telegram_id', userTelegramId)
      .single()

    if (!existingProject) {
      return sendError(event, createError({
        statusCode: 404,
        message: 'Project not found'
      }))
    }

    // Delete project (only if it belongs to the user)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_telegram_id', userTelegramId)

    if (error) {
      console.error('[Projects API] Error deleting project:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to delete project'
      }))
    }

    return { success: true, message: 'Project deleted successfully' }
  } catch (error) {
    console.error('[Projects API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})
