<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import OrderPageHeader from '~/components/OrderPageHeader.vue'
import OrderCard from '~/components/OrderCard.vue'
import OrderEmptyState from '~/components/OrderEmptyState.vue'
import DataLoadingIndicator from '~/components/DataLoadingIndicator.vue'
import MonthSelector from '~/components/MonthSelector.vue'
import OrderStatusChips from '~/components/OrderStatusChips.vue'
import { useOrders } from '~/composables/useOrders'
import { useProjects } from '~/composables/useProjects'
import { useUserStore } from '~/stores/user'
import { convertOrderToProjectOrder } from '~/utils/convertOrderToProjectOrder'
import { ORDER_STATUS_FILTERS, type OrderStatusFilter } from '~/utils/orderStatuses'
import type { ProjectOrder } from '~/data/projects'
import type { Order } from '~/data/orders'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const projectId = computed(() => {
  const raw = route.query.projectId
  if (Array.isArray(raw)) {
    return raw[0] ?? ''
  }
  return typeof raw === 'string' ? raw : ''
})

const { orders, fetchOrders, isLoading: isLoadingOrders } = useOrders()
const { fetchProjects, fetchProject, getProjectById, isLoading: isLoadingProjects } = useProjects()

const isLoading = computed(() => isLoadingOrders.value || isLoadingProjects.value)

const ordersList = computed<Order[]>(() => (Array.isArray(orders.value) ? orders.value : []))

const ordersFilteredByProject = computed(() => {
  if (projectId.value) {
    return ordersList.value.filter((order) => order.projectId === projectId.value)
  }
  return ordersList.value
})

const project = computed(() => {
  if (!projectId.value) {
    return null
  }
  return getProjectById(projectId.value) ?? null
})

const projectOrders = computed<ProjectOrder[]>(() =>
  ordersFilteredByProject.value
    .filter((order) => !order.archived)
    .map((order) => convertOrderToProjectOrder(order, {
      projectTitle: getProjectById(order.projectId)?.title ?? null,
    })),
)

const activeStatus = ref<OrderStatusFilter>('all')

const statusFilteredOrders = computed(() => {
  if (activeStatus.value === 'all') {
    return projectOrders.value
  }

  return projectOrders.value.filter((order) => order.status === activeStatus.value)
})

const statusOptions = computed(() =>
  ORDER_STATUS_FILTERS.map((option) => ({
    ...option,
    count:
      option.value === 'all'
        ? projectOrders.value.length
        : projectOrders.value.filter((order) => order.status === option.value).length,
  })),
)

const declOfNum = (count: number, forms: [string, string, string]) => {
  const mod100 = count % 100
  if (mod100 > 4 && mod100 < 20) {
    return forms[2]
  }

  const mod10 = count % 10
  if (mod10 === 1) {
    return forms[0]
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return forms[1]
  }

  return forms[2]
}

const parseOrderDate = (value?: string) => {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  }

  const parts = value.split('-').map((part) => Number.parseInt(part, 10))
  if (parts.length !== 3) {
    return null
  }

  const [year, month, day] = parts
  if ([year, month, day].some((part) => part === undefined || Number.isNaN(part))) {
    return null
  }

  return new Date(year, month - 1, day)
}

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase('ru-RU') + value.slice(1)

const periodFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
const dayNumberFormatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit' })

const monthNameFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long' })

const formatMonthLabel = (date: Date) => `${capitalize(monthNameFormatter.format(date))} ${date.getFullYear()}`

const formatMonthId = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const monthOptions = computed(() => {
  const monthMap = new Map<string, Date>()

  projectOrders.value.forEach((order) => {
    const date = parseOrderDate(order.dueDate)
    if (!date) {
      return
    }

    const monthId = formatMonthId(date)
    if (!monthMap.has(monthId) || monthMap.get(monthId)!.getTime() > date.getTime()) {
      monthMap.set(monthId, date)
    }
  })

  return Array.from(monthMap.entries())
    .map(([value, date]) => ({
      value,
      label: formatMonthLabel(date),
      date,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
})

const currentMonthId = computed(() => formatMonthId(new Date()))
const selectedMonthId = ref('')

watch(
  monthOptions,
  (options) => {
    if (options.length === 0) {
      selectedMonthId.value = ''
      return
    }

    if (options.some((option) => option.value === selectedMonthId.value)) {
      return
    }

    const currentOption = options.find((option) => option.value === currentMonthId.value)
    const firstOption = options[0]
    selectedMonthId.value = currentOption ? currentOption.value : firstOption?.value ?? ''
  },
  { immediate: true },
)

watch(projectId, (nextId, previousId) => {
  if (nextId === previousId) {
    return
  }

  activeStatus.value = 'all'
  selectedMonthId.value = ''
})

const handleMonthChange = (value: string) => {
  selectedMonthId.value = value
}

watch(selectedMonthId, () => {
  if (activeStatus.value !== 'all') {
    activeStatus.value = 'all'
  }
})

const filteredOrders = computed(() => {
  const orders = statusFilteredOrders.value

  if (!selectedMonthId.value) {
    return orders
  }

  return orders.filter((order) => {
    const date = parseOrderDate(order.dueDate)
    if (!date) {
      return true
    }

    return formatMonthId(date) === selectedMonthId.value
  })
})

const hasStatusFilteredOrders = computed(() => statusFilteredOrders.value.length > 0)
const hasFilteredOrders = computed(() => filteredOrders.value.length > 0)
const hasOrders = computed(() => projectOrders.value.length > 0)

const handleStatusChange = (value: string) => {
  activeStatus.value = value as OrderStatusFilter
}

const datedOrderGroups = computed(() => {
  const groups = new Map<
    string,
    {
      key: string
      weekday: string
      dayNumber: string
      fullDate: string
      orders: ProjectOrder[]
    }
  >()

  const datedOrders = filteredOrders.value
    .map((order) => ({ order, date: parseOrderDate(order.dueDate) }))
    .filter((item): item is { order: ProjectOrder; date: Date } => item.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  datedOrders.forEach(({ order, date }) => {
    const key = formatDateKey(date)
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        weekday: capitalize(weekdayFormatter.format(date)),
        dayNumber: dayNumberFormatter.format(date),
        fullDate: capitalize(periodFormatter.format(date)),
        orders: [],
      })
    }

    groups.get(key)!.orders.push(order)
  })

  return Array.from(groups.values()).map((group, index, array) => ({
    ...group,
    isLast: index === array.length - 1,
  }))
})

const undatedOrders = computed(() =>
  filteredOrders.value
    .filter((order) => !parseOrderDate(order.dueDate))
    .sort((a, b) => a.title.localeCompare(b.title, 'ru-RU')),
)

const hasDatedOrders = computed(() => datedOrderGroups.value.length > 0)
const hasUndatedOrders = computed(() => undatedOrders.value.length > 0)

const totalTaskLabel = computed(() => {
  const count = projectOrders.value.length
  if (count === 0) {
    return 'Задач пока нет'
  }
  return `${count} ${declOfNum(count, ['задача', 'задачи', 'задач'])}`
})

const pageTitle = computed(() => {
  if (!project.value) {
    return 'Все задачи'
  }
  return `Задачи • ${project.value.title}`
})

const subtitle = computed(() => totalTaskLabel.value)

const isProjectOwner = computed(() => {
  if (!project.value || !userStore.user) {
    return false
  }

  return project.value.ownerTelegramId === userStore.user.telegram_id
})

const handleBack = () => {
  router.push('/')
}

const handleEditProject = () => {
  if (!projectId.value) {
    return
  }

  router.push({
    path: `/projects/${projectId.value}/edit`,
    query: {
      from: route.fullPath,
      fallback: `/orders?projectId=${projectId.value}`,
    },
  })
}

const handleAddOrder = () => {
  if (!projectId.value) {
    return
  }

  router.push({
    path: `/projects/${projectId.value}/orders/new`,
    query: {
      from: route.fullPath,
      fallback: `/orders?projectId=${projectId.value}`,
    },
  })
}

const canCreateOrder = computed(() => projectId.value.length > 0)

onMounted(async () => {
  try {
    await Promise.all([
      fetchProjects(),
      fetchOrders(projectId.value || undefined),
    ])

    if (projectId.value && !project.value) {
      await fetchProject(projectId.value)
    }
  } catch (error) {
    console.error('Failed to load orders data:', error)
  }
})

watch(projectId, async (nextId, previousId) => {
  if (nextId === previousId) {
    return
  }

  try {
    await fetchOrders(nextId || undefined)

    if (nextId && !getProjectById(nextId)) {
      await fetchProject(nextId)
    }
  } catch (error) {
    console.error('Failed to reload orders data:', error)
  }
})

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
  <div
    class="relative flex min-h-screen w-full flex-col bg-background-light text-black transition-colors dark:bg-background-dark dark:text-white"
    :style="{ backgroundColor: 'var(--telegram-background-color, #f6f6f8)' }"
  >
    <OrderPageHeader
      :title="pageTitle"
      :subtitle="subtitle"
      :is-owner="isProjectOwner"
      @back="handleBack"
      @edit="handleEditProject"
    />

    <main class="flex-1 px-4 pb-24">
      <section class="space-y-4 py-4">
        <DataLoadingIndicator v-if="isLoading" message="Загрузка задач..." />

        <template v-else>
          <div class="flex flex-col gap-4">
            <MonthSelector
              v-if="monthOptions.length > 0"
              :model-value="selectedMonthId"
              :options="monthOptions"
              @update:model-value="handleMonthChange"
            />
            <OrderStatusChips
              :model-value="activeStatus"
              :options="statusOptions"
              @update:model-value="handleStatusChange"
            />
          </div>

          <div v-if="hasDatedOrders || hasUndatedOrders" class="flex flex-col gap-4">
            <div v-for="group in datedOrderGroups" :key="group.key" class="flex gap-4">
              <div class="flex flex-col items-center">
                <div
                  class="flex flex-col items-center justify-center rounded-xl bg-black px-3 py-2 text-white shadow-inner dark:bg-white/10"
                >
                  <span class="text-[12px] font-semibold uppercase">{{ group.weekday }}</span>
                  <span class="text-[14px] font-bold leading-none">{{ group.dayNumber }}</span>
                </div>
                <div v-if="!group.isLast" class="mt-3 h-full w-px flex-1 bg-black/10 dark:bg-white/15"></div>
              </div>
              <div class="flex flex-1 flex-col gap-3">
                <p class="text-sm font-medium text-gray-500 dark:text-[#9da6b9]">
                  {{ group.fullDate }}
                </p>
                <ul class="flex flex-col gap-3" role="list">
                  <li v-for="order in group.orders" :key="order.id" role="listitem">
                    <OrderCard :order="order" />
                  </li>
                </ul>
              </div>
            </div>

            <div v-if="hasUndatedOrders" class="flex flex-col gap-3">
              <p class="text-sm font-medium text-gray-500 dark:text-[#9da6b9]">Без даты</p>
              <ul class="flex flex-col gap-3" role="list">
                <li v-for="order in undatedOrders" :key="order.id" role="listitem">
                  <OrderCard :order="order" />
                </li>
              </ul>
            </div>
          </div>
          <div v-else class="flex flex-col gap-4 pt-2">
            <OrderEmptyState
              v-if="hasStatusFilteredOrders"
              icon="calendar_month"
              title="Нет задач в выбранном месяце"
              description="Попробуйте переключить месяц или показать все задачи."
            />
            <OrderEmptyState
              v-else-if="hasOrders"
              icon="manage_search"
              title="Нет задач по выбранным фильтрам"
              description="Измените статус, чтобы увидеть другие задачи."
            />
            <OrderEmptyState v-else />
          </div>
        </template>
      </section>
    </main>

    <button
      v-if="canCreateOrder"
      type="button"
      class="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label="Добавить задачу"
      @click="handleAddOrder"
    >
      <span class="material-symbols-outlined !text-3xl">add</span>
    </button>
  </div>
</template>
