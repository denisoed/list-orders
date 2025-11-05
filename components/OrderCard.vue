<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectOrder, OrderStatus } from '~/data/projects'
import { getOrderStatusMeta } from '~/utils/orderStatuses'

const props = defineProps<{
  order: ProjectOrder
}>()

const statusMeta = computed(() => getOrderStatusMeta(props.order.status))
const isCompleted = computed(() => props.order.status === 'done')

const orderDetailsRoute = computed(() => {
  // If order is in review status, redirect to review page
  if (props.order.status === 'review') {
    return `/orders/${props.order.id}/review`
  }
  return `/orders/${props.order.id}`
})
const orderAriaLabel = computed(() => {
  if (props.order.status === 'review') {
    return `Открыть проверку заказа «${props.order.title}»`
  }
  return `Открыть детали заказа «${props.order.title}»`
})

const dueLabel = computed(() => {
  if (!props.order.dueDate) {
    return 'Срок не указан'
  }

  if (props.order.dueTime) {
    return `Срок: ${formatDate(props.order.dueDate)} в ${formatTime(props.order.dueTime)}`
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

function formatTime(time: string) {
  try {
    // If time is already in HH:mm format, return as is
    if (/^\d{2}:\d{2}$/.test(time)) {
      return time
    }
    // If time is in HH:mm:ss format, remove seconds
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return time.substring(0, 5)
    }
    // Try to parse as Date and format
    const date = new Date(`2000-01-01T${time}`)
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }
    return time
  } catch (error) {
    return time
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
