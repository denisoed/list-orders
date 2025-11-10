import type { OrderStatus } from '~/utils/orderStatuses'

export type { OrderStatus }
export type OrderReminderOffset =
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '3h'
  | '6h'
  | '12h'
  | '1d'
  | '2d'

export const ORDER_REMINDER_OFFSETS: ReadonlyArray<OrderReminderOffset> = [
  '15m',
  '30m',
  '1h',
  '2h',
  '3h',
  '6h',
  '12h',
  '1d',
  '2d',
]

export interface OrderAttachment {
  id: string
  name: string
  previewUrl: string
}

export interface OrderAssignee {
  name: string
  avatarUrl: string
}

export interface ProjectOrder {
  id: string
  title: string
  assignee: OrderAssignee
  status: OrderStatus
  dueDate?: string
  description?: string
  attachments?: OrderAttachment[]
  clientName?: string
  clientPhone?: string
  deliveryAddress?: string
  isPickup?: boolean
  remindBefore?: OrderReminderOffset | OrderReminderOffset[]
}

export interface ProjectFeaturesSettings {
  requireReview?: boolean
  orderFields?: {
    title?: boolean
    description?: boolean
    assignee?: boolean
    attachments?: boolean
    payment?: boolean
    delivery?: boolean
    clientName?: boolean
    clientPhone?: boolean
    dueDate?: boolean
    dueTime?: boolean
    reminder?: boolean
  }
}

export interface Project {
  id: string
  title: string
  description: string
  completed: number
  total: number
  color?: string
  ownerTelegramId?: number
  membersCount?: number
  archived?: boolean
  featuresSettings?: ProjectFeaturesSettings
}
