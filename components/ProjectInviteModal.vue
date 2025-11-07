<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Props {
  isOpen: boolean
  projectId: string
  projectTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  projectTitle: '',
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const inviteLink = computed(() => {
  if (!props.projectId) return ''
  // Telegram Mini App link format: https://t.me/bot_username?start=parameter
  const botUsername = 'list_orders_bot'
  return `https://t.me/${botUsername}/app?startapp=invite_${props.projectId}`
})

const isCopied = ref(false)
const isShareSupported = computed(
  () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
)

const copyToClipboard = async () => {
  if (!inviteLink.value) return

  try {
    await navigator.clipboard.writeText(inviteLink.value)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy link:', error)
  }
}

const shareInviteLink = async () => {
  if (!inviteLink.value) return

  if (isShareSupported.value) {
    try {
      await navigator.share({
        title: 'Пригласить в проект',
        text: props.projectTitle
          ? `Присоединяйтесь к проекту «${props.projectTitle}»`
          : 'Присоединяйтесь к проекту',
        url: inviteLink.value,
      })
    } catch (error) {
      console.error('Failed to share link:', error)
    }
    return
  }

  await copyToClipboard()
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

watch(() => props.isOpen, () => {
  isCopied.value = false
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
              <h2 class="text-lg font-bold text-zinc-900 dark:text-white">Пригласить в проект</h2>
              <button
                type="button"
                class="flex size-10 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                aria-label="Закрыть"
                @click="emit('close')"
              >
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </header>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto px-4 py-6">
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <p class="text-base text-zinc-700 dark:text-zinc-300">
                    Поделитесь этой ссылкой с коллегами. При переходе по ссылке они автоматически будут добавлены в проект{{ props.projectTitle ? ` «${props.projectTitle}»` : '' }}.
                  </p>
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-zinc-900 dark:text-white">
                    Ссылка для приглашения
                  </label>
                  <div class="flex gap-2">
                    <input
                      :value="inviteLink"
                      type="text"
                      readonly
                      class="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#1C2431] dark:text-white"
                    />
                    <button
                      type="button"
                      class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      :disabled="!inviteLink"
                      @click="copyToClipboard"
                    >
                      <span v-if="isCopied" class="material-symbols-outlined text-lg">check</span>
                      <span v-else class="material-symbols-outlined text-lg">content_copy</span>
                      <span>{{ isCopied ? 'Скопировано' : 'Копировать' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <footer class="border-t border-black/5 p-4 pb-8 dark:border-white/10">
              <button
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="!inviteLink"
                @click="shareInviteLink"
              >
                <span class="material-symbols-outlined text-xl">ios_share</span>
                <span>Пригласить</span>
              </button>
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

