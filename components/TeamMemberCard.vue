<script setup lang="ts">
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
    required: true,
  },
  actionAriaLabel: {
    type: String,
    default: 'Дополнительные действия участника',
  },
})
</script>

<template>
  <article
    class="flex items-center justify-between gap-4 rounded-lg bg-white p-3 text-zinc-900 transition-colors hover:bg-black/5 dark:bg-[#1C2431] dark:text-white dark:hover:bg-white/5"
  >
    <div class="flex items-center gap-4">
      <img :src="props.avatarUrl" :alt="`Аватар ${props.name}`" class="size-12 rounded-full object-cover" loading="lazy" />
      <div class="flex flex-col gap-0.5">
        <p class="text-base font-medium leading-tight text-zinc-900 dark:text-white">{{ props.name }}</p>
        <p class="text-sm leading-normal text-zinc-500 dark:text-[#9da6b9]">{{ props.role }}</p>
      </div>
    </div>
    <div class="shrink-0">
      <button
        type="button"
        class="flex size-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-primary/20 dark:text-white/60"
        :aria-label="props.actionAriaLabel"
      >
        <span class="material-symbols-outlined text-2xl">more_vert</span>
      </button>
    </div>
  </article>
</template>
