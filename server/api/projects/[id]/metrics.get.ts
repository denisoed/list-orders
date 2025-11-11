import { mapDbStatusToOrderStatus, type OrderStatus } from '~/utils/orderStatuses'
import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

interface OrderRow {
  id: string
  status: string | null
  assignee_telegram_id: number | string | null
  due_date: string | null
  reminder_offset: string | null
  payment_type: string | null
  prepayment_amount: number | string | null
  total_amount: number | string | null
  review_comment: string | null
  review_images: string[] | null
  review_answer: string | null
  created_at: string | null
  updated_at: string | null
}

interface OrderHistoryRow {
  order_id: string
  event_type: string
  created_at: string | null
}

interface ReminderLogRow {
  order_id: string
  sent_at: string | null
  target_datetime: string | null
}

interface ProjectRow {
  id: string
  title: string
  description: string | null
  color: string | null
  completed: number | null
  total: number | null
  user_telegram_id: number
  updated_at: string | null
}

const HOURS_IN_MS = 1000 * 60 * 60
const DAY_IN_MS = HOURS_IN_MS * 24

const calculateShare = (part: number, total: number): number => {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
    return 0
  }

  return Math.round((part / total) * 100)
}

const parseTimestamp = (value: string | null | undefined): number | null => {
  if (!value) {
    return null
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

const toNullableNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  return null
}

const toIntegerId = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : null
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? null : parsed
  }

  return null
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

    const projectId = getRouterParam(event, 'id')

    if (!projectId) {
      return sendError(
        event,
        createError({
          statusCode: 400,
          message: 'Project ID is required',
        }),
      )
    }

    const query = getQuery(event)
    let fromTimestamp: number | null = null
    let toTimestamp: number | null = null

    if (typeof query.from === 'string' && query.from.trim().length > 0) {
      const parsed = Date.parse(query.from)
      if (Number.isNaN(parsed)) {
        return sendError(
          event,
          createError({
            statusCode: 400,
            message: 'Invalid "from" query parameter. Expected ISO date string.',
          }),
        )
      }
      fromTimestamp = parsed
    }

    if (typeof query.to === 'string' && query.to.trim().length > 0) {
      const parsed = Date.parse(query.to)
      if (Number.isNaN(parsed)) {
        return sendError(
          event,
          createError({
            statusCode: 400,
            message: 'Invalid "to" query parameter. Expected ISO date string.',
          }),
        )
      }
      toTimestamp = parsed
    }

    if (fromTimestamp !== null && toTimestamp !== null && fromTimestamp > toTimestamp) {
      return sendError(
        event,
        createError({
          statusCode: 400,
          message: 'Invalid period: "from" must be earlier than "to".',
        }),
      )
    }

    const supabase = getSupabaseClient()

    const projectResult = await supabase
      .from('projects')
      .select('id, title, description, color, completed, total, user_telegram_id, updated_at')
      .eq('id', projectId)
      .maybeSingle()

    const project = (projectResult.data as ProjectRow | null) || null
    const projectError = projectResult.error

    if (projectError) {
      console.error('[ProjectMetrics API] Error fetching project:', projectError)
      return sendError(
        event,
        createError({
          statusCode: 500,
          message: 'Failed to load project',
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

    if (project.user_telegram_id !== userTelegramId) {
      const membershipResult = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('member_telegram_id', userTelegramId)
        .maybeSingle()

      const membership = membershipResult.data
      const membershipError = membershipResult.error

      if (membershipError) {
        console.error('[ProjectMetrics API] Error verifying membership:', membershipError)
        return sendError(
          event,
          createError({
            statusCode: 500,
            message: 'Failed to verify project access',
          }),
        )
      }

      if (!membership) {
        return sendError(
          event,
          createError({
            statusCode: 403,
            message: 'Access denied to this project',
          }),
        )
      }
    }

    const [ordersResult, membersResult] = await Promise.all([
      supabase
        .from('orders')
        .select(
          'id, status, assignee_telegram_id, due_date, reminder_offset, payment_type, prepayment_amount, total_amount, review_comment, review_images, review_answer, created_at, updated_at',
        )
        .eq('project_id', projectId),
      supabase
        .from('project_members')
        .select('member_telegram_id, project_id')
        .eq('project_id', projectId),
    ])

    const rawOrders = (ordersResult.data as OrderRow[] | null) || []
    const ordersError = ordersResult.error
    const members = membersResult.data as Array<{ member_telegram_id: number | string; project_id: string }> | null
    const membersError = membersResult.error

    if (ordersError) {
      console.error('[ProjectMetrics API] Error fetching project orders:', ordersError)
      return sendError(
        event,
        createError({
          statusCode: 500,
          message: 'Failed to load project orders',
        }),
      )
    }

    if (membersError) {
      console.error('[ProjectMetrics API] Error fetching project members:', membersError)
      return sendError(
        event,
        createError({
          statusCode: 500,
          message: 'Failed to load project members',
        }),
      )
    }

    const projectMembers = (members || []).filter((member) => member.project_id === projectId)
    const membersCount = projectMembers.filter((member) => {
      const memberId = toIntegerId(member.member_telegram_id)
      return memberId !== null && memberId !== project.user_telegram_id
    }).length

    const filteredOrders: OrderRow[] = rawOrders.filter((order) => {
      const createdAt = parseTimestamp(order.created_at)

      if (fromTimestamp !== null && (createdAt === null || createdAt < fromTimestamp)) {
        return false
      }

      if (toTimestamp !== null && (createdAt === null || createdAt > toTimestamp)) {
        return false
      }

      return true
    })

    const orderIds = filteredOrders.map((order) => order.id)

    let historyRows: OrderHistoryRow[] = []
    let reminderRows: ReminderLogRow[] = []

    if (orderIds.length > 0) {
      const [historyResult, reminderResult] = await Promise.all([
        supabase
          .from('order_history')
          .select('order_id, event_type, created_at')
          .in('order_id', orderIds),
        supabase
          .from('order_reminder_logs')
          .select('order_id, sent_at, target_datetime')
          .in('order_id', orderIds),
      ])

      if (historyResult.error) {
        console.error('[ProjectMetrics API] Error fetching order history:', historyResult.error)
        return sendError(
          event,
          createError({
            statusCode: 500,
            message: 'Failed to load order history',
          }),
        )
      }

      if (reminderResult.error) {
        console.error('[ProjectMetrics API] Error fetching reminder logs:', reminderResult.error)
        return sendError(
          event,
          createError({
            statusCode: 500,
            message: 'Failed to load reminder logs',
          }),
        )
      }

      historyRows = (historyResult.data as OrderHistoryRow[] | null) || []
      reminderRows = ((reminderResult.data as ReminderLogRow[] | null) || []).filter((log) => {
        const sentAt = parseTimestamp(log.sent_at) ?? parseTimestamp(log.target_datetime)

        if (fromTimestamp !== null && (sentAt === null || sentAt < fromTimestamp)) {
          return false
        }

        if (toTimestamp !== null && (sentAt === null || sentAt > toTimestamp)) {
          return false
        }

        return true
      })
    }

    const statusCounts: Record<OrderStatus, number> = {
      pending: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    }

    const now = Date.now()
    const dueSoonThreshold = now + HOURS_IN_MS * 48

    let totalRevenue = 0
    let totalPrepayment = 0
    let ordersWithoutAssignee = 0
    let ordersWithoutPaymentType = 0
    let overdueCount = 0
    let dueSoonCount = 0
    let ordersWithDueDate = 0
    let reviewsCount = 0
    let reviewsAwaitingResponse = 0
    let ordersWithReminderField = 0
    let lastActivityTimestamp = 0

    const completionDurations: number[] = []
    let onTimeCompletionCount = 0
    let completedWithDueDate = 0

    const historyByOrder = new Map<string, OrderHistoryRow[]>()
    for (const record of historyRows) {
      const existing = historyByOrder.get(record.order_id) || []
      existing.push(record)
      historyByOrder.set(record.order_id, existing)

      const recordTimestamp = parseTimestamp(record.created_at)
      if (recordTimestamp !== null) {
        lastActivityTimestamp = Math.max(lastActivityTimestamp, recordTimestamp)
      }
    }

    const doneTimestamps = new Map<string, number>()
    const returnedToReviewOrders = new Set<string>()

    const activeAssignments = new Map<number, number>()
    let unassignedActiveCount = 0

    for (const order of filteredOrders) {
      const status = mapDbStatusToOrderStatus(order.status || 'pending')
      statusCounts[status] += 1

      const updatedAt = parseTimestamp(order.updated_at)
      if (updatedAt !== null) {
        lastActivityTimestamp = Math.max(lastActivityTimestamp, updatedAt)
      }

      const assigneeId = toIntegerId(order.assignee_telegram_id)
      const dueDateTimestamp = parseTimestamp(order.due_date)
      const reminderOffset = order.reminder_offset
      const paymentType = order.payment_type
      const prepaymentAmount = toNullableNumber(order.prepayment_amount) || 0
      const totalAmount = toNullableNumber(order.total_amount) || 0

      if (assigneeId === null) {
        ordersWithoutAssignee += 1
      }

      if (!paymentType) {
        ordersWithoutPaymentType += 1
      }

      if (reminderOffset) {
        ordersWithReminderField += 1
      }

      totalRevenue += totalAmount
      totalPrepayment += prepaymentAmount

      const hasComment = typeof order.review_comment === 'string' && order.review_comment.trim().length > 0
      const hasImages = Array.isArray(order.review_images) && order.review_images.length > 0
      const hasAnswer = typeof order.review_answer === 'string' && order.review_answer.trim().length > 0

      if (hasComment || hasImages || hasAnswer) {
        reviewsCount += 1
      }

      if (hasComment && !hasAnswer) {
        reviewsAwaitingResponse += 1
      }

      if (dueDateTimestamp !== null) {
        ordersWithDueDate += 1

        if (status !== 'done' && dueDateTimestamp < now) {
          overdueCount += 1
        }

        if (status !== 'done' && dueDateTimestamp >= now && dueDateTimestamp <= dueSoonThreshold) {
          dueSoonCount += 1
        }
      }

      if (status !== 'done') {
        if (assigneeId === null) {
          unassignedActiveCount += 1
        } else {
          activeAssignments.set(assigneeId, (activeAssignments.get(assigneeId) || 0) + 1)
        }
      }

      const orderHistory = (historyByOrder.get(order.id) || []).sort((a, b) => {
        const aTime = parseTimestamp(a.created_at) || 0
        const bTime = parseTimestamp(b.created_at) || 0
        return aTime - bTime
      })

      for (const event of orderHistory) {
        if (event.event_type === 'status.review') {
          returnedToReviewOrders.add(order.id)
        }
      }

      const createdAt = parseTimestamp(order.created_at)
      const doneRecord = orderHistory.find((record) => record.event_type === 'status.done')
      const doneTimestamp = doneRecord ? parseTimestamp(doneRecord.created_at) : null

      if (doneTimestamp !== null) {
        doneTimestamps.set(order.id, doneTimestamp)
      } else if (status === 'done') {
        const fallbackDone = parseTimestamp(order.updated_at)
        if (fallbackDone !== null) {
          doneTimestamps.set(order.id, fallbackDone)
        }
      }

      const finalDoneTimestamp = doneTimestamps.get(order.id)

      if (status === 'done' && createdAt !== null && finalDoneTimestamp !== undefined) {
        const durationMs = finalDoneTimestamp - createdAt
        if (durationMs > 0) {
          completionDurations.push(durationMs)
        }
      }

      if (status === 'done' && dueDateTimestamp !== null && finalDoneTimestamp !== undefined) {
        completedWithDueDate += 1
        if (finalDoneTimestamp <= dueDateTimestamp) {
          onTimeCompletionCount += 1
        }
      }
    }

    const totalOrders = filteredOrders.length
    const completedOrders = statusCounts.done
    const activeOrders = totalOrders - completedOrders
    const attentionOrders = statusCounts.in_progress + statusCounts.review

    const completionRate = calculateShare(completedOrders, totalOrders)
    const overdueShare = calculateShare(overdueCount, totalOrders)
    const dueSoonShare = calculateShare(dueSoonCount, totalOrders)
    const dueDateCoverage = calculateShare(ordersWithDueDate, totalOrders)
    const reminderLogs = reminderRows
    const reminderOrderIds = new Set(reminderLogs.map((log) => log.order_id))
    const reminderLogCount = reminderLogs.length
    const ordersWithRemindersCount = reminderOrderIds.size > 0 ? reminderOrderIds.size : ordersWithReminderField

    const remindersShare = calculateShare(ordersWithRemindersCount, totalOrders)
    const prepaymentShare = calculateShare(totalPrepayment, totalRevenue)
    const onTimeCompletionRate = calculateShare(onTimeCompletionCount, completedWithDueDate)

    const averageCompletionTimeHours = completionDurations.length
      ? Math.round(
          (completionDurations.reduce((sum, value) => sum + value, 0) / completionDurations.length / HOURS_IN_MS) * 10,
        ) / 10
      : null

    const completionAfterReminderOrders = new Set<string>()

    for (const log of reminderLogs) {
      const sentAt = parseTimestamp(log.sent_at) ?? parseTimestamp(log.target_datetime)
      if (sentAt === null) {
        continue
      }

      const doneTimestamp = doneTimestamps.get(log.order_id)
      if (doneTimestamp === undefined) {
        continue
      }

      if (doneTimestamp >= sentAt && doneTimestamp <= sentAt + DAY_IN_MS) {
        completionAfterReminderOrders.add(log.order_id)
      }
    }

    const reminderCompletionShare = calculateShare(
      completionAfterReminderOrders.size,
      ordersWithRemindersCount > 0 ? ordersWithRemindersCount : reminderLogs.length,
    )

    const lastActivityIso = lastActivityTimestamp > 0 ? new Date(lastActivityTimestamp).toISOString() : null

    return {
      project: {
        id: project.id,
        title: project.title,
        description: project.description || '',
        color: project.color || null,
        completed: project.completed ?? 0,
        total: project.total ?? 0,
        ownerTelegramId: project.user_telegram_id,
        updatedAt: project.updated_at,
        membersCount,
      },
      period: {
        from: fromTimestamp ? new Date(fromTimestamp).toISOString() : null,
        to: toTimestamp ? new Date(toTimestamp).toISOString() : null,
      },
      summary: {
        totalOrders,
        completedOrders,
        activeOrders,
        completionRate,
        attentionOrders,
        ordersWithoutAssignee,
        ordersWithoutPaymentType,
        ordersWithReminder: ordersWithRemindersCount,
        lastActivity: lastActivityIso,
      },
      statuses: (Object.keys(statusCounts) as OrderStatus[]).map((status) => ({
        status,
        count: statusCounts[status],
      })),
      timing: {
        overdueCount,
        overdueShare,
        dueSoonCount,
        dueSoonShare,
        ordersWithDueDate,
        dueDateCoverage,
        onTimeCompletionRate,
        averageCompletionTimeHours,
      },
      finance: {
        totalRevenue,
        totalPrepayment,
        outstandingAmount: Math.max(0, totalRevenue - totalPrepayment),
        prepaymentShare,
        ordersWithoutPaymentType,
      },
      quality: {
        reviewsCount,
        reviewsAwaitingResponse,
        returnedToReviewCount: returnedToReviewOrders.size,
      },
      reminders: {
        reminderLogsCount: reminderLogCount,
        ordersWithReminders: ordersWithRemindersCount,
        completionAfterReminderCount: completionAfterReminderOrders.size,
        completionAfterReminderShare: reminderCompletionShare,
        remindersShare,
      },
      team: {
        membersCount,
        assignments: Array.from(activeAssignments.entries()).map(([assigneeTelegramId, activeCount]) => ({
          assigneeTelegramId,
          activeOrders: activeCount,
        })),
        unassignedActiveCount,
      },
      history: {
        totalHistoryEvents: historyRows.length,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('[ProjectMetrics API] Unexpected error:', error)
    return sendError(
      event,
      createError({
        statusCode: 500,
        message: 'Internal server error',
      }),
    )
  }
})

