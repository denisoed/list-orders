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
  assigneeTelegramId: number | null
  assigneeTelegramAvatarUrl: string | null
  assigneeTelegramName: string | null
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

// Format timestamp for history (date and time separately)
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
    return `${dateFormatter.format(date)}, ${timeFormatter.format(date)}`
  } catch (error) {
    return dateString
  }
}

/**
 * Convert Order from API to OrderDetail for UI display
 */
export const convertOrderToOrderDetail = (order: Order, projectName?: string): OrderDetail => {
  // Format due date
  let dueDateLabel = ''
  if (order.dueDate) {
    try {
      const date = new Date(order.dueDate)
      const formatter = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      dueDateLabel = formatter.format(date)
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
      return '0 ₽'
    }
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
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
        description: 'Заказ создан',
        timestamp: formatHistoryTimestamp(order.createdAt),
        author: assignee?.name || undefined,
      },
    ],
    deliveryAddress: order.deliveryAddress,
  }
}
