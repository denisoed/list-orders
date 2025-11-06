import type { OrderStatus } from '~/utils/orderStatuses'

export type { OrderStatus }
export type OrderReminderOffset = '1h' | '3h' | '1d'

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
  dueDate: string
  dueTime?: string
  description?: string
  attachments?: OrderAttachment[]
  clientName?: string
  clientPhone?: string
  deliveryAddress?: string
  isPickup?: boolean
  remindBefore?: OrderReminderOffset
}

export interface ProjectFeaturesSettings {
  requireReview?: boolean
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
