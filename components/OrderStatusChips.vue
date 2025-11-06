<script setup lang="ts">
import { STATUS_CHIP_THEMES, type OrderStatusFilter } from '~/utils/orderStatuses'

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

const getChipClasses = (value: string, isActive: boolean) => {
  const theme = STATUS_CHIP_THEMES[value as OrderStatusFilter] ?? STATUS_CHIP_THEMES.all
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
    class="flex gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden z-[1] relative"
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
