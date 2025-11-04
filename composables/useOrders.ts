import type { Order } from '~/data/orders'
import {
  useOrdersStore,
  type CreateOrderInput,
  type UpdateOrderInput,
} from '~/stores/orders'

/**
 * Composable for using orders with Pinia store
 * Provides a convenient interface to the orders store
 */
export const useOrders = () => {
  const store = useOrdersStore()

  const orders = computed(() => store.orders)
  const isLoading = computed(() => store.isLoading)
  const isCreating = computed(() => store.isCreating)
  const isUpdating = computed(() => store.isUpdating)
  const isDeleting = computed(() => store.isDeleting)
  const error = computed(() => store.error)

  /**
   * Fetch all orders from the server
   * @param projectId Optional project ID to filter orders
   */
  const fetchOrders = async (projectId?: string): Promise<Order[]> => {
    return await store.fetchOrders(projectId)
  }

  /**
   * Fetch a single order by ID from the server
   */
  const fetchOrder = async (orderId: string): Promise<Order> => {
    return await store.fetchOrder(orderId)
  }

  /**
   * Create a new order on the server
   */
  const createOrder = async (input: CreateOrderInput): Promise<Order> => {
    return await store.createOrder(input)
  }

  /**
   * Update an existing order on the server
   */
  const updateOrder = async (
    orderId: string,
    input: UpdateOrderInput,
  ): Promise<Order> => {
    return await store.updateOrder(orderId, input)
  }

  /**
   * Delete an order from the server
   */
  const deleteOrder = async (orderId: string): Promise<void> => {
    await store.deleteOrder(orderId)
  }

  return {
    // State
    orders,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    // Actions
    fetchOrders,
    fetchOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    // Additional helpers
    getOrderById: store.getOrderById,
    getOrdersByProjectId: store.getOrdersByProjectId,
  }
}

// Re-export types for convenience
export type { CreateOrderInput, UpdateOrderInput }
