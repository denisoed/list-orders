export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done'
export type TaskReminderOffset = '1h' | '3h' | '1d'

export interface TaskAttachment {
  id: string
  name: string
  previewUrl: string
}

export interface TaskAssignee {
  name: string
  avatarUrl: string
}

export interface ProjectTask {
  id: string
  title: string
  assignee: TaskAssignee
  status: TaskStatus
  dueDate: string
  dueTime?: string
  description?: string
  attachments?: TaskAttachment[]
  clientName?: string
  clientPhone?: string
  deliveryAddress?: string
  isPickup?: boolean
  remindBefore?: TaskReminderOffset
}

export interface Project {
  id: string
  title: string
  description: string
  completed: number
  total: number
  color?: string
}
