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

    // First, try to fetch project owned by the user
    const { data: ownedProject, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_telegram_id', userTelegramId)
      .single()

    let project = ownedProject

    // If not owned, check if user is a member
    if (ownedError && ownedError.code === 'PGRST116') {
      const { data: memberProject, error: memberError } = await supabase
        .from('project_members')
        .select('project_id, projects(*)')
        .eq('project_id', projectId)
        .eq('member_telegram_id', userTelegramId)
        .single()

      if (memberError) {
        if (memberError.code === 'PGRST116') {
          return sendError(event, createError({
            statusCode: 404,
            message: 'Project not found'
          }))
        }

        console.error('[Projects API] Error checking project membership:', memberError)
        return sendError(event, createError({
          statusCode: 500,
          message: 'Failed to fetch project'
        }))
      }

      project = (memberProject as any)?.projects
    } else if (ownedError) {
      console.error('[Projects API] Error fetching project:', ownedError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch project'
      }))
    }

    if (!project) {
      return sendError(event, createError({
        statusCode: 404,
        message: 'Project not found'
      }))
    }

    // Transform database fields to match frontend Project interface
    const transformedProject = {
      id: project.id,
      title: project.title,
      description: project.description || '',
      completed: project.completed || 0,
      total: project.total || 0,
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
