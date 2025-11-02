<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from '#imports'
import TaskCard from '~/components/TaskCard.vue'
import TaskEmptyState from '~/components/TaskEmptyState.vue'
import TaskPageHeader from '~/components/TaskPageHeader.vue'
import TaskStatusChips from '~/components/TaskStatusChips.vue'
import { TASK_STATUS_FILTERS, useProjectTasks, type TaskStatusFilter } from '~/composables/useProjectTasks'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => String(route.params.id ?? ''))

const { project, allTasks, filteredTasks, activeStatus, setActiveStatus } = useProjectTasks(projectId)

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

const selectedPeriodLabel = computed(() => {
  if (!hasTasksInSelectedMonth.value) {
    if (selectedMonth.value) {
      return `Нет заказов в ${selectedMonth.value.label.toLocaleLowerCase('ru-RU')}`
    }
    return 'Нет заказов'
  }

  const first = groupedTasks.value[0]
  const last = groupedTasks.value[groupedTasks.value.length - 1]

  if (!first || !last) {
    return ''
  }

  if (first.key === last.key) {
    return first.fullDate
  }

  return `${first.fullDate} — ${last.fullDate}`
})

const subtitle = computed(() => {
  if (!project.value) {
    return undefined
  }
  return `${project.value.completed} из ${project.value.total} задач выполнено`
})

const pageTitle = computed(() => {
  if (!project.value) {
    return 'Задачи'
  }
  return `Задачи • ${project.value.title}`
})

const projectsListRoute = '/'

const handleBack = () => {
  router.push(projectsListRoute)
}

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
      @back="handleBack"
      @edit="handleEditProject"
    />

    <main class="flex-1 px-4 pb-24">
      <section v-if="project" class="space-y-4 py-4">
        <div
          class="rounded-3xl border border-black/5 bg-white/80 px-5 py-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[#1C2431]/70"
        >
          <div class="flex flex-col gap-4">
            <p class="text-sm font-medium text-gray-500 dark:text-[#9da6b9]">
              {{ selectedPeriodLabel }}
            </p>
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
            @click="handleBack"
          >
            <span class="material-symbols-outlined !text-base">arrow_back</span>
            Вернуться на главную
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
