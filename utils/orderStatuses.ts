/**
 * Unified order status definitions
 * This file serves as the single source of truth for all order status-related data
 */

export type OrderStatus = 'pending' | 'in_progress' | 'review' | 'done'
export type OrderStatusTone = 'info' | 'warning' | 'danger' | 'success'
export type OrderStatusFilter = 'all' | OrderStatus

/**
 * Status metadata for UI display
 */
export interface OrderStatusMeta {
  label: string
  tone: OrderStatusTone
  badgeBg: string
  badgeText: string
  dot: string
  cardClass: string
  chipTheme: {
    inactive: string
    active: string
  }
}

/**
 * Status metadata for all order statuses
 */
export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending: {
    label: 'Новый',
    tone: 'danger',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500 dark:bg-red-400',
    cardClass: 'bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/25',
    chipTheme: {
      inactive: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-100',
      active: 'bg-red-200 text-red-900 dark:bg-red-500/30 dark:text-red-50',
    },
  },
  in_progress: {
    label: 'В работе',
    tone: 'warning',
    badgeBg: 'bg-yellow-500/20',
    badgeText: 'text-yellow-600 dark:text-yellow-400',
    dot: 'bg-yellow-500 dark:bg-yellow-400',
    cardClass: 'bg-yellow-50 border border-yellow-100 dark:bg-yellow-500/10 dark:border-yellow-500/25',
    chipTheme: {
      inactive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-100',
      active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-50',
    },
  },
  review: {
    label: 'Проверяется',
    tone: 'info',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-500 dark:text-blue-400',
    dot: 'bg-blue-500 dark:bg-blue-400',
    cardClass: 'bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/25',
    chipTheme: {
      inactive: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-100',
      active: 'bg-blue-200 text-blue-900 dark:bg-blue-500/30 dark:text-blue-50',
    },
  },
  done: {
    label: 'Сделано',
    tone: 'success',
    badgeBg: 'bg-green-500/20',
    badgeText: 'text-green-500 dark:text-green-400',
    dot: 'bg-green-500 dark:bg-green-400',
    cardClass: 'bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/25',
    chipTheme: {
      inactive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100',
      active: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-50',
    },
  },
}

/**
 * Filter options for order status filtering
 */
export const ORDER_STATUS_FILTERS = [
  { value: 'all' as const, label: 'Все' },
  { value: 'pending' as const, label: ORDER_STATUS_META.pending.label },
  { value: 'in_progress' as const, label: ORDER_STATUS_META.in_progress.label },
  { value: 'review' as const, label: ORDER_STATUS_META.review.label },
  { value: 'done' as const, label: ORDER_STATUS_META.done.label },
] as const

/**
 * Chip theme for status filters (including 'all')
 */
export const STATUS_CHIP_THEMES: Record<OrderStatusFilter, { inactive: string; active: string }> = {
  all: {
    inactive: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white',
    active: 'bg-primary text-white',
  },
  pending: ORDER_STATUS_META.pending.chipTheme,
  in_progress: ORDER_STATUS_META.in_progress.chipTheme,
  review: ORDER_STATUS_META.review.chipTheme,
  done: ORDER_STATUS_META.done.chipTheme,
}

/**
 * Map database status values to OrderStatus
 * Handles variations like 'new' -> 'pending'
 */
export const mapDbStatusToOrderStatus = (dbStatus: string): OrderStatus => {
  const statusMap: Record<string, OrderStatus> = {
    new: 'pending',
    pending: 'pending',
    in_progress: 'in_progress',
    review: 'review',
    done: 'done',
    cancelled: 'pending', // cancelled orders treated as pending
  }
  return statusMap[dbStatus] || 'pending'
}

/**
 * Get status metadata for a given status
 */
export const getOrderStatusMeta = (status: OrderStatus): OrderStatusMeta => {
  return ORDER_STATUS_META[status]
}

/**
 * Get status label for a given status
 */
export const getOrderStatusLabel = (status: OrderStatus): string => {
  return ORDER_STATUS_META[status].label
}
