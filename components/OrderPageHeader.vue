<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  isOwner?: boolean
  showFilterButton?: boolean
  isFilterActive?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Задачи',
  subtitle: undefined,
  isOwner: false,
  showFilterButton: false,
  isFilterActive: false,
})

const emit = defineEmits<{
  (event: 'back'): void
  (event: 'edit'): void
  (event: 'filter'): void
}>()

const handleBack = () => {
  emit('back')
}

const handleEdit = () => {
  emit('edit')
}

const handleFilter = () => {
  emit('filter')
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
      <div class="flex items-center justify-end gap-2">
        <button
          v-if="showFilterButton"
          type="button"
          class="relative flex size-12 shrink-0 items-center justify-center rounded-full border border-transparent bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
          :class="isFilterActive ? 'border-primary/40 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90' : ''"
          aria-label="Открыть фильтры"
          :aria-pressed="isFilterActive"
          @click="handleFilter"
        >
          <span class="material-symbols-outlined">tune</span>
          <span
            v-if="isFilterActive"
            class="absolute right-2 top-2 block size-2 rounded-full border border-white bg-[#FF4D4F] shadow-sm dark:border-zinc-900"
            aria-hidden="true"
          ></span>
        </button>
        <button
          v-if="isOwner"
          type="button"
          class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/5"
          aria-label="Редактировать проект"
          @click="handleEdit"
        >
          <span class="material-symbols-outlined">edit_square</span>
        </button>
        <div v-else-if="!showFilterButton" class="flex w-12 items-center justify-end"></div>
      </div>
    </div>
  </header>
</template>
