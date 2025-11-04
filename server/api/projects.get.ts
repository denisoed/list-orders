import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * GET /api/projects
 * Returns list of projects for the authenticated user
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

    const supabase = getSupabaseClient()

    // Fetch projects for the user
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_telegram_id', userTelegramId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Projects API] Error fetching projects:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch projects'
      }))
    }

    // Transform database fields to match frontend Project interface
    const transformedProjects = projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description || '',
      completed: project.completed || 0,
      total: project.total || 0,
      tasks: [], // Tasks will be loaded separately
      color: project.color || undefined,
    }))

    return transformedProjects
  } catch (error) {
    console.error('[Projects API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})
