export type OrderStatusTone = 'info' | 'warning' | 'danger' | 'success'

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
}

export interface OrderDetail {
  id: string
  code: string
  title: string
  summary: string
  statusChips: OrderStatusChip[]
  assignee: OrderAssignee
  dueDateLabel: string
  projectName: string
  description: string
  client: OrderClient
  attachments: OrderAttachment[]
  history: OrderHistoryItem[]
  actionLabel: string
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
  dueDateLabel: '26 октября 2024',
  projectName: 'Открытие нового офиса',
  description:
    'Необходимо подготовить поставку оборудования для переговорных комнат и рабочих мест. В задачи входит согласование с подрядчиком, проверка спецификаций и организация монтажных работ на площадке.',
  client: {
    name: 'ООО "ТехноПром"',
    phone: '+7 (495) 123-45-67',
    payment: 'Предоплата 50%',
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
  ],
  actionLabel: 'Отметить выполненным',
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
    dueDateLabel: '21 октября 2024',
    projectName: 'Осенняя рекламная кампания',
    description:
      'Оформить заказ на доставку печатных материалов (буклеты, плакаты) в 12 филиалов. Контролировать движение курьерской службы и подтвердить получение в каждом офисе.',
    client: {
      name: 'ИП Петров А.В.',
      phone: '+7 (812) 456-78-90',
      payment: 'Оплата по факту',
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
    ],
    actionLabel: 'Завершить доставку',
  },
}

const cloneOrderDetail = (order: OrderDetail): OrderDetail => ({
  ...order,
  client: { ...order.client },
  statusChips: order.statusChips.map((chip) => ({ ...chip })),
  attachments: order.attachments.map((attachment) => ({ ...attachment })),
  history: order.history.map((history) => ({ ...history })),
})

export const getOrderDetailMock = (orderId: string | undefined): OrderDetail => {
  const normalizedId = orderId?.toString().trim()

  if (normalizedId && normalizedId in ordersMock) {
    return cloneOrderDetail(ordersMock[normalizedId])
  }

  const fallback = cloneOrderDetail(defaultOrder)

  if (normalizedId && normalizedId.length > 0) {
    fallback.id = normalizedId
    fallback.code = normalizedId.toUpperCase()
  }

  return fallback
}
