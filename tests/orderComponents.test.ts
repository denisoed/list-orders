import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import OrderAttachmentsList from '../components/orders/OrderAttachmentsList.vue'
import OrderItemsList from '../components/orders/OrderItemsList.vue'
import OrderStatusChips from '../components/orders/OrderStatusChips.vue'
import OrderTimeline from '../components/orders/OrderTimeline.vue'

const currency = 'RUB'

describe('Order components rendering', () => {
  it('renders attachment empty state', () => {
    const wrapper = mount(OrderAttachmentsList, {
      props: {
        attachments: [],
      },
    })

    expect(wrapper.text()).toContain('Файлы пока не добавлены')
  })

  it('renders status chips with correct labels', () => {
    const wrapper = mount(OrderStatusChips, {
      props: {
        statuses: [
          { id: 'in_progress', label: 'В работе', appearance: 'warning' },
          { id: 'overdue', label: 'Просрочен', appearance: 'danger' },
        ],
      },
    })

    const chips = wrapper.findAll('span')
    expect(chips).toHaveLength(2)
    expect(chips[0]?.text()).toBe('В работе')
    expect(chips[1]?.text()).toBe('Просрочен')
  })

  it('sorts timeline events by timestamp', () => {
    const wrapper = mount(OrderTimeline, {
      props: {
        events: [
          {
            id: 'older',
            actor: 'Иван',
            action: 'создал заказ',
            timestamp: '2024-01-01T10:00:00+03:00',
            icon: 'add',
          },
          {
            id: 'newer',
            actor: 'Мария',
            action: 'обновила статус',
            timestamp: '2024-02-01T10:00:00+03:00',
            icon: 'autorenew',
          },
        ],
      },
    })

    const events = wrapper.findAll('li')
    expect(events[0]?.text()).toContain('Мария')
    expect(events[1]?.text()).toContain('Иван')
  })

  it('renders order items and totals', () => {
    const wrapper = mount(OrderItemsList, {
      props: {
        items: [
          { id: '1', title: 'Товар 1', sku: 'SKU1', quantity: 2, price: 1000, currency },
          { id: '2', title: 'Товар 2', sku: 'SKU2', quantity: 1, price: 500, currency },
        ],
        pricing: {
          subtotal: 2500,
          shipping: 300,
          discount: 200,
          tax: 150,
          total: 2750,
          currency,
        },
      },
    })

    const textContent = wrapper.text()
    expect(textContent).toContain('Товар 1')
    expect(textContent).toContain('Итого')
    expect(textContent.replace(/\s/g, '')).toContain('2750')
  })
})
