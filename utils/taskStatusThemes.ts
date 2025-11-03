import type { TaskStatusFilter } from '~/composables/useProjectTasks'

export const STATUS_CHIP_THEMES: Record<TaskStatusFilter, { inactive: string; active: string }> = {
  all: {
    inactive: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white',
    active: 'bg-primary text-white',
  },
  pending: {
    inactive: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-100',
    active: 'bg-red-200 text-red-900 dark:bg-red-500/30 dark:text-red-50',
  },
  in_progress: {
    inactive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-100',
    active: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-50',
  },
  review: {
    inactive: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-100',
    active: 'bg-blue-200 text-blue-900 dark:bg-blue-500/30 dark:text-blue-50',
  },
  done: {
    inactive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100',
    active: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-50',
  },
}

