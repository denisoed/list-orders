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
    required: true,
  },
  actionAriaLabel: {
    type: String,
    default: 'Дополнительные действия участника',
  },
})

const emit = defineEmits<{
  (e: 'delete'): void
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
    <div class="flex items-center gap-4">
      <img :src="props.avatarUrl" :alt="`Аватар ${props.name}`" class="size-12 rounded-full object-cover" loading="lazy" />
      <div class="flex flex-col gap-0.5">
        <p class="text-base font-medium leading-tight text-zinc-900 dark:text-white">{{ props.name }}</p>
        <p class="text-sm leading-normal text-zinc-500 dark:text-[#9da6b9]">{{ props.role }}</p>
      </div>
    </div>
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
