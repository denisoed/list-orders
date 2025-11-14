<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import OrderPageHeader from '~/components/OrderPageHeader.vue'
import OrderCard from '~/components/OrderCard.vue'
import OrderEmptyState from '~/components/OrderEmptyState.vue'
import DataLoadingIndicator from '~/components/DataLoadingIndicator.vue'
import MonthSelector from '~/components/MonthSelector.vue'
import OrderStatusChips from '~/components/OrderStatusChips.vue'
import OrderFilterModal from '~/components/OrderFilterModal.vue'
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

const NO_PROJECT_ID = 'none'
const activeProjectId = computed(() =>
  projectId.value === NO_PROJECT_ID ? '' : projectId.value,
)
const isNoProjectFilter = computed(() => projectId.value === NO_PROJECT_ID)

const { orders, fetchOrders, isLoading: isLoadingOrders } = useOrders()
const {
  fetchProjects,
  fetchProject,
  getProjectById,
  isLoading: isLoadingProjects,
  projects,
} = useProjects()

const isInitialLoading = ref(true)

const ordersList = computed<Order[]>(() => (Array.isArray(orders.value) ? orders.value : []))

const canUseCachedOrders = computed(() => !projectId.value)
const hasCachedProjects = computed(() => projects.value.length > 0)
const hasCachedOrders = computed(() => ordersList.value.length > 0)
const hasCachedData = computed(
  () => canUseCachedOrders.value && hasCachedProjects.value && hasCachedOrders.value,
)

const applyInitialLoadingState = () => {
  if (!canUseCachedOrders.value) {
    isInitialLoading.value = false
    return
  }

  isInitialLoading.value = !hasCachedData.value
}

applyInitialLoadingState()

const isLoading = computed(() => {
  if (!canUseCachedOrders.value) {
    return isLoadingOrders.value || isLoadingProjects.value
  }

  return isInitialLoading.value && !hasCachedData.value
})

const appliedProjectIds = ref<string[]>([])
const appliedAssigneeIds = ref<number[]>([])
const isFilterModalOpen = ref(false)

const filterProjectIds = computed(() => {
  if (appliedProjectIds.value.length > 0) {
    return appliedProjectIds.value
  }
  return projectId.value ? [projectId.value] : []
})

const hasActiveFilters = computed(
  () => filterProjectIds.value.length > 0 || appliedAssigneeIds.value.length > 0,
)

const projectFilterOptions = computed(() => {
  const map = new Map<string, { id: string; label: string }>()

  projects.value
    .filter((project) => !project.archived)
    .forEach((project) => {
      map.set(project.id, {
        id: project.id,
        label: project.title,
      })
    })

  ordersList.value
    .filter((order) => !order.archived)
    .forEach((order) => {
      const projectKey = order.projectId ?? NO_PROJECT_ID

      if (map.has(projectKey)) {
        return
      }

      const projectTitle = order.projectId
        ? getProjectById(order.projectId)?.title ?? 'Без проекта'
        : 'Без проекта'
      map.set(projectKey, {
        id: projectKey,
        label: projectTitle,
      })
    })

  if (!map.has(NO_PROJECT_ID)) {
    map.set(NO_PROJECT_ID, {
      id: NO_PROJECT_ID,
      label: 'Без проекта',
    })
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'ru-RU'))
})

const UNASSIGNED_ASSIGNEE_ID = -1

const assigneeFilterOptions = computed(() => {
  const map = new Map<number, { id: number; name: string; avatarUrl: string | null }>()
  let hasUnassigned = false

  ordersList.value
    .filter((order) => !order.archived)
    .forEach((order) => {
      if (order.assigneeTelegramId === null) {
        if (!hasUnassigned) {
          hasUnassigned = true
        }
        return
      }

      if (map.has(order.assigneeTelegramId)) {
        return
      }

      map.set(order.assigneeTelegramId, {
        id: order.assigneeTelegramId,
        name: order.assigneeTelegramName?.trim() || 'Без имени',
        avatarUrl: order.assigneeTelegramAvatarUrl,
      })
    })

  const options = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ru-RU'))

  if (hasUnassigned) {
    options.push({ id: UNASSIGNED_ASSIGNEE_ID, name: 'Без исполнителя', avatarUrl: null })
  }

  return options
})

const ordersFilteredByProject = computed(() => {
  if (filterProjectIds.value.length > 0) {
    const projectIdSet = new Set(filterProjectIds.value)
    return ordersList.value.filter((order) =>
      projectIdSet.has(order.projectId ?? NO_PROJECT_ID),
    )
  }

  return ordersList.value
})

const ordersFilteredByAssignee = computed(() => {
  if (appliedAssigneeIds.value.length === 0) {
    return ordersFilteredByProject.value
  }

  const assigneeIdSet = new Set(appliedAssigneeIds.value)
  return ordersFilteredByProject.value.filter((order) => {
    if (order.assigneeTelegramId === null) {
      return assigneeIdSet.has(UNASSIGNED_ASSIGNEE_ID)
    }

    return assigneeIdSet.has(order.assigneeTelegramId)
  })
})

const project = computed(() => {
  if (!activeProjectId.value) {
    return null
  }
  return getProjectById(activeProjectId.value) ?? null
})

const projectOrders = computed<ProjectOrder[]>(() =>
  ordersFilteredByAssignee.value
    .filter((order) => !order.archived)
    .map((order) => convertOrderToProjectOrder(order, {
      projectTitle: order.projectId ? getProjectById(order.projectId)?.title ?? null : null,
    })),
)

const activeStatus = ref<OrderStatusFilter>('in_progress')

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

watch(filterProjectIds, () => {
  if (activeStatus.value !== 'all') {
    activeStatus.value = 'all'
  }
  if (selectedMonthId.value !== '') {
    selectedMonthId.value = ''
  }
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
  if (!activeProjectId.value) {
    return
  }

  router.push({
    path: `/projects/${activeProjectId.value}/edit`,
    query: {
      from: route.fullPath,
      fallback: `/orders?projectId=${activeProjectId.value}`,
    },
  })
}

const handleAddOrder = () => {
  router.push({
    path: '/orders/new',
    query: {
      ...(activeProjectId.value ? { projectId: activeProjectId.value } : {}),
      from: route.fullPath,
    },
  })
}

const openFilterModal = () => {
  isFilterModalOpen.value = true
}

const closeFilterModal = () => {
  isFilterModalOpen.value = false
}

const removeProjectIdQueryParam = async () => {
  if (!projectId.value) {
    return
  }

  const updatedQuery = { ...route.query } as Record<string, string | string[]>
  delete updatedQuery.projectId
  await router.replace({ query: updatedQuery })
}

const handleApplyFilters = async ({
  projectIds,
  assigneeIds,
}: {
  projectIds: string[]
  assigneeIds: number[]
}) => {
  appliedProjectIds.value = projectIds
  appliedAssigneeIds.value = assigneeIds
  isFilterModalOpen.value = false

  const shouldRemoveProjectQuery =
    projectIds.length === 0 || projectIds.some((id) => id !== projectId.value)

  if (projectId.value && shouldRemoveProjectQuery) {
    await removeProjectIdQueryParam()
  }
}

const handleClearFilters = async () => {
  appliedProjectIds.value = []
  appliedAssigneeIds.value = []
  isFilterModalOpen.value = false

  if (projectId.value) {
    await removeProjectIdQueryParam()
  }
}

const canCreateOrder = computed(() => true)

onMounted(async () => {
  applyInitialLoadingState()

  try {
    await Promise.all([
      fetchProjects(),
      fetchOrders(projectId.value || undefined),
    ])

    if (activeProjectId.value && !project.value) {
      await fetchProject(activeProjectId.value)
    }
  } catch (error) {
    console.error('Failed to load orders data:', error)
  } finally {
    isInitialLoading.value = false
  }
})

watch(projectId, async (nextId, previousId) => {
  if (nextId === previousId) {
    return
  }

  if (nextId) {
    appliedProjectIds.value = []
    appliedAssigneeIds.value = []
    isInitialLoading.value = false
  } else {
    applyInitialLoadingState()
  }

  try {
    await fetchOrders(nextId || undefined)

    if (nextId && nextId !== NO_PROJECT_ID && !getProjectById(nextId)) {
      await fetchProject(nextId)
    }
  } catch (error) {
    console.error('Failed to reload orders data:', error)
  } finally {
    if (!nextId) {
      isInitialLoading.value = false
    }
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

    <div
      v-if="canCreateOrder"
      class="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-[42px] border border-black/5 bg-white/80 p-1.5 shadow-lg dark:border-white/10 dark:bg-[#1C2431]/80"
    >
      <button
        type="button"
        class="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[42px] bg-white text-primary shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-[#2A3242] dark:text-white"
        :aria-pressed="hasActiveFilters"
        aria-label="Открыть фильтры задач"
        @click="openFilterModal"
      >
        <span class="material-symbols-outlined !text-3xl">tune</span>
        <span
          v-if="hasActiveFilters"
          class="absolute right-3 top-3 block size-2 rounded-full border border-white bg-[#FF4D4F] shadow-sm dark:border-zinc-900"
          aria-hidden="true"
        ></span>
      </button>
      <button
        type="button"
        class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[42px] bg-primary text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Добавить задачу"
        @click="handleAddOrder"
      >
        <span class="material-symbols-outlined !text-3xl">add</span>
      </button>
    </div>

    <OrderFilterModal
      :is-open="isFilterModalOpen"
      :project-options="projectFilterOptions"
      :assignee-options="assigneeFilterOptions"
      :initial-project-ids="filterProjectIds"
      :initial-assignee-ids="appliedAssigneeIds"
      :show-project-filters="!activeProjectId"
      @close="closeFilterModal"
      @apply="handleApplyFilters"
      @clear="handleClearFilters"
    />
  </div>
</template>
