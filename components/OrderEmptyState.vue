<script setup lang="ts">
interface Props {
  icon?: string
  title?: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'task_alt',
  title: 'Здесь пока нет задач',
  description: 'Нажмите +, чтобы создать новую.',
})
</script>

<template>
  <section
    class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
  >
    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      <span class="material-symbols-outlined text-4xl">{{ icon }}</span>
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-base font-bold text-zinc-900 dark:text-white">{{ title }}</p>
      <p class="text-sm">{{ description }}</p>
    </div>
  </section>
</template>
