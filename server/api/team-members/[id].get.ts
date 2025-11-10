import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'
import { checkProjectAccess } from '~/server/utils/checkProjectAccess'
import type {
  TeamMemberContact,
  TeamMemberHistoryItem,
  TeamMemberOrder,
  TeamMemberOrderStatus,
  TeamMemberProfile,
} from '~/data/teamMemberProfiles'

const DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const TIME_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/
const HAS_TIME_COMPONENT_REGEX = /[T ]\d{2}:\d{2}/

const TELEGRAM_URL_PREFIX = 'https://t.me/'

interface MemberQueryParams {
  projectId?: string
}

interface OrderRecord {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  archived: boolean | null
  updated_at: string | null
}

interface ProjectRecord {
  id: string
  title: string | null
  user_telegram_id: number
}

interface MemberRecord {
  role: string | null
}

interface UserRecord {
  telegram_id: number
  first_name: string | null
  last_name: string | null
  username: string | null
  photo_url: string | null
}

const parseDueDate = (dueDate: string | null): Date | null => {
  const rawDueDate = (dueDate ?? '').trim()
  if (!rawDueDate) {
    return null
  }

  const parsedTimestamp = new Date(rawDueDate)
  if (!Number.isNaN(parsedTimestamp.getTime())) {
    return parsedTimestamp
  }

  const match = rawDueDate.match(DATE_ONLY_REGEX)
  if (match) {
    const [, year, month, day] = match
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  return null
}

const formatDueDateLabel = (dueDate: Date | null, includeTime: boolean): string => {
  if (!dueDate) {
    return 'Без срока'
  }

  const datePart = DATE_FORMATTER.format(dueDate)

  if (includeTime) {
    const timePart = TIME_FORMATTER.format(dueDate)
    return `${datePart} в ${timePart}`
  }

  return datePart
}

const deriveOrderStatus = (order: OrderRecord, dueDate: Date | null): TeamMemberOrderStatus => {
  const rawStatus = (order.status ?? '').toLowerCase()
  const finishedStatuses = new Set(['done', 'completed', 'complete'])

  if (finishedStatuses.has(rawStatus)) {
    return 'completed'
  }

  if (dueDate && dueDate.getTime() < Date.now()) {
    return 'overdue'
  }

  return 'in-progress'
}

const formatHistoryDate = (timestamp: string | null): string => {
  if (!timestamp) {
    return 'Без даты'
  }

  const parsed = new Date(timestamp)

  if (Number.isNaN(parsed.getTime())) {
    return 'Без даты'
  }

  const datePart = DATE_FORMATTER.format(parsed)
  const timePart = TIME_FORMATTER.format(parsed)

  return `${datePart} в ${timePart}`
}

const buildTelegramContact = (user: UserRecord): TeamMemberContact | null => {
  const username = (user.username ?? '').trim()

  if (username) {
    return {
      id: 'telegram',
      type: 'telegram',
      label: 'Telegram',
      value: `@${username}`,
      href: `${TELEGRAM_URL_PREFIX}${username}`,
      icon: 'alternate_email',
    }
  }

  if (user.telegram_id) {
    return {
      id: 'telegram-id',
      type: 'telegram',
      label: 'Telegram ID',
      value: user.telegram_id.toString(),
      href: `tg://user?id=${user.telegram_id}`,
      icon: 'account_circle',
    }
  }

  return null
}

const buildProfileName = (user: UserRecord): string => {
  const parts = [user.first_name, user.last_name].filter(Boolean).map((part) => part!.trim())
  if (parts.length) {
    return parts.join(' ')
  }

  if (user.username) {
    return `@${user.username}`
  }

  return `ID: ${user.telegram_id}`
}

export default defineEventHandler(async (event) => {
  try {
    const userTelegramId = await getUserTelegramIdFromRequest(event)

    if (!userTelegramId) {
      return sendError(
        event,
        createError({
          statusCode: 401,
          message: 'Unauthorized: Invalid or missing initData',
        }),
      )
    }

    const memberIdParam = getRouterParam(event, 'id')
    const query = getQuery<MemberQueryParams>(event)
    const projectId = query.projectId

    if (!memberIdParam) {
      return sendError(
        event,
        createError({
          statusCode: 400,
          message: 'Member ID is required',
        }),
      )
    }

    if (!projectId) {
      return sendError(
        event,
        createError({
          statusCode: 400,
          message: 'Project ID is required',
        }),
      )
    }

    const memberTelegramId = Number(memberIdParam)
    if (!Number.isFinite(memberTelegramId) || memberTelegramId <= 0) {
      return sendError(
        event,
        createError({
          statusCode: 400,
          message: 'Member ID is invalid',
        }),
      )
    }

    const supabase = getSupabaseClient()

    const hasAccess = await checkProjectAccess(supabase, userTelegramId, projectId)
    if (!hasAccess) {
      return sendError(
        event,
        createError({
          statusCode: 404,
          message: 'Project not found',
        }),
      )
    }

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, title, user_telegram_id')
      .eq('id', projectId)
      .maybeSingle()

    const project = projectData as ProjectRecord | null

    if (projectError) {
      console.error('[TeamMemberProfile API] Error fetching project:', projectError)
      return sendError(
        event,
        createError({
          statusCode: 500,
          message: 'Failed to load project data',
        }),
      )
    }

    if (!project) {
      return sendError(
        event,
        createError({
          statusCode: 404,
          message: 'Project not found',
        }),
      )
    }

    const { data: userRecordData, error: userError } = await supabase
      .from('users')
      .select('telegram_id, first_name, last_name, username, photo_url')
      .eq('telegram_id', memberTelegramId)
      .maybeSingle()

    const userRecord = userRecordData as UserRecord | null

    if (userError) {
      console.error('[TeamMemberProfile API] Error fetching user:', userError)
      return sendError(
        event,
        createError({
          statusCode: 500,
          message: 'Failed to load user profile',
        }),
      )
    }

    if (!userRecord) {
      return sendError(
        event,
        createError({
          statusCode: 404,
          message: 'User not found',
        }),
      )
    }

    let memberRole = 'Участник'

    if (memberTelegramId === project.user_telegram_id) {
      memberRole = 'Владелец проекта'
    } else {
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('member_telegram_id', memberTelegramId)
        .maybeSingle()

      const memberRecord = memberData as MemberRecord | null

      if (memberError) {
        console.error('[TeamMemberProfile API] Error fetching member record:', memberError)
        return sendError(
          event,
          createError({
            statusCode: 500,
            message: 'Failed to load member record',
          }),
        )
      }

      if (!memberRecord) {
        return sendError(
          event,
          createError({
            statusCode: 404,
            message: 'Member not found in project',
          }),
        )
      }

      if (memberRecord.role) {
        memberRole = memberRecord.role
      }
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
  .select('id, title, status, due_date, archived, updated_at')
      .eq('project_id', projectId)
      .eq('assignee_telegram_id', memberTelegramId)

    const orders = ordersData as OrderRecord[] | null

    if (ordersError) {
      console.error('[TeamMemberProfile API] Error fetching orders:', ordersError)
      return sendError(
        event,
        createError({
          statusCode: 500,
          message: 'Failed to load member orders',
        }),
      )
    }

    const activeOrdersInternal: Array<{ order: TeamMemberOrder; dueDate: Date | null }> = []
    const historyItemsInternal: Array<{ item: TeamMemberHistoryItem; completedAt: number }> = []

    for (const order of orders ?? []) {
      if (order.archived) {
        continue
      }

    const dueDate = parseDueDate(order.due_date)
    const derivedStatus = deriveOrderStatus(order, dueDate)
    const hasDueTime = Boolean(order.due_date && HAS_TIME_COMPONENT_REGEX.test(order.due_date))
      const dueDateLabel = formatDueDateLabel(dueDate, hasDueTime)

      const memberOrder: TeamMemberOrder = {
        id: order.id,
        title: order.title ?? 'Без названия',
        status: derivedStatus,
        dueDateLabel,
      }
      activeOrdersInternal.push({ order: memberOrder, dueDate })

      if (derivedStatus === 'completed') {
        const completedAtTimestamp = order.updated_at ? new Date(order.updated_at).getTime() : 0
        const historyItem: TeamMemberHistoryItem = {
          id: order.id,
          title: order.title ?? 'Без названия',
          completedAtLabel: formatHistoryDate(order.updated_at),
        }
        historyItemsInternal.push({ item: historyItem, completedAt: completedAtTimestamp })
      }
    }

    activeOrdersInternal.sort((a, b) => {
      const aStatus = a.order.status
      const bStatus = b.order.status

      if (aStatus === 'overdue' && bStatus !== 'overdue') {
        return -1
      }

      if (aStatus !== 'overdue' && bStatus === 'overdue') {
        return 1
      }

      const aTime = a.dueDate ? a.dueDate.getTime() : Number.POSITIVE_INFINITY
      const bTime = b.dueDate ? b.dueDate.getTime() : Number.POSITIVE_INFINITY

      return aTime - bTime
    })

    historyItemsInternal.sort((a, b) => b.completedAt - a.completedAt)

    const activeOrders = activeOrdersInternal.map(({ order }) => order)
    const historyItems = historyItemsInternal.map(({ item }) => item)

    const contacts: TeamMemberContact[] = []
    const telegramContact = buildTelegramContact(userRecord)
    if (telegramContact) {
      contacts.push(telegramContact)
    }

    const profile: TeamMemberProfile = {
      id: memberIdParam,
      name: buildProfileName(userRecord),
      role: memberRole,
      department: project.title ?? 'Проект без названия',
      avatarUrl: userRecord.photo_url || undefined,
      contacts,
      orders: activeOrders,
      history: historyItems,
    }

    return profile
  } catch (error) {
    console.error('[TeamMemberProfile API] Unexpected error:', error)
    return sendError(
      event,
      createError({
        statusCode: 500,
        message: 'Internal server error',
      }),
    )
  }
})
