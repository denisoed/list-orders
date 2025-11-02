<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectTask, TaskStatus } from '~/data/projects'

interface StatusMeta {
  label: string
  gradient: string
  accentDot: string
  badgeBg: string
  badgeText: string
}

const STATUS_META: Record<TaskStatus, StatusMeta> = {
  pending: {
    label: 'Ожидает',
    gradient: 'bg-gradient-to-r from-rose-500 via-rose-500 to-orange-400',
    accentDot: 'bg-white/80',
    badgeBg: 'bg-white/15',
    badgeText: 'text-white/80',
  },
  in_progress: {
    label: 'В работе',
    gradient: 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500',
    accentDot: 'bg-white/75',
    badgeBg: 'bg-white/15',
    badgeText: 'text-white/80',
  },
  review: {
    label: 'Проверяется',
    gradient: 'bg-gradient-to-r from-indigo-500 via-indigo-500 to-blue-500',
    accentDot: 'bg-white/80',
    badgeBg: 'bg-white/15',
    badgeText: 'text-white/80',
  },
  done: {
    label: 'Сделано',
    gradient: 'bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600',
    accentDot: 'bg-white/85',
    badgeBg: 'bg-white/15',
    badgeText: 'text-white/80',
  },
}

const props = defineProps<{
  task: ProjectTask
}>()

const statusMeta = computed(() => STATUS_META[props.task.status])

const orderDetailsRoute = computed(() => `/orders/${props.task.id}`)
const orderAriaLabel = computed(() => `Открыть детали заказа «${props.task.title}»`)

const parsedDueDate = computed(() => parseDueDate(props.task.dueDate))

const dueTimeLabel = computed(() => {
  if (!parsedDueDate.value) {
    return 'Срок не указан'
  }

  return `до ${formatDayMonth(parsedDueDate.value)}`
})

const dueIcon = computed(() => (props.task.status === 'pending' ? 'schedule' : 'calendar_today'))

const containerClasses = computed(() => [
  'group relative block overflow-hidden rounded-3xl p-4 text-white shadow-[0_28px_60px_-30px_rgba(0,0,0,0.8)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/80',
  statusMeta.value.gradient,
])

const statusBadgeClasses = computed(() => [
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
  statusMeta.value.badgeBg,
  statusMeta.value.badgeText,
])

const statusDotClass = computed(() => ['h-2 w-2 rounded-full', statusMeta.value.accentDot])

const dueBadgeClasses =
  'inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur'

function parseDueDate(value: ProjectTask['dueDate']) {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10))

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null
  }

  return new Date(year, month - 1, day)
}

const dayMonthFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
})

function formatDayMonth(date: Date) {
  try {
    return dayMonthFormatter.format(date)
  } catch (error) {
    return date.toISOString().slice(0, 10)
  }
}
</script>

<template>
  <NuxtLink :to="orderDetailsRoute" :aria-label="orderAriaLabel" :class="containerClasses">
    <div class="flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <div class="relative shrink-0">
          <img
            :src="task.assignee.avatarUrl"
            :alt="`Аватар ${task.assignee.name}`"
            class="size-12 rounded-full border-2 border-white/70 object-cover transition-transform duration-200 group-hover:scale-105 group-focus-visible:scale-105"
            loading="lazy"
          />
          <span class="absolute -bottom-1 -right-1 inline-flex size-5 items-center justify-center rounded-full bg-white/20 text-white">
            <span class="material-symbols-outlined text-[14px] leading-none">person</span>
          </span>
        </div>

        <div class="flex flex-1 flex-col gap-3">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex flex-col gap-2">
              <span :class="statusBadgeClasses">
                <span :class="statusDotClass"></span>
                <span>{{ statusMeta.label }}</span>
              </span>
              <p class="text-lg font-semibold leading-snug tracking-[-0.015em] text-white">
                {{ task.title }}
              </p>
            </div>
            <div :class="dueBadgeClasses">
              <span class="material-symbols-outlined text-base leading-none">{{ dueIcon }}</span>
              <span>{{ dueTimeLabel }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 text-sm text-white/85">
            <span class="material-symbols-outlined text-base leading-none text-white/70">account_circle</span>
            <span>{{ task.assignee.name }}</span>
          </div>

          <p v-if="task.description" class="text-sm leading-6 text-white/85">
            {{ task.description }}
          </p>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
