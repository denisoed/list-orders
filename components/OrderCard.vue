<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectOrder, OrderStatus } from '~/data/projects'

interface StatusMeta {
  label: string
  badgeBg: string
  badgeText: string
  dot: string
  cardClass: string
}

const STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: 'Ожидает',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500 dark:bg-red-400',
    cardClass: 'bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/25',
  },
  in_progress: {
    label: 'В работе',
    badgeBg: 'bg-yellow-500/20',
    badgeText: 'text-yellow-600 dark:text-yellow-400',
    dot: 'bg-yellow-500 dark:bg-yellow-400',
    cardClass: 'bg-yellow-50 border border-yellow-100 dark:bg-yellow-500/10 dark:border-yellow-500/25',
  },
  review: {
    label: 'Проверяется',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-500 dark:text-blue-400',
    dot: 'bg-blue-500 dark:bg-blue-400',
    cardClass: 'bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/25',
  },
  done: {
    label: 'Сделано',
    badgeBg: 'bg-green-500/20',
    badgeText: 'text-green-500 dark:text-green-400',
    dot: 'bg-green-500 dark:bg-green-400',
    cardClass:
      'bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/25',
  },
}

const props = defineProps<{
  order: ProjectOrder
}>()

const statusMeta = computed(() => STATUS_META[props.order.status])
const isCompleted = computed(() => props.order.status === 'done')

const orderDetailsRoute = computed(() => `/orders/${props.order.id}`)
const orderAriaLabel = computed(() => `Открыть детали заказа «${props.order.title}»`)

const dueLabel = computed(() => {
  if (!props.order.dueDate) {
    return 'Срок не указан'
  }

  if (props.order.dueTime) {
    return `Срок: ${formatDate(props.order.dueDate)} в ${props.order.dueTime}`
  }

  return `Срок: ${formatDate(props.order.dueDate)}`
})

const dueIcon = computed(() => (props.order.status === 'pending' ? 'schedule' : 'calendar_today'))

const dueIconClass = computed(() =>
  isCompleted.value ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400',
)

const dueTextClass = computed(() => {
  if (isCompleted.value) {
    return 'text-sm font-normal text-emerald-600 dark:text-emerald-400'
  }

  return 'text-sm font-normal text-zinc-600 dark:text-zinc-400'
})

const containerClasses = computed(() => {
  return [
    'block flex flex-col gap-4 rounded-xl p-4 shadow-sm transition-shadow hover:shadow-lg focus-visible:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    statusMeta.value.cardClass,
    isCompleted.value ? 'opacity-95' : '',
  ]
})

const titleClasses = computed(() => {
  return [
    'text-base font-bold leading-tight text-zinc-900 dark:text-white',
    isCompleted.value ? 'line-through' : '',
  ]
})

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU').format(new Date(date))
  } catch (error) {
    return date
  }
}
</script>

<template>
  <NuxtLink :to="orderDetailsRoute" :aria-label="orderAriaLabel" :class="containerClasses">
    <div class="flex flex-col gap-2">
      <p :class="titleClasses">
        {{ order.title }}
      </p>
      <div class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <img
          :src="order.assignee.avatarUrl"
          :alt="`Аватар ${order.assignee.name}`"
          class="h-6 w-6 rounded-full object-cover"
          loading="lazy"
        />
        <span>{{ order.assignee.name }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-base" :class="dueIconClass">
          {{ dueIcon }}
        </span>
        <p :class="dueTextClass">
          {{ dueLabel }}
        </p>
      </div>
    </div>
    <div class="flex items-center justify-between">
      <div
        class="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
        :class="`${statusMeta.badgeBg} ${statusMeta.badgeText}`"
      >
        <span class="h-2 w-2 rounded-full" :class="statusMeta.dot"></span>
        <span>{{ statusMeta.label }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
