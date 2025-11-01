<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Задачи',
  subtitle: undefined,
})

const emit = defineEmits<{
  (event: 'back'): void
  (event: 'edit'): void
}>()

const handleBack = () => {
  emit('back')
}

const handleEdit = () => {
  emit('edit')
}
</script>

<template>
  <header
    class="sticky top-0 z-20 flex flex-col bg-background-light/95 p-4 pb-2 backdrop-blur-sm transition-colors dark:bg-background-dark/80"
    :style="{ backgroundColor: 'var(--telegram-header-color, rgba(246, 246, 248, 0.95))' }"
  >
    <div class="flex items-center justify-between gap-3">
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/5"
        aria-label="Вернуться к списку проектов"
        @click="handleBack"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>
      <div class="flex flex-1 flex-col items-start text-left">
        <h1 class="text-lg font-bold leading-tight tracking-[-0.015em] text-zinc-900 dark:text-white">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {{ subtitle }}
        </p>
      </div>
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary transition hover:bg-primary/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-primary/30 dark:text-white"
        aria-label="Редактировать проект"
        @click="handleEdit"
      >
        <span class="material-symbols-outlined">settings</span>
      </button>
    </div>
  </header>
</template>
