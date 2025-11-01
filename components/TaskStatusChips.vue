<script setup lang="ts">
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
      class="flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :class="
        option.value === props.modelValue
          ? 'bg-primary text-white'
          : 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white'
      "
      @click="handleSelect(option.value)"
    >
      <span>{{ option.label }}</span>
      <span v-if="option.count !== undefined" class="text-xs font-semibold opacity-70">{{ option.count }}</span>
    </button>
  </div>
</template>
