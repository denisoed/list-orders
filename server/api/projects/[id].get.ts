import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * GET /api/projects/[id]
 * Returns a single project by ID for the authenticated user
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

    // Fetch project for the user
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_telegram_id', userTelegramId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return sendError(event, createError({
          statusCode: 404,
          message: 'Project not found'
        }))
      }

      console.error('[Projects API] Error fetching project:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch project'
      }))
    }

    // Transform database fields to match frontend Project interface
    const transformedProject = {
      id: project.id,
      title: project.title,
      description: project.description || '',
      completed: project.completed || 0,
      total: project.total || 0,
      tasks: [], // Tasks will be loaded separately
      color: project.color || undefined,
    }

    return transformedProject
  } catch (error) {
    console.error('[Projects API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})
