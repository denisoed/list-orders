import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'
import { sendTelegramMessage } from '~/server/api/telegram'
import { Markup } from 'telegraf'
import { WEB_URL } from '~/server/constants/telegram'

/**
 * POST /api/projects/[id]/members
 * Adds a team member to a project
 * Body: { memberTelegramId: number, role?: string }
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

    // Read body
    const body = await readBody(event)

    if (!body.memberTelegramId || typeof body.memberTelegramId !== 'number') {
      return sendError(event, createError({
        statusCode: 400,
        message: 'memberTelegramId is required and must be a number'
      }))
    }

    // Get user telegram_id from request
    const userTelegramId = await getUserTelegramIdFromRequest(event, body)

    if (!userTelegramId) {
      return sendError(event, createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid or missing initData'
      }))
    }

    const supabase = getSupabaseClient()

    // Check if user is adding themselves (invitation case) or is the project owner
    const isSelfInvitation = userTelegramId === body.memberTelegramId

    // Verify that the project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, user_telegram_id')
      .eq('id', projectId)
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
        message: 'Failed to verify project'
      }))
    }

    // Check permissions: user must be either the project owner OR adding themselves
    if (!isSelfInvitation && project.user_telegram_id !== userTelegramId) {
      return sendError(event, createError({
        statusCode: 403,
        message: 'Forbidden: Only project owner can add other members'
      }))
    }

    // Prevent owner from adding themselves
    if (isSelfInvitation && project.user_telegram_id === userTelegramId) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Project owner cannot add themselves as a member'
      }))
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('telegram_id', body.memberTelegramId)
      .single()

    if (userError || !user) {
      if (userError?.code === 'PGRST116') {
        return sendError(event, createError({
          statusCode: 404,
          message: 'User not found'
        }))
      }

      console.error('[Project Members API] Error fetching user:', userError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to verify user'
      }))
    }

    // Check if member is already in the project
    const { data: existingMember, error: checkError } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('member_telegram_id', body.memberTelegramId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Project Members API] Error checking existing member:', checkError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to check existing member'
      }))
    }

    if (existingMember) {
      return sendError(event, createError({
        statusCode: 409,
        message: 'User is already a member of this project'
      }))
    }

    // Add member to project
    const { data: member, error: insertError } = await supabase
      .from('project_members')
      .insert([
        {
          project_id: projectId,
          member_telegram_id: body.memberTelegramId,
          role: body.role || 'Участник',
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error('[Project Members API] Error adding member:', insertError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to add member to project'
      }))
    }

    // Fetch full member data with user info
    const { data: memberWithUser, error: fetchError } = await supabase
      .from('project_members')
      .select(`
        id,
        role,
        created_at,
        member:users!project_members_member_telegram_id_fkey (
          telegram_id,
          first_name,
          last_name,
          username,
          photo_url
        )
      `)
      .eq('id', member.id)
      .single()

    if (fetchError || !memberWithUser) {
      console.error('[Project Members API] Error fetching member data:', fetchError)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch member data'
      }))
    }

    const userData = memberWithUser.member as any

    // Send Telegram notification to the project owner about the new member
    try {
      const projectUrl = `${WEB_URL}/projects/${projectId}/orders`
      const memberRole = memberWithUser.role || 'Участник'
      const escapeHtml = (value: string | null | undefined) =>
        String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')

      const memberFullName = [userData.first_name, userData.last_name]
        .filter(Boolean)
        .join(' ')
        .trim()

      const memberNameForMessage =
        memberFullName || (userData.username ? `@${userData.username}` : '') || `ID: ${userData.telegram_id}`

      const safeProjectTitle = escapeHtml(project.title || 'Без названия')
      const safeMemberName = escapeHtml(memberNameForMessage)

      const message = [
        '👥 <b>Новый участник в проекте</b>',
        '',
        `Проект: <b>${safeProjectTitle}</b>`,
        `Участник: <b>${safeMemberName}</b>`,
        `Роль: <b>${escapeHtml(memberRole)}</b>`
      ].join('\n')

      const replyMarkup = Markup.inlineKeyboard([
        [Markup.button.webApp('Перейти в проект', projectUrl)],
      ])

      await sendTelegramMessage(project.user_telegram_id, message, replyMarkup)
    } catch (error) {
      console.error('[Project Members API] Failed to send notification:', error)
      // Don't fail the request if notification fails
    }

    // Transform to match frontend interface
    const transformedMember = {
      id: userData.telegram_id.toString(),
      name: [userData.first_name, userData.last_name].filter(Boolean).join(' ') || 'Без имени',
      role: memberWithUser.role,
      avatarUrl: userData.photo_url || null,
    }

    return transformedMember
  } catch (error) {
    console.error('[Project Members API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})
