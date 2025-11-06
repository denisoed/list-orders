<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'

type Variant = 'danger' | 'warning' | 'info'

interface Props {
  isOpen: boolean
  isLoading?: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: Variant
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  variant: 'danger',
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()

const handleConfirm = () => {
  if (props.isLoading) {
    return
  }

  emit('confirm')
}

const handleBackdropClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('modal-backdrop')) {
    emit('close')
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

const confirmButtonClass = computed(() => {
  const baseClass = 'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70'
  
  switch (props.variant) {
    case 'danger':
      return `${baseClass} bg-red-500 text-white hover:brightness-110 focus-visible:outline-white`
    case 'warning':
      return `${baseClass} bg-yellow-500 text-white hover:brightness-110 focus-visible:outline-white`
    case 'info':
      return `${baseClass} bg-primary text-white hover:brightness-110 focus-visible:outline-white`
    default:
      return `${baseClass} bg-primary text-white hover:brightness-110 focus-visible:outline-white`
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.isOpen"
        class="modal-backdrop fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm sm:items-center sm:justify-center"
        @click="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-full opacity-0 sm:translate-y-4 sm:scale-95"
          enter-to-class="translate-y-0 opacity-100 sm:scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 opacity-100 sm:scale-100"
          leave-to-class="translate-y-full opacity-0 sm:translate-y-4 sm:scale-95"
        >
          <div
            v-if="props.isOpen"
            class="flex min-h-[50vh] max-h-[85vh] w-full flex-col rounded-t-2xl bg-background-light shadow-xl dark:bg-background-dark sm:max-w-md sm:rounded-2xl"
            @click.stop
          >
            <!-- Header -->
            <header class="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-background-light/95 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-background-dark/95">
              <h2 class="text-lg font-bold text-zinc-900 dark:text-white">{{ props.title }}</h2>
              <button
                type="button"
                class="flex size-10 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                aria-label="Закрыть"
                :disabled="props.isLoading"
                @click="emit('close')"
              >
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </header>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto px-4 py-6">
              <div class="space-y-4">
                <p class="text-base leading-6 text-gray-700 dark:text-gray-300">{{ props.message }}</p>
              </div>
            </div>

            <!-- Footer -->
            <footer class="border-t border-black/5 p-4 pb-8 dark:border-white/10">
              <div class="flex flex-col gap-3 sm:flex-row-reverse">
                <button
                  type="button"
                  :class="confirmButtonClass"
                  :disabled="props.isLoading"
                  @click="handleConfirm"
                >
                  <span v-if="props.isLoading" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  <span>{{ props.isLoading ? 'Обработка...' : props.confirmText }}</span>
                </button>
                <button
                  type="button"
                  class="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-3 text-base font-semibold text-zinc-900 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:hover:bg-white/5"
                  :disabled="props.isLoading"
                  @click="emit('close')"
                >
                  {{ props.cancelText }}
                </button>
              </div>
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

