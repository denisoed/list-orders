import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * GET /api/projects/archived
 * Returns list of archived projects for the authenticated user (owner only)
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

    // Fetch only archived projects owned by the user
    const { data: archivedProjects, error: archivedError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_telegram_id', userTelegramId)
      .eq('archived', true)
      .order('created_at', { ascending: false })

    if (archivedError) {
      console.error('[Archived Projects API] Error fetching archived projects:', archivedError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch archived projects'
      }))
    }

    if (!archivedProjects || archivedProjects.length === 0) {
      return []
    }

    // Get member counts for all projects (excluding owners)
    const projectIds = archivedProjects.map((p: any) => p.id)
    const { data: memberCounts, error: memberCountsError } = await supabase
      .from('project_members')
      .select('project_id, member_telegram_id')
      .in('project_id', projectIds)

    if (memberCountsError) {
      console.error('[Archived Projects API] Error fetching member counts:', memberCountsError)
    }

    // Count members per project (excluding owners)
    const memberCountMap = new Map<string, number>()
    archivedProjects.forEach((p: any) => {
      const ownerId = p.user_telegram_id
      const members = (memberCounts || []).filter((m: any) => 
        m.project_id === p.id && m.member_telegram_id !== ownerId
      )
      memberCountMap.set(p.id, members.length)
    })

    // Transform database fields to match frontend Project interface
    const transformedProjects = archivedProjects.map((project: any) => ({
      id: project.id,
      title: project.title,
      description: project.description || '',
      completed: project.completed || 0,
      total: project.total || 0,
      color: project.color || undefined,
      ownerTelegramId: project.user_telegram_id,
      membersCount: memberCountMap.get(project.id) || 0,
      archived: true,
    }))

    return transformedProjects
  } catch (error) {
    console.error('[Archived Projects API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})

