import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * POST /api/projects
 * Creates a new project for the authenticated user
 */
export default defineEventHandler(async (event) => {
  try {
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

    // Prepare project data
    const projectData = {
      user_telegram_id: userTelegramId,
      title: body.title.trim(),
      description: body.description?.trim() || '',
      color: body.color || null,
      completed: 0,
      total: 0,
    }

    // Insert project
    const { data: project, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single()

    if (error) {
      console.error('[Projects API] Error creating project:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to create project'
      }))
    }

    // Parse features_settings from JSONB, default to { requireReview: false }
    let featuresSettings: { requireReview?: boolean } = { requireReview: false }
    if (project.features_settings) {
      try {
        featuresSettings = typeof project.features_settings === 'string'
          ? JSON.parse(project.features_settings)
          : project.features_settings
      } catch (error) {
        console.error('[Projects API] Error parsing features_settings:', error)
        featuresSettings = { requireReview: false }
      }
    }

    // Transform database fields to match frontend Project interface
    const transformedProject = {
      id: project.id,
      title: project.title,
      description: project.description || '',
      completed: project.completed || 0,
      total: project.total || 0,
      color: project.color || undefined,
      featuresSettings,
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
