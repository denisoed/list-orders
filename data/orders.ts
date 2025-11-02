export type OrderStatusAppearance = 'success' | 'warning' | 'danger' | 'info'

export interface OrderStatusChip {
  id: string
  label: string
  appearance: OrderStatusAppearance
}

export interface OrderCustomer {
  name: string
  avatarUrl: string | null
  email: string
  phone: string
  location: string
}

export interface OrderAttachment {
  id: string
  name: string
  type: 'image' | 'document' | 'archive'
  sizeLabel: string
  url: string
}

export interface OrderTimelineEvent {
  id: string
  actor: string
  action: string
  timestamp: string
  icon: string
}

export interface OrderItem {
  id: string
  title: string
  sku: string
  quantity: number
  price: number
  currency: string
}

export interface OrderPricing {
  subtotal: number
  shipping: number
  discount: number
  tax: number
  total: number
  currency: string
}

export interface OrderAddress {
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
  comment?: string
}

export interface OrderDetail {
  id: string
  orderNumber: string
  title: string
  statuses: OrderStatusChip[]
  description: string
  createdAt: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  projectName: string
  customer: OrderCustomer
  items: OrderItem[]
  attachments: OrderAttachment[]
  timeline: OrderTimelineEvent[]
  pricing: OrderPricing
  shippingAddress: OrderAddress
  billingAddress: OrderAddress
  notes: string
  allowCompletion: boolean
}

export const ORDERS: OrderDetail[] = [
  {
    id: 'order-aurora-5824',
    orderNumber: 'AUR-5824',
    title: 'Собрать подарочный набор для корпоративных клиентов',
    statuses: [
      { id: 'in_progress', label: 'В работе', appearance: 'warning' },
      { id: 'overdue', label: 'Просрочен', appearance: 'danger' },
    ],
    description:
      'Набор должен включать персонализированные открытки, подборку кофе и брендированные аксессуары. Проверить доступность всех позиций и подготовить отчёт по стоимости доставки.',
    createdAt: '2024-10-20T08:45:00+03:00',
    dueDate: '2024-10-26T18:00:00+03:00',
    priority: 'high',
    projectName: 'Q4 Corporate Gifts',
    customer: {
      name: 'Иван Смирнов',
      avatarUrl: 'https://i.pravatar.cc/160?img=12',
      email: 'ivan.smirnov@example.com',
      phone: '+7 (915) 555-23-43',
      location: 'Москва, Россия',
    },
    items: [
      {
        id: 'item-espresso',
        title: 'Набор моносортов кофе «Espresso Collection»',
        sku: 'CF-ESP-5',
        quantity: 10,
        price: 1890,
        currency: 'RUB',
      },
      {
        id: 'item-accessories',
        title: 'Брендированные термокружки',
        sku: 'ACC-MUG-2',
        quantity: 10,
        price: 1590,
        currency: 'RUB',
      },
      {
        id: 'item-cards',
        title: 'Персонализированные открытки (набор из 3 штук)',
        sku: 'ST-CRD-3',
        quantity: 15,
        price: 350,
        currency: 'RUB',
      },
    ],
    attachments: [
      {
        id: 'att-figma',
        name: 'gift-box-layout.fig',
        type: 'image',
        sizeLabel: '12.5 MB',
        url: 'https://example.com/files/gift-box-layout.fig',
      },
      {
        id: 'att-doc',
        name: 'requirements.docx',
        type: 'document',
        sizeLabel: '256 KB',
        url: 'https://example.com/files/requirements.docx',
      },
    ],
    timeline: [
      {
        id: 'evt-status-change',
        actor: 'Мария Петрова',
        action: 'изменил статус с «К выполнению» на «В работе»',
        timestamp: '2024-10-24T10:30:00+03:00',
        icon: 'autorenew',
      },
      {
        id: 'evt-created',
        actor: 'Алексей Иванов',
        action: 'создал заказ',
        timestamp: '2024-10-23T14:15:00+03:00',
        icon: 'add',
      },
    ],
    pricing: {
      subtotal: 63750,
      shipping: 4500,
      discount: 5000,
      tax: 3200,
      total: 66450,
      currency: 'RUB',
    },
    shippingAddress: {
      line1: 'ул. Тверская, д. 18',
      line2: 'офис 402',
      city: 'Москва',
      postalCode: '125009',
      country: 'Россия',
      comment: 'Доставка до 12:00, пропуск по паспорту.',
    },
    billingAddress: {
      line1: 'ул. Новый Арбат, д. 21',
      city: 'Москва',
      postalCode: '119019',
      country: 'Россия',
    },
    notes: 'Согласовать финальные макеты открыток до 24 октября. Проверить все вложения в письме с заказчиком.',
    allowCompletion: true,
  },
  {
    id: 'order-nordic-7241',
    orderNumber: 'NRD-7241',
    title: 'Сформировать тестовый заказ для витрины «Скандинавия»',
    statuses: [
      { id: 'pending_approval', label: 'Ожидает подтверждения', appearance: 'info' },
    ],
    description:
      'Проверить карточки товаров, собрать заказ с доставкой в Санкт-Петербург и убедиться, что акция на бесплатную доставку применяется корректно.',
    createdAt: '2024-11-02T09:10:00+03:00',
    dueDate: '2024-11-05T17:00:00+03:00',
    priority: 'medium',
    projectName: 'Marketplace QA',
    customer: {
      name: 'Марина Лебедева',
      avatarUrl: null,
      email: 'marina.lebedeva@example.com',
      phone: '+7 (812) 555-19-08',
      location: 'Санкт-Петербург, Россия',
    },
    items: [
      {
        id: 'item-blanket',
        title: 'Плед с узором «Северное сияние»',
        sku: 'HM-BL-045',
        quantity: 1,
        price: 4590,
        currency: 'RUB',
      },
      {
        id: 'item-candles',
        title: 'Набор ароматических свечей «Winter Forest»',
        sku: 'HM-CD-102',
        quantity: 2,
        price: 1490,
        currency: 'RUB',
      },
    ],
    attachments: [],
    timeline: [
      {
        id: 'evt-draft',
        actor: 'Павел Якубов',
        action: 'создал черновик заказа',
        timestamp: '2024-11-02T09:10:00+03:00',
        icon: 'edit',
      },
    ],
    pricing: {
      subtotal: 7570,
      shipping: 0,
      discount: 0,
      tax: 690,
      total: 8260,
      currency: 'RUB',
    },
    shippingAddress: {
      line1: 'пр. Невский, д. 56',
      city: 'Санкт-Петербург',
      postalCode: '191023',
      country: 'Россия',
    },
    billingAddress: {
      line1: 'ул. Чайковского, д. 12',
      city: 'Санкт-Петербург',
      postalCode: '191187',
      country: 'Россия',
    },
    notes: 'Заказ только для внутренних проверок. Отменить перед закрытием спринта.',
    allowCompletion: false,
  },
]

export const cloneOrders = (): OrderDetail[] =>
  ORDERS.map((order) => ({
    ...order,
    statuses: order.statuses.map((status) => ({ ...status })),
    customer: { ...order.customer },
    items: order.items.map((item) => ({ ...item })),
    attachments: order.attachments.map((attachment) => ({ ...attachment })),
    timeline: order.timeline.map((event) => ({ ...event })),
    pricing: { ...order.pricing },
    shippingAddress: { ...order.shippingAddress },
    billingAddress: { ...order.billingAddress },
  }))
