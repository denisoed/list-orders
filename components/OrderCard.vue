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
    return `Открыть проверку задачи «${props.order.title}»`
  }
  return `Открыть детали задачи «${props.order.title}»`
})

const dueLabel = computed(() => {
  if (!props.order.dueDate) {
    return ''
  }

  return `Срок: ${formatDateAndTime(props.order.dueDate, props.order.dueTime)}`
})

const hasDueDate = computed(() => Boolean(props.order.dueDate))

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

// Format date and time in format "d month yyyy в hh:mm"
function formatDateAndTime(date: string, time?: string | null): string {
  try {
    const dateObj = new Date(date)
    const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    
    if (time) {
      // Parse time string (could be HH:mm or HH:mm:ss)
      const timeParts = time.split(':')
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10)
        const minutes = parseInt(timeParts[1], 10)
        if (!isNaN(hours) && !isNaN(minutes)) {
          return `${dateFormatter.format(dateObj)} в ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
        }
      }
    }
    
    // If no time or time parsing failed, check if date has time component
    const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const timeStr = timeFormatter.format(dateObj)
    // If time is 00:00, don't show it
    if (timeStr === '00:00') {
      return dateFormatter.format(dateObj)
    } else {
      return `${dateFormatter.format(dateObj)} в ${timeStr}`
    }
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
      <div v-if="hasDueDate" class="flex items-center gap-2">
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
