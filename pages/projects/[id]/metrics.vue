<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useHead, useRoute, useRouter } from '#imports'
import { useProjectsStore } from '~/stores/projects'
import { useProjects } from '~/composables/useProjects'
import { useOrdersStore } from '~/stores/orders'
import { mapDbStatusToOrderStatus, ORDER_STATUS_META, type OrderStatus } from '~/utils/orderStatuses'

interface StatusChartBar {
  status: OrderStatus
  label: string
  count: number
  share: number
  width: string
  barClass: string
}

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const ordersStore = useOrdersStore()
const { isLoading: isProjectsLoading } = storeToRefs(projectsStore)
const { orders: ordersList, isLoading: isOrdersLoading } = storeToRefs(ordersStore)
const { fetchProject } = useProjects()

const pageTitle = 'Метрики проекта'
const loadError = ref('')

const projectId = computed(() => {
  const id = route.params.id
  if (Array.isArray(id)) {
    return id[0] ?? ''
  }
  return typeof id === 'string' ? id : ''
})

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

const project = computed(() => (projectId.value ? projectsStore.getProjectById(projectId.value) : undefined))
const isLoadingAny = computed(() => isProjectsLoading.value || isOrdersLoading.value)
const safeOrders = computed(() => (Array.isArray(ordersList.value) ? ordersList.value : []))
const projectOrders = computed(() => {
  const currentId = projectId.value
  if (!currentId) {
    return []
  }
  return safeOrders.value.filter((order) => order.projectId === currentId)
})

const numberFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const percentFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

const formatNumber = (value: number): string => numberFormatter.format(value)
const formatPercent = (value: number): string => `${percentFormatter.format(value)}%`
const calculateShare = (part: number, total: number): number => {
  if (total <= 0) {
    return 0
  }
  return Math.round((part / total) * 100)
}
const clampShare = (value: number): number => Math.min(100, Math.max(0, value))

const statusBarClasses: Record<OrderStatus, string> = {
  pending: 'bg-gradient-to-r from-red-500/90 via-red-400/80 to-red-500/70',
  in_progress: 'bg-gradient-to-r from-amber-400/90 via-amber-300/80 to-yellow-400/70',
  review: 'bg-gradient-to-r from-sky-500/90 via-sky-400/80 to-blue-400/70',
  done: 'bg-gradient-to-r from-emerald-500/90 via-emerald-400/80 to-green-400/70',
}

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
const totalOrdersLabel = computed(() => `${formatNumber(totalOrders.value)} заказов`)
const completionRate = computed(() => calculateShare(statusTotals.value.done, totalOrders.value))
const completionRateLabel = computed(() => formatPercent(completionRate.value))

const statusChartBars = computed<StatusChartBar[]>(() => {
  const statuses: OrderStatus[] = ['pending', 'in_progress', 'review', 'done']
  return statuses.map((status) => {
    const count = statusTotals.value[status]
    const share = calculateShare(count, totalOrders.value)
    return {
      status,
      label: ORDER_STATUS_META[status].label,
      count,
      share,
      width: `${clampShare(share)}%`,
      barClass: statusBarClasses[status],
    }
  })
})

const hasStatusData = computed(() => statusChartBars.value.some((item) => item.count > 0))
const projectNotFound = computed(
  () => projectId.value.length > 0 && !isProjectsLoading.value && !project.value && !loadError.value,
)

const handleBack = () => {
  if (returnPath.value && returnPath.value !== route.fullPath) {
    router.push(returnPath.value)
  } else {
    router.back()
  }
}

watch(
  projectId,
  async (id) => {
    if (!id) {
      loadError.value = 'Не удалось определить проект.'
      return
    }

    loadError.value = ''

    try {
      if (!project.value) {
        await fetchProject(id)
      }
    } catch (error) {
      console.error('Failed to load project for metrics:', error)
      loadError.value = 'Не удалось загрузить данные проекта.'
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
      <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div
          v-if="loadError"
          class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
        >
          {{ loadError }}
        </div>
        <div
          v-if="projectNotFound"
          class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200"
        >
          Проект не найден или ещё не загружен. Попробуйте вернуться назад.
        </div>

        <section class="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 class="text-xl font-semibold leading-tight text-white">Страница в разработке</h2>
          <p class="mt-2 text-sm text-zinc-300">
            Мы продолжаем работать над расширенной аналитикой. Пока доступен только блок с распределением статусов заказов.
          </p>
        </section>

        <article class="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/10">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold leading-tight text-white">Распределение статусов</h3>
              <p class="mt-1 text-sm text-zinc-400">Доля заказов в каждом состоянии.</p>
            </div>
            <span class="text-xs text-zinc-500">{{ totalOrdersLabel }}</span>
          </div>
          <div v-if="isLoadingAny" class="mt-6 text-sm text-zinc-400">Загрузка данных о заказах…</div>
          <template v-else>
            <div v-if="hasStatusData" class="mt-6 space-y-4">
              <div
                v-for="bar in statusChartBars"
                :key="bar.status"
                class="space-y-2"
              >
                <div class="flex items-center justify-between text-sm">
                  <span class="text-zinc-200">{{ bar.label }}</span>
                  <span class="text-zinc-400">{{ formatPercent(bar.share) }}</span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="bar.barClass"
                    :style="{ width: bar.width }"
                  ></div>
                </div>
              </div>
            </div>
            <p v-else class="mt-6 text-sm text-zinc-400">
              Создайте первые заказы, чтобы увидеть распределение по статусам.
            </p>
          </template>
          <p class="mt-6 text-xs uppercase tracking-wide text-zinc-500">Завершено: {{ completionRateLabel }}</p>
        </article>
      </div>
    </main>
  </div>
</template>
