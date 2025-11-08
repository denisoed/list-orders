import { Markup } from 'telegraf'
import { getSupabaseClient } from '~/server/utils/supabase'
import { sendTelegramMessage } from '~/server/api/telegram'
import { WEB_URL } from '~/server/constants/telegram'

interface OrderRecord {
  id: string
  title: string | null
  code: string | null
  due_date: string | null
  due_time: string | null
  status: string | null
  archived: boolean | null
  assignee_telegram_id: number | null
  assignee_telegram_name: string | null
}

const DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const TIME_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

function parseDueDate(record: OrderRecord): Date | null {
  if (!record.due_date) {
    return null
  }

  let dueDate = new Date(record.due_date)
  if (Number.isNaN(dueDate.getTime())) {
    // Attempt to parse YYYY-MM-DD format
    const match = record.due_date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (match) {
      const [, year, month, day] = match
      dueDate = new Date(Number(year), Number(month) - 1, Number(day))
    }
  }

  if (Number.isNaN(dueDate.getTime())) {
    return null
  }

  if (record.due_time) {
    const [hoursStr, minutesStr] = record.due_time.split(':')
    const hours = Number(hoursStr)
    const minutes = Number(minutesStr)

    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      dueDate.setHours(hours, minutes, 0, 0)
      return dueDate
    }
  }

  return dueDate
}

function formatDueDateLabel(dueDate: Date, includeTime: boolean): string {
  if (!includeTime) {
    return DATE_FORMATTER.format(dueDate)
  }

  return `${DATE_FORMATTER.format(dueDate)} в ${TIME_FORMATTER.format(dueDate)}`
}

export default defineEventHandler(async (event) => {
  try {
    const cronHeader = getHeader(event, 'x-vercel-cron')
    const expectedSecret = process.env.OVERDUE_CRON_SECRET

    if (expectedSecret) {
      const providedSecret = getHeader(event, 'x-cron-secret')

      if (!providedSecret || providedSecret !== expectedSecret) {
        return sendError(event, createError({
          statusCode: 401,
          message: 'Unauthorized',
        }))
      }
    } else if (process.env.NODE_ENV === 'production' && !cronHeader) {
      return sendError(event, createError({
        statusCode: 403,
        message: 'Forbidden',
      }))
    }

    const supabase = getSupabaseClient()
    const now = new Date()

    const { data: orders, error } = await supabase
      .from('orders')
      .select(
        'id, title, code, due_date, due_time, status, archived, assignee_telegram_id, assignee_telegram_name'
      )
      .not('due_date', 'is', null)
      .not('assignee_telegram_id', 'is', null)
      .neq('archived', true)
      .neq('status', 'done')

    if (error) {
      console.error('[Cron] Failed to fetch orders:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch orders',
      }))
    }

    const overdueOrders = (orders || []).reduce(
      (acc: Array<{ order: OrderRecord; dueDate: Date }>, order: OrderRecord) => {
        const dueDate = parseDueDate(order)
        if (!dueDate) {
          return acc
        }

        const isOverdue = dueDate.getTime() <= now.getTime()
        const status = (order.status || '').toLowerCase()
        const isCompleted = status === 'done' || status === 'completed'

        if (isOverdue && !isCompleted) {
          acc.push({ order, dueDate })
        }

        return acc
      },
      []
    )

    let notificationsSent = 0

    for (const { order, dueDate } of overdueOrders) {
      if (!order.assignee_telegram_id) {
        continue
      }

      const includeTime = Boolean(order.due_time) || !(dueDate.getHours() === 0 && dueDate.getMinutes() === 0)
      const dueLabel = formatDueDateLabel(dueDate, includeTime)
      const orderTitle = order.title?.trim() || 'Задача'
      const assigneeName = order.assignee_telegram_name?.trim()

      const messageLines = [
        '⚠️ <b>Задача просрочена</b>',
        '',
        `Задача: <b>${orderTitle}</b>`,
        `Срок: <b>${dueLabel}</b>`,
        '',
        'Пожалуйста завершите задачу или измените срок.'
      ]

      if (assigneeName) {
        messageLines.splice(2, 0, `Исполнитель: <b>${assigneeName}</b>`)
      }

      const orderUrl = `${WEB_URL}/orders/${order.id}`
      const replyMarkup = Markup.inlineKeyboard([
        [Markup.button.webApp('Перейти к задаче', orderUrl)],
      ])

      try {
        await sendTelegramMessage(order.assignee_telegram_id, messageLines.join('\n'), replyMarkup)
        notificationsSent += 1
      } catch (sendError) {
        console.error(`[Cron] Failed to notify assignee ${order.assignee_telegram_id} for order ${order.id}:`, sendError)
      }
    }

    return {
      checked: orders?.length || 0,
      overdue: overdueOrders.length,
      notificationsSent,
    }
  } catch (error) {
    console.error('[Cron] Unexpected error while checking overdue tasks:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error',
    }))
  }
})
