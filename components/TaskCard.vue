<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectTask, TaskStatus } from '~/data/projects'

interface StatusMeta {
  label: string
  badgeBg: string
  badgeText: string
  dot: string
}

interface PriorityMeta {
  label: string
  icon: string
  textClass: string
  iconClass?: string
}

const STATUS_META: Record<TaskStatus, StatusMeta> = {
  in_progress: {
    label: 'В работе',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-500 dark:text-blue-400',
    dot: 'bg-blue-500 dark:bg-blue-400',
  },
  overdue: {
    label: 'Просрочено',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-500 dark:text-red-400',
    dot: 'bg-red-500 dark:bg-red-400',
  },
  review: {
    label: 'На проверку',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-500 dark:text-purple-400',
    dot: 'bg-purple-500 dark:bg-purple-400',
  },
  done: {
    label: 'Сделано',
    badgeBg: 'bg-green-500/20',
    badgeText: 'text-green-500 dark:text-green-400',
    dot: 'bg-green-500 dark:bg-green-400',
  },
}

const PRIORITY_META: Record<ProjectTask['priority'], PriorityMeta> = {
  high: {
    label: 'Высокий',
    icon: 'priority_high',
    textClass: 'text-amber-500',
  },
  medium: {
    label: 'Средний',
    icon: 'horizontal_rule',
    textClass: 'text-zinc-500 dark:text-zinc-300',
  },
  low: {
    label: 'Низкий',
    icon: 'signal_cellular_4_bar',
    textClass: 'text-green-500',
    iconClass: '-rotate-90',
  },
}

const props = defineProps<{
  task: ProjectTask
}>()

const statusMeta = computed(() => STATUS_META[props.task.status])
const priorityMeta = computed(() => PRIORITY_META[props.task.priority])
const isCompleted = computed(() => props.task.status === 'done')
const isOverdue = computed(() => props.task.status === 'overdue')

const dueLabel = computed(() => {
  if (isOverdue.value) {
    const days = props.task.overdueDays ?? 0
    if (days <= 0) {
      return 'Просрочено'
    }
    return `Просрочено: ${days} ${formatDays(days)}`
  }

  return `Срок: ${formatDate(props.task.dueDate)}`
})

const dueIcon = computed(() => (isOverdue.value ? 'error' : 'calendar_today'))

const dueTextClass = computed(() => {
  if (isOverdue.value) {
    return 'text-sm font-semibold text-red-500 dark:text-red-400'
  }
  return 'text-sm font-normal text-zinc-600 dark:text-zinc-400'
})

const containerClasses = computed(() => {
  return [
    'flex flex-col gap-4 rounded-xl p-4 transition-shadow',
    isCompleted.value
      ? 'bg-white/80 opacity-80 dark:bg-[#1C2431]/70'
      : 'bg-white dark:bg-[#1C2431]',
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

function formatDays(days: number) {
  const mod10 = days % 10
  const mod100 = days % 100

  if (mod10 === 1 && mod100 !== 11) {
    return 'день'
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'дня'
  }
  return 'дней'
}
</script>

<template>
  <article :class="containerClasses" class="shadow-sm hover:shadow-lg">
    <div class="flex flex-col gap-2">
      <p :class="titleClasses">
        {{ task.title }}
      </p>
      <div class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <img
          :src="task.assignee.avatarUrl"
          :alt="`Аватар ${task.assignee.name}`"
          class="h-6 w-6 rounded-full object-cover"
          loading="lazy"
        />
        <span>{{ task.assignee.name }}</span>
      </div>
      <div class="flex items-center gap-2" :class="isOverdue ? 'text-red-500 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400'">
        <span class="material-symbols-outlined text-base" :class="isOverdue ? 'text-red-500 dark:text-red-400' : ''">
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
      <div class="flex items-center gap-1" :class="priorityMeta.textClass">
        <span class="material-symbols-outlined !text-xl" :class="priorityMeta.iconClass">{{ priorityMeta.icon }}</span>
        <span class="text-sm font-medium">{{ priorityMeta.label }}</span>
      </div>
    </div>
  </article>
</template>
