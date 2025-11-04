<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from '#imports'
import { useOrders } from '~/composables/useOrders'
import { useProjects } from '~/composables/useProjects'
import { convertOrderToOrderDetail } from '~/data/orders'
import type { Order } from '~/data/orders'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => String(route.params.id ?? ''))

const { fetchOrders, orders, isLoading } = useOrders()
const { getProjectById } = useProjects()

const project = computed(() => getProjectById(projectId.value))
const projectOrders = computed(() => {
  return orders.value.filter((order) => order.projectId === projectId.value)
})

const sortedOrders = computed(() => {
  return [...projectOrders.value].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA // Most recent first
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

const handleAddOrder = () => {
  router.push({
    path: `/projects/${projectId.value}/orders/new`,
    query: {
      from: route.fullPath,
    },
  })
}

const handleOrderClick = (orderId: string) => {
  router.push(`/orders/${orderId}`)
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch (error) {
    return dateString
  }
}

const formatAmount = (amount: number | null) => {
  if (amount === null || amount === undefined) {
    return '—'
  }
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    new: 'Новый',
    pending: 'Ожидает',
    in_progress: 'В работе',
    review: 'Проверяется',
    done: 'Сделано',
    cancelled: 'Отменен',
  }
  return statusMap[status] || status
}

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-300',
    pending: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-300',
    in_progress: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300',
    review: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300',
    done: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    cancelled: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300',
  }
  return colorMap[status] || 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300'
}

useHead({
  title: project.value ? `Заказы • ${project.value.title}` : 'Заказы',
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
    <header
      class="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-background-light/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        aria-label="Вернуться назад"
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col items-start text-left">
        <h1 class="line-clamp-2 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          {{ project?.title ?? 'Заказы' }}
        </h1>
        <p v-if="project" class="text-sm text-gray-500 dark:text-[#9da6b9]">
          Заказы
        </p>
      </div>
    </header>

    <main class="flex-1 px-4 pb-24">
      <section v-if="project" class="space-y-4 py-4">
        <div v-if="isLoading" class="flex items-center justify-center py-10">
          <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>

        <div v-else-if="sortedOrders.length > 0" class="flex flex-col gap-3">
          <article
            v-for="order in sortedOrders"
            :key="order.id"
            class="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm transition-shadow hover:shadow-lg focus-visible:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/10 dark:bg-[#1C2431]/80"
            @click="handleOrderClick(order.id)"
          >
            <div class="flex items-start gap-3">
              <div class="flex flex-1 flex-col gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-500 dark:text-[#9da6b9]">{{ order.code }}</span>
                  <span
                    class="inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium"
                    :class="getStatusColor(order.status)"
                  >
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>
                <h2 class="text-base font-semibold leading-tight text-zinc-900 dark:text-white">
                  {{ order.title }}
                </h2>
                <p v-if="order.summary" class="text-sm leading-6 text-gray-500 dark:text-[#9da6b9]">
                  {{ order.summary }}
                </p>
              </div>
              <span
                class="material-symbols-outlined shrink-0 text-gray-400 transition group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400"
              >
                chevron_right
              </span>
            </div>

            <div class="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-primary">person</span>
                <span>{{ order.clientName }}</span>
              </div>
              <div v-if="order.totalAmount" class="flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-primary">payments</span>
                <span>{{ formatAmount(order.totalAmount) }}</span>
              </div>
              <div v-if="order.dueDate" class="flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-primary">calendar_today</span>
                <span>{{ formatDate(order.dueDate) }}</span>
              </div>
            </div>
          </article>
        </div>

        <div
          v-else
          class="mx-auto mt-20 flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600 dark:border-gray-700 dark:bg-[#1C2431] dark:text-[#9da6b9]"
        >
          <span class="material-symbols-outlined text-5xl text-primary">shopping_cart</span>
          <div class="space-y-2">
            <p class="text-lg font-semibold text-black dark:text-white">Заказов пока нет</p>
            <p class="max-w-sm text-sm leading-6 text-gray-500 dark:text-[#9da6b9]">
              Создайте первый заказ для этого проекта, чтобы начать работу.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="handleAddOrder"
          >
            <span class="material-symbols-outlined !text-base">add</span>
            Создать заказ
          </button>
        </div>
      </section>

      <section v-else class="py-10">
        <div
          class="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600 dark:border-gray-700 dark:bg-[#1C2431] dark:text-[#9da6b9]"
        >
          <span class="material-symbols-outlined text-5xl text-primary">search_off</span>
          <div class="space-y-2">
            <p class="text-lg font-semibold text-black dark:text-white">Проект не найден</p>
            <p class="max-w-sm text-sm leading-6 text-gray-500 dark:text-[#9da6b9]">
              Проект недоступен или был удалён. Вернитесь к списку проектов, чтобы выбрать другой.
            </p>
          </div>
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
      aria-label="Добавить заказ"
      @click="handleAddOrder"
    >
      <span class="material-symbols-outlined !text-3xl">add</span>
    </button>
  </div>
</template>
