export type TeamMemberOrderStatus = 'in-progress' | 'completed' | 'overdue'

export interface TeamMemberContact {
  id: string
  type: 'telegram' | 'phone' | 'email'
  label: string
  value: string
  href: string
  icon: string
}

export interface TeamMemberOrder {
  id: string
  title: string
  status: TeamMemberOrderStatus
  dueDateLabel: string
}

export interface TeamMemberHistoryItem {
  id: string
  title: string
  completedAtLabel: string
}

export interface TeamMemberProfile {
  id: string
  name: string
  role: string
  department: string
  avatarUrl?: string | null
  bio?: string
  contacts: TeamMemberContact[]
  orders: TeamMemberOrder[]
  history: TeamMemberHistoryItem[]
}

const makeTelegramLink = (handle: string) => `https://t.me/${handle.replace(/^@/, '')}`

export const TEAM_MEMBER_PROFILES: TeamMemberProfile[] = [
  {
    id: 'ivan-ivanov',
    name: 'Иван Иванов',
    role: 'Разработчик',
    department: 'Проект «Обновление дизайна»',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB274va3NlNhycW5R6ChTqLAkPcOO6eyvJ5Sfj11LDrbBYw-oWruaCB-Wf55pTRym3gtQ4WWybIjO7jdKAuRKghnwYgA-jA1W0hztnl_9-VZlQ2tlH25ovMklQ1MZMmAjPw8pSIvXGCfkZR9uUPmsfPuG-pEDmcYAek0HmuDue6CEQUieM3xQXdvgr2_pIMA85tJyeG8NuQEpqnra2NE5Be6h1LkyB7W31ZFjZTSikk_vKH7eYaF0nGbfHIIcNdkgehBCGM0WEug0',
    bio: 'Отвечает за разработку клиентской части и поддержку дизайн-системы.',
    contacts: [
      {
        id: 'telegram',
        type: 'telegram',
        label: 'Telegram',
        value: '@ivan_dev',
        href: makeTelegramLink('@ivan_dev'),
        icon: 'alternate_email',
      },
      {
        id: 'phone',
        type: 'phone',
        label: 'Телефон',
        value: '+7 999 123-45-67',
        href: 'tel:+79991234567',
        icon: 'call',
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        value: 'ivan.ivanov@company.io',
        href: 'mailto:ivan.ivanov@company.io',
        icon: 'mail',
      },
    ],
    orders: [
      {
        id: 'order-1',
        title: 'Реализация формы обратной связи',
        status: 'in-progress',
        dueDateLabel: '25 октября 2024',
      },
      {
        id: 'order-2',
        title: 'Оптимизация сборки фронтенда',
        status: 'in-progress',
        dueDateLabel: '1 ноября 2024',
      },
      {
        id: 'order-3',
        title: 'Подготовить релизную ветку',
        status: 'overdue',
        dueDateLabel: '15 октября 2024',
      },
    ],
    history: [
      {
        id: 'history-1',
        title: 'Обновил дизайн-систему до версии 2.1',
        completedAtLabel: '10 октября 2024',
      },
      {
        id: 'history-2',
        title: 'Настроил автоматическое тестирование',
        completedAtLabel: '2 октября 2024',
      },
    ],
  },
  {
    id: 'anna-kuznetsova',
    name: 'Анна Кузнецова',
    role: 'Дизайнер',
    department: 'Проект «Обновление дизайна»',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA4S-FgSi_AUIYxKuDKiAvF79NIKGcIiu6PZD78wEIOoyoKAaP_dpSYUfYi-57VMKT0nHMSB4GE_M8MIYkyXWxzTSAdDlFPb5PL3G05mgCW2E4uzWDIndUNMVL0GFHQK7asOh840hRt40ThSRxa854J9Mg3803O-oAPxUcHOgeU6_6SehB1vx3JzpZE_xjItzv8GCl4rohaw6x_HWIq6D_Wr_Z3V-ytfwTlx2xQRf1v8H7U1XSPvGNrYdCIznkYAOmsGlBtJkY0Z8c',
    bio: 'Разрабатывает пользовательские сценарии и следит за единообразием интерфейса.',
    contacts: [
      {
        id: 'telegram',
        type: 'telegram',
        label: 'Telegram',
        value: '@anna_design',
        href: makeTelegramLink('@anna_design'),
        icon: 'alternate_email',
      },
      {
        id: 'phone',
        type: 'phone',
        label: 'Телефон',
        value: '+7 921 555-12-34',
        href: 'tel:+79215551234',
        icon: 'call',
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        value: 'anna.k@company.io',
        href: 'mailto:anna.k@company.io',
        icon: 'mail',
      },
    ],
    orders: [
      {
        id: 'order-1',
        title: 'Подготовить макеты адаптивных экранов',
        status: 'in-progress',
        dueDateLabel: '29 октября 2024',
      },
      {
        id: 'order-2',
        title: 'Согласовать визуализацию отчёта',
        status: 'completed',
        dueDateLabel: '18 октября 2024',
      },
    ],
    history: [
      {
        id: 'history-1',
        title: 'Создала гайдлайны для новой продуктовой линейки',
        completedAtLabel: '5 октября 2024',
      },
      {
        id: 'history-2',
        title: 'Провела исследование пользовательских сценариев',
        completedAtLabel: '25 сентября 2024',
      },
    ],
  },
  {
    id: 'petr-smirnov',
    name: 'Петр Смирнов',
    role: 'Менеджер проекта',
    department: 'Проект «Обновление дизайна»',
    avatarUrl: null,
    bio: 'Координирует команду и отвечает за коммуникации со стейкхолдерами.',
    contacts: [
      {
        id: 'telegram',
        type: 'telegram',
        label: 'Telegram',
        value: '@peter_manager',
        href: makeTelegramLink('@peter_manager'),
        icon: 'alternate_email',
      },
      {
        id: 'phone',
        type: 'phone',
        label: 'Телефон',
        value: '+7 903 777-00-11',
        href: 'tel:+79037770011',
        icon: 'call',
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        value: 'petr.smirnov@company.io',
        href: 'mailto:petr.smirnov@company.io',
        icon: 'mail',
      },
    ],
    orders: [
      {
        id: 'order-1',
        title: 'Подготовить обновлённый roadmap проекта',
        status: 'in-progress',
        dueDateLabel: '28 октября 2024',
      },
      {
        id: 'order-2',
        title: 'Согласовать бюджет с финансовым отделом',
        status: 'overdue',
        dueDateLabel: '12 октября 2024',
      },
    ],
    history: [
      {
        id: 'history-1',
        title: 'Организовал демо для стейкхолдеров',
        completedAtLabel: '30 сентября 2024',
      },
      {
        id: 'history-2',
        title: 'Настроил каналы обратной связи от пользователей',
        completedAtLabel: '18 сентября 2024',
      },
    ],
  },
  {
    id: 'anna-smirnova',
    name: 'Анна Смирнова',
    role: 'Руководитель проектов',
    department: 'Команда стратегических инициатив',
    avatarUrl: 'https://i.pravatar.cc/160?img=5',
    bio: 'Отвечает за планирование, запуск и развитие нескольких проектных потоков одновременно.',
    contacts: [
      {
        id: 'telegram',
        type: 'telegram',
        label: 'Telegram',
        value: '@anna_manager',
        href: makeTelegramLink('@anna_manager'),
        icon: 'alternate_email',
      },
      {
        id: 'phone',
        type: 'phone',
        label: 'Телефон',
        value: '+7 495 123-45-67',
        href: 'tel:+74951234567',
        icon: 'call',
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        value: 'anna.smirnova@company.io',
        href: 'mailto:anna.smirnova@company.io',
        icon: 'mail',
      },
    ],
    orders: [
      {
        id: 'order-1',
        title: 'Согласовать квартальный план проектов',
        status: 'in-progress',
        dueDateLabel: '30 октября 2024',
      },
      {
        id: 'order-2',
        title: 'Подготовить презентацию для совета директоров',
        status: 'completed',
        dueDateLabel: '18 октября 2024',
      },
    ],
    history: [
      {
        id: 'history-1',
        title: 'Запустила программу наставничества для новых менеджеров',
        completedAtLabel: '7 октября 2024',
      },
      {
        id: 'history-2',
        title: 'Провела стратегическую сессию с ключевыми людьми',
        completedAtLabel: '20 сентября 2024',
      },
    ],
  },
]

export const cloneTeamMemberProfile = (profile: TeamMemberProfile): TeamMemberProfile => ({
  ...profile,
  contacts: profile.contacts.map((contact) => ({ ...contact })),
  orders: profile.orders.map((order) => ({ ...order })),
  history: profile.history.map((item) => ({ ...item })),
})

export const getTeamMemberProfile = (id: string): TeamMemberProfile | undefined => {
  const profile = TEAM_MEMBER_PROFILES.find((item) => item.id === id)
  return profile ? cloneTeamMemberProfile(profile) : undefined
}
