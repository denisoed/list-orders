<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useAllProjects } from '~/composables/useProjectOrders'
import { useProjects } from '~/composables/useProjects'
import { useOrders } from '~/composables/useOrders'
import type { Project } from '~/data/projects'
import type { Order } from '~/data/orders'
import { useUserStore } from '~/stores/user'
import DataLoadingIndicator from '~/components/DataLoadingIndicator.vue'
import { mapDbStatusToOrderStatus } from '~/utils/orderStatuses'

const route = useRoute()
const projects = useAllProjects()
const router = useRouter()
const userStore = useUserStore()
const { fetchProjects, isLoading: isLoadingProjects } = useProjects()
const { fetchOrders, orders, isLoading: isLoadingOrders } = useOrders()

const isLoading = computed(() => isLoadingProjects.value || isLoadingOrders.value)

// Use computed to get orders array
const ordersList = computed<Order[]>(() => {
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

const visibleProjects = computed<Project[]>(() => {
  if (route.query.empty === 'true') {
    return []
  }
  // Filter out archived projects (additional client-side filtering for safety)
  return projects.value.filter((project) => !project.archived)
})

const hasProjects = computed(() => visibleProjects.value.length > 0)

interface TaskItem {
  id: string
  title: string
  project: string
  statusColor: string
}

interface TaskSection {
  id: string
  title: string
  tasks: TaskItem[]
}

const STATUS_COLOR_BY_STATUS = {
  pending: '#EF4444',
  in_progress: '#F59E0B',
  review: '#3B82F6',
  done: '#22C55E',
} as const

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getTaskItemsForDate = (targetDateKey: string) => {
  return ordersList.value
    .filter((order: Order) => {
      if (order.archived || !order.dueDate) {
        return false
      }

      const dueDate = new Date(order.dueDate)
      if (Number.isNaN(dueDate.getTime())) {
        return false
      }

      return formatDateKey(dueDate) === targetDateKey
    })
    .map((order) => {
      const normalizedStatus = mapDbStatusToOrderStatus(order.status)
      const projectTitle = projectTitleById.value.get(order.projectId) ?? 'Без проекта'

      return {
        id: order.id,
        title: order.title,
        project: projectTitle,
        statusColor: STATUS_COLOR_BY_STATUS[normalizedStatus] ?? '#3B82F6',
      }
    })
}

const todayTasks = computed<TaskItem[]>(() => {
  const today = new Date()
  return getTaskItemsForDate(formatDateKey(today))
})

const tomorrowTasks = computed<TaskItem[]>(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return getTaskItemsForDate(formatDateKey(tomorrow))
})

const projectTitleById = computed(() => {
  const map = new Map<string, string>()
  for (const project of projects.value) {
    map.set(project.id, project.title)
  }
  return map
})

const usedTaskIds = computed(() => {
  return new Set([
    ...todayTasks.value.map((task) => task.id),
    ...tomorrowTasks.value.map((task) => task.id),
  ])
})

const availableOtherOrders = computed(() =>
  ordersList.value.filter((order: Order) => !order.archived && !usedTaskIds.value.has(order.id)),
)

const otherTasks = computed<TaskItem[]>(() => {
  return availableOtherOrders.value.map((order) => {
    const normalizedStatus = mapDbStatusToOrderStatus(order.status)
    const projectTitle = projectTitleById.value.get(order.projectId) ?? 'Без проекта'

    return {
      id: order.id,
      title: order.title,
      project: projectTitle,
      statusColor: STATUS_COLOR_BY_STATUS[normalizedStatus] ?? '#3B82F6',
    }
  })
})

const taskSections = computed<TaskSection[]>(() => [
  {
    id: 'today',
    title: 'Сегодня',
    tasks: todayTasks.value,
  },
  {
    id: 'tomorrow',
    title: 'Завтра',
    tasks: tomorrowTasks.value,
  },
  {
    id: 'others',
    title: 'Остальные',
    tasks: otherTasks.value,
  },
])

const collapsibleSectionIds = new Set<TaskSection['id']>(['today', 'tomorrow'])

const expandedSections = reactive<Record<string, boolean>>({
  today: true,
  tomorrow: false,
})

const toggleSection = (sectionId: TaskSection['id']) => {
  if (!collapsibleSectionIds.has(sectionId)) {
    return
  }

  expandedSections[sectionId] = !expandedSections[sectionId]
}

const isSectionExpanded = (sectionId: TaskSection['id']) => {
  return collapsibleSectionIds.has(sectionId) ? expandedSections[sectionId] : true
}

const getSectionTaskCountLabel = (section: TaskSection) => {
  const count = section.tasks.length
  return `${count} ${declOfNum(count, ['задача', 'задачи', 'задач'])}`
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

const projectCardWidthClass = computed(() =>
  visibleProjects.value.length > 1 ? 'min-w-[70%]' : 'min-w-full',
)

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
  title: 'Задачи',
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
    class="relative flex min-h-screen w-full flex-col bg-background-light text-black dark:bg-background-dark dark:text-white"
    :style="{ backgroundColor: 'var(--telegram-background-color, #f6f6f8)' }"
  >
    <ProjectsPageHeader
      title="Задачи"
      :profile-url="userProfile.profileUrl"
      :avatar-url="userProfile.avatarUrl"
      :user-name="userProfile.name"
    />

    <main class="flex-1 px-4 pt-4">
      <DataLoadingIndicator v-if="isLoading" message="Загрузка…" />

      <div v-else class="flex flex-col gap-6 pb-24">
        <section v-for="section in taskSections" :key="section.id" class="rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm transition-shadow dark:border-white/10 dark:bg-[#1C2431]/80">
          <template v-if="collapsibleSectionIds.has(section.id)">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3"
              @click="toggleSection(section.id)"
            >
              <div class="flex items-center gap-2 text-left">
                <p class="text-base font-semibold leading-tight text-zinc-900 dark:text-white">{{ section.title }}</p>
                <span class="inline-flex items-center rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-gray-600 whitespace-nowrap dark:bg-white/10 dark:text-[#c7cedd]">
                  {{ getSectionTaskCountLabel(section) }}
                </span>
              </div>
              <span
                class="material-symbols-outlined shrink-0 text-gray-500"
                :class="isSectionExpanded(section.id) ? 'rotate-0' : 'rotate-180'"
              >
                expand_more
              </span>
            </button>
          </template>
          <template v-else>
            <NuxtLink to="/tasks" class="flex w-full items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-left">
                <p class="text-base font-semibold leading-tight text-zinc-900 dark:text-white">{{ section.title }}</p>
                <span class="inline-flex items-center rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-gray-600 whitespace-nowrap dark:bg-white/10 dark:text-[#c7cedd]">
                  {{ getSectionTaskCountLabel(section) }}
                </span>
              </div>
              <span class="material-symbols-outlined shrink-0 text-gray-400 transition dark:text-gray-600">
                chevron_right
              </span>
            </NuxtLink>
          </template>
          <div
            v-if="section.id !== 'others' && isSectionExpanded(section.id)"
            class="mt-4 flex flex-col gap-3"
          >
            <template v-if="section.tasks.length">
              <div
                v-for="task in section.tasks"
                :key="task.id"
                class="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2.5 text-sm text-gray-700 shadow-sm dark:bg-[#2A3242]/70 dark:text-[#c7cedd]"
              >
                <div class="flex items-center gap-3">
                  <span class="inline-flex size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: task.statusColor }" />
                  <span class="font-medium text-zinc-900 dark:text-white">{{ task.title }}</span>
                </div>
                <span class="text-xs font-medium text-gray-500 dark:text-[#9da6b9]">
                  {{ task.project }}
                </span>
              </div>
            </template>
            <p v-else class="text-sm text-gray-500 dark:text-[#9da6b9]">Задач пока нет</p>
          </div>
        </section>

        <section class="flex flex-col gap-3">
          <h2 class="px-1 text-base font-semibold leading-tight text-zinc-900 dark:text-white">Проекты</h2>

          <div
            v-if="hasProjects"
            class="flex gap-3 overflow-x-auto pb-2"
          >
            <NuxtLink
              v-for="project in visibleProjects"
              :key="project.id"
              :to="`/projects/${project.id}/orders`"
              class="group flex w-full flex-none cursor-pointer flex-col gap-4 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm transition-shadow hover:shadow-lg focus-visible:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/10 dark:bg-[#1C2431]/80"
              :class="projectCardWidthClass"
              :aria-label="`Перейти к задачам проекта «${project.title}»`"
            >
              <div class="flex items-start gap-3">
                <div class="flex items-start gap-2 flex-1" :class="{ 'items-center': !project.description }">
                  <div
                    class="flex size-12 shrink-0 items-center justify-center rounded-xl transition group-hover:opacity-80"
                    :style="project.color ? { backgroundColor: project.color + '20', color: project.color } : {}"
                    :class="!project.color && 'bg-black/5 text-black dark:bg-white/10 dark:text-white group-hover:bg-black/10 dark:group-hover:bg-white/15'"
                  >
                    <span class="material-symbols-outlined text-2xl">folder</span>
                  </div>
                  <div class="flex-1 space-y-1">
                    <p class="text-base font-semibold leading-tight text-zinc-900 dark:text-white">
                      {{ project.title }}
                    </p>
                    <p v-if="project.description" class="text-sm leading-6 text-gray-500 dark:text-[#9da6b9]">
                      {{ project.description }}
                    </p>
                  </div>
                </div>
                <span
                  class="material-symbols-outlined shrink-0 text-gray-400 transition group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400"
                >
                  chevron_right
                </span>
              </div>
              <div class="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-base text-primary">checklist</span>
                  {{ formatOrderCount(project) }}
                </div>
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-base text-primary">group</span>
                  {{ formatParticipantCount(project) }}
                </div>
              </div>
            </NuxtLink>
          </div>

          <div
            v-else
            class="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600 dark:border-gray-700 dark:bg-[#1C2431] dark:text-[#9da6b9]"
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
        </section>
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
