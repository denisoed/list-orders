export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'

export type TaskReminderOffset = '1h' | '3h' | '1d'

export interface TaskAttachment {
  id: string
  name: string
  previewUrl: string
}

export interface TaskAssignee {
  name: string
  avatarUrl: string
}

export interface TaskStatusChip {
  id: string
  label: string
  tone: 'info' | 'warning' | 'danger' | 'success'
}

export interface TaskItem {
  id: string
  name: string
  quantity: number
  price: number
}

export interface TaskTimelineEntry {
  id: string
  actor: string
  icon: string
  description: string
  timestamp: string
}

export interface ProjectTask {
  id: string
  title: string
  assignee: TaskAssignee
  status: TaskStatus
  dueDate: string
  priority: TaskPriority
  description?: string
  attachments?: TaskAttachment[]
  statusChips?: TaskStatusChip[]
  items?: TaskItem[]
  history?: TaskTimelineEntry[]
  clientName?: string
  clientPhone?: string
  deliveryAddress?: string
  isPickup?: boolean
  remindBefore?: TaskReminderOffset
}

export interface Project {
  id: string
  title: string
  description: string
  completed: number
  total: number
  tasks: ProjectTask[]
}

export const PROJECTS: Project[] = [
  {
    id: 'design-refresh',
    title: 'Разработка нового дизайна',
    description: 'Редизайн главных страниц продукта и обновление брендбука.',
    completed: 5,
    total: 12,
    tasks: [
      {
        id: 'landing-page',
        title: 'Разработать новый лендинг',
        assignee: {
          name: 'Иван Иванов',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAYbdVxX0u4RO9pDO6FYGL-XndtfAkrXc4E4ypMkjuFI-m_n3pAjUjQb20r6r-GxUdEZ0NRN9DfapdYipdUeuT5BL8yRYldNUGlNiOCwgNE6cdXih2SZwa0k8Q0YOKPs5e_qMkqO96wXIwKGObpp3hCTysQEBdEfBhaggQCjvPb7LfADoLwnQLGp_p_s4LaLzUK2brKVVm_-F6rLCBrBBCBaGMgwyKmr__9-cqBraAXCxvOs3sjK4DieDDyz4Zwv0AEV-anhBpjnmI',
        },
        status: 'in_progress',
        dueDate: '2024-12-25',
        priority: 'high',
        description:
          'Подготовить концепцию и дизайн нового лендинга для зимней кампании. Учесть адаптивность, SEO-структуру и блок с отзывами клиентов.',
        attachments: [
          {
            id: 'attach-landing-wireframe',
            name: 'landing-wireframe.fig',
            previewUrl:
              'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=320&q=80',
          },
          {
            id: 'attach-landing-brief',
            name: 'client-brief.pdf',
            previewUrl:
              'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=320&q=80',
          },
        ],
        items: [
          { id: 'service-research', name: 'Исследование аудитории', quantity: 1, price: 12000 },
          { id: 'service-design', name: 'Дизайн-макет страниц', quantity: 1, price: 24000 },
          { id: 'service-assets', name: 'Подготовка графических материалов', quantity: 1, price: 9000 },
        ],
        history: [
          {
            id: 'history-landing-01',
            actor: 'Мария Петрова',
            icon: 'person',
            description: 'Назначила задачу Ивану Иванову и загрузила бриф клиента.',
            timestamp: '2024-10-12T09:15:00+03:00',
          },
          {
            id: 'history-landing-02',
            actor: 'Иван Иванов',
            icon: 'edit',
            description: 'Добавил черновой макет лендинга и запросил обратную связь.',
            timestamp: '2024-10-18T16:40:00+03:00',
          },
          {
            id: 'history-landing-03',
            actor: 'Алексей Смирнов',
            icon: 'rate_review',
            description: 'Оставил комментарии по блоку отзывов и контактной форме.',
            timestamp: '2024-10-20T11:05:00+03:00',
          },
        ],
        clientName: 'ООО «Новые решения»',
        clientPhone: '+7 (999) 123-45-67',
        deliveryAddress: 'Москва, ул. Красная Пресня, д. 12',
        remindBefore: '1d',
      },
      {
        id: 'q3-report',
        title: 'Подготовить отчет за Q3',
        assignee: {
          name: 'Мария Петрова',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuD_rqZAEsxNnMbhPSQFUkqcC0QYM6hjLUY7JQKcMDUT6m3qY9Tq4iRfwupfr9hHLwbFNtOzTK82bwTn86oLMKRIrmyvv2f1gZCJomwz7z-jkaPwgPRpA1ghQWh0JnJqyTelQLMsO3fkccFYGC0_p5dnzo_aOS_d8tTP5uPrdVukjx3oByTpnqBqHIKqauC_WngtAWU8mjv54373v2YF_5wWi_agmvNpZsvBPVIIQ0EgmC8MpZzHE2Uy8JcHEyLEguVHTU3197TbeHU',
        },
        status: 'pending',
        dueDate: '2024-10-01',
        priority: 'low',
      },
      {
        id: 'design-review',
        title: 'Проверить дизайн-макеты',
        assignee: {
          name: 'Алексей Смирнов',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCm87klF7TQ3SAZBKgUB1JwDUzGWGGik18cyv176_4o7XhpY3g4-T3Ab7hW6bX1CjxwSbhJUIhvIbUCvoHPWV_KvQ9SRgE4lwL3Sqfhawf1W2-Bo_rE2I9m4p5htVGWj0E2IBUV8T48X7yWpbHSNyzrCNef3Ajm8dDUPKRbrAx7e7N4N3Nz0ST2TWMbFRgFd1yUaSgj3gEuR2dmpZ6urTXf8Ru1MaKDNGVcR_2e7VbuN8-s9P0BNhp8rtEpjIf9E5hiLEzN7jdAdIs',
        },
        status: 'review',
        dueDate: '2024-11-15',
        priority: 'medium',
        description:
          'Провести проверку дизайн-макетов мобильного приложения и подготовить список финальных правок для разработчиков.',
        attachments: [
          {
            id: 'attach-design-review',
            name: 'app-design.fig',
            previewUrl:
              'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=320&q=80',
          },
        ],
        history: [
          {
            id: 'history-review-01',
            actor: 'Елена Волкова',
            icon: 'person',
            description: 'Назначила Алексея ответственным за проверку.',
            timestamp: '2024-10-05T12:45:00+03:00',
          },
        ],
        remindBefore: '1h',
      },
      {
        id: 'requirements-doc',
        title: 'Написать ТЗ для разработчиков',
        assignee: {
          name: 'Елена Волкова',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAZCsrP2QtL8K_3zwKOcBRdTBtFS-AzPN0zXIQtot_cYrm1OUNtz2lK6UVHVYBLpNdWzxe_PWdcIv5IBGgR6ihuznAkf8KZ7y-6RDH3z_cWInoSooDJeyWR0lS6BCHsL7m6dZOhT5oqiW83UVMmPGqgXrkAlBankya5ytyx6FzV0kXfEOrAVsk_tB29v1u5JY8NkvQ5zV3P2PZHM4FtWEEcB4uvm_EZhquL0ZqBz1w_LDj6_hXWzpXHHgrPTa8JWcxu39Yc6ayJTqw',
        },
        status: 'done',
        dueDate: '2024-11-01',
        priority: 'medium',
        description:
          'Сформировать техническое задание для команды разработки, описав бизнес-логику, API и ограничения по безопасности.',
        attachments: [
          {
            id: 'attach-requirements',
            name: 'requirements-doc.docx',
            previewUrl:
              'https://images.unsplash.com/photo-1454166155302-ef4863c27e70?auto=format&fit=crop&w=320&q=80',
          },
        ],
        history: [
          {
            id: 'history-requirements-01',
            actor: 'Елена Волкова',
            icon: 'check_circle',
            description: 'Отметила задачу выполненной.',
            timestamp: '2024-10-30T18:55:00+03:00',
          },
        ],
        clientName: 'Команда разработки',
        clientPhone: '+7 (812) 200-40-40',
      },
      {
        id: 'styleguide-update',
        title: 'Обновить UI Kit в Figma',
        assignee: {
          name: 'Сергей Котов',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBt1Bi4VKcH8JGkgirNQrBs2yc1ZLNX5lZSDl00hMtfv2tg6YqAySoJidYh3PbU5C3FxrITKzVbn4Y8qs3nQdwD8-5jS8sBKLNRgELFb0dHDYjwpu5OQ4iOiZk5B4bmTixAiEUz6dOAp3rruK7wba4_Rw2Sy0-YoELhKNWo',
        },
        status: 'done',
        dueDate: '2024-10-20',
        priority: 'high',
        description:
          'Привести UI Kit в соответствие с новым брендбуком и обновить компоненты для дизайн-системы.',
        history: [
          {
            id: 'history-styleguide-01',
            actor: 'Сергей Котов',
            icon: 'brush',
            description: 'Загрузил обновленные компоненты в библиотеку.',
            timestamp: '2024-10-19T17:35:00+03:00',
          },
        ],
      },
      {
        id: 'animations',
        title: 'Продумать анимации для главного экрана',
        assignee: {
          name: 'Ольга Соколова',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCSd_b4n2JAnPyXBLZJ7XJrJNjF1l5dDrNcJvfl6gn9QZzR9F98k5zGH4CSnzc-uyAhv7R53NtY1LXHh6X6oOtN7aaS2dS7w-F3_JXE3NHXgRByTf9TzGe6FZ9SMsJ8n_NnuxTqWQn3v91xJd60lBfNn1vfxhj5wIhX2DpL',
        },
        status: 'in_progress',
        dueDate: '2024-12-05',
        priority: 'medium',
        description:
          'Подготовить сценарии анимаций для главного экрана и согласовать с разработкой возможные ограничения.',
      },
    ],
  },
  {
    id: 'marketing-q4',
    title: 'Маркетинговая кампания Q4',
    description: 'Подготовка кампании к новогоднему сезону и запуск акций.',
    completed: 22,
    total: 25,
    tasks: [
      {
        id: 'media-plan',
        title: 'Собрать медиаплан по каналам',
        assignee: {
          name: 'Тимур Мельников',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCugrgxa0nHwhMTwZtmcUcFfXXpAnESNcfGsLRNV0kgXjYPRbhIOnhCIUIw5pxRgu8bBn32ECAXO6rqX4NvQ4OP7ikzDfSZvby0oFs_0VdssibbgmrP-WcgQ3iSTHXXIhtca9B9TEy9cGcyvEoq3eq9ZGo_NnWcfq4yV1B-',
        },
        status: 'in_progress',
        dueDate: '2024-10-30',
        priority: 'high',
      },
      {
        id: 'landing-copy',
        title: 'Написать тексты для промо-лендинга',
        assignee: {
          name: 'Анна Лебедева',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAgbV_GsxLo6XbS8Pm21S-hw8gv1z-EJiijOxIEzD2HiUJv0n7-Ux7L-kNWYpPciAvAX62VmH5A15ruLBHAB4agK50Jk-m7LAqgKAFIqtX8J8Xytl1c4iQI4Ql1mMuTDPScdwwGJfEKtKe8zU6hzMOgPcoLKXCzG6uK8y5B',
        },
        status: 'review',
        dueDate: '2024-10-18',
        priority: 'medium',
      },
      {
        id: 'influencer-contracts',
        title: 'Заключить договоры с инфлюенсерами',
        assignee: {
          name: 'Дмитрий Орлов',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDDV5vEV9M3Xh72gMqbMcGDN42TAyWQj-4u9Qp1XjR2gLOxOBE1Q0ngsM0aLtLqkSn1Zzsvfi3DW2EFZcWt-eZV6zQkmqOmy6PcgIT-Z4F4Xe9Nx4FvAYf4GztG9t0z0ttMzcV7zWx9wHhSkrJwdh6cL9YLoxWbMd0dfSN-',
        },
        status: 'in_progress',
        dueDate: '2024-11-05',
        priority: 'high',
      },
      {
        id: 'promo-assets',
        title: 'Подготовить визуальные материалы',
        assignee: {
          name: 'Марина Яковлева',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBzywHTePrl1TgwxOWdwgWkn5zsFWEKwq1W1Lg9Sxjpj-LIxMXYc_9gC5LmTGqZgUij8h05K0W6rkN_t5GgujDSi05xwZRIok5XHk4l_kYqB_Dvx0iw9fZ1I30vMu8JSa94QeIoq--QfqZeY3W-ZB3Qzu8nOkqAPdD1Rar7',
        },
        status: 'done',
        dueDate: '2024-09-28',
        priority: 'medium',
      },
      {
        id: 'email-series',
        title: 'Настроить серию email-рассылок',
        assignee: {
          name: 'Андрей Белый',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBPcbapXe1Te39OfT5kbRUQTEThdKb1r1M70geJ_x0j8wl8K_wAJVSc73nJH7d64LzMc2DVRmW2Tc4ElWxWajKeTx2Uq4qTwmY0q6KXqYzCgY3g7NPr1_SovVx2KhTnL59uWaOCiThGfoWuzmfxYynQKb0t0n1B59JCyheB',
        },
        status: 'pending',
        dueDate: '2024-09-20',
        priority: 'low',
      },
    ],
  },
  {
    id: 'api-upgrade',
    title: 'Обновление API сервера',
    description: 'Миграция на новую версию API, оптимизация производительности и логирования.',
    completed: 2,
    total: 10,
    tasks: [
      {
        id: 'auth-migration',
        title: 'Перевести аутентификацию на OAuth 2.1',
        assignee: {
          name: 'Виктор Чернов',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuA3dJql6kAiDvTXDVzsvxe2MCqx7wWShCguUtS7quuKqjprc5AiN0yHkaXbXzyqs0fvOFHNd2C0QruiqxAuOLK0HM6u3nVldte0EJ1P0BdB37xXpFZ1KRa5y69mK0JmVWVj3ua9lt60bzMdCQv4XNM--eTPe7TI24REp7aA',
        },
        status: 'in_progress',
        dueDate: '2024-11-12',
        priority: 'high',
      },
      {
        id: 'rate-limits',
        title: 'Добавить динамические rate limits',
        assignee: {
          name: 'Максим Кузнецов',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCQO85RGKM6fIOaB-DCfd-NxSju1PC6M60-zV1E9cH-s8P7yqO8NeMwtr9Ot2OAemF8DtsqzhkvQa9E7jQts9D-j1R7X20qaEXmMSYDej4zPO0KnBhJqoaeCws8gODsNECtj2PEd6F9RVMyLDj6roaXENPYFYqFtsm6krh8',
        },
        status: 'review',
        dueDate: '2024-10-25',
        priority: 'medium',
      },
      {
        id: 'observability',
        title: 'Настроить централизованный логинг',
        assignee: {
          name: 'Галина Павлова',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBk0MUSlzfArhGp0zsuA5uW3DTwG0mErvhB-8JBrR7FNVWuP4F8FKS72M-6KNE13Gm07ZVu-7vYFdHkYLTxphgQ-H2_glv9Y15VCcHtH_Wd7tkM3TNer_zVJRlXg_7GHCNLitxHOXtS0ukOAt4SKdE8Amo5YfxFGrFQNHp_',
        },
        status: 'in_progress',
        dueDate: '2024-11-30',
        priority: 'medium',
      },
      {
        id: 'deprecated-endpoints',
        title: 'Удалить устаревшие эндпоинты',
        assignee: {
          name: 'Наталья Сергеева',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAvJW6F2X53uucCf3710Fd859ay5FSIfxcMqqrSCEUq5MSWhA3bWIjw5aKoIJsz2UZkBaxCzRNkpPCDVl9FUw-hjI1yvd7h9Do5XslLEbOAaewR6UsTkYwuAZQG1kRyg2u9clmP3ySstp11vhut1iFjnIbApX4nTlqz1w2T',
        },
        status: 'done',
        dueDate: '2024-09-10',
        priority: 'low',
      },
      {
        id: 'load-testing',
        title: 'Провести нагрузочное тестирование',
        assignee: {
          name: 'Павел Никитин',
          avatarUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBkBVOUCwrIi8PhUhun_KSn7ZEtgJ58Fph2X04ncsbkwc6dW5QN1zMAe1U86nLrakom7Amzj9LZsrJJ3-6VghK41g2H6m0PxpytkcbW0svyypO4NP2YFf0Vv2gQkfHEJfZFg83Pu_Z1IctLH2j4grXHP_gURAVrPBh8CuWb',
        },
        status: 'pending',
        dueDate: '2024-09-30',
        priority: 'high',
      },
    ],
  },
]

export const findProjectById = (projectId: string) => {
  return PROJECTS.find((project) => project.id === projectId)
}
