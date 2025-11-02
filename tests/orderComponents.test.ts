import { describe, expect, it } from 'vitest'
import { RouterLinkStub, mount } from '@vue/test-utils'
import OrderAttachmentsList from '../components/orders/OrderAttachmentsList.vue'
import OrderItemsList from '../components/orders/OrderItemsList.vue'
import OrderStatusChips from '../components/orders/OrderStatusChips.vue'
import OrderTimeline from '../components/orders/OrderTimeline.vue'
import OrderListCard from '../components/orders/OrderListCard.vue'

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

  it('links order card to detail page', () => {
    const order = {
      id: 'order-1',
      orderNumber: 'ORD-1',
      title: 'Тестовый заказ',
      statuses: [
        { id: 'in_progress', label: 'В работе', appearance: 'warning' },
      ],
      description: 'Описание заказа',
      createdAt: '2024-01-02T10:00:00+03:00',
      dueDate: '2024-01-05T10:00:00+03:00',
      priority: 'high',
      projectName: 'Проект А',
      customer: {
        name: 'Иван Иванов',
        avatarUrl: null,
        email: 'ivan@example.com',
        phone: '+7 900 000-00-00',
        location: 'Москва',
      },
      items: [],
      attachments: [],
      timeline: [],
      pricing: {
        subtotal: 1000,
        shipping: 0,
        discount: 0,
        tax: 0,
        total: 1000,
        currency,
      },
      shippingAddress: {
        line1: 'ул. Ленина, 1',
        city: 'Москва',
        postalCode: '101000',
        country: 'Россия',
      },
      billingAddress: {
        line1: 'ул. Ленина, 1',
        city: 'Москва',
        postalCode: '101000',
        country: 'Россия',
      },
      notes: '',
      allowCompletion: true,
    }

    const wrapper = mount(OrderListCard, {
      props: {
        order,
        to: { path: `/orders/${order.id}`, query: { state: 'encoded-state' } },
      },
      global: {
        stubs: {
          NuxtLink: RouterLinkStub,
        },
      },
    })

    const link = wrapper.getComponent(RouterLinkStub)
    expect(link.props('to')).toEqual({ path: `/orders/${order.id}`, query: { state: 'encoded-state' } })
    expect(wrapper.text()).toContain('Заказ ORD-1')
  })
})
