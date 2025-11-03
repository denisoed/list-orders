<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { getOrderDetailMock } from '~/data/orders'
import { submitOrderReview } from '~/utils/orderReviewSubmission'

interface AttachmentPreview {
  id: string
  name: string
  previewUrl: string
  file: File
}

const route = useRoute()
const router = useRouter()

const orderId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] ?? '' : raw?.toString() ?? ''
})

const order = computed(() => getOrderDetailMock(orderId.value))

const attachments = ref<AttachmentPreview[]>([])
const comment = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const MAX_FILENAME_LENGTH = 26

const createAttachmentPreview = (file: File): AttachmentPreview => {
  const identifier =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 11)

  const previewUrl = typeof URL !== 'undefined' ? URL.createObjectURL(file) : ''

  return {
    id: identifier,
    name: file.name,
    previewUrl,
    file,
  }
}

const revokePreviewUrl = (url: string) => {
  if (!url) {
    return
  }

  if (typeof URL !== 'undefined') {
    URL.revokeObjectURL(url)
  }
}

const formatFileName = (name: string, maxLength = MAX_FILENAME_LENGTH) => {
  if (name.length <= maxLength) {
    return name
  }

  const extensionIndex = name.lastIndexOf('.')

  if (extensionIndex <= 0 || extensionIndex === name.length - 1) {
    return `${name.slice(0, Math.max(1, maxLength - 3))}...`
  }

  const extension = name.slice(extensionIndex)
  const baseName = name.slice(0, extensionIndex)
  const available = Math.max(1, maxLength - extension.length - 3)
  const truncated = baseName.slice(0, available)

  return `${truncated}...${extension}`
}

const handleBack = () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
    return
  }

  if (orderId.value) {
    router.push({ path: `/orders/${orderId.value}` })
  } else {
    router.push({ path: '/' })
  }
}

const handleAddAttachments = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  const fileList = target?.files

  if (!fileList?.length) {
    return
  }

  const newAttachments = Array.from(fileList).map(createAttachmentPreview)
  attachments.value = [...attachments.value, ...newAttachments]

  if (target) {
    target.value = ''
  }
}

const handleRemoveAttachment = (attachmentId: string) => {
  const index = attachments.value.findIndex((item) => item.id === attachmentId)

  if (index === -1) {
    return
  }

  const [removed] = attachments.value.splice(index, 1)
  revokePreviewUrl(removed.previewUrl)
}

const hasAttachments = computed(() => attachments.value.length > 0)

const isSubmitDisabled = computed(() => {
  const trimmedComment = comment.value.trim()
  return isSubmitting.value || (!trimmedComment && !attachments.value.length)
})

const handleSubmit = async () => {
  if (isSubmitDisabled.value) {
    return
  }

  errorMessage.value = null
  isSubmitting.value = true

  try {
    const response = await submitOrderReview({
      orderId: orderId.value,
      comment: comment.value,
      attachments: attachments.value.map((item) => item.file),
    })

    console.info('Заказ отправлен на проверку', {
      orderId: orderId.value,
      reviewId: response.reviewId,
      attachments: response.attachments.length,
    })

    attachments.value.forEach((attachment) => {
      revokePreviewUrl(attachment.previewUrl)
    })
    attachments.value = []
    comment.value = ''

    await router.replace({
      path: `/orders/${orderId.value}`,
      query: { status: response.status },
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Не удалось отправить заказ на проверку. Попробуйте ещё раз.'
    errorMessage.value = message
  } finally {
    isSubmitting.value = false
  }
}

onBeforeUnmount(() => {
  attachments.value.forEach((attachment) => revokePreviewUrl(attachment.previewUrl))
})

const pageTitle = computed(() => {
  const orderTitle = order.value.title
  return orderTitle ? `Отправка на проверку — ${orderTitle}` : 'Отправка на проверку'
})

useHead({
  title: pageTitle,
  htmlAttrs: {
    lang: 'ru',
    class: 'dark',
  },
  bodyAttrs: {
    class: 'bg-background-light dark:bg-background-dark font-display',
    style: 'min-height: 100dvh;',
  },
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
    },
  ],
})
</script>

<template>
  <div
    class="relative flex min-h-screen w-full flex-col bg-background-light text-black dark:bg-background-dark dark:text-white"
    :style="{ backgroundColor: 'var(--telegram-background-color, #f6f6f8)' }"
  >
    <header
      class="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-background-light/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        aria-label="Вернуться назад"
        @click="handleBack"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col items-start text-left">
        <h1 class="line-clamp-2 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          {{ order.title }}
        </h1>
      </div>
    </header>

    <main class="flex-1 space-y-8 px-4 py-6 pb-28 sm:pb-24">
      <section class="space-y-4">
        <div class="space-y-3">
          <p class="text-base font-semibold text-black dark:text-white">Фотографии</p>
          <div class="flex flex-wrap items-start gap-4">
            <button
              type="button"
              class="flex h-24 w-24 min-h-24 min-w-24 items-center justify-center rounded-2xl border-2 border-dashed border-black/10 bg-white text-gray-500 transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/15 dark:bg-[#1C2431] dark:text-[#9da6b9] dark:hover:border-primary"
              aria-label="Добавить фотографии"
              @click="handleAddAttachments"
            >
              <span class="material-symbols-outlined text-3xl">add_photo_alternate</span>
            </button>

            <ul v-if="hasAttachments" class="flex flex-wrap gap-4" role="list">
              <li
                v-for="attachment in attachments"
                :key="attachment.id"
                role="listitem"
                class="group relative flex w-28 flex-col items-center gap-2"
              >
                <div class="relative">
                  <img
                    v-if="attachment.previewUrl"
                    :src="attachment.previewUrl"
                    :alt="`Фото ${attachment.name}`"
                    class="h-24 w-24 min-h-24 min-w-24 rounded-2xl object-cover shadow-sm"
                  />
                  <div
                    v-else
                    class="flex h-24 w-24 min-h-24 min-w-24 items-center justify-center rounded-2xl bg-black/5 text-gray-500 dark:bg-white/10 dark:text-[#9da6b9]"
                  >
                    <span class="material-symbols-outlined text-3xl">image</span>
                  </div>

                  <button
                    type="button"
                    class="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    :aria-label="`Удалить фото ${attachment.name}`"
                    @click="handleRemoveAttachment(attachment.id)"
                  >
                    <span class="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <p
                  class="text-center text-xs font-medium text-gray-600 dark:text-[#9da6b9]"
                  :title="attachment.name"
                >
                  {{ formatFileName(attachment.name) }}
                </p>
              </li>
            </ul>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept="image/*"
            class="sr-only"
            @change="handleFileChange"
          />

          <p class="text-sm text-gray-500 dark:text-[#9da6b9]">
            Поддерживаются изображения в форматах JPEG, PNG и HEIC. Максимальный размер уточняется с бэкендом.
          </p>
        </div>

        <div class="space-y-3">
          <label class="flex flex-col">
            <span class="text-base font-semibold text-black dark:text-white">Комментарий</span>
            <textarea
              v-model="comment"
              class="min-h-32 w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:placeholder:text-[#9da6b9] dark:focus:ring-primary/40"
              placeholder="Опишите выполненную работу, чтобы ускорить проверку заказа"
              enterkeyhint="done"
            ></textarea>
          </label>
        </div>
      </section>

      <p
        v-if="errorMessage"
        class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
        role="alert"
      >
        {{ errorMessage }}
      </p>
    </main>

    <footer
      class="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-background-light/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
        :aria-disabled="isSubmitDisabled"
        :disabled="isSubmitDisabled"
        @click="handleSubmit"
      >
        <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
        <span>{{ isSubmitting ? 'Отправляем...' : 'Отправить на проверку' }}</span>
      </button>
    </footer>
  </div>
</template>
