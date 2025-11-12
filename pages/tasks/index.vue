<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useOrders } from '~/composables/useOrders'
import { useProjects } from '~/composables/useProjects'
import type { Order } from '~/data/orders'
import { useUserStore } from '~/stores/user'
import DataLoadingIndicator from '~/components/DataLoadingIndicator.vue'
import ProjectsPageHeader from '~/components/ProjectsPageHeader.vue'
import { mapDbStatusToOrderStatus } from '~/utils/orderStatuses'

const route = useRoute()
const userStore = useUserStore()
const { fetchOrders, orders, isLoading: isLoadingOrders } = useOrders()
const { fetchProjects, isLoading: isLoadingProjects, getProjectById } = useProjects()

const isLoading = computed(() => isLoadingOrders.value || isLoadingProjects.value)

const STATUS_COLOR_BY_STATUS = {
  pending: '#EF4444',
  in_progress: '#F59E0B',
  review: '#3B82F6',
  done: '#22C55E',
} as const

const ordersList = computed<Order[]>(() => {
  const value = orders.value
  return Array.isArray(value) ? value : []
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

const taskItems = computed(() =>
  ordersList.value
    .filter((order) => !order.archived)
    .map((order) => {
      const normalizedStatus = mapDbStatusToOrderStatus(order.status)
      const project = order.projectId ? getProjectById(order.projectId) : null
      return {
        id: order.id,
        title: order.title,
        project: project?.title ?? 'Без проекта',
        statusColor: STATUS_COLOR_BY_STATUS[normalizedStatus] ?? '#3B82F6',
      }
    }),
)

const totalTaskLabel = computed(() => {
  const count = taskItems.value.length
  return `${count} ${declOfNum(count, ['задача', 'задачи', 'задач'])}`
})

const hasTasks = computed(() => taskItems.value.length > 0)

onMounted(async () => {
  try {
    await Promise.all([
      fetchProjects(),
      fetchOrders(),
    ])
  } catch (error) {
    console.error('Failed to load tasks data:', error)
  }
})

const userProfile = computed(() => {
  const user = userStore.user
  const showEmptyAvatar = route.query.noAvatar === 'true'

  const userName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || undefined
    : undefined

  const avatarUrl = showEmptyAvatar ? null : (user?.photo_url ?? null)

  return {
    name: userName,
    profileUrl: '/profile/edit',
    avatarUrl,
  }
})

useHead({
  title: 'Все задачи',
  htmlAttrs: {
    lang: 'ru',
    class: 'dark',
  },
  bodyAttrs: {
    class: 'bg-background-light dark:bg-background-dark font-display',
    style: 'min-height: 100dvh;',
  },
})
</script>

<template>
  <div
    class="relative flex min-h-screen w-full flex-col bg-background-light text-black dark:bg-background-dark dark:text-white"
    :style="{ backgroundColor: 'var(--telegram-background-color, #f6f6f8)' }"
  >
    <ProjectsPageHeader
      title="Все задачи"
      :profile-url="userProfile.profileUrl"
      :avatar-url="userProfile.avatarUrl"
      :user-name="userProfile.name"
    />

    <main class="flex-1 px-4 pt-4">
      <DataLoadingIndicator v-if="isLoading" message="Загрузка…" />

      <div v-else class="flex flex-col gap-6 pb-24">
        <section class="rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm transition-shadow dark:border-white/10 dark:bg-[#1C2431]/80">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold leading-tight text-zinc-900 dark:text-white">Список задач</h2>
            <span class="inline-flex items-center rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-gray-600 whitespace-nowrap dark:bg-white/10 dark:text-[#c7cedd]">
              {{ totalTaskLabel }}
            </span>
          </div>

          <div v-if="hasTasks" class="mt-4 flex flex-col gap-3">
            <div
              v-for="task in taskItems"
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
          </div>
          <p v-else class="mt-4 text-sm text-gray-500 dark:text-[#9da6b9]">Задач пока нет</p>
        </section>
      </div>
    </main>
  </div>
</template>
