<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface MonthOption {
  value: string
  label: string
  date: Date
}

interface Props {
  modelValue: string
  options: MonthOption[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isMenuOpen = ref(false)
const buttonRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const selectedMonth = computed(() => props.options.find((option) => option.value === props.modelValue) ?? null)
const selectedMonthIndex = computed(() => props.options.findIndex((option) => option.value === props.modelValue))

const canGoToPreviousMonth = computed(() => selectedMonthIndex.value > 0)
const canGoToNextMonth = computed(
  () => selectedMonthIndex.value >= 0 && selectedMonthIndex.value < props.options.length - 1,
)

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

const handleMonthSelect = (value: string) => {
  emit('update:modelValue', value)
  closeMenu()
}

const handlePreviousMonth = () => {
  if (!canGoToPreviousMonth.value) {
    return
  }

  const previous = props.options[selectedMonthIndex.value - 1]
  if (previous) {
    emit('update:modelValue', previous.value)
  }
}

const handleNextMonth = () => {
  if (!canGoToNextMonth.value) {
    return
  }

  const next = props.options[selectedMonthIndex.value + 1]
  if (next) {
    emit('update:modelValue', next.value)
  }
}
</script>

<template>
  <div
    class="rounded-[50px] border border-black/5 bg-white/80 px-2 py-2 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[#1C2431]/70 z-[2] relative"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex size-12 items-center justify-center rounded-full bg-black/5 text-black transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          :disabled="!canGoToPreviousMonth"
          aria-label="Предыдущий месяц"
          @click="handlePreviousMonth"
        >
          <span class="material-symbols-outlined text-2xl">chevron_left</span>
        </button>
        <div class="relative flex-1" ref="buttonRef">
          <button
            type="button"
            class="flex w-full items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-medium text-white shadow-inner transition hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/10 dark:hover:bg-white/15"
            :aria-expanded="isMenuOpen"
            aria-haspopup="listbox"
            :disabled="!canGoToPreviousMonth && !canGoToNextMonth"
            @click.stop="toggleMenu"
          >
            <span class="truncate">
              {{ selectedMonth?.label ?? 'Месяц не выбран' }}
            </span>
            <span
              class="material-symbols-outlined ml-2 text-lg transition-transform duration-200"
              :class="{ 'rotate-180': isMenuOpen }"
            >
              expand_more
            </span>
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
              class="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-black/5 bg-white shadow-lg shadow-black/10 dark:border-white/10 dark:bg-[#1C2431]"
              role="listbox"
            >
              <button
                v-for="option in props.options"
                :key="option.value"
                type="button"
                class="flex w-full items-center justify-center px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-white dark:hover:bg-white/5"
                :class="{
                  'bg-primary/10 text-primary dark:bg-primary/20': option.value === modelValue,
                }"
                role="option"
                :aria-selected="option.value === modelValue"
                @click="handleMonthSelect(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </transition>
        </div>
        <button
          type="button"
          class="flex size-12 items-center justify-center rounded-full bg-black/5 text-black transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          :disabled="!canGoToNextMonth"
          aria-label="Следующий месяц"
          @click="handleNextMonth"
        >
          <span class="material-symbols-outlined text-2xl">chevron_right</span>
        </button>
      </div>
    </div>
  </div>
</template>

