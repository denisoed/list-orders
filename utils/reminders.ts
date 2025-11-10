import { ORDER_REMINDER_OFFSETS, type OrderReminderOffset } from '~/data/projects'

export const REMINDER_LABELS: Record<OrderReminderOffset, string> = {
  '15m': '15 минут',
  '30m': '30 минут',
  '1h': '1 час',
  '2h': '2 часа',
  '3h': '3 часа',
  '6h': '6 часов',
  '12h': '12 часов',
  '1d': '1 день',
  '2d': '2 дня',
}

export const parseReminderOffsets = (
  value: string | string[] | null | undefined,
): OrderReminderOffset[] => {
  if (!value) {
    return []
  }

  const ensureArray = (): unknown => {
    if (Array.isArray(value)) {
      return value
    }

    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }

    try {
      if (trimmed.startsWith('[')) {
        return JSON.parse(trimmed)
      }

      return trimmed
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    } catch (error) {
      console.warn('[Reminders] Failed to parse reminder offsets, falling back to comma split:', error)
      return trimmed
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    }
  }

  const parsed = ensureArray()
  if (!Array.isArray(parsed)) {
    return []
  }

  const parsedStrings = parsed.filter((offset): offset is string => typeof offset === 'string')
  const normalized: OrderReminderOffset[] = []

  for (const offset of ORDER_REMINDER_OFFSETS) {
    if (parsedStrings.includes(offset)) {
      normalized.push(offset)
    }
  }

  return normalized
}

export const getReminderLabel = (offset: OrderReminderOffset): string => {
  return REMINDER_LABELS[offset] || offset
}

export const getReminderLabels = (
  value: string | string[] | null | undefined,
): string[] => {
  const offsets = parseReminderOffsets(value)
  return offsets.map(getReminderLabel)
}

export const formatReminderList = (labels: string[]): string => {
  if (!labels.length) {
    return ''
  }

  if (labels.length === 1) {
    return labels[0]
  }

  const head = labels.slice(0, -1)
  const tail = labels[labels.length - 1]

  return `${head.join(', ')} и ${tail}`
}
