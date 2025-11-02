<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  icon?: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <section class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white/70 p-10 text-center text-gray-600 dark:border-white/20 dark:bg-white/5 dark:text-gray-300">
    <span class="material-symbols-outlined text-5xl text-primary">
      {{ props.icon || 'info' }}
    </span>
    <div class="space-y-2">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ props.title }}</h2>
      <p class="max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">{{ props.description }}</p>
    </div>
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="emit('retry')"
    >
      <span class="material-symbols-outlined text-base">refresh</span>
      Попробовать снова
    </button>
  </section>
</template>
