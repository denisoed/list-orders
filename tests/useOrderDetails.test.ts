import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import { computed, nextTick, ref, type Ref } from 'vue'

const stateRegistry = new Map<string, Ref<unknown>>()

vi.mock('#imports', () => ({
  useState: <T>(key: string, init: () => T) => {
    if (!stateRegistry.has(key)) {
      stateRegistry.set(key, ref(init()))
    }

    return stateRegistry.get(key) as Ref<T>
  },
  createError: (input: { statusCode?: number; statusMessage?: string }) => ({
    ...input,
    name: 'NuxtError',
    message: input.statusMessage ?? 'Ошибка',
  }),
}))

import { __resetOrdersState, useOrderDetails } from '../composables/useOrderDetails'

const flushLoaders = async () => {
  await vi.runAllTimersAsync()
  await nextTick()
}

describe('useOrderDetails', () => {
  beforeEach(() => {
    stateRegistry.clear()
    vi.useFakeTimers()
    __resetOrdersState()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('загружает детали заказа по идентификатору', async () => {
    const details = useOrderDetails(computed(() => 'order-aurora-5824'))

    await flushLoaders()

    expect(details.order.value?.orderNumber).toBe('AUR-5824')
    expect(details.statusChips.value).toHaveLength(2)
  })

  it('отмечает заказ как завершённый и обновляет статусы', async () => {
    const details = useOrderDetails(computed(() => 'order-aurora-5824'))

    await flushLoaders()

    await details.markAsCompleted()

    expect(details.order.value?.statuses[0]?.id).toBe('completed')
    expect(details.order.value?.allowCompletion).toBe(false)
  })

  it('возвращает ошибку 404, если заказ не найден', async () => {
    const details = useOrderDetails(computed(() => 'unknown-order'))

    await flushLoaders()

    expect(details.order.value).toBeNull()
    expect((details.error.value as { statusCode?: number })?.statusCode).toBe(404)
  })

  it('не позволяет завершить заказ без прав', async () => {
    const details = useOrderDetails(computed(() => 'order-nordic-7241'))

    await flushLoaders()

    await details.markAsCompleted()

    expect((details.error.value as { statusCode?: number })?.statusCode).toBe(403)
  })
})
