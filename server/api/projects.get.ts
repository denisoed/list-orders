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

    // Fetch projects owned by the user
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_telegram_id', userTelegramId)
      .order('created_at', { ascending: false })

    if (ownedError) {
      console.error('[Projects API] Error fetching owned projects:', ownedError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch projects'
      }))
    }

    // Fetch projects where user is a member
    const { data: memberProjects, error: memberError } = await supabase
      .from('project_members')
      .select('project_id, projects(*)')
      .eq('member_telegram_id', userTelegramId)

    if (memberError) {
      console.error('[Projects API] Error fetching member projects:', memberError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch projects'
      }))
    }

    // Combine owned projects and member projects
    const memberProjectsData = (memberProjects || [])
      .map((item: any) => item.projects)
      .filter((project: any) => project !== null && project.user_telegram_id !== userTelegramId) // Exclude projects already owned by user

    // Merge and deduplicate projects by ID
    const allProjects = [...(ownedProjects || []), ...memberProjectsData]
    const projectsMap = new Map()
    allProjects.forEach((project: any) => {
      if (project && !projectsMap.has(project.id)) {
        projectsMap.set(project.id, project)
      }
    })
    const projects = Array.from(projectsMap.values())
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Transform database fields to match frontend Project interface
    const transformedProjects = projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description || '',
      completed: project.completed || 0,
      total: project.total || 0,
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
