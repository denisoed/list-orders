import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

type OrderReminderOffset =
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "3h"
  | "6h"
  | "12h"
  | "1d"
  | "2d"

interface OrderRecord {
  id: string
  title: string | null
  code: string | null
  due_date: string | null
  due_time: string | null
  status: string | null
  archived: boolean | null
  reminder_offset: string | null
  assignee_telegram_id: number | null
  assignee_telegram_name: string | null
  user_telegram_id: number | null
}

interface OrderReminderLogRecord {
  order_id: string
  reminder_offset: string
  target_datetime: string
}

interface ReminderCandidate {
  order: OrderRecord
  dueDate: Date
  offset: OrderReminderOffset
  reminderTime: Date
}

const REMINDER_LATE_WINDOW_MS = 3 * 60 * 1000
const REMINDER_EARLY_WINDOW_MS = 3 * 60 * 1000
const REMINDER_LOG_LOOKBACK_MS = Math.max(
  REMINDER_LATE_WINDOW_MS,
  REMINDER_EARLY_WINDOW_MS,
)

const REMINDER_OPTIONS: Record<
  OrderReminderOffset,
  { label: string; milliseconds: number }
> = {
  "15m": { label: "15 минут", milliseconds: 15 * 60 * 1000 },
  "30m": { label: "30 минут", milliseconds: 30 * 60 * 1000 },
  "1h": { label: "1 час", milliseconds: 60 * 60 * 1000 },
  "2h": { label: "2 часа", milliseconds: 2 * 60 * 60 * 1000 },
  "3h": { label: "3 часа", milliseconds: 3 * 60 * 60 * 1000 },
  "6h": { label: "6 часов", milliseconds: 6 * 60 * 60 * 1000 },
  "12h": { label: "12 часов", milliseconds: 12 * 60 * 60 * 1000 },
  "1d": { label: "1 день", milliseconds: 24 * 60 * 60 * 1000 },
  "2d": { label: "2 дня", milliseconds: 2 * 24 * 60 * 60 * 1000 },
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

const REMINDER_ORDER: ReadonlyArray<OrderReminderOffset> = [
  "15m",
  "30m",
  "1h",
  "2h",
  "3h",
  "6h",
  "12h",
  "1d",
  "2d",
]

function normalizeReminderOffsets(offsets: OrderReminderOffset[]): OrderReminderOffset[] {
  const allowed = new Set<OrderReminderOffset>(REMINDER_ORDER)
  const unique = new Set<OrderReminderOffset>()
  for (const offset of REMINDER_ORDER) {
    if (offsets.includes(offset) && allowed.has(offset)) {
      unique.add(offset)
    }
  }
  return Array.from(unique)
}

function parseReminderOffsets(value: string | null): OrderReminderOffset[] {
  if (!value) {
    return []
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return []
  }

  const ensureArray = (): unknown => {
    if (trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed)
      } catch (error) {
        console.warn(
          "[RemindUpcomingTasks] Failed to parse reminder offsets as JSON, falling back to comma split:",
          error,
        )
      }
    }

    return trimmed.split(",").map((item) => item.trim()).filter(Boolean)
  }

  const parsed = ensureArray()
  if (!Array.isArray(parsed)) {
    return []
  }

  const filtered = parsed.filter((offset): offset is OrderReminderOffset => {
    return typeof offset === "string" && offset in REMINDER_OPTIONS
  })

  return normalizeReminderOffsets(filtered)
}

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

  const dueTime = (record.due_time ?? "").trim()
  if (!dueTime) {
    return null
  }

  const [hoursStr, minutesStr] = dueTime.split(":")
  const hours = Number(hoursStr)
  const minutes = Number(minutesStr)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null
  }

  dueDate.setHours(hours, minutes, 0, 0)
  return dueDate
}

function formatDueDateLabel(dueDate: Date): string {
  return `${DATE_FORMATTER.format(dueDate)} в ${TIME_FORMATTER.format(dueDate)}`
}

async function sendTelegramMessage(
  telegramId: number,
  message: string,
  replyMarkup?: Json,
) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN")
  if (!token) {
    console.error("[RemindUpcomingTasks] TELEGRAM_BOT_TOKEN is not configured")
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

function buildReminderKey(record: OrderReminderLogRecord): string {
  const timestamp = new Date(record.target_datetime).getTime()
  return `${record.order_id}::${record.reminder_offset}::${timestamp}`
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
      },
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  const webUrl = Deno.env.get("WEB_URL") ?? "https://list-orders.vercel.app"

  try {
    const now = new Date()
    const nowTimestamp = now.getTime()
    const earliestReminderTimestamp = nowTimestamp - REMINDER_LATE_WINDOW_MS
    const latestReminderTimestamp = nowTimestamp + REMINDER_EARLY_WINDOW_MS

    const { data: orders, error } = await supabase
      .from<OrderRecord>("orders")
      .select(
        "id, title, code, due_date, due_time, status, archived, reminder_offset, assignee_telegram_id, assignee_telegram_name, user_telegram_id",
      )
      .not("reminder_offset", "is", null)
      .not("due_date", "is", null)
      .neq("archived", true)
      .neq("status", "done")

    if (error) {
      console.error("[RemindUpcomingTasks] Failed to fetch orders", error)
      return new Response(
        JSON.stringify({ error: "Failed to fetch orders" }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        },
      )
    }

    const candidates: ReminderCandidate[] = []

    for (const order of orders ?? []) {
      const dueDate = parseDueDate(order)
      if (!dueDate) {
        continue
      }

      const offsets = parseReminderOffsets(order.reminder_offset)
      if (!offsets.length) {
        continue
      }

      for (const offset of offsets) {
        const option = REMINDER_OPTIONS[offset]
        const reminderTimestamp = dueDate.getTime() - option.milliseconds
        if (Number.isNaN(reminderTimestamp)) {
          continue
        }

        if (reminderTimestamp > latestReminderTimestamp) {
          continue
        }

        if (reminderTimestamp < earliestReminderTimestamp) {
          continue
        }

        candidates.push({
          order,
          dueDate,
          offset,
          reminderTime: new Date(reminderTimestamp),
        })
      }
    }

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({
          orders: orders ?? [],
          remindersPlanned: 0,
          remindersSent: 0,
        }),
        {
          headers: { "content-type": "application/json" },
        },
      )
    }

    const orderIds = Array.from(new Set(candidates.map((candidate) => candidate.order.id)))

    const minTargetTime = Math.min(
      ...candidates.map((candidate) => candidate.reminderTime.getTime()),
    )

    let existingLogs: OrderReminderLogRecord[] = []

    if (orderIds.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from<OrderReminderLogRecord>("order_reminder_logs")
        .select("order_id, reminder_offset, target_datetime")
        .in("order_id", orderIds)
        .gte(
          "target_datetime",
          new Date(minTargetTime - REMINDER_LOG_LOOKBACK_MS).toISOString(),
        )

      if (logsError) {
        console.error("[RemindUpcomingTasks] Failed to fetch reminder logs", logsError)
        return new Response(
          JSON.stringify({ error: "Failed to fetch reminder logs" }),
          {
            status: 500,
            headers: { "content-type": "application/json" },
          },
        )
      }

      existingLogs = logs ?? []
    }

    const sentLogKeys = new Set<string>(existingLogs.map((log) => buildReminderKey(log)))

    const remindersToSend = candidates.filter((candidate) => {
      const key = `${candidate.order.id}::${candidate.offset}::${candidate.reminderTime.getTime()}`
      return !sentLogKeys.has(key)
    })

    let remindersSent = 0

    for (const reminder of remindersToSend) {
      const recipients = new Set<number>()

      const assigneeTelegramId = Number(reminder.order.assignee_telegram_id)
      if (!Number.isNaN(assigneeTelegramId) && assigneeTelegramId > 0) {
        recipients.add(assigneeTelegramId)
      }

      const creatorTelegramId = Number(reminder.order.user_telegram_id)
      if (!Number.isNaN(creatorTelegramId) && creatorTelegramId > 0) {
        recipients.add(creatorTelegramId)
      }

      if (recipients.size === 0) {
        continue
      }

      const dueLabel = formatDueDateLabel(reminder.dueDate)
      const orderTitle = (reminder.order.title ?? "").trim() || "Задача"
      const assigneeName = (reminder.order.assignee_telegram_name ?? "").trim()
      const reminderLabel = REMINDER_OPTIONS[reminder.offset]?.label ?? reminder.offset

      const messageLines = [
        "⏰ <b>Скоро срок задачи</b>",
        "",
        `Задача: <b>${orderTitle}</b>`,
        `Срок: <b>${dueLabel}</b>`,
        `Напоминание: <b>${reminderLabel}</b> до срока`,
        "",
        "Не забудьте завершить задачу вовремя.",
      ]

      if (assigneeName) {
        messageLines.splice(2, 0, `Исполнитель: <b>${assigneeName}</b>`)
      }

      const orderUrl = `${webUrl}/orders/${reminder.order.id}`
      const replyMarkup = {
        inline_keyboard: [[{ text: "Перейти к задаче", web_app: { url: orderUrl } }]],
      }

      const message = messageLines.join("\n")
      let notificationSent = false

      for (const telegramId of recipients) {
        try {
          await sendTelegramMessage(telegramId, message, replyMarkup)
          notificationSent = true
          remindersSent += 1
        } catch (err) {
          console.error(
            `[RemindUpcomingTasks] Failed to notify telegram user ${telegramId} for order ${reminder.order.id}:`,
            err,
          )
        }
      }

      if (!notificationSent) {
        continue
      }

      const insertPayload = {
        order_id: reminder.order.id,
        reminder_offset: reminder.offset,
        target_datetime: reminder.reminderTime.toISOString(),
      }

      const { error: insertError } = await supabase
        .from("order_reminder_logs")
        .upsert(insertPayload, {
          onConflict: "order_id, reminder_offset, target_datetime",
        })

      if (insertError) {
        console.error(
          `[RemindUpcomingTasks] Failed to save reminder log for order ${reminder.order.id}:`,
          insertError,
        )
      }
    }

    return new Response(
      JSON.stringify({
        orders: orders ?? [],
        remindersPlanned: remindersToSend.length,
        remindersSent,
      }),
      {
        headers: { "content-type": "application/json" },
      },
    )
  } catch (error) {
    console.error("[RemindUpcomingTasks] Unexpected error", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    )
  }
})
