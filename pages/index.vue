<script setup lang="ts">
import { useAllProjects } from '~/composables/useProjectOrders'
import { useProjects } from '~/composables/useProjects'
import { useOrders } from '~/composables/useOrders'
import type { Project } from '~/data/projects'
import type { Order } from '~/data/orders'
import { useUserStore } from '~/stores/user'
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

const visibleProjects = computed<Project[]>(() => {
  if (route.query.empty === 'true') {
    return []
  }
  // Filter out archived projects (additional client-side filtering for safety)
  return projects.value.filter((project) => !project.archived)
})

const hasProjects = computed(() => visibleProjects.value.length > 0)

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
  // Count orders for this project from the database
  const currentOrders = ordersList.value
  const projectOrders = currentOrders.filter((order: Order) => order.projectId === project.id)
  const orderCount = projectOrders.length
  
  // Use project.total if available and greater than actual count
  if (typeof project.total === 'number' && project.total >= orderCount) {
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
    class="relative flex min-h-screen w-full flex-col bg-background-light text-black dark:bg-background-dark dark:text-white"
    :style="{ backgroundColor: 'var(--telegram-background-color, #f6f6f8)' }"
  >
    <ProjectsPageHeader
      title="Мои проекты"
      :profile-url="userProfile.profileUrl"
      :avatar-url="userProfile.avatarUrl"
      :user-name="userProfile.name"
    />

    <main class="flex-1 px-4 pt-4">
      <DataLoadingIndicator v-if="isLoading" message="Загрузка проектов..." />

      <div v-else-if="hasProjects" class="flex flex-col gap-3 pb-24">
        <NuxtLink
          v-for="project in visibleProjects"
          :key="project.id"
          :to="`/projects/${project.id}/orders`"
          class="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm transition-shadow hover:shadow-lg focus-visible:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/10 dark:bg-[#1C2431]/80"
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
