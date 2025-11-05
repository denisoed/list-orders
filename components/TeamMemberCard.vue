<script setup lang="ts">
import type { DropdownMenuItem } from '~/components/DropdownMenu.vue'
import DropdownMenu from '~/components/DropdownMenu.vue'

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
    default: null,
  },
  actionAriaLabel: {
    type: String,
    default: 'Дополнительные действия участника',
  },
  profileAriaLabel: {
    type: String,
    default: 'Открыть профиль участника',
  },
})

const emit = defineEmits<{
  (e: 'delete'): void
  (e: 'open-profile'): void
}>()

const menuItems: DropdownMenuItem[] = [
  {
    id: 'delete',
    label: 'Удалить',
    icon: 'delete',
    variant: 'danger',
    action: () => emit('delete'),
  },
]
</script>

<template>
  <article
    class="flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-lg text-zinc-900 dark:bg-[#1C2431] dark:text-white"
  >
    <button
      type="button"
      class="group flex flex-1 items-center gap-4 rounded-xl p-2 text-left transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-white/5"
      :aria-label="props.profileAriaLabel"
      @click="emit('open-profile')"
    >
      <div
        class="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-500 transition group-hover:ring-2 group-hover:ring-primary/50 dark:bg-[#282e39] dark:text-gray-300"
      >
        <img
          v-if="props.avatarUrl"
          :src="props.avatarUrl"
          :alt="`Аватар ${props.name}`"
          class="size-full object-cover"
          loading="lazy"
        />
        <span v-else class="material-symbols-outlined text-2xl">person</span>
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <p class="truncate text-base font-medium leading-tight text-zinc-900 dark:text-white">{{ props.name }}</p>
        <p class="truncate text-sm leading-normal text-zinc-500 dark:text-[#9da6b9]">{{ props.role }}</p>
      </div>
    </button>
    <DropdownMenu
      :items="menuItems"
      :button-aria-label="props.actionAriaLabel"
      button-size="sm"
    />
  </article>
</template>
