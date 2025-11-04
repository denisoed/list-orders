import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * PUT /api/projects/[id]
 * Updates an existing project for the authenticated user
 */
export default defineEventHandler(async (event) => {
  try {
    const projectId = getRouterParam(event, 'id')

    if (!projectId) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Project ID is required'
      }))
    }

    // Read body first to avoid reading it twice
    const body = await readBody(event)

    // Get user telegram_id from request (pass body to avoid reading it again)
    const userTelegramId = await getUserTelegramIdFromRequest(event, body)

    if (!userTelegramId) {
      return sendError(event, createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid or missing initData'
      }))
    }

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Title is required and cannot be empty'
      }))
    }

    const supabase = getSupabaseClient()

    // Prepare update data
    const updateData: {
      title: string
      description?: string
      color?: string | null
    } = {
      title: body.title.trim(),
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || ''
    }

    if (body.color !== undefined) {
      updateData.color = body.color || null
    }

    // Update project (only if it belongs to the user)
    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('user_telegram_id', userTelegramId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return sendError(event, createError({
          statusCode: 404,
          message: 'Project not found'
        }))
      }

      console.error('[Projects API] Error updating project:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to update project'
      }))
    }

    // Transform database fields to match frontend Project interface
    const transformedProject = {
      id: project.id,
      title: project.title,
      description: project.description || '',
      completed: project.completed || 0,
      total: project.total || 0,
      tasks: [],
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
