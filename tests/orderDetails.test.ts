import { describe, expect, it } from 'vitest'
import { getOrderDetailMock } from '~/data/orders'

describe('getOrderDetailMock', () => {
  it('returns matching mock order when id exists', () => {
    const order = getOrderDetailMock('express-delivery')

    expect(order.id).toBe('express-delivery')
    expect(order.title).toContain('Экспресс-доставка')
    expect(order.attachments).toHaveLength(1)
  })

  it('provides fallback order and keeps id when unknown id passed', () => {
    const order = getOrderDetailMock('custom-order-77')

    expect(order.id).toBe('custom-order-77')
    expect(order.code).toBe('CUSTOM-ORDER-77')
    expect(order.statusChips.length).toBeGreaterThan(0)
  })

  it('returns a new object on each call to avoid shared mutations', () => {
    const first = getOrderDetailMock('order-2045')
    const second = getOrderDetailMock('order-2045')

    expect(first).not.toBe(second)
    first.statusChips[0]!.label = 'Изменён'

    const third = getOrderDetailMock('order-2045')

    expect(third.statusChips[0]?.label).not.toBe('Изменён')
  })
})
