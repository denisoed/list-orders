<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from '#imports'
import TaskCard from '~/components/TaskCard.vue'
import TaskEmptyState from '~/components/TaskEmptyState.vue'
import TaskPageHeader from '~/components/TaskPageHeader.vue'
import TaskStatusChips from '~/components/TaskStatusChips.vue'
import { TASK_STATUS_FILTERS, useProjectTasks, type TaskStatusFilter } from '~/composables/useProjectTasks'
import { useProjects } from '~/composables/useProjects'
import { useOrders } from '~/composables/useOrders'
import type { Order } from '~/data/orders'
import type { ProjectTask, TaskStatus } from '~/data/projects'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => String(route.params.id ?? ''))

const { project, activeStatus, setActiveStatus } = useProjectTasks(projectId)
const { fetchProject } = useProjects()
const { fetchOrders, getOrdersByProjectId } = useOrders()

// Convert Order to ProjectTask format
const convertOrderToTask = (order: Order): ProjectTask => {
  // Map order status to task status
  const statusMap: Record<string, TaskStatus> = {
    new: 'pending',
    pending: 'pending',
    in_progress: 'in_progress',
    review: 'review',
    done: 'done',
    cancelled: 'pending', // cancelled orders treated as pending
  }
  
  const taskStatus: TaskStatus = statusMap[order.status] || 'pending'
  
  // Format due date from ISO string to YYYY-MM-DD format
  let dueDate = new Date().toISOString().slice(0, 10)
  if (order.dueDate) {
    try {
      const date = new Date(order.dueDate)
      dueDate = date.toISOString().slice(0, 10)
    } catch (error) {
      console.error('Error parsing due date:', error)
    }
  }
  
  // Extract time from dueDate if available
  let dueTime: string | undefined
  if (order.dueDate) {
    try {
      const date = new Date(order.dueDate)
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      dueTime = `${hours}:${minutes}`
    } catch (error) {
      // Ignore time parsing errors
    }
  }
  
  return {
    id: order.id,
    title: order.title,
    assignee: {
      name: 'Не назначен',
      avatarUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23282e39%22/%3E%3Cpath d=%22M32 34c6.075 0 11-4.925 11-11S38.075 12 32 12s-11 4.925-11 11 4.925 11 11 11Zm0 4c-7.732 0-21 3.882-21 11.5V52a4 4 0 0 0 4 4h34a4 4 0 0 0 4-4v-2.5C53 41.882 39.732 38 32 38Z%22 fill=%22%239da6b9%22/%3E%3C/svg%3E',
    },
    status: taskStatus,
    dueDate,
    dueTime,
    description: order.description || undefined,
    clientName: order.clientName,
    clientPhone: order.clientPhone,
  }
}

// Get orders for current project and convert to tasks
const projectOrders = computed(() => getOrdersByProjectId(projectId.value))
const ordersAsTasks = computed(() => projectOrders.value.map(convertOrderToTask))

// All tasks come from orders (synchronized with database)
const allTasks = computed(() => {
  return ordersAsTasks.value || []
})

// Filter tasks based on status and search query
const filteredTasks = computed(() => {
  const tasks = allTasks.value
  const normalizedQuery = '' // No search query for now
  const normalizedQueryLower = normalizedQuery.trim().toLocaleLowerCase('ru-RU')
  
  return tasks.filter((task) => {
    const matchesStatus = activeStatus.value === 'all' || task.status === activeStatus.value
    const matchesQuery =
      normalizedQueryLower.length === 0 ||
      [task.title, task.assignee.name].some((value) => value.toLocaleLowerCase('ru-RU').includes(normalizedQueryLower))
    
    return matchesStatus && matchesQuery
  })
})

// Load orders on mount
onMounted(async () => {
  try {
    await fetchOrders(projectId.value)
  } catch (error) {
    console.error('Failed to load orders:', error)
  }
})

// Reload orders when project changes
watch(projectId, async () => {
  try {
    await fetchOrders(projectId.value)
  } catch (error) {
    console.error('Failed to load orders:', error)
  }
})

// Load project if not found in local state
watch(
  [projectId, project],
  async ([id, currentProject]) => {
    if (id && !currentProject) {
      try {
        await fetchProject(id)
      } catch (error) {
        console.error('Failed to load project:', error)
      }
    }
  },
  { immediate: true },
)

const statusOptions = computed(() =>
  TASK_STATUS_FILTERS.map((option) => ({
    ...option,
    count:
      option.value === 'all'
        ? allTasks.value.length
        : allTasks.value.filter((task) => task.status === option.value).length,
  })),
)

const hasTasks = computed(() => allTasks.value.length > 0)
const hasFilteredTasks = computed(() => filteredTasks.value.length > 0)

const monthNameFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long' })
const periodFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
const dayNumberFormatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit' })

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase('ru-RU') + value.slice(1)

const formatMonthLabel = (date: Date) => `${capitalize(monthNameFormatter.format(date))} ${date.getFullYear()}`

const formatMonthId = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const parseTaskDate = (value: string | undefined) => {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10))

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null
  }

  return new Date(year, month - 1, day)
}

const monthOptions = computed(() => {
  const monthMap = new Map<string, Date>()

  allTasks.value.forEach((task) => {
    const date = parseTaskDate(task.dueDate)
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
    selectedMonthId.value = currentOption ? currentOption.value : options[0].value
  },
  { immediate: true },
)

const selectedMonth = computed(() => monthOptions.value.find((option) => option.value === selectedMonthId.value) ?? null)
const selectedMonthIndex = computed(() => monthOptions.value.findIndex((option) => option.value === selectedMonthId.value))

const canGoToPreviousMonth = computed(() => selectedMonthIndex.value > 0)
const canGoToNextMonth = computed(
  () => selectedMonthIndex.value >= 0 && selectedMonthIndex.value < monthOptions.value.length - 1,
)

const handlePreviousMonth = () => {
  if (!canGoToPreviousMonth.value) {
    return
  }

  const previous = monthOptions.value[selectedMonthIndex.value - 1]
  if (previous) {
    selectedMonthId.value = previous.value
  }
}

const handleNextMonth = () => {
  if (!canGoToNextMonth.value) {
    return
  }

  const next = monthOptions.value[selectedMonthIndex.value + 1]
  if (next) {
    selectedMonthId.value = next.value
  }
}

const filteredTasksByMonth = computed(() => {
  if (!selectedMonthId.value) {
    return filteredTasks.value
  }

  return filteredTasks.value.filter((task) => {
    const date = parseTaskDate(task.dueDate)
    return date && formatMonthId(date) === selectedMonthId.value
  })
})

const groupedTasks = computed(() => {
  const groups = new Map<
    string,
    {
      date: Date
      tasks: typeof filteredTasksByMonth.value
    }
  >()

  filteredTasksByMonth.value.forEach((task) => {
    const date = parseTaskDate(task.dueDate)

    if (!date) {
      return
    }

    const key = formatDateKey(date)
    const entry = groups.get(key)

    if (entry) {
      entry.tasks.push(task)
    } else {
      groups.set(key, { date, tasks: [task] })
    }
  })

  return Array.from(groups.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((entry, index, array) => {
      const weekdayRaw = weekdayFormatter.format(entry.date).replace('.', '')

      return {
        key: formatDateKey(entry.date),
        tasks: entry.tasks,
        dayNumber: dayNumberFormatter.format(entry.date),
        weekday: weekdayRaw.toLocaleUpperCase('ru-RU'),
        fullDate: capitalize(periodFormatter.format(entry.date)),
        isLast: index === array.length - 1,
      }
    })
})

const hasTasksInSelectedMonth = computed(() => groupedTasks.value.length > 0)

const subtitle = computed(() => {
  if (!project.value) {
    return undefined
  }
  return ''
})

const pageTitle = computed(() => {
  if (!project.value) {
    return 'Задачи'
  }
  return `Задачи • ${project.value.title}`
})

const getReturnPath = () => {
  const fallbackPath = `/projects/${projectId.value}/tasks`
  const returnPath = typeof route.fullPath === 'string' && route.fullPath.length > 0 ? route.fullPath : fallbackPath

  return { fallbackPath, returnPath }
}

const handleAddTask = () => {
  const { returnPath } = getReturnPath()

  router.push({
    path: `/projects/${projectId.value}/tasks/new`,
    query: {
      from: returnPath,
    },
  })
}

const handleEditProject = () => {
  if (!project.value) {
    return
  }

  const { fallbackPath, returnPath } = getReturnPath()

  router.push({
    path: '/projects/new',
    query: {
      from: returnPath,
      edit: projectId.value,
      fallback: fallbackPath,
    },
  })
}

const handleStatusChange = (value: string) => {
  setActiveStatus(value as TaskStatusFilter)
}

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
    <TaskPageHeader
      :title="project?.title ?? 'Задачи'"
      :subtitle="subtitle"
      @back="$router.back()"
      @edit="handleEditProject"
    />

    <main class="flex-1 px-4 pb-24">
      <section v-if="project" class="space-y-4 py-4">
        <div
          class="rounded-3xl border border-black/5 bg-white/80 px-2 py-2 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[#1C2431]/70"
        >
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="flex size-12 items-center justify-center rounded-full bg-black/5 text-black transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                :disabled="!canGoToPreviousMonth"
                aria-label="Предыдущий месяц"
                @click="handlePreviousMonth"
              >
                <span class="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
              <div
                class="flex flex-1 items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-medium text-white shadow-inner dark:bg-white/10"
              >
                <span class="truncate">
                  {{ selectedMonth?.label ?? 'Месяц не выбран' }}
                </span>
              </div>
              <button
                type="button"
                class="flex size-12 items-center justify-center rounded-full bg-black/5 text-black transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                :disabled="!canGoToNextMonth"
                aria-label="Следующий месяц"
                @click="handleNextMonth"
              >
                <span class="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        <TaskStatusChips :model-value="activeStatus" :options="statusOptions" @update:model-value="handleStatusChange" />

        <div class="flex flex-col gap-4 pt-2">
          <template v-if="hasTasks">
            <template v-if="hasFilteredTasks">
              <template v-if="hasTasksInSelectedMonth">
                <div v-for="group in groupedTasks" :key="group.key" class="flex gap-4">
                  <div class="flex flex-col items-center">
                    <div
                      class="flex px-3 py-2 flex-col items-center justify-center rounded-xl bg-black text-white shadow-inner dark:bg-white/10"
                    >
                      <span class="text-[12px] font-semibold uppercase">{{ group.weekday }}</span>
                      <span class="text-[14px] font-bold leading-none">{{ group.dayNumber }}</span>
                    </div>
                    <div
                      v-if="!group.isLast"
                      class="mt-3 h-full w-px flex-1 bg-black/10 dark:bg-white/15"
                    ></div>
                  </div>
                  <div class="flex flex-1 flex-col gap-3">
                    <p class="text-sm font-medium text-gray-500 dark:text-[#9da6b9]">
                      {{ group.fullDate }}
                    </p>
                    <ul class="flex flex-col gap-3" role="list">
                      <li v-for="task in group.tasks" :key="task.id" role="listitem">
                        <TaskCard :task="task" />
                      </li>
                    </ul>
                  </div>
                </div>
              </template>
              <TaskEmptyState
                v-else
                icon="calendar_month"
                title="Нет заказов в выбранном месяце"
                description="Попробуйте переключить месяц или изменить фильтр статуса."
              />
            </template>
            <TaskEmptyState
              v-else
              icon="manage_search"
              title="Нет заказов по выбранным фильтрам"
              description="Измените статус или покажите все заказы."
            />
          </template>
          <TaskEmptyState v-else />
        </div>
      </section>

      <section v-else class="py-10">
        <TaskEmptyState
          icon="search_off"
          title="Проект не найден"
          description="Проект недоступен или был удалён. Вернитесь к списку проектов, чтобы выбрать другой."
        />
        <div class="mt-6 flex justify-center">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="$router.back()"
          >
            <span class="material-symbols-outlined !text-base">arrow_back</span>
            Вернуться назад
          </button>
        </div>
      </section>
    </main>

    <button
      type="button"
      class="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label="Добавить задачу"
      @click="handleAddTask"
    >
      <span class="material-symbols-outlined !text-3xl">add</span>
    </button>
  </div>
</template>
