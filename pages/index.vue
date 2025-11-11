<script setup lang="ts">
import { useAllProjects } from '~/composables/useProjectOrders'
import { useProjects } from '~/composables/useProjects'
import { useOrders } from '~/composables/useOrders'
import type { Project } from '~/data/projects'
import type { Order } from '~/data/orders'
import { useUserStore } from '~/stores/user'
import { mapDbStatusToOrderStatus } from '~/utils/orderStatuses'
import type { OrderStatus } from '~/utils/orderStatuses'
import DataLoadingIndicator from '~/components/DataLoadingIndicator.vue'

const route = useRoute()
const projects = useAllProjects()
const router = useRouter()
const userStore = useUserStore()
const { fetchProjects, isLoading: isLoadingProjects } = useProjects()
const { fetchOrders, orders, isLoading: isLoadingOrders } = useOrders()

const isLoading = computed(() => isLoadingProjects.value || isLoadingOrders.value)

// Use computed to get orders array
const ordersList = computed(() => {
  if (typeof orders === 'function') {
    return []
  }
  return Array.isArray(orders) ? orders : (orders?.value || [])
})

// Load projects and orders on mount
onMounted(async () => {
  try {
    await Promise.all([
      fetchProjects(),
      fetchOrders(),
    ])
  } catch (error) {
    console.error('Failed to load projects or orders on mount:', error)
  }
})

type TaskFilter = 'all' | 'today' | 'tomorrow' | 'other'

const visibleProjects = computed<Project[]>(() => {
  if (route.query.empty === 'true') {
    return []
  }
  // Filter out archived projects (additional client-side filtering for safety)
  return projects.value.filter((project) => !project.archived)
})

const hasProjects = computed(() => visibleProjects.value.length > 0)

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const todayDate = computed(() => startOfDay(new Date()))

const tomorrowDate = computed(() => {
  const next = new Date(todayDate.value)
  next.setDate(next.getDate() + 1)
  return next
})

const parseOrderDueDate = (value: string | null) => {
  if (!value) {
    return null
  }

  const dateOnlyMatch = value.match(/^\d{4}-\d{2}-\d{2}$/)
  if (dateOnlyMatch) {
    const [yearStr, monthStr, dayStr] = value.split('-')
    const year = Number.parseInt(yearStr, 10)
    const month = Number.parseInt(monthStr, 10)
    const day = Number.parseInt(dayStr, 10)

    if ([year, month, day].some((part) => Number.isNaN(part))) {
      return null
    }

    return new Date(year, month - 1, day)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return startOfDay(parsed)
}

const activeTaskFilter = ref<TaskFilter>('all')

const getOrderTaskFilter = (order: Order): TaskFilter => {
  const dueDate = parseOrderDueDate(order.dueDate)
  if (!dueDate) {
    return 'other'
  }

  if (dueDate.getTime() === todayDate.value.getTime()) {
    return 'today'
  }

  if (dueDate.getTime() === tomorrowDate.value.getTime()) {
    return 'tomorrow'
  }

  return 'other'
}

const activeOrders = computed(() =>
  ordersList.value.filter((order: Order) => !order.archived),
)

const filterCounts = computed(() => {
  const counts: Record<TaskFilter, number> = {
    all: activeOrders.value.length,
    today: 0,
    tomorrow: 0,
    other: 0,
  }

  activeOrders.value.forEach((order: Order) => {
    const category = getOrderTaskFilter(order)
    counts[category] += 1
  })

  return counts
})

const taskFilterButtons = computed(() => [
  { id: 'all' as const, label: 'Все', count: filterCounts.value.all },
  { id: 'today' as const, label: 'На сегодня', count: filterCounts.value.today },
  { id: 'tomorrow' as const, label: 'На завтра', count: filterCounts.value.tomorrow },
  { id: 'other' as const, label: 'Остальные', count: filterCounts.value.other },
])

const filteredOrders = computed(() => {
  if (activeTaskFilter.value === 'all') {
    return activeOrders.value
  }

  return activeOrders.value.filter(
    (order: Order) => getOrderTaskFilter(order) === activeTaskFilter.value,
  )
})

const filteredOrderPreviews = computed(() => filteredOrders.value.slice(0, 5))

const hasMoreTasksThanPreview = computed(
  () => filteredOrders.value.length > filteredOrderPreviews.value.length,
)

const projectNameMap = computed(() => {
  const map = new Map<string, string>()
  projects.value.forEach((project) => {
    map.set(project.id, project.title)
  })
  return map
})

const getProjectTitle = (projectId: string) =>
  projectNameMap.value.get(projectId) ?? 'Проект'

const dueDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
})

const getTaskDueDateLabel = (order: Order) => {
  const dueDate = parseOrderDueDate(order.dueDate)
  if (!dueDate) {
    return 'Без срока'
  }

  if (dueDate.getTime() === todayDate.value.getTime()) {
    return 'Сегодня'
  }

  if (dueDate.getTime() === tomorrowDate.value.getTime()) {
    return 'Завтра'
  }

  return dueDateFormatter.format(dueDate)
}

const statusSummary = computed<Record<OrderStatus, number>>(() => {
  return activeOrders.value.reduce(
    (acc, order) => {
      const normalizedStatus = mapDbStatusToOrderStatus(order.status || 'pending')
      acc[normalizedStatus] += 1
      return acc
    },
    {
      pending: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    } as Record<OrderStatus, number>,
  )
})

const completedTaskCount = computed(() => statusSummary.value.done)
const totalTaskCount = computed(() => activeOrders.value.length)
const progressPercentage = computed(() => {
  if (totalTaskCount.value === 0) {
    return 0
  }
  return Math.round((completedTaskCount.value / totalTaskCount.value) * 100)
})

const progressCircleStyle = computed(() => {
  const degree = (progressPercentage.value / 100) * 360
  return {
    background: `conic-gradient(#8b5cf6 ${degree}deg, #ebe5ff ${degree}deg)`,
  }
})

const dashboardTasks = computed(() => filteredOrderPreviews.value.slice(0, 4))

const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
})

const dayNumberFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
})

const weekDays = computed(() => {
  const today = todayDate.value
  const start = new Date(today)
  const dayOfWeek = (today.getDay() + 6) % 7 // convert Sunday-based index to Monday-based
  start.setDate(start.getDate() - dayOfWeek)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      label: weekdayFormatter.format(date),
      day: dayNumberFormatter.format(date),
      date,
      isToday: date.getTime() === today.getTime(),
    }
  })
})

const taskTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

const getTaskTimeLabel = (order: Order) => {
  if (!order.dueDate) {
    return 'Время не указано'
  }

  const parsed = new Date(order.dueDate)
  if (Number.isNaN(parsed.getTime())) {
    return 'Время не указано'
  }

  const time = taskTimeFormatter.format(parsed)
  if (time === '00:00') {
    return 'Весь день'
  }

  return time
}

const taskCardPalette = [
  { start: '#fde8ff', end: '#fdf1ff' },
  { start: '#dff6ff', end: '#eaf4ff' },
  { start: '#fff6d6', end: '#ffe8c8' },
] as const

const getTaskCardBackground = (index: number) => {
  const palette = taskCardPalette[index % taskCardPalette.length]
  return `linear-gradient(135deg, ${palette.start}, ${palette.end})`
}

const userProfile = computed(() => {
  const user = userStore.user
  const showEmptyAvatar = route.query.noAvatar === 'true'

  // Build user name from first_name and last_name
  const userName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || undefined
    : undefined

  // Get avatar URL from user data
  const avatarUrl = showEmptyAvatar ? null : (user?.photo_url ?? null)

  // Build profile URL using telegram_id
  const profileUrl = '/profile/edit'

  return {
    name: userName,
    profileUrl,
    avatarUrl,
  }
})

const declOfNum = (count: number, forms: [string, string, string]) => {
  const mod100 = count % 100
  if (mod100 > 4 && mod100 < 20)
    return forms[2]

  const mod10 = count % 10
  if (mod10 === 1)
    return forms[0]
  if (mod10 >= 2 && mod10 <= 4)
    return forms[1]

  return forms[2]
}

const getOrderCount = (project: Project) => {
  // Count only non-archived orders for this project from the database
  const currentOrders = ordersList.value
  const projectOrders = currentOrders.filter(
    (order: Order) => order.projectId === project.id && !order.archived,
  )
  const orderCount = projectOrders.length

  // Fallback to project.total only when orders haven't been loaded yet
  if (orderCount === 0 && currentOrders.length === 0 && typeof project.total === 'number') {
    return project.total
  }

  return orderCount
}

const formatOrderCount = (project: Project) => {
  const count = getOrderCount(project)
  return `${count} ${declOfNum(count, ['задача', 'задачи', 'задач'])}`
}

const getParticipantCount = (project: Project) => {
  // Use membersCount from project (excluding owner)
  return project.membersCount ?? 0
}

const formatParticipantCount = (project: Project) => {
  const count = getParticipantCount(project)
  return `${count} ${declOfNum(count, ['участник', 'участника', 'участников'])}`
}

const handleAddProject = () => {
  router.push('/projects/new')
}

useHead({
  title: 'Мои проекты',
  htmlAttrs: {
    lang: 'ru',
    class: 'dark',
  },
  bodyAttrs: {
    class: 'bg-background-light dark:bg-background-dark font-display',
    style: 'min-height: 100dvh;',
  },
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
    },
  ],
})
</script>

<template>
  <div
    class="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#f3f2ff] text-black dark:bg-[#0f172a] dark:text-white"
    :style="{ backgroundColor: 'var(--telegram-background-color, #f3f2ff)' }"
  >
    <div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#ede8ff] via-transparent to-white dark:from-[#111827] dark:via-[#0f172a] dark:to-[#020617]" aria-hidden="true"></div>

    <main class="relative z-10 flex-1 px-4 pb-28 pt-6 sm:px-6">
      <DataLoadingIndicator v-if="isLoading" message="Загрузка проектов..." />

      <div v-else-if="hasProjects" class="mx-auto flex w-full max-w-md flex-col gap-6 pb-6">
        <header class="flex items-center gap-3 rounded-3xl bg-white/90 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-[#1b2030]/90 dark:ring-white/10">
          <NuxtLink
            :to="userProfile.profileUrl"
            class="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary transition hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Редактировать профиль"
          >
            <img
              v-if="userProfile.avatarUrl"
              :src="userProfile.avatarUrl"
              :alt="userProfile.name ?? 'Аватар пользователя'"
              class="size-full rounded-2xl object-cover"
            >
            <span v-else class="material-symbols-outlined text-2xl text-primary">person</span>
          </NuxtLink>
          <div class="flex flex-1 flex-col">
            <span class="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Dashboard</span>
            <p class="text-lg font-semibold text-zinc-900 dark:text-white">
              {{ userProfile.name ? `Привет, ${userProfile.name}` : 'Ваши задачи' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex size-11 items-center justify-center rounded-2xl bg-white/80 text-zinc-500 shadow-sm ring-1 ring-black/5 transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-[#111727]/80 dark:text-zinc-300 dark:ring-white/10"
              aria-label="Поиск задач"
            >
              <span class="material-symbols-outlined text-2xl">search</span>
            </button>
            <button
              type="button"
              class="flex size-11 items-center justify-center rounded-2xl bg-white/80 text-zinc-500 shadow-sm ring-1 ring-black/5 transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-[#111727]/80 dark:text-zinc-300 dark:ring-white/10"
              aria-label="Открыть уведомления"
            >
              <span class="material-symbols-outlined text-2xl">notifications</span>
            </button>
          </div>
        </header>

        <section class="space-y-4 rounded-3xl bg-white/95 p-5 shadow-sm ring-1 ring-black/5 dark:bg-[#1c2435]/90 dark:ring-white/10">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Ваш прогресс</p>
              <p class="text-2xl font-semibold text-zinc-900 dark:text-white">
                {{ totalTaskCount }}
              </p>
              <p class="text-sm text-zinc-500 dark:text-zinc-400">
                {{ declOfNum(totalTaskCount, ['задача', 'задачи', 'задач']) }} в работе
              </p>
            </div>
            <button
              type="button"
              class="flex items-center justify-center rounded-2xl bg-black/5 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-black/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
            >
              {{ filterCounts[activeTaskFilter] }} {{ declOfNum(filterCounts[activeTaskFilter], ['задача', 'задачи', 'задач']) }}
            </button>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl bg-gradient-to-br from-[#ede4ff] to-[#f5f0ff] p-4 shadow-inner">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-primary">Список задач</p>
                <span class="text-xl font-bold text-primary">{{ dashboardTasks.length }}</span>
              </div>
              <ul v-if="dashboardTasks.length" class="mt-4 space-y-2">
                <li v-for="order in dashboardTasks" :key="order.id">
                  <NuxtLink
                    :to="`/orders/${order.id}`"
                    class="group flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2 text-sm text-zinc-700 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    :aria-label="`Перейти к задаче «${order.title}»`"
                  >
                    <div class="flex flex-1 items-center gap-2">
                      <span class="material-symbols-outlined text-base text-primary">task_alt</span>
                      <span class="line-clamp-1 font-medium text-zinc-900 dark:text-zinc-900">{{ order.title }}</span>
                    </div>
                    <span class="text-xs text-zinc-500">{{ getTaskDueDateLabel(order) }}</span>
                  </NuxtLink>
                </li>
              </ul>
              <p v-else class="mt-6 text-sm text-zinc-500">Задач пока нет.</p>
            </div>

            <div class="flex flex-col items-center rounded-2xl border border-black/5 bg-white/90 p-4 text-center shadow-sm dark:border-white/10 dark:bg-[#131826]/90">
              <div class="relative flex size-32 items-center justify-center">
                <div class="size-full rounded-full" :style="progressCircleStyle"></div>
                <div class="absolute inset-[14px] rounded-full bg-white/95 dark:bg-[#0f1420]"></div>
                <div class="absolute flex flex-col items-center justify-center">
                  <span class="text-2xl font-bold text-primary">{{ progressPercentage }}%</span>
                  <span class="text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Готово</span>
                </div>
              </div>
              <p class="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                {{ completedTaskCount }} из {{ totalTaskCount }} задач выполнено
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 pt-2">
            <button
              v-for="button in taskFilterButtons"
              :key="button.id"
              type="button"
              class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :class="
                activeTaskFilter === button.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-black/5 text-zinc-700 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15'
              "
              :aria-pressed="activeTaskFilter === button.id"
              @click="activeTaskFilter = button.id"
            >
              <span>{{ button.label }}</span>
              <span class="rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold text-black/80 dark:bg-white/15 dark:text-white/80">
                {{ button.count }}
              </span>
            </button>
          </div>
        </section>

        <section class="space-y-4 rounded-3xl bg-white/95 p-5 shadow-sm ring-1 ring-black/5 dark:bg-[#1c2435]/90 dark:ring-white/10">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">Список задач</h2>
            <button
              type="button"
              class="rounded-2xl bg-black/5 px-3 py-2 text-sm text-zinc-500 transition hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
            >
              <span class="material-symbols-outlined text-base">more_horiz</span>
            </button>
          </div>

          <div class="flex items-center justify-between gap-2 overflow-x-auto pb-2 text-xs font-semibold text-zinc-500">
            <button
              v-for="day in weekDays"
              :key="day.label"
              type="button"
              class="flex min-w-[48px] flex-col items-center rounded-2xl px-3 py-2 uppercase tracking-wide transition"
              :class="day.isToday ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white'"
            >
              <span>{{ day.label }}</span>
              <span class="mt-1 text-base font-semibold">{{ day.day }}</span>
            </button>
          </div>

          <div v-if="filteredOrderPreviews.length > 0" class="space-y-3">
            <NuxtLink
              v-for="(order, index) in filteredOrderPreviews"
              :key="order.id"
              :to="`/orders/${order.id}`"
              class="group flex flex-col gap-3 rounded-2xl p-4 text-sm text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :style="{ background: getTaskCardBackground(index) }"
              :aria-label="`Перейти к задаче «${order.title}»`"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-base font-semibold text-zinc-900">
                    {{ order.title }}
                  </p>
                  <p class="text-xs text-zinc-600">
                    {{ getProjectTitle(order.projectId) }}
                  </p>
                </div>
                <span class="material-symbols-outlined text-3xl text-white/70">calendar_month</span>
              </div>
              <div class="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                <div class="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-700">
                  <span class="material-symbols-outlined text-base text-primary">calendar_month</span>
                  {{ getTaskDueDateLabel(order) }}
                </div>
                <div class="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-700">
                  <span class="material-symbols-outlined text-base text-primary">schedule</span>
                  {{ getTaskTimeLabel(order) }}
                </div>
              </div>
            </NuxtLink>
          </div>
          <p
            v-else
            class="rounded-2xl border border-dashed border-black/10 bg-white/70 p-5 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-[#1F2937]/60 dark:text-zinc-400"
          >
            В этой категории пока нет задач.
          </p>
          <p
            v-if="hasMoreTasksThanPreview"
            class="text-xs text-zinc-500 dark:text-zinc-400"
          >
            Показаны первые {{ filteredOrderPreviews.length }} {{ declOfNum(filteredOrderPreviews.length, ['задача', 'задачи', 'задач']) }} из {{ filteredOrders.length }}.
          </p>
        </section>

        <section class="space-y-4 rounded-3xl bg-white/95 p-5 shadow-sm ring-1 ring-black/5 dark:bg-[#1c2435]/90 dark:ring-white/10">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">Активные проекты</h2>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              @click="handleAddProject"
            >
              <span class="material-symbols-outlined !text-base">add</span>
              Новый проект
            </button>
          </div>
          <div class="-mx-3 flex gap-3 overflow-x-auto px-1 pb-2">
            <NuxtLink
              v-for="project in visibleProjects"
              :key="project.id"
              :to="`/projects/${project.id}/orders`"
              class="flex min-w-[240px] flex-col gap-3 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-[#141b2b]/90 dark:ring-white/10"
              :aria-label="`Перейти к задачам проекта «${project.title}»`"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-12 items-center justify-center rounded-2xl text-white"
                    :style="project.color ? { backgroundColor: project.color } : {}"
                    :class="{ 'bg-primary': !project.color }"
                  >
                    <span class="material-symbols-outlined text-2xl">folder</span>
                  </div>
                  <div>
                    <p class="text-base font-semibold text-zinc-900 dark:text-white">{{ project.title }}</p>
                    <p v-if="project.description" class="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {{ project.description }}
                    </p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-zinc-400">chevron_right</span>
              </div>
              <div class="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <div class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-base text-primary">checklist</span>
                  {{ formatOrderCount(project) }}
                </div>
                <div class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-base text-primary">group</span>
                  {{ formatParticipantCount(project) }}
                </div>
              </div>
            </NuxtLink>
          </div>
        </section>
      </div>

      <div
        v-else-if="!isLoading"
        class="mx-auto mt-20 flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600 dark:border-gray-700 dark:bg-[#1C2431] dark:text-[#9da6b9]"
      >
        <span class="material-symbols-outlined text-5xl text-primary">folder_off</span>
        <div class="space-y-2">
          <p class="text-lg font-semibold text-black dark:text-white">Проектов пока нет</p>
          <p class="max-w-sm text-sm leading-6 text-gray-500 dark:text-[#9da6b9]">
            Создайте первый проект, чтобы начать работу с задачами и отслеживать прогресс вашей команды.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="handleAddProject"
        >
          <span class="material-symbols-outlined !text-base">add</span>
          Создать проект
        </button>
      </div>
    </main>

    <div class="fixed bottom-5 right-5 z-20">
      <button
        type="button"
        class="flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Добавить проект"
        @click="handleAddProject"
      >
        <span class="material-symbols-outlined !text-3xl">add</span>
      </button>
    </div>
  </div>
</template>
