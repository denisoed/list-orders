<script setup lang="ts">
interface Props {
  title: string
}

withDefaults(defineProps<Props>(), {
  title: 'Мои проекты',
})

const emit = defineEmits<{
  (event: 'search'): void
}>()

const handleSearchClick = () => {
  emit('search')
}
</script>

<template>
  <header
    class="sticky top-0 z-10 flex items-center justify-between bg-background-light/80 p-4 pb-2 backdrop-blur-sm dark:bg-background-dark/80"
  >
    <h1 class="flex-1 text-lg font-bold leading-tight tracking-[-0.015em] text-black dark:text-white">
      {{ title }}
    </h1>
    <div class="flex items-center">
      <button
        type="button"
        class="flex size-12 items-center justify-center text-black transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-white"
        aria-label="Поиск по проектам"
        @click="handleSearchClick"
      >
        <span class="material-symbols-outlined">search</span>
      </button>
    </div>
  </header>
</template>
