import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

interface OrderRecord {
  id: string
  title: string | null
  code: string | null
  due_date: string | null
  status: string | null
  archived: boolean | null
  assignee_telegram_id: number | null
  assignee_telegram_name: string | null
  user_telegram_id: number | null
}

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
}

const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
}

interface UserTimeZoneRecord {
  telegram_id: number
  time_zone: string | null
}

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/

function parseDueDate(record: OrderRecord): Date | null {
  const rawDueDate = (record.due_date ?? "").trim()
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

function formatWithTimeZone(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  timeZone: string | null,
): string {
  try {
    const formatOptions = timeZone ? { ...options, timeZone } : options
    return new Intl.DateTimeFormat("ru-RU", formatOptions).format(date)
  } catch (error) {
    console.warn(
      `[Cron] Failed to format date with time zone ${timeZone ?? "<empty>"}:`,
      error,
    )
    return new Intl.DateTimeFormat("ru-RU", options).format(date)
  }
}

function formatDueDateLabel(
  dueDate: Date,
  includeTime: boolean,
  timeZone: string | null,
): string {
  if (!includeTime) {
    return formatWithTimeZone(dueDate, DATE_FORMAT_OPTIONS, timeZone)
  }

  const dateLabel = formatWithTimeZone(dueDate, DATE_FORMAT_OPTIONS, timeZone)
  const timeLabel = formatWithTimeZone(dueDate, TIME_FORMAT_OPTIONS, timeZone)
  return `${dateLabel} в ${timeLabel}`
}

function collectTelegramRecipients(order: OrderRecord): Set<number> {
  const recipients = new Set<number>()

  const assigneeTelegramId = Number(order.assignee_telegram_id)
  if (!Number.isNaN(assigneeTelegramId) && assigneeTelegramId > 0) {
    recipients.add(assigneeTelegramId)
  }

  const creatorTelegramId = Number(order.user_telegram_id)
  if (!Number.isNaN(creatorTelegramId) && creatorTelegramId > 0) {
    recipients.add(creatorTelegramId)
  }

  return recipients
}

async function sendTelegramMessage(
  telegramId: number,
  message: string,
  replyMarkup?: Json
) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN")
  if (!token) {
    console.error("[Cron] TELEGRAM_BOT_TOKEN is not configured")
    return
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      chat_id: telegramId,
      text: message,
      parse_mode: "HTML",
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Telegram API error: ${response.status} ${response.statusText} - ${body}`)
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")
  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase credentials" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  const webUrl = Deno.env.get("WEB_URL") ?? "https://list-orders.vercel.app"

  try {
    const now = new Date()

    const { data: orders, error } = await supabase
      .from<OrderRecord>("orders")
      .select(
        "id, title, code, due_date, status, archived, assignee_telegram_id, assignee_telegram_name, user_telegram_id"
      )
      .not("due_date", "is", null)
      .not("assignee_telegram_id", "is", null)
      .neq("archived", true)
      .neq("status", "done")

    if (error) {
      console.error("[Cron] Failed to fetch orders", error)
      return new Response(
        JSON.stringify({ error: "Failed to fetch orders" }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        }
      )
    }

    const overdueOrders = (orders ?? []).reduce<
      Array<{ order: OrderRecord; dueDate: Date }>
    >((acc, order) => {
      const dueDate = parseDueDate(order)
      if (!dueDate) {
        return acc
      }

      const isOverdue = dueDate.getTime() <= now.getTime()
      const status = (order.status ?? "").toLowerCase()
      const isCompleted = status === "done" || status === "completed"

      if (isOverdue && !isCompleted) {
        acc.push({ order, dueDate })
      }

      return acc
    }, [])

    let notificationsSent = 0

    const overdueOrdersWithRecipients = overdueOrders.map(({ order, dueDate }) => {
      const recipients = collectTelegramRecipients(order)
      return { order, dueDate, recipients }
    })

    const allRecipientIds = new Set<number>()
    for (const { recipients } of overdueOrdersWithRecipients) {
      for (const telegramId of recipients) {
        allRecipientIds.add(telegramId)
      }
    }

    let timeZonesByTelegramId = new Map<number, string | null>()

    if (allRecipientIds.size > 0) {
      const { data: users, error: usersError } = await supabase
        .from<UserTimeZoneRecord>("users")
        .select("telegram_id, time_zone")
        .in("telegram_id", Array.from(allRecipientIds))

      if (usersError) {
        console.error("[Cron] Failed to fetch user time zones", usersError)
      } else if (users) {
        timeZonesByTelegramId = new Map(
          users.map((user) => [Number(user.telegram_id), user.time_zone ?? null]),
        )
      }
    }

    for (const { order, dueDate, recipients } of overdueOrdersWithRecipients) {
      if (recipients.size === 0) {
        continue
      }

      const orderTitle = (order.title ?? "").trim() || "Задача"
      const assigneeName = (order.assignee_telegram_name ?? "").trim()

      const orderUrl = `${webUrl}/orders/${order.id}`
      const replyMarkup = {
        inline_keyboard: [[{ text: "Перейти к задаче", web_app: { url: orderUrl } }]],
      }

      for (const telegramId of recipients) {
        try {
          const timeZone = timeZonesByTelegramId.get(telegramId) ?? null
          const dueLabel = formatDueDateLabel(dueDate, true, timeZone)

          const messageLines = [
            "⚠️ <b>Задача просрочена</b>",
            "",
            `Задача: <b>${orderTitle}</b>`,
            `Срок: <b>${dueLabel}</b>`,
            "",
            "Пожалуйста завершите задачу или измените срок.",
          ]

          if (assigneeName) {
            messageLines.splice(2, 0, `Исполнитель: <b>${assigneeName}</b>`)
          }

          const message = messageLines.join("\n")

          await sendTelegramMessage(telegramId, message, replyMarkup)
          notificationsSent += 1
        } catch (err) {
          console.error(
            `[Cron] Failed to notify telegram user ${telegramId} for order ${order.id}:`,
            err
          )
        }
      }
    }

    return new Response(
      JSON.stringify({
        orders,
        overdueOrders,
        notificationsSent,
      }),
      {
        headers: { "content-type": "application/json" },
      }
    )
  } catch (error) {
    console.error("[Cron] Unexpected error while checking overdue tasks", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    )
  }
})
