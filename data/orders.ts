export type OrderStatusTone = 'info' | 'warning' | 'danger' | 'success'

/**
 * Order interface matching server API response
 */
export interface Order {
  id: string
  code: string
  title: string
  summary: string
  description: string
  status: string
  assigneeTelegramId: number | null
  dueDate: string | null
  projectId: string
  clientName: string
  clientPhone: string
  paymentType: string | null
  prepaymentAmount: number | null
  totalAmount: number | null
  createdAt: string
  updatedAt: string
}

export interface OrderStatusChip {
  id: string
  label: string
  tone: OrderStatusTone
}

export interface OrderAssignee {
  name: string
  avatarUrl: string
  role: string
}

export interface OrderAttachment {
  id: string
  name: string
  size: string
  icon: string
  previewUrl: string
}

export interface OrderHistoryItem {
  id: string
  icon: string
  description: string
  timestamp: string
}

export interface OrderClient {
  name: string
  phone: string
  payment: string
  prepayment: string
  totalAmount: string
}

export interface OrderDetail {
  id: string
  code: string
  title: string
  summary: string
  statusChips: OrderStatusChip[]
  assignee: OrderAssignee | null
  dueDateLabel: string
  projectName: string
  description: string
  client: OrderClient
  attachments: OrderAttachment[]
  history: OrderHistoryItem[]
}

const defaultOrder: OrderDetail = {
  id: 'order-2045',
  code: 'ORD-2045',
  title: 'Доставка оборудования для офиса',
  summary: 'Организовать поставку и монтаж оборудования в новом офисе на Ленинградском проспекте.',
  statusChips: [
    { id: 'status-progress', label: 'В работе', tone: 'warning' },
  ],
  assignee: {
    name: 'Иван Смирнов',
    role: 'Менеджер проектов',
    avatarUrl: 'https://i.pravatar.cc/96?img=12',
  },
  dueDateLabel: '26 октября 2024, 18:00',
  projectName: 'Открытие нового офиса',
  description:
    'Необходимо подготовить поставку оборудования для переговорных комнат и рабочих мест. В задачи входит согласование с подрядчиком, проверка спецификаций и организация монтажных работ на площадке.',
  client: {
    name: 'ООО "ТехноПром"',
    phone: '+7 (495) 123-45-67',
    payment: 'Предоплата 50%',
    prepayment: '50 000 ₽',
    totalAmount: '100 000 ₽',
  },
  attachments: [
    {
      id: 'attachment-brief',
      name: 'спецификация-оборудования.fig',
      size: '12.5 МБ',
      icon: 'image',
      previewUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=240&q=80',
    },
    {
      id: 'attachment-contract',
      name: 'договор-поставки.docx',
      size: '256 КБ',
      icon: 'description',
      previewUrl: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=240&q=80',
    },
  ],
  history: [
    {
      id: 'history-status',
      icon: 'sync_alt',
      description: 'Мария Петрова изменила статус с «К выполнению» на «В работе».',
      timestamp: '24 октября 2024, 10:30',
    },
    {
      id: 'history-created',
      icon: 'add',
      description: 'Алексей Иванов создал заказ и прикрепил спецификацию.',
      timestamp: '23 октября 2024, 14:15',
    },
  ]
}

const ordersMock: Record<string, OrderDetail> = {
  [defaultOrder.id]: defaultOrder,
  'express-delivery': {
    id: 'express-delivery',
    code: 'ORD-5102',
    title: 'Экспресс-доставка рекламных материалов',
    summary: 'Срочно доставить печатные материалы в региональные офисы до запуска кампании.',
    statusChips: [{ id: 'status-progress', label: 'В работе', tone: 'warning' }],
    assignee: {
      name: 'Мария Соколова',
      role: 'Координатор логистики',
      avatarUrl: 'https://i.pravatar.cc/96?img=32',
    },
    dueDateLabel: '21 октября 2024, 12:00',
    projectName: 'Осенняя рекламная кампания',
    description:
      'Оформить заказ на доставку печатных материалов (буклеты, плакаты) в 12 филиалов. Контролировать движение курьерской службы и подтвердить получение в каждом офисе.',
    client: {
      name: 'ИП Петров А.В.',
      phone: '+7 (812) 456-78-90',
      payment: 'Оплата по факту',
      prepayment: '0 ₽',
      totalAmount: '65 000 ₽',
    },
    attachments: [
      {
        id: 'attachment-route',
        name: 'маршрут-доставки.xlsx',
        size: '84 КБ',
        icon: 'table',
        previewUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=240&q=80',
      },
    ],
    history: [
      {
        id: 'history-assigned',
        icon: 'person',
        description: 'Николай Орлов назначил ответственным Марию Соколову.',
        timestamp: '20 октября 2024, 09:10',
      },
      {
        id: 'history-comment',
        icon: 'comment',
        description: 'Мария Соколова добавила комментарий о задержке поставщика в Санкт-Петербурге.',
        timestamp: '20 октября 2024, 11:42',
      },
    ]
  },
  'no-assignee-order': {
    id: 'no-assignee-order',
    code: 'ORD-9999',
    title: 'Тестовый заказ без исполнителя',
    summary: 'Этот заказ создан для тестирования функции "Взять в работу".',
    statusChips: [{ id: 'status-new', label: 'Новый', tone: 'info' }],
    assignee: null,
    dueDateLabel: '30 октября 2024, 18:00',
    projectName: 'Тестовый проект',
    description: 'Этот заказ используется для проверки функциональности назначения исполнителя. Нажмите "Взять в работу", чтобы стать исполнителем.',
    client: {
      name: 'Тестовый клиент',
      phone: '+7 (999) 000-00-00',
      payment: 'Оплата по факту',
      prepayment: '0 ₽',
      totalAmount: '10 000 ₽',
    },
    attachments: [],
    history: [
      {
        id: 'history-created',
        icon: 'add',
        description: 'Заказ создан для тестирования.',
        timestamp: '25 октября 2024, 12:00',
      },
    ],
  },
}

const cloneOrderDetail = (order: OrderDetail): OrderDetail => ({
  ...order,
  client: { ...order.client },
  assignee: order.assignee ? { ...order.assignee } : null,
  statusChips: order.statusChips.map((chip) => ({ ...chip })),
  attachments: order.attachments.map((attachment) => ({ ...attachment })),
  history: order.history.map((history) => ({ ...history })),
})

export const getOrderDetailMock = (orderId: string | undefined): OrderDetail => {
  const normalizedId = orderId?.toString().trim()

  if (normalizedId && normalizedId in ordersMock && ordersMock[normalizedId]) {
    return cloneOrderDetail(ordersMock[normalizedId])
  }

  const fallback = cloneOrderDetail(defaultOrder)

  if (normalizedId && normalizedId.length > 0) {
    fallback.id = normalizedId
    fallback.code = normalizedId.toUpperCase()
  }

  return fallback
}

/**
 * Convert Order from API to OrderDetail for UI display
 */
export const convertOrderToOrderDetail = (order: Order, projectName?: string): OrderDetail => {
  // Format due date
  let dueDateLabel = ''
  if (order.dueDate) {
    try {
      const date = new Date(order.dueDate)
      const formatter = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      dueDateLabel = formatter.format(date)
    } catch (error) {
      console.error('Error formatting due date:', error)
    }
  }

  // Map status to status chips
  const statusChips: OrderStatusChip[] = []
  if (order.status) {
    const statusMap: Record<string, { label: string; tone: OrderStatusTone }> = {
      new: { label: 'Новый', tone: 'info' },
      pending: { label: 'Ожидает', tone: 'info' },
      in_progress: { label: 'В работе', tone: 'warning' },
      review: { label: 'Проверяется', tone: 'warning' },
      done: { label: 'Сделано', tone: 'success' },
      cancelled: { label: 'Отменен', tone: 'danger' },
    }
    const statusInfo = statusMap[order.status] || { label: order.status, tone: 'info' as OrderStatusTone }
    statusChips.push({
      id: `status-${order.status}`,
      label: statusInfo.label,
      tone: statusInfo.tone,
    })
  }

  // Format payment info
  const paymentTypeLabels: Record<string, string> = {
    prepayment: 'Предоплата',
    full: 'Полная оплата',
    partial: 'Частичная оплата',
    on_delivery: 'Оплата при доставке',
    on_completion: 'Оплата по факту',
  }

  const paymentTypeLabel = order.paymentType
    ? paymentTypeLabels[order.paymentType] || order.paymentType
    : 'Оплата по факту'

  const formatAmount = (amount: number | null) => {
    if (amount === null || amount === undefined) {
      return '0 ₽'
    }
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return {
    id: order.id,
    code: order.code,
    title: order.title,
    summary: order.summary || '',
    description: order.description || '',
    statusChips,
    assignee: null, // Will be populated separately if assignee info is available
    dueDateLabel,
    projectName: projectName || 'Проект',
    client: {
      name: order.clientName,
      phone: order.clientPhone,
      payment: paymentTypeLabel,
      prepayment: formatAmount(order.prepaymentAmount),
      totalAmount: formatAmount(order.totalAmount),
    },
    attachments: [], // Will be populated separately if attachments are available
    history: [
      {
        id: 'history-created',
        icon: 'add',
        description: `Заказ создан ${new Date(order.createdAt).toLocaleString('ru-RU')}`,
        timestamp: new Date(order.createdAt).toLocaleString('ru-RU'),
      },
    ],
  }
}
