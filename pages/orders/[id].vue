<script setup lang="ts">
import { computed } from 'vue'
import { getOrderDetailMock } from '~/data/orders'
import type { OrderDetail, OrderStatusTone } from '~/data/orders'

const route = useRoute()
const router = useRouter()

const orderId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] ?? '' : raw?.toString() ?? ''
})

const order = computed<OrderDetail>(() => getOrderDetailMock(orderId.value))

const quickInfoItems = computed(() => [
  {
    id: 'due-date',
    icon: 'calendar_today',
    label: 'Срок выполнения',
    value: order.value.dueDateLabel,
  },
  {
    id: 'project',
    icon: 'folder',
    label: 'Проект',
    value: order.value.projectName,
  },
])

const statusToneClass = (tone: OrderStatusTone) => {
  const toneClasses: Record<OrderStatusTone, string> = {
    info: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-300',
    warning: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300',
    danger: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300',
    success: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
  }

  return toneClasses[tone]
}

const primaryStatusChip = computed(() => order.value.statusChips[0] ?? null)

const baseIconContainerClass =
  'flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-700 dark:bg-[#282e39] dark:text-white'

const quickInfoCardClass = (itemId: string) =>
  [
    'flex items-center gap-4 rounded-2xl p-4 shadow-sm',
    itemId === 'due-date'
      ? 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-100'
      : 'bg-white text-black dark:bg-[#1C2431] dark:text-white',
  ]

const quickInfoLabelClass = (itemId: string) =>
  itemId === 'due-date'
    ? 'text-sm font-medium text-red-500 dark:text-red-200'
    : 'text-sm font-medium text-gray-500 dark:text-[#9da6b9]'

const quickInfoValueClass = (itemId: string) =>
  itemId === 'due-date'
    ? 'mt-1 text-base font-semibold leading-tight text-red-700 dark:text-red-50'
    : 'mt-1 text-base font-semibold leading-tight'

const quickInfoIconClass = (itemId: string) =>
  [
    baseIconContainerClass,
    itemId === 'due-date'
      ? 'bg-red-500 text-white dark:bg-red-400 dark:text-white'
      : '',
  ]

const examplesCountLabel = computed(() => {
  const count = order.value.attachments.length

  if (count === 0) {
    return '0 примеров'
  }

  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} пример`
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} примера`
  }

  return `${count} примеров`
})

const handleBack = () => {
  router.back()
}

const handleImageClick = (attachmentId: string) => {
  router.push({
    path: `/images/${attachmentId}`,
    query: {
      orderId: orderId.value,
      source: 'order-details',
    },
  })
}

useHead({
  title: order.value.title,
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
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
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
        @click="handleBack"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col items-start text-left">
        <h1 class="line-clamp-2 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          {{ order.title }}
        </h1>
      </div>
    </header>

    <main class="flex-1 space-y-6 px-4 py-6 pb-28 sm:pb-24">
      <section v-if="primaryStatusChip" class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <span
            class="inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm font-medium"
            :class="statusToneClass(primaryStatusChip.tone)"
          >
            <span class="material-symbols-outlined text-base">adjust</span>
            <span>{{ primaryStatusChip.label }}</span>
          </span>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
          <img
            :src="order.assignee.avatarUrl"
            :alt="`Аватар ответственного ${order.assignee.name}`"
            class="size-14 rounded-full object-cover"
          />
          <div class="flex flex-1 flex-col">
            <p class="text-sm font-medium text-gray-500 dark:text-[#9da6b9]">Ответственный</p>
            <p class="mt-1 text-base font-semibold leading-tight">{{ order.assignee.name }}</p>
            <p class="text-sm text-gray-500 dark:text-[#9da6b9]">{{ order.assignee.role }}</p>
          </div>
        </article>

        <article v-for="item in quickInfoItems" :key="item.id" :class="quickInfoCardClass(item.id)">
          <div :class="quickInfoIconClass(item.id)">
            <span class="material-symbols-outlined text-2xl">{{ item.icon }}</span>
          </div>
          <div class="flex flex-1 flex-col">
            <p :class="quickInfoLabelClass(item.id)">{{ item.label }}</p>
            <p :class="quickInfoValueClass(item.id)">{{ item.value }}</p>
          </div>
        </article>
      </section>

      <section class="space-y-3">
        <details class="group rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]" open>
          <summary
            class="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-black dark:text-white"
          >
            Описание
            <span class="material-symbols-outlined text-gray-400 transition group-open:rotate-180">expand_more</span>
          </summary>
          <div class="mt-3 text-sm leading-6 text-gray-600 dark:text-[#9da6b9]">
            <p>{{ order.description }}</p>
          </div>
        </details>
      </section>

      <section class="space-y-3">
        <details class="group rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
          <summary
            class="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-black dark:text-white"
          >
            Клиент
            <span class="material-symbols-outlined text-gray-400 transition group-open:rotate-180">expand_more</span>
          </summary>
          <div class="mt-3 space-y-3 text-sm leading-6 text-gray-600 dark:text-[#9da6b9]">
            <div>
              <p class="font-medium text-gray-700 dark:text-gray-300">Имя клиента</p>
              <p class="mt-1">{{ order.client.name }}</p>
            </div>
            <div>
              <p class="font-medium text-gray-700 dark:text-gray-300">Номер телефона</p>
              <p class="mt-1">{{ order.client.phone }}</p>
            </div>
            <div>
              <p class="font-medium text-gray-700 dark:text-gray-300">Оплата</p>
              <p class="mt-1">{{ order.client.payment }}</p>
            </div>
          </div>
        </details>
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold">Примеры</h2>
          <span class="text-sm text-gray-500 dark:text-[#9da6b9]">{{ examplesCountLabel }}</span>
        </div>
        <div v-if="order.attachments.length" class="flex items-center gap-4">
          <ul class="flex items-center gap-4 overflow-x-auto" role="list">
            <li
              v-for="attachment in order.attachments"
              :key="attachment.id"
              role="listitem"
              class="relative cursor-pointer transition-transform hover:scale-105 active:scale-95"
              @click="handleImageClick(attachment.id)"
            >
              <img
                :src="attachment.previewUrl"
                :alt="`Пример ${attachment.name}`"
                class="h-24 w-24 min-h-24 min-w-24 rounded-xl object-cover"
              />
            </li>
          </ul>
        </div>
        <p v-else class="rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-sm dark:bg-[#1C2431] dark:text-[#9da6b9]">
          Примеры пока отсутствуют.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-base font-semibold">История изменений</h2>
        <div class="space-y-4">
          <div v-for="entry in order.history" :key="entry.id" class="flex gap-4">
            <div class="flex flex-col items-center">
              <div :class="baseIconContainerClass">
                <span class="material-symbols-outlined">{{ entry.icon }}</span>
              </div>
              <div
                v-if="entry.id !== order.history[order.history.length - 1]?.id"
                class="mt-2 w-px flex-1 bg-gray-200 dark:bg-[#282e39]"
              ></div>
            </div>
            <div class="flex-1 rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
              <p class="text-sm leading-6 text-black dark:text-white">{{ entry.description }}</p>
              <p class="mt-2 text-xs uppercase tracking-wide text-gray-500 dark:text-[#9da6b9]">{{ entry.timestamp }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer
      class="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-background-light/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span>{{ order.actionLabel }}</span>
        <span class="material-symbols-outlined">check_circle</span>
      </button>
    </footer>
  </div>
</template>
