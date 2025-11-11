<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import { useProjectsStore } from '~/stores/projects'
import { useProjects } from '~/composables/useProjects'
import { useOrdersStore } from '~/stores/orders'
import { mapDbStatusToOrderStatus, ORDER_STATUS_META, type OrderStatus } from '~/utils/orderStatuses'

type TabId = 'general' | 'links' | 'metrics'
type InternalTab = 'general' | 'links'
type MetricTone = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface MetricItem {
  label: string
  value: string
  hint?: string
  tone?: MetricTone
}

interface MetricsSection {
  id: string
  title: string
  description: string
  items: MetricItem[]
}

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const ordersStore = useOrdersStore()
const { fetchProject } = useProjects()

const pageTitle = 'Метрики проекта'
const metricsTabs: Array<{ id: TabId; label: string }> = [
  { id: 'general', label: 'Основное' },
  { id: 'links', label: 'Настройки' },
  { id: 'metrics', label: 'Метрики' },
]

const valueToneClasses: Record<MetricTone, string> = {
  default: 'text-white',
  success: 'text-emerald-400',
  warning: 'text-amber-300',
  danger: 'text-red-400',
  info: 'text-sky-300',
}

const statusDescriptions: Record<OrderStatus, string> = {
  pending: 'Ожидают запуска работ',
  in_progress: 'Находятся в процессе выполнения',
  review: 'Требуют проверки',
  done: 'Завершены и закрыты',
}

const numberFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const percentFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})
const activityFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

const formatNumber = (value: number): string => numberFormatter.format(value)
const formatPercent = (value: number): string => `${percentFormatter.format(value)}%`
const formatCurrencyValue = (value: number): string => currencyFormatter.format(value)
const getMetricValueClasses = (tone: MetricTone = 'default'): string =>
  `text-3xl font-semibold leading-none ${valueToneClasses[tone]}`
const getMetricsTabButtonClasses = (tabId: TabId): string => {
  if (tabId === 'metrics') {
    return 'flex-1 rounded-xl bg-primary/15 px-3 py-2 text-sm font-semibold text-white shadow-inner cursor-default'
  }

  return 'flex-1 rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white'
}
const getStatusCardClasses = (status: OrderStatus): string => {
  return `${ORDER_STATUS_META[status].cardClass} rounded-2xl p-4 shadow-sm`
}
const calculateShare = (part: number, total: number): number => {
  if (total <= 0) {
    return 0
  }
  return Math.round((part / total) * 100)
}
const parseDueDate = (value: string | null): Date | null => {
  if (!value) {
    return null
  }

  const parsed = Date.parse(value)
  if (!Number.isNaN(parsed)) {
    return new Date(parsed)
  }

  const parts = value.split('-')
  if (parts.length === 3) {
    const [yearStr, monthStr, dayStr] = parts
    const year = Number.parseInt(yearStr, 10)
    const month = Number.parseInt(monthStr, 10)
    const day = Number.parseInt(dayStr, 10)

    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      return new Date(year, month - 1, day)
    }
  }

  return null
}

const projectId = computed(() => {
  const id = route.params.id
  if (Array.isArray(id)) {
    return id[0] ?? ''
  }
  return typeof id === 'string' ? id : ''
})

const project = computed(() => (projectId.value ? projectsStore.getProjectById(projectId.value) : undefined))
const projectColor = computed(() => project.value?.color ?? '#3B82F6')
const hasCustomDescription = computed(
  () => typeof project.value?.description === 'string' && project.value.description.trim().length > 0,
)
const projectDescription = computed(() => {
  if (hasCustomDescription.value) {
    return project.value?.description?.trim() ?? ''
  }
  return 'Добавьте описание проекта, чтобы команда понимала контекст.'
})
const projectTitle = computed(() => project.value?.title ?? 'Проект')

const fallbackPath = computed(() => {
  const fallback = route.query.fallback
  if (typeof fallback === 'string' && fallback.length > 0) {
    return fallback
  }
  return ''
})

const returnPath = computed(() => {
  const from = route.query.from
  if (typeof from === 'string' && from.length > 0) {
    return from
  }
  if (fallbackPath.value.length > 0) {
    return fallbackPath.value
  }
  if (projectId.value) {
    return `/projects/${projectId.value}/edit`
  }
  return '/projects'
})

const loadError = ref('')
const isRefreshing = ref(false)

const isProjectsLoading = computed(() => projectsStore.isLoading.value)
const isOrdersLoading = computed(() => ordersStore.isLoading.value)
const isLoadingAny = computed(() => isProjectsLoading.value || isOrdersLoading.value)

const projectOrders = computed(() => {
  const currentId = projectId.value
  if (!currentId) {
    return []
  }
  return ordersStore.orders.value.filter((order) => order.projectId === currentId)
})

const statusTotals = computed<Record<OrderStatus, number>>(() => {
  const totals: Record<OrderStatus, number> = {
    pending: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  }

  for (const order of projectOrders.value) {
    const status = mapDbStatusToOrderStatus(order.status)
    totals[status] += 1
  }

  return totals
})

const totalOrders = computed(() => projectOrders.value.length)
const completedOrders = computed(() => statusTotals.value.done)
const activeOrdersCount = computed(() => totalOrders.value - completedOrders.value)
const ordersRequiringAttention = computed(
  () => statusTotals.value.in_progress + statusTotals.value.review,
)
const completionRate = computed(() => calculateShare(completedOrders.value, totalOrders.value))
const completionRateLabel = computed(() => formatPercent(completionRate.value))
const completionRateWidth = computed(
  () => `${Math.min(100, Math.max(0, completionRate.value))}%`,
)

const ordersWithoutAssignee = computed(
  () =>
    projectOrders.value.filter(
      (order) => order.assigneeTelegramId === null || order.assigneeTelegramId === undefined,
    ).length,
)
const ordersWithoutPaymentType = computed(
  () => projectOrders.value.filter((order) => !order.paymentType).length,
)
const ordersWithReminder = computed(
  () => projectOrders.value.filter((order) => Boolean(order.reminderOffset)).length,
)

const reviewsCount = computed(() => {
  return projectOrders.value.filter((order) => {
    const hasComment = typeof order.reviewComment === 'string' && order.reviewComment.trim().length > 0
    const hasImages = Array.isArray(order.reviewImages) && order.reviewImages.length > 0
    const hasAnswer = typeof order.reviewAnswer === 'string' && order.reviewAnswer.trim().length > 0
    return hasComment || hasImages || hasAnswer
  }).length
})

const reviewsAwaitingResponse = computed(() => {
  return projectOrders.value.filter((order) => {
    const hasComment = typeof order.reviewComment === 'string' && order.reviewComment.trim().length > 0
    const hasAnswer = typeof order.reviewAnswer === 'string' && order.reviewAnswer.trim().length > 0
    return hasComment && !hasAnswer
  }).length
})

const totalRevenue = computed(() =>
  projectOrders.value.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0),
)
const totalPrepayment = computed(() =>
  projectOrders.value.reduce((sum, order) => sum + (order.prepaymentAmount ?? 0), 0),
)
const outstandingAmount = computed(() => {
  const diff = totalRevenue.value - totalPrepayment.value
  return diff > 0 ? diff : 0
})

const overdueOrders = computed(() => {
  const now = Date.now()
  return projectOrders.value.filter((order) => {
    const dueDate = parseDueDate(order.dueDate)
    if (!dueDate) {
      return false
    }
    if (mapDbStatusToOrderStatus(order.status) === 'done') {
      return false
    }
    return dueDate.getTime() < now
  }).length
})

const dueSoonOrders = computed(() => {
  const now = Date.now()
  const threshold = now + 1000 * 60 * 60 * 48
  return projectOrders.value.filter((order) => {
    const dueDate = parseDueDate(order.dueDate)
    if (!dueDate) {
      return false
    }
    const dueTime = dueDate.getTime()
    if (mapDbStatusToOrderStatus(order.status) === 'done') {
      return false
    }
    return dueTime > now && dueTime <= threshold
  }).length
})

const ordersWithDueDate = computed(() =>
  projectOrders.value.filter((order) => Boolean(parseDueDate(order.dueDate))).length,
)

const overdueShare = computed(() => calculateShare(overdueOrders.value, totalOrders.value))
const dueSoonShare = computed(() => calculateShare(dueSoonOrders.value, totalOrders.value))
const dueDateCoverage = computed(() => calculateShare(ordersWithDueDate.value, totalOrders.value))
const remindersShare = computed(() => calculateShare(ordersWithReminder.value, totalOrders.value))
const prepaymentShare = computed(() => calculateShare(totalPrepayment.value, totalRevenue.value))

const statusBreakdown = computed(() => {
  const statuses: OrderStatus[] = ['pending', 'in_progress', 'review', 'done']
  return statuses.map((status) => ({
    status,
    label: ORDER_STATUS_META[status].label,
    count: statusTotals.value[status],
  }))
})

const lastActivityLabel = computed(() => {
  const timestamps = projectOrders.value
    .map((order) => order.updatedAt)
    .filter((timestamp): timestamp is string => Boolean(timestamp))

  const latestTimestamp = timestamps.reduce((latest, current) => {
    const parsed = Date.parse(current)
    if (Number.isNaN(parsed)) {
      return latest
    }
    return Math.max(latest, parsed)
  }, 0)

  if (latestTimestamp === 0) {
    return 'Нет данных об активности'
  }

  return `Обновлено ${activityFormatter.format(new Date(latestTimestamp))}`
})

const showStatusBreakdown = computed(
  () => !isLoadingAny.value || totalOrders.value > 0,
)
const showEmptyState = computed(
  () => !isLoadingAny.value && totalOrders.value === 0 && !loadError.value,
)
const projectNotFound = computed(
  () => projectId.value.length > 0 && !isProjectsLoading.value && !project.value && !loadError.value,
)

const metricsSections = computed<MetricsSection[]>(() => {
  return [
    {
      id: 'progress',
      title: 'Прогресс и статусы',
      description: 'Показывает, как продвигаются заказы по этапам.',
      items: [
        {
          label: 'Выполнено',
          value: formatNumber(completedOrders.value),
          hint:
            totalOrders.value > 0
              ? `${formatPercent(completionRate.value)} от всех заказов`
              : 'Нет завершённых задач',
          tone: completedOrders.value > 0 ? 'success' : 'default',
        },
        {
          label: 'Активно',
          value: formatNumber(activeOrdersCount.value),
          hint:
            activeOrdersCount.value > 0
              ? `${formatNumber(ordersRequiringAttention.value)} на ключевых этапах`
              : 'Все текущие задачи завершены',
          tone: activeOrdersCount.value > 0 ? 'info' : 'success',
        },
        {
          label: 'Без исполнителя',
          value: formatNumber(ordersWithoutAssignee.value),
          hint:
            ordersWithoutAssignee.value > 0
              ? 'Назначьте ответственных, чтобы не потерять сроки'
              : 'Все заказы распределены по исполнителям',
          tone: ordersWithoutAssignee.value > 0 ? 'warning' : 'success',
        },
      ],
    },
    {
      id: 'timing',
      title: 'Сроки и дедлайны',
      description: 'Контроль просрочек и срочных задач.',
      items: [
        {
          label: 'Просрочено',
          value: formatNumber(overdueOrders.value),
          hint:
            overdueOrders.value > 0
              ? `${formatPercent(overdueShare.value)} от активных задач`
              : 'Просроченных задач нет',
          tone: overdueOrders.value > 0 ? 'danger' : 'success',
        },
        {
          label: '48 часов до дедлайна',
          value: formatNumber(dueSoonOrders.value),
          hint:
            dueSoonOrders.value > 0
              ? `${formatPercent(dueSoonShare.value)} требуют внимания`
              : 'Ближайших дедлайнов нет',
          tone: dueSoonOrders.value > 0 ? 'warning' : 'info',
        },
        {
          label: 'С указанным сроком',
          value: formatNumber(ordersWithDueDate.value),
          hint:
            ordersWithDueDate.value > 0
              ? `${formatPercent(dueDateCoverage.value)} заказов со сроками`
              : 'Укажите сроки, чтобы видеть нагрузку по календарю',
          tone: ordersWithDueDate.value > 0 ? 'info' : 'warning',
        },
      ],
    },
    {
      id: 'finance',
      title: 'Финансы',
      description: 'Денежные показатели по заказам.',
      items: [
        {
          label: 'Оборот',
          value: totalRevenue.value > 0 ? formatCurrencyValue(totalRevenue.value) : '—',
          hint:
            totalRevenue.value > 0
              ? `${formatNumber(completedOrders.value)} заказов с суммами`
              : 'Суммы заказов пока не заполнены',
          tone: totalRevenue.value > 0 ? 'info' : 'default',
        },
        {
          label: 'Предоплаты',
          value: totalPrepayment.value > 0 ? formatCurrencyValue(totalPrepayment.value) : '—',
          hint:
            totalPrepayment.value > 0
              ? totalRevenue.value > 0
                ? `${formatPercent(prepaymentShare.value)} от оборота`
                : 'Предоплаты указаны, но итоговая сумма заказов отсутствует'
              : 'Нет данных о предоплатах',
          tone: totalPrepayment.value > 0 ? 'success' : 'default',
        },
        {
          label: 'Ожидается оплата',
          value: outstandingAmount.value > 0 ? formatCurrencyValue(outstandingAmount.value) : '—',
          hint:
            outstandingAmount.value > 0
              ? 'Проверьте оплату по этим заказам'
              : 'Задолженностей нет',
          tone: outstandingAmount.value > 0 ? 'warning' : 'success',
        },
      ],
    },
    {
      id: 'quality',
      title: 'Качество и коммуникации',
      description: 'Отзывы и автоматические напоминания.',
      items: [
        {
          label: 'Отзывы',
          value: formatNumber(reviewsCount.value),
          hint:
            reviewsCount.value > 0
              ? reviewsAwaitingResponse.value > 0
                ? `${formatNumber(reviewsAwaitingResponse.value)} ждут ответа`
                : 'Все отзывы обработаны'
              : 'Отзывы ещё не собирались',
          tone:
            reviewsAwaitingResponse.value > 0
              ? 'warning'
              : reviewsCount.value > 0
                ? 'success'
                : 'default',
        },
        {
          label: 'Напоминания',
          value: formatNumber(ordersWithReminder.value),
          hint:
            ordersWithReminder.value > 0
              ? `${formatPercent(remindersShare.value)} заказов с напоминаниями`
              : 'Напоминания не настроены',
          tone: ordersWithReminder.value > 0 ? 'info' : 'default',
        },
        {
          label: 'Без указания оплаты',
          value: formatNumber(ordersWithoutPaymentType.value),
          hint:
            ordersWithoutPaymentType.value > 0
              ? 'Заполните способ оплаты для контроля финансов'
              : 'Способ оплаты указан во всех заказах',
          tone: ordersWithoutPaymentType.value > 0 ? 'warning' : 'success',
        },
      ],
    },
  ]
})

const handleMetricsTabClick = (tabId: TabId) => {
  if (tabId === 'metrics') {
    return
  }
  goToEdit(tabId)
}

const goToEdit = (targetTab: InternalTab) => {
  if (!projectId.value) {
    return
  }

  const query: Record<string, string> = { from: route.fullPath }
  if (fallbackPath.value.length > 0) {
    query.fallback = fallbackPath.value
  }
  if (targetTab === 'links') {
    query.tab = 'links'
  }

  router.push({
    path: `/projects/${projectId.value}/edit`,
    query,
  })
}

const handleBack = () => {
  if (returnPath.value && returnPath.value !== route.fullPath) {
    router.push(returnPath.value)
  } else {
    router.back()
  }
}

const handleRefresh = async () => {
  if (!projectId.value || isRefreshing.value) {
    return
  }

  isRefreshing.value = true
  loadError.value = ''

  try {
    await ordersStore.fetchOrders(projectId.value)
  } catch (error) {
    console.error('Failed to refresh project metrics orders:', error)
    loadError.value = 'Не удалось обновить метрики. Попробуйте позже.'
  } finally {
    isRefreshing.value = false
  }
}

watch(
  projectId,
  async (id) => {
    if (!id) {
      return
    }

    loadError.value = ''
    let projectLoadFailed = false

    try {
      if (!project.value) {
        await fetchProject(id)
      }
    } catch (error) {
      console.error('Failed to load project for metrics:', error)
      loadError.value = 'Не удалось загрузить данные проекта.'
      projectLoadFailed = true
    }

    if (projectLoadFailed) {
      return
    }

    try {
      await ordersStore.fetchOrders(id)
    } catch (error) {
      console.error('Failed to load orders for metrics:', error)
      if (!loadError.value) {
        loadError.value = 'Не удалось загрузить задачи для расчёта метрик.'
      }
    }
  },
  { immediate: true },
)

useHead({
  title: pageTitle,
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
  <div class="relative flex min-h-screen w-full flex-col bg-background-dark text-white">
    <header
      class="flex items-center justify-between border-b border-white/10 bg-background-dark/90 p-4 pb-3 backdrop-blur-sm"
    >
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/5"
        aria-label="Вернуться назад"
        @click="handleBack"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>
      <h1 class="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em]">{{ pageTitle }}</h1>
      <div class="flex w-12 items-center justify-end"></div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 pt-4 pb-12">
      <div class="flex flex-col space-y-6">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-1">
          <div class="flex gap-1" role="tablist" aria-label="Навигация по настройкам проекта">
            <button
              v-for="tab in metricsTabs"
              :key="tab.id"
              type="button"
              :class="getMetricsTabButtonClasses(tab.id)"
              role="tab"
              :aria-selected="tab.id === 'metrics'"
              :aria-controls="`tab-panel-${tab.id}`"
              :disabled="tab.id === 'metrics'"
              @click="handleMetricsTabClick(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div
          v-if="loadError"
          class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
        >
          {{ loadError }}
        </div>
        <div
          v-else-if="projectNotFound"
          class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200"
        >
          Проект не найден или ещё не загружен. Попробуйте вернуться назад.
        </div>
        <template v-else>
          <section class="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <div
                  class="mt-1 size-12 shrink-0 rounded-2xl border border-white/20"
                  :style="{ backgroundColor: projectColor }"
                ></div>
                <div class="space-y-1">
                  <h2 class="text-xl font-semibold leading-tight">{{ projectTitle }}</h2>
                  <p
                    :class="[
                      'max-w-2xl text-sm',
                      hasCustomDescription ? 'text-zinc-300' : 'text-zinc-500',
                    ]"
                  >
                    {{ projectDescription }}
                  </p>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1 text-right">
                <p class="text-sm font-medium uppercase tracking-wide text-zinc-400">Выполнение</p>
                <p class="text-4xl font-bold leading-none text-white">{{ completionRateLabel }}</p>
                <p class="text-xs text-zinc-500">{{ lastActivityLabel }}</p>
              </div>
            </div>
            <div class="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                class="h-full rounded-full bg-primary transition-all duration-500"
                :style="{ width: completionRateWidth }"
              ></div>
            </div>
            <div class="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                @click="goToEdit('general')"
              >
                <span class="material-symbols-outlined text-base">tune</span>
                Редактировать
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                @click="goToEdit('links')"
              >
                <span class="material-symbols-outlined text-base">settings</span>
                Настройки
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary/80 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isLoadingAny || isRefreshing"
                @click="handleRefresh"
              >
                <span
                  class="material-symbols-outlined text-base"
                  :class="{ 'animate-spin': isRefreshing }"
                >
                  refresh
                </span>
                Обновить метрики
              </button>
            </div>
          </section>

          <section
            v-if="showStatusBreakdown"
            class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <article
              v-for="status in statusBreakdown"
              :key="status.status"
              :class="getStatusCardClasses(status.status)"
            >
              <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {{ status.label }}
              </p>
              <p class="mt-3 text-3xl font-bold leading-none text-zinc-900 dark:text-white">
                {{ formatNumber(status.count) }}
              </p>
              <p class="mt-2 text-xs text-zinc-500 dark:text-zinc-300">
                {{ statusDescriptions[status.status] }}
              </p>
            </article>
          </section>

          <section
            v-if="isLoadingAny"
            class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300"
          >
            Загрузка метрик проекта…
          </section>
          <section
            v-else-if="showEmptyState"
            class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300"
          >
            Для расчёта метрик пока нет заказов. Создайте хотя бы один заказ, чтобы увидеть аналитику.
          </section>
          <section
            v-else
            class="grid gap-4 xl:grid-cols-2"
          >
            <article
              v-for="section in metricsSections"
              :key="section.id"
              class="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div>
                <h3 class="text-lg font-semibold leading-tight text-white">
                  {{ section.title }}
                </h3>
                <p class="mt-1 text-sm text-zinc-300">
                  {{ section.description }}
                </p>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div
                  v-for="item in section.items"
                  :key="item.label"
                  class="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <p class="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {{ item.label }}
                  </p>
                  <p :class="['mt-3', getMetricValueClasses(item.tone)]">
                    {{ item.value }}
                  </p>
                  <p v-if="item.hint" class="mt-2 text-xs text-zinc-400">
                    {{ item.hint }}
                  </p>
                </div>
              </div>
            </article>
          </section>
        </template>
      </div>
    </main>
  </div>
</template>
