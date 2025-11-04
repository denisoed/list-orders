export type OrderStatusTone = 'info' | 'warning' | 'danger' | 'success'

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
    const statusMap: Record<string, { label: string; tone: OrderStatusTone }> = {
      new: { label: 'Новый', tone: 'info' },
      pending: { label: 'Ожидает', tone: 'info' },
      in_progress: { label: 'В работе', tone: 'warning' },
      review: { label: 'Проверяется', tone: 'warning' },
      done: { label: 'Сделано', tone: 'success' },
      cancelled: { label: 'Отменен', tone: 'danger' },
    }
    const statusInfo = statusMap[order.status] || { label: order.status, tone: 'info' as OrderStatusTone }
    statusChips.push({
      id: `status-${order.status}`,
      label: statusInfo.label,
      tone: statusInfo.tone,
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
    attachments: [], // Will be populated separately if attachments are available
    history: [
      {
        id: 'history-created',
        icon: 'add',
        description: `Заказ создан ${new Date(order.createdAt).toLocaleString('ru-RU')}`,
        timestamp: new Date(order.createdAt).toLocaleString('ru-RU'),
      },
    ],
  }
}
