import { mapDbStatusToOrderStatus } from '~/utils/orderStatuses'
import type { Order } from '~/data/orders'
import type { ProjectOrder } from '~/data/projects'

export interface ConvertOrderToProjectOrderOptions {
  projectTitle?: string | null
}

export const convertOrderToProjectOrder = (
  order: Order,
  options: ConvertOrderToProjectOrderOptions = {},
): ProjectOrder => {
  const orderStatus = mapDbStatusToOrderStatus(order.status)

  return {
    id: order.id,
    title: order.title,
    assignee: {
      name: order.assigneeTelegramName || 'Не назначен',
      avatarUrl:
        order.assigneeTelegramAvatarUrl ||
        'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23282e39%22/%3E%3Cpath d=%22M32 34c6.075 0 11-4.925 11-11S38.075 12 32 12s-11 4.925-11 11 4.925 11 11 11Zm0 4c-7.732 0-21 3.882-21 11.5V52a4 4 0 0 0 4 4h34a4 4 0 0 0 4-4v-2.5C53 41.882 39.732 38 32 38Z%22 fill=%22%239da6b9%22/%3E%3C/svg%3E',
    },
    status: orderStatus,
    dueDate: order.dueDate || undefined,
    description: order.description || undefined,
    clientName: order.clientName,
    clientPhone: order.clientPhone,
    projectId: order.projectId,
    projectTitle: options.projectTitle?.trim() || undefined,
  }
}
