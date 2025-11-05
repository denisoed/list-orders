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

    // Fetch projects owned by the user and projects where user is a member in parallel
    const [ownedProjectsResult, memberProjectsResult] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .eq('user_telegram_id', userTelegramId),
      supabase
        .from('project_members')
        .select('project_id, projects(*)')
        .eq('member_telegram_id', userTelegramId),
    ])

    const { data: ownedProjects, error: ownedError } = ownedProjectsResult
    const { data: memberProjects, error: memberError } = memberProjectsResult

    if (ownedError) {
      console.error('[Projects API] Error fetching owned projects:', ownedError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch projects'
      }))
    }

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

    // Get member counts for all projects (excluding owners)
    const projectIds = projects.map((p: any) => p.id)
    const { data: memberCounts, error: memberCountsError } = await supabase
      .from('project_members')
      .select('project_id, member_telegram_id')
      .in('project_id', projectIds)

    // Count members per project (excluding owners)
    const memberCountMap = new Map<string, number>()
    projects.forEach((p: any) => {
      const ownerId = p.user_telegram_id
      const members = (memberCounts || []).filter((m: any) => 
        m.project_id === p.id && m.member_telegram_id !== ownerId
      )
      memberCountMap.set(p.id, members.length)
    })

    // Transform database fields to match frontend Project interface
    const transformedProjects = projects.map((project: any) => ({
      id: project.id,
      title: project.title,
      description: project.description || '',
      completed: project.completed || 0,
      total: project.total || 0,
      color: project.color || undefined,
      ownerTelegramId: project.user_telegram_id,
      membersCount: memberCountMap.get(project.id) || 0,
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
