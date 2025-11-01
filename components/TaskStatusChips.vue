<script setup lang="ts">
import type { TaskStatusFilter } from '~/composables/useProjectTasks'

export interface StatusOption {
  value: string
  label: string
  count?: number
}

interface Props {
  modelValue: string
  options: StatusOption[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const STATUS_CHIP_THEMES: Record<TaskStatusFilter, { inactive: string; active: string }> = {
  all: {
    inactive: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white',
    active: 'bg-primary text-white',
  },
  pending: {
    inactive: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-100',
    active: 'bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-50',
  },
  in_progress: {
    inactive: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-100',
    active: 'bg-blue-200 text-blue-900 dark:bg-blue-500/30 dark:text-blue-50',
  },
  review: {
    inactive: 'bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-100',
    active: 'bg-purple-200 text-purple-900 dark:bg-purple-500/30 dark:text-purple-50',
  },
  done: {
    inactive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100',
    active: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-50',
  },
}

const getChipClasses = (value: string, isActive: boolean) => {
  const theme = STATUS_CHIP_THEMES[value as TaskStatusFilter] ?? STATUS_CHIP_THEMES.all
  return isActive ? theme.active : theme.inactive
}

const handleSelect = (value: string) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Фильтр задач по статусу"
    class="flex gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="option.value === props.modelValue"
      :class="[
        'flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        getChipClasses(option.value, option.value === props.modelValue),
      ]"
      @click="handleSelect(option.value)"
    >
      <span>{{ option.label }}</span>
      <span v-if="option.count !== undefined" class="text-xs font-semibold opacity-70">{{ option.count }}</span>
    </button>
  </div>
</template>
