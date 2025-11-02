<script setup lang="ts">
const props = defineProps<{
  icon: string
  label: string
  value: string
  description?: string
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-4 rounded-xl bg-white/60 p-4 dark:bg-white/5">
    <div class="flex flex-1 items-center gap-4">
      <span class="flex size-11 items-center justify-center rounded-lg bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white">
        <span class="material-symbols-outlined text-2xl">{{ props.icon }}</span>
      </span>
      <div class="flex flex-col gap-1">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ props.label }}</p>
        <p class="text-base font-semibold text-gray-900 dark:text-white">{{ props.value }}</p>
        <p v-if="props.description" class="text-sm text-gray-500 dark:text-gray-400">{{ props.description }}</p>
      </div>
    </div>
  </div>
</template>
