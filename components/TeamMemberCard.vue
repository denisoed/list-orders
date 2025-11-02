<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

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

const isMenuOpen = ref(false)
const buttonRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  if (isMenuOpen.value) {
    isMenuOpen.value = false
  }
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as Node

  if (
    !isMenuOpen.value ||
    (buttonRef.value && buttonRef.value.contains(target)) ||
    (menuRef.value && menuRef.value.contains(target))
  ) {
    return
  }

  closeMenu()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})

const handleDelete = () => {
  emit('delete')
  closeMenu()
}
</script>

<template>
  <article
    class="flex items-center justify-between gap-4 rounded-lg bg-white p-3 text-zinc-900 dark:bg-[#1C2431] dark:text-white"
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
    <div class="relative shrink-0">
      <button
        type="button"
        ref="buttonRef"
        class="flex size-8 items-center justify-center rounded-full text-gray-500 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-white/60"
        :aria-label="props.actionAriaLabel"
        :aria-expanded="isMenuOpen"
        aria-haspopup="menu"
        @click.stop="toggleMenu"
      >
        <span class="material-symbols-outlined text-2xl">more_vert</span>
      </button>
      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-1 opacity-0"
      >
        <div
          v-if="isMenuOpen"
          ref="menuRef"
          class="absolute right-0 top-10 z-20 min-w-[180px] overflow-hidden rounded-xl border border-black/5 bg-white py-1 shadow-lg shadow-black/10 dark:border-white/10 dark:bg-[#1C2431]"
          role="menu"
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-red-400 dark:hover:bg-red-500/20"
            role="menuitem"
            @click="handleDelete"
          >
            <span class="material-symbols-outlined text-base">delete</span>
            Удалить
          </button>
        </div>
      </transition>
    </div>
  </article>
</template>
