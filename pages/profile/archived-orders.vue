<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHead, useRouter } from '#imports'
import { useOrders } from '~/composables/useOrders'
import type { Order } from '~/data/orders'
import { getOrderStatusLabel, mapDbStatusToOrderStatus } from '~/utils/orderStatuses'
import DataLoadingIndicator from '~/components/DataLoadingIndicator.vue'

const router = useRouter()
const {
  archivedOrders,
  fetchArchivedOrders,
  unarchiveOrder,
  isLoadingArchived,
  isUpdating,
} = useOrders()

const isUnarchiving = ref<string | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await fetchArchivedOrders()
  } catch (err) {
    console.error('Failed to load archived orders:', err)
    error.value = 'Не удалось загрузить заархивированные задачи'
  }
})

const hasOrders = computed(() => archivedOrders.value.length > 0)

const formatStatus = (order: Order) => {
  return getOrderStatusLabel(mapDbStatusToOrderStatus(order.status))
}

const formatDueDate = (order: Order) => {
  if (!order.dueDate) {
    return 'Срок не указан'
  }

  try {
    const date = new Date(order.dueDate)
    const dateLabel = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
    }).format(date)

    const timeLabel = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)

    return timeLabel === '00:00' ? dateLabel : `${dateLabel} в ${timeLabel}`
  } catch (err) {
    console.error('Failed to format due date:', err)
    return 'Срок не указан'
  }
}

const formatAssignee = (order: Order) => {
  return order.assigneeTelegramName || 'Не назначен'
}

const handleUnarchive = async (order: Order) => {
  if (isUnarchiving.value || isUpdating.value) {
    return
  }

  isUnarchiving.value = order.id
  error.value = null

  try {
    await unarchiveOrder(order.id)
  } catch (err) {
    console.error('Failed to unarchive order:', err)
    error.value = 'Не удалось разархивировать задачу'
  } finally {
    isUnarchiving.value = null
  }
}

useHead({
  title: 'Заархивированные задачи',
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
        @click="router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col text-left">
        <h1 class="line-clamp-1 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          Заархивированные задачи
        </h1>
        <p class="text-sm text-gray-500 dark:text-[#9da6b9]">Задачи, которые вы заархивировали</p>
      </div>

      <div class="flex w-12 shrink-0 items-center justify-end"></div>
    </header>

    <main class="flex-1 px-4 pt-4">
      <div v-if="error" class="mb-4 rounded-xl border border-red-300/50 bg-red-500/10 p-4 text-sm text-red-200">
        {{ error }}
      </div>

      <DataLoadingIndicator v-if="isLoadingArchived" message="Загрузка заархивированных задач..." />

      <div v-else-if="hasOrders" class="flex flex-col gap-3 pb-24">
        <div
          v-for="order in archivedOrders"
          :key="order.id"
          class="group flex flex-col gap-4 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm transition-shadow dark:border-white/10 dark:bg-[#1C2431]/80"
        >
          <div class="flex flex-col gap-1">
            <div class="flex items-start justify-between gap-3">
              <p class="text-base font-semibold leading-tight text-zinc-900 dark:text-white">
                {{ order.title || 'Без названия' }}
              </p>
              <span v-if="order.code" class="text-xs font-medium text-gray-500 dark:text-[#9da6b9]">
                #{{ order.code }}
              </span>
            </div>
            <p v-if="order.summary" class="text-sm leading-6 text-gray-500 dark:text-[#9da6b9]">
              {{ order.summary }}
            </p>
          </div>

          <div class="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-primary">flag</span>
              {{ formatStatus(order) }}
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-primary">event</span>
              {{ formatDueDate(order) }}
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-primary">person</span>
              {{ formatAssignee(order) }}
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isUnarchiving === order.id || isUpdating"
              @click="handleUnarchive(order)"
            >
              <span v-if="isUnarchiving === order.id" class="material-symbols-outlined text-base animate-spin">hourglass_empty</span>
              <span v-else class="material-symbols-outlined text-base">unarchive</span>
              {{ isUnarchiving === order.id ? 'Разархивирование…' : 'Разархивировать' }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-else
        class="mx-auto mt-20 flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600 dark:border-gray-700 dark:bg-[#1C2431] dark:text-[#9da6b9]"
      >
        <span class="material-symbols-outlined text-5xl text-primary">archive</span>
        <div class="space-y-2">
          <p class="text-lg font-semibold text-black dark:text-white">Нет заархивированных задач</p>
          <p class="max-w-sm text-sm leading-6 text-gray-500 dark:text-[#9da6b9]">
            Заархивированные задачи будут отображаться здесь. Вы можете архивировать задачи из их карточек.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
