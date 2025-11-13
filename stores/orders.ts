import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Order } from '~/data/orders'
import { useTelegram } from '~/composables/useTelegram'

export interface CreateOrderInput {
  project_id?: string | null
  title?: string | null
  summary?: string
  description?: string
  status?: string
  archived?: boolean
  assignee_telegram_id?: number | null
  assignee_telegram_name?: string | null
  assignee_telegram_avatar_url?: string | null
  due_date?: string | null
  delivery_address?: string | null
  reminder_offset?: string | null
  client_name?: string | null
  client_phone?: string | null
  payment_type?: string | null
  prepayment_amount?: number | null
  total_amount?: number | null
  image_urls?: string[]
  code?: string
}

export interface UpdateOrderInput {
  project_id?: string | null
  title?: string | null
  summary?: string
  description?: string
  status?: string
  archived?: boolean
  assignee_telegram_id?: number | null
  assignee_telegram_name?: string | null
  assignee_telegram_avatar_url?: string | null
  due_date?: string | null
  delivery_address?: string | null
  reminder_offset?: string | null
  client_name?: string | null
  client_phone?: string | null
  payment_type?: string | null
  prepayment_amount?: number | null
  total_amount?: number | null
  image_urls?: string[]
  review_comment?: string | null
  review_images?: string[]
}

/**
 * Pinia store for managing orders CRUD operations
 */
export const useOrdersStore = defineStore('orders', () => {
  // State
  const orders = ref<Order[]>([])
  const archivedOrders = ref<Order[]>([])
  const isLoading = ref(false)
  const isLoadingArchived = ref(false)
  const isCreating = ref(false)
  const isUpdating = ref(false)
  const isDeleting = ref(false)
  const error = ref<string | null>(null)

  /**
   * Helper function to get fetch options with initData header
   */
  function getFetchOptions(options: any = {}): any {
    const { getInitData } = useTelegram()
    const initData = getInitData()

    const headers = {
      ...(options.headers || {}),
    }

    if (initData) {
      headers['x-telegram-init-data'] = initData
    }

    return {
      ...options,
      headers,
    }
  }

  /**
   * Fetch all orders from the server
   * @param projectId Optional project ID to filter orders
   */
  async function fetchOrders(projectId?: string): Promise<Order[]> {
    isLoading.value = true
    error.value = null

    try {
      const queryParams = projectId ? { project_id: projectId } : {}
      const response = await $fetch<Order[]>('/api/orders', {
        ...getFetchOptions(),
        query: queryParams,
      })

      // If filtering by project, replace orders for that project
      if (projectId) {
        orders.value = orders.value.filter((order) => {
          const normalizedProjectId = order.projectId ?? 'none'
          return normalizedProjectId !== projectId
        })
        orders.value = [...orders.value, ...response]
      } else {
        orders.value = response
      }

      console.info('[OrdersStore] Orders fetched successfully', {
        count: response.length,
        projectId,
      })

      return response
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось загрузить задачи'
      error.value = errorMessage
      console.error('[OrdersStore] Error fetching orders:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single order by ID from the server
   */
  async function fetchOrder(orderId: string): Promise<Order> {
    isLoading.value = true
    error.value = null

    try {
      const order = await $fetch<Order>(`/api/orders/${orderId}`, getFetchOptions())

      // Update or add order in the list
      const orderIndex = orders.value.findIndex((o) => o.id === orderId)
      if (orderIndex !== -1) {
        orders.value.splice(orderIndex, 1, order)
      } else {
        orders.value.push(order)
      }

      console.info('[OrdersStore] Order fetched successfully', {
        orderId: order.id,
        title: order.title,
      })

      return order
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось загрузить задачу'
      error.value = errorMessage
      console.error('[OrdersStore] Error fetching order:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new order on the server
   */
  async function createOrder(input: CreateOrderInput): Promise<Order> {
    const projectId =
      typeof input.project_id === 'string' ? input.project_id.trim() : input.project_id ?? ''
    const normalizedProjectId = typeof projectId === 'string' && projectId.length > 0 ? projectId : null
    const toNullableString = (value: string | null | undefined): string | null => {
      if (value === undefined || value === null) {
        return null
      }

      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    }

    isCreating.value = true
    error.value = null

    try {
      const newOrder = await $fetch<Order>('/api/orders', getFetchOptions({
        method: 'POST',
        body: {
          project_id: normalizedProjectId,
          title: toNullableString(input.title ?? null),
          summary: input.summary?.trim() || '',
          description: input.description?.trim() || '',
          status: input.status || 'new',
          archived: input.archived ?? false,
          assignee_telegram_id: input.assignee_telegram_id ?? null,
          assignee_telegram_name: input.assignee_telegram_name ?? null,
          assignee_telegram_avatar_url: input.assignee_telegram_avatar_url ?? null,
          due_date: input.due_date || null,
          delivery_address: input.delivery_address || null,
          reminder_offset: input.reminder_offset ?? null,
          client_name: toNullableString(input.client_name ?? null),
          client_phone: toNullableString(input.client_phone ?? null),
          payment_type: input.payment_type || null,
          prepayment_amount: input.prepayment_amount ?? null,
          total_amount: input.total_amount ?? null,
          image_urls: input.image_urls || [],
          code: input.code || undefined,
        },
      }))

      // Add new order to the beginning of the list
      orders.value = [newOrder, ...orders.value]

      console.info('[OrdersStore] Order created successfully', {
        orderId: newOrder.id,
        title: newOrder.title,
        projectId: newOrder.projectId,
      })

      return newOrder
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось создать задачу'
      error.value = errorMessage
      console.error('[OrdersStore] Error creating order:', err)
      throw err
    } finally {
      isCreating.value = false
    }
  }

  /**
   * Update an existing order on the server
   */
  async function updateOrder(
    orderId: string,
    input: UpdateOrderInput,
  ): Promise<Order> {
    const toNullableString = (value: string | null | undefined): string | null | undefined => {
      if (value === undefined) {
        return undefined
      }

      if (value === null) {
        return null
      }

      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    }

    isUpdating.value = true
    error.value = null

    try {
      const body: any = {}

      if (input.title !== undefined) {
        body.title = toNullableString(input.title)
      }
      if (input.summary !== undefined) {
        body.summary = input.summary.trim() || ''
      }
      if (input.description !== undefined) {
        body.description = input.description.trim() || ''
      }
      if (input.status !== undefined) {
        body.status = input.status
      }
      if (input.archived !== undefined) {
        body.archived = input.archived
      }
      if (input.assignee_telegram_id !== undefined) {
        body.assignee_telegram_id = input.assignee_telegram_id
      }
      if (input.project_id !== undefined) {
        if (input.project_id === null) {
          body.project_id = null
        } else if (typeof input.project_id === 'string') {
          const trimmedProjectId = input.project_id.trim()
          body.project_id = trimmedProjectId.length > 0 ? trimmedProjectId : null
        } else {
          body.project_id = null
        }
      }
      if (input.due_date !== undefined) {
        body.due_date = input.due_date
      }
      if (input.delivery_address !== undefined) {
        body.delivery_address = input.delivery_address
      }
      if (input.reminder_offset !== undefined) {
        body.reminder_offset = input.reminder_offset
      }
      if (input.client_name !== undefined) {
        body.client_name = toNullableString(input.client_name)
      }
      if (input.client_phone !== undefined) {
        body.client_phone = toNullableString(input.client_phone)
      }
      if (input.payment_type !== undefined) {
        body.payment_type = input.payment_type
      }
      if (input.prepayment_amount !== undefined) {
        body.prepayment_amount = input.prepayment_amount
      }
      if (input.total_amount !== undefined) {
        body.total_amount = input.total_amount
      }
      if (input.assignee_telegram_name !== undefined) {
        body.assignee_telegram_name = input.assignee_telegram_name
      }
      if (input.assignee_telegram_avatar_url !== undefined) {
        body.assignee_telegram_avatar_url = input.assignee_telegram_avatar_url
      }
      if (input.image_urls !== undefined) {
        body.image_urls = input.image_urls
      }
      if (input.review_comment !== undefined) {
        body.review_comment = input.review_comment?.trim() || null
      }
      if (input.review_images !== undefined) {
        body.review_images = input.review_images
      }

      const updatedOrder = await $fetch<Order>(`/api/orders/${orderId}`, getFetchOptions({
        method: 'PUT',
        body,
      }))

      // Update order in the list
      const orderIndex = orders.value.findIndex((order) => order.id === orderId)
      const archivedOrderIndex = archivedOrders.value.findIndex((order) => order.id === orderId)

      if (orderIndex !== -1) {
        orders.value.splice(orderIndex, 1, updatedOrder)
      } else {
        orders.value.push(updatedOrder)
      }

      if (updatedOrder.archived) {
        if (archivedOrderIndex !== -1) {
          archivedOrders.value.splice(archivedOrderIndex, 1, updatedOrder)
        } else {
          archivedOrders.value.push(updatedOrder)
        }
      } else if (archivedOrderIndex !== -1) {
        archivedOrders.value.splice(archivedOrderIndex, 1)
      }

      console.info('[OrdersStore] Order updated successfully', {
        orderId: updatedOrder.id,
        title: updatedOrder.title,
      })

      return updatedOrder
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось обновить задачу'
      error.value = errorMessage
      console.error('[OrdersStore] Error updating order:', err)
      throw err
    } finally {
      isUpdating.value = false
    }
  }

  /**
   * Delete an order from the server
   */
  async function deleteOrder(orderId: string): Promise<void> {
    isDeleting.value = true
    error.value = null

    try {
      await $fetch(`/api/orders/${orderId}`, getFetchOptions({
        method: 'DELETE',
      }))

      // Remove order from the list
      const orderIndex = orders.value.findIndex((order) => order.id === orderId)
      if (orderIndex !== -1) {
        orders.value.splice(orderIndex, 1)
      }

      console.info('[OrdersStore] Order deleted successfully', {
        orderId,
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось удалить задачу'
      error.value = errorMessage
      console.error('[OrdersStore] Error deleting order:', err)
      throw err
    } finally {
      isDeleting.value = false
    }
  }

  /**
   * Get an order by ID from the store (without fetching from server)
   */
  function getOrderById(orderId: string): Order | undefined {
    return orders.value.find((order) => order.id === orderId)
  }

  /**
   * Get orders by project ID from the store
   */
  function getOrdersByProjectId(projectId: string): Order[] {
    if (projectId === 'none') {
      return orders.value.filter((order) => order.projectId === null)
    }
    return orders.value.filter((order) => order.projectId === projectId)
  }

  /**
   * Fetch archived orders from the server
   */
  async function fetchArchivedOrders(): Promise<Order[]> {
    isLoadingArchived.value = true
    error.value = null

    try {
      const response = await $fetch<Order[]>('/api/orders/archived', getFetchOptions())
      archivedOrders.value = response

      console.info('[OrdersStore] Archived orders fetched successfully', {
        count: response.length,
      })

      return response
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось загрузить заархивированные задачи'
      error.value = errorMessage
      console.error('[OrdersStore] Error fetching archived orders:', err)
      throw err
    } finally {
      isLoadingArchived.value = false
    }
  }

  /**
   * Unarchive an order
   */
  async function unarchiveOrder(orderId: string): Promise<Order> {
    const order = archivedOrders.value.find((item) => item.id === orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    return await updateOrder(orderId, {
      archived: false,
    })
  }

  /**
   * Set orders directly (useful for testing or manual updates)
   */
  function setOrdersList(newOrders: Order[]): void {
    orders.value = newOrders
  }

  /**
   * Clear all orders from the store
   */
  function clearOrders(): void {
    orders.value = []
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    error.value = null
  }

  // Getters as computed refs
  const ordersComputed = computed(() => orders.value)
  const isLoadingComputed = computed(() => isLoading.value)
  const archivedOrdersComputed = computed(() => archivedOrders.value)
  const isLoadingArchivedComputed = computed(() => isLoadingArchived.value)
  const isCreatingComputed = computed(() => isCreating.value)
  const isUpdatingComputed = computed(() => isUpdating.value)
  const isDeletingComputed = computed(() => isDeleting.value)
  const errorComputed = computed(() => error.value)

  return {
    // State
    orders: orders,
    archivedOrders: archivedOrdersComputed,
    isLoading: isLoadingComputed,
    isLoadingArchived: isLoadingArchivedComputed,
    isCreating: isCreatingComputed,
    isUpdating: isUpdatingComputed,
    isDeleting: isDeletingComputed,
    error: errorComputed,
    // Actions
    fetchOrders,
    fetchOrder,
    fetchArchivedOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    unarchiveOrder,
    getOrderById,
    getOrdersByProjectId,
    setOrders: setOrdersList,
    clearOrders,
    clearError,
  }
})
