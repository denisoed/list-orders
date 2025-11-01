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
  pending: {
    label: 'Ожидает',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  in_progress: {
    label: 'В работе',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-500 dark:text-blue-400',
    dot: 'bg-blue-500 dark:bg-blue-400',
  },
  review: {
    label: 'Проверяется',
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

const dueLabel = computed(() => {
  if (!props.task.dueDate) {
    return 'Срок не указан'
  }

  return `Срок: ${formatDate(props.task.dueDate)}`
})

const dueIcon = computed(() => (props.task.status === 'pending' ? 'schedule' : 'calendar_today'))

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
      <div class="flex items-center gap-1" :class="priorityMeta.textClass">
        <span class="material-symbols-outlined !text-xl" :class="priorityMeta.iconClass">{{ priorityMeta.icon }}</span>
        <span class="text-sm font-medium">{{ priorityMeta.label }}</span>
      </div>
    </div>
  </article>
</template>
