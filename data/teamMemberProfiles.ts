export type TeamMemberOrderStatus = 'in-progress' | 'completed' | 'overdue'

export interface TeamMemberContact {
  id: string
  type: 'telegram' | 'phone' | 'email'
  label: string
  value: string
  href: string
  icon: string
}

export interface TeamMemberOrder {
  id: string
  title: string
  status: TeamMemberOrderStatus
  dueDateLabel: string
}

export interface TeamMemberHistoryItem {
  id: string
  title: string
  completedAtLabel: string
}

export interface TeamMemberProfile {
  id: string
  name: string
  role: string
  department: string
  avatarUrl?: string | null
  bio?: string
  contacts: TeamMemberContact[]
  orders: TeamMemberOrder[]
  history: TeamMemberHistoryItem[]
}
