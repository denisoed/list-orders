<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

export interface DropdownMenuItem {
  id: string
  label: string
  icon?: string
  variant?: 'default' | 'danger'
  action: () => void
}

const props = withDefaults(
  defineProps<{
    items: DropdownMenuItem[]
    buttonAriaLabel?: string
    buttonSize?: 'sm' | 'md'
  }>(),
  {
    buttonSize: 'md',
  },
)

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

const handleItemClick = (item: DropdownMenuItem) => {
  item.action()
  closeMenu()
}

const getItemClasses = (variant: DropdownMenuItem['variant'] = 'default') => {
  const baseClasses =
    'flex w-full items-center gap-3 px-5 py-3 text-left text-base font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

  if (variant === 'danger') {
    return [
      baseClasses,
      'text-red-500 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20',
    ]
  }

  return [
    baseClasses,
    'text-zinc-900 hover:bg-black/5 dark:text-white dark:hover:bg-white/5',
  ]
}
</script>

<template>
  <div class="relative shrink-0">
    <button
      type="button"
      ref="buttonRef"
      :class="[
        'flex items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10',
        props.buttonSize === 'sm' ? 'size-8' : 'size-12',
      ]"
      :aria-label="props.buttonAriaLabel || '?????????????? ????????'"
      :aria-expanded="isMenuOpen"
      aria-haspopup="menu"
      @click.stop="toggleMenu"
    >
      <span
        :class="[
          'material-symbols-outlined',
          props.buttonSize === 'sm' ? 'text-2xl' : 'text-3xl',
        ]"
        >more_vert</span
      >
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
        :class="[
          'absolute right-0 z-20 min-w-[200px] overflow-hidden rounded-xl border border-black/5 bg-white shadow-lg shadow-black/10 dark:border-white/10 dark:bg-[#1C2431]',
          props.buttonSize === 'sm' ? 'top-10' : 'top-14',
        ]"
        role="menu"
      >
        <button
          v-for="item in props.items"
          :key="item.id"
          type="button"
          :class="getItemClasses(item.variant)"
          role="menuitem"
          @click="handleItemClick(item)"
        >
          <span v-if="item.icon" class="material-symbols-outlined text-xl">{{
            item.icon
          }}</span>
          {{ item.label }}
        </button>
      </div>
    </transition>
  </div>
</template>
