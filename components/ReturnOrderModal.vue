<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Props {
  isOpen: boolean
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'return', reason: string): void
}>()

const returnReason = ref('')
const isSubmitting = ref(false)

const isSubmitDisabled = computed(() => {
  return isSubmitting.value || !returnReason.value.trim()
})

const handleReturn = () => {
  if (isSubmitDisabled.value) {
    return
  }

  emit('return', returnReason.value.trim())
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

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
})

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    returnReason.value = ''
    isSubmitting.value = false
  }
})

watch(() => props.isLoading, (isLoading) => {
  isSubmitting.value = isLoading
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
              <h2 class="text-lg font-bold text-zinc-900 dark:text-white">Вернуть задачу</h2>
              <button
                type="button"
                class="flex size-10 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                aria-label="Закрыть"
                :disabled="isSubmitting"
                @click="emit('close')"
              >
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </header>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto px-4 py-6">
              <div class="space-y-4">
                <div class="space-y-3">
                  <label class="flex flex-col space-y-3">
                    <span class="text-base font-semibold text-black dark:text-white">Причина возврата</span>
                    <textarea
                      v-model="returnReason"
                      class="min-h-32 w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:placeholder:text-[#9da6b9] dark:focus:ring-primary/40"
                      placeholder="Укажите, почему задача возвращается на доработку"
                      enterkeyhint="enter"
                      :disabled="isSubmitting"
                    ></textarea>
                  </label>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <footer class="border-t border-black/5 p-4 pb-8 dark:border-white/10">
              <button
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="isSubmitDisabled"
                @click="handleReturn"
              >
                <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                <span>{{ isSubmitting ? 'Возвращаем...' : 'Вернуть' }}</span>
              </button>
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
