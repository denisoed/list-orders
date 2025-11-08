import type { OrderStatusTone } from '~/utils/orderStatuses'
import { mapDbStatusToOrderStatus, getOrderStatusMeta } from '~/utils/orderStatuses'

export type { OrderStatusTone }

/**
 * Order interface matching server API response
 */
export interface Order {
  id: string
  code: string
  title: string
  summary: string
  description: string
  status: string
  archived: boolean
  assigneeTelegramId: number | null
  assigneeTelegramAvatarUrl: string | null
  assigneeTelegramName: string | null
  creatorTelegramId: number | null
  creatorTelegramName: string | null
  dueDate: string | null
  dueTime: string | null
  deliveryAddress: string | null
  reminderOffset: string | null
  projectId: string
  clientName: string
  clientPhone: string
  paymentType: string | null
  prepaymentAmount: number | null
  totalAmount: number | null
  imageUrls: string[]
  reviewComment: string | null
  reviewImages: string[]
  reviewAnswer: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderStatusChip {
  id: string
  label: string
  tone: OrderStatusTone
}

export interface OrderAssignee {
  name: string
  avatarUrl: string
  role: string
}

export interface OrderAttachment {
  id: string
  name: string
  size: string
  icon: string
  previewUrl: string
}

export interface OrderHistoryItem {
  id: string
  icon: string
  description: string
  timestamp: string
  author?: string
}

export interface OrderClient {
  name: string
  phone: string
  payment: string
  prepayment: string
  totalAmount: string
}

export interface OrderDetail {
  id: string
  code: string
  title: string
  summary: string
  statusChips: OrderStatusChip[]
  assignee: OrderAssignee | null
  dueDateLabel: string
  projectName: string
  description: string
  client: OrderClient
  attachments: OrderAttachment[]
  history: OrderHistoryItem[]
  deliveryAddress: string | null
}

// Format timestamp for history in format "d month yyyy в hh:mm"
function formatHistoryTimestamp(dateString: string): string {
  try {
    const date = new Date(dateString)
    const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${dateFormatter.format(date)} в ${timeFormatter.format(date)}`
  } catch (error) {
    return dateString
  }
}

/**
 * Convert Order from API to OrderDetail for UI display
 */
export const convertOrderToOrderDetail = (order: Order, projectName?: string): OrderDetail => {
  // Format due date in format "d month yyyy в hh:mm"
  let dueDateLabel = ''
  const parseDueDate = (value: string) => {
    // Handle dates stored as YYYY-MM-DD (without timezone)
    const dateOnlyMatch = value.match(/^\d{4}-\d{2}-\d{2}$/)
    if (dateOnlyMatch) {
      const [yearStr, monthStr, dayStr] = value.split('-')
      const year = Number.parseInt(yearStr, 10)
      const month = Number.parseInt(monthStr, 10)
      const day = Number.parseInt(dayStr, 10)

      if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
        return new Date(year, month - 1, day)
      }
    }

    const parsedDate = new Date(value)
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  if (order.dueDate) {
    try {
      const parsedDate = parseDueDate(order.dueDate)
      if (!parsedDate) {
        throw new Error(`Unable to parse due date: ${order.dueDate}`)
      }

      const date = new Date(parsedDate)
      const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

      // If dueTime is provided, use it; otherwise use time from dueDate
      if (order.dueTime) {
        const timeParts = order.dueTime.split(':')
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0], 10)
          const minutes = parseInt(timeParts[1], 10)
          if (!isNaN(hours) && !isNaN(minutes)) {
            date.setHours(hours, minutes, 0, 0)
            dueDateLabel = `${dateFormatter.format(date)} в ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
          } else {
            dueDateLabel = dateFormatter.format(date)
          }
        } else {
          dueDateLabel = dateFormatter.format(date)
        }
      } else {
        // If no dueTime, check if date has time component
        const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        })
        const timeStr = timeFormatter.format(date)
        // If time is 00:00, don't show it
        if (timeStr === '00:00') {
          dueDateLabel = dateFormatter.format(date)
        } else {
          dueDateLabel = `${dateFormatter.format(date)} в ${timeStr}`
        }
      }
    } catch (error) {
      console.error('Error formatting due date:', error)
    }
  }

  // Map status to status chips
  const statusChips: OrderStatusChip[] = []
  if (order.status) {
    const orderStatus = mapDbStatusToOrderStatus(order.status)
    const statusMeta = getOrderStatusMeta(orderStatus)
    statusChips.push({
      id: `status-${order.status}`,
      label: statusMeta.label,
      tone: statusMeta.tone,
    })
  }

  // Format payment info
  const paymentTypeLabels: Record<string, string> = {
    prepayment: 'Предоплата',
    full: 'Полная оплата',
    partial: 'Частичная оплата',
    on_delivery: 'Оплата при доставке',
    on_completion: 'Оплата по факту',
  }

  const paymentTypeLabel = order.paymentType
    ? paymentTypeLabels[order.paymentType] || order.paymentType
    : 'Оплата по факту'

  const formatAmount = (amount: number | null) => {
    if (amount === null || amount === undefined) {
      return '0'
    }
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Build assignee from new fields
  const assignee: OrderAssignee | null = order.assigneeTelegramName && order.assigneeTelegramAvatarUrl
    ? {
        name: order.assigneeTelegramName,
        avatarUrl: order.assigneeTelegramAvatarUrl,
        role: '', // Role is not available from DB fields
      }
    : null

  return {
    id: order.id,
    code: order.code,
    title: order.title,
    summary: order.summary || '',
    description: order.description || '',
    statusChips,
    assignee,
    dueDateLabel,
    projectName: projectName || 'Проект',
    client: {
      name: order.clientName,
      phone: order.clientPhone,
      payment: paymentTypeLabel,
      prepayment: formatAmount(order.prepaymentAmount),
      totalAmount: formatAmount(order.totalAmount),
    },
    attachments: order.imageUrls?.map((url, index) => ({
      id: `img-${index}`,
      name: `image-${index + 1}`,
      size: '',
      icon: 'image',
      previewUrl: url,
    })) || [], // Convert imageUrls to attachments format
    history: [
      {
        id: 'history-created',
        icon: 'add',
        description: 'Задача создана',
        timestamp: formatHistoryTimestamp(order.createdAt),
        author: order.creatorTelegramName || undefined,
      },
    ],
    deliveryAddress: order.deliveryAddress,
  }
}
