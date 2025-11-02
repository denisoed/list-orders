import { useState, createError } from '#imports'
import { computed, ref, type ComputedRef, type MaybeRefOrGetter, toValue, watchEffect } from 'vue'
import {
  cloneOrders,
  type OrderDetail,
  type OrderStatusChip,
} from '~/data/orders'

const ORDERS_STATE_KEY = 'orders-data'

export interface UseOrderDetailsResult {
  order: ComputedRef<OrderDetail | null>
  statusChips: ComputedRef<OrderStatusChip[]>
  isLoading: ComputedRef<boolean>
  error: ComputedRef<Error | null>
  isCompleting: ComputedRef<boolean>
  refresh: () => Promise<void>
  markAsCompleted: () => Promise<void>
}

export const useOrdersState = () => useState<OrderDetail[]>(ORDERS_STATE_KEY, cloneOrders)

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useOrderDetails = (orderId: MaybeRefOrGetter<string | undefined | null>): UseOrderDetailsResult => {
  const ordersState = useOrdersState()

  const currentOrder = ref<OrderDetail | null>(null)
  const loading = ref(false)
  const errorState = ref<Error | null>(null)
  const completing = ref(false)

  const loadOrder = async () => {
    const id = toValue(orderId)

    if (!id) {
      currentOrder.value = null
      errorState.value = createError({ statusCode: 400, statusMessage: 'Не указан идентификатор заказа' })
      return
    }

    loading.value = true
    errorState.value = null

    try {
      await delay(180)

      const order = ordersState.value.find((item) => item.id === id) ?? null

      if (!order) {
        throw createError({ statusCode: 404, statusMessage: 'Заказ не найден' })
      }

      console.info('[orders] открыта страница заказа', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        statuses: order.statuses.map((status) => status.id),
      })

      currentOrder.value = order
    } catch (error) {
      currentOrder.value = null
      errorState.value = error as Error
    } finally {
      loading.value = false
    }
  }

  const markAsCompleted = async () => {
    if (!currentOrder.value) {
      return
    }

    if (!currentOrder.value.allowCompletion) {
      errorState.value = createError({ statusCode: 403, statusMessage: 'Недостаточно прав для завершения заказа' })
      return
    }

    const index = ordersState.value.findIndex((order) => order.id === currentOrder.value?.id)

    if (index === -1) {
      errorState.value = createError({ statusCode: 404, statusMessage: 'Заказ не найден' })
      return
    }

    const snapshot = JSON.parse(JSON.stringify(ordersState.value[index])) as OrderDetail

    completing.value = true
    errorState.value = null

    try {
      ordersState.value.splice(index, 1, {
        ...ordersState.value[index],
        statuses: [
          { id: 'completed', label: 'Завершён', appearance: 'success' },
        ],
        allowCompletion: false,
      })

      currentOrder.value = ordersState.value[index]

      console.info('[orders] заказ отмечен как завершён', {
        orderId: currentOrder.value.id,
        orderNumber: currentOrder.value.orderNumber,
      })
    } catch (error) {
      console.error('[orders] не удалось завершить заказ', error)
      ordersState.value.splice(index, 1, snapshot)
      currentOrder.value = snapshot
      errorState.value = error as Error
      throw error
    } finally {
      completing.value = false
    }
  }

  watchEffect(() => {
    void loadOrder()
  })

  return {
    order: computed(() => currentOrder.value),
    statusChips: computed(() => currentOrder.value?.statuses ?? []),
    isLoading: computed(() => loading.value),
    error: computed(() => errorState.value),
    isCompleting: computed(() => completing.value),
    refresh: loadOrder,
    markAsCompleted,
  }
}

export const __resetOrdersState = () => {
  const state = useOrdersState()
  state.value = cloneOrders()
}
