import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

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

const DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

const TIME_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
})

function parseDueDate(record: OrderRecord): Date | null {
  if (!record.due_date) {
    return null
  }

  let dueDate = new Date(record.due_date)
  if (Number.isNaN(dueDate.getTime())) {
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
    const [hoursStr, minutesStr] = record.due_time.split(":")
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
        "id, title, code, due_date, due_time, status, archived, assignee_telegram_id, assignee_telegram_name"
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

    for (const { order, dueDate } of overdueOrders) {
      const telegramId = Number(order.assignee_telegram_id)
      if (!telegramId || Number.isNaN(telegramId)) {
        continue
      }

      const includeTime = Boolean(order.due_time) || !(dueDate.getHours() === 0 && dueDate.getMinutes() === 0)
      const dueLabel = formatDueDateLabel(dueDate, includeTime)
      const orderTitle = (order.title ?? "").trim() || "Задача"
      const assigneeName = (order.assignee_telegram_name ?? "").trim()

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

      const orderUrl = `${webUrl}/orders/${order.id}`
      const replyMarkup = {
        inline_keyboard: [[{ text: "Перейти к задаче", web_app: { url: orderUrl } }]],
      }

      try {
        await sendTelegramMessage(telegramId, messageLines.join("\n"), replyMarkup)
        notificationsSent += 1
      } catch (err) {
        console.error(
          `[Cron] Failed to notify assignee ${telegramId} for order ${order.id}:`,
          err
        )
      }
    }

    return new Response(
      JSON.stringify({
        checked: orders?.length ?? 0,
        overdue: overdueOrders.length,
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
