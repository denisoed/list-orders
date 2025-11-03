<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { getOrderDetailMock } from '~/data/orders'
import type { OrderDetail } from '~/data/orders'

const route = useRoute()
const router = useRouter()

const orderId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] ?? '' : raw?.toString() ?? ''
})

const order = computed<OrderDetail>(() => getOrderDetailMock(orderId.value))

const nuxtApp = useNuxtApp()

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTOS = 6
const MIN_COMMENT_LENGTH = 10

interface ReviewAttachment {
  id: string
  name: string
  sizeLabel: string
  url: string
  file: File
}

const attachments = ref<ReviewAttachment[]>([])
const fileErrors = ref<string[]>([])
const comment = ref('')
const commentTouched = ref(false)
const submitAttempted = ref(false)
const formError = ref('')
const isSubmitting = ref(false)

const reviewFormId = 'order-review-form'

const fromPath = computed(() => {
  const from = route.query.from
  if (typeof from === 'string' && from.length > 0) {
    return from
  }
  return `/orders/${orderId.value}`
})

const createAttachmentId = () => `photo-${Math.random().toString(36).slice(2, 10)}`

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} МБ`
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} КБ`
  }
  return `${size} Б`
}

const resetFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  if (input) {
    input.value = ''
  }
}

const handleFilesChange = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const selectedFiles = Array.from(input?.files ?? [])
  if (!selectedFiles.length) {
    resetFileInput(event)
    return
  }

  const nextAttachments = [...attachments.value]
  const errors: string[] = []

  for (const file of selectedFiles) {
    if (nextAttachments.length >= MAX_PHOTOS) {
      errors.push(`Можно загрузить не более ${MAX_PHOTOS} фотографий.`)
      break
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      errors.push(`Файл «${file.name}» имеет неподдерживаемый формат.`)
      continue
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`Файл «${file.name}» превышает ${MAX_FILE_SIZE_MB} МБ.`)
      continue
    }

    const url = URL.createObjectURL(file)
    nextAttachments.push({
      id: createAttachmentId(),
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      url,
      file,
    })
  }

  attachments.value = nextAttachments
  fileErrors.value = errors
  resetFileInput(event)
}

const revokeAttachmentUrl = (attachment: ReviewAttachment) => {
  URL.revokeObjectURL(attachment.url)
}

const handleRemoveAttachment = (id: string) => {
  const attachment = attachments.value.find((item) => item.id === id)
  if (!attachment) {
    return
  }

  revokeAttachmentUrl(attachment)
  attachments.value = attachments.value.filter((item) => item.id !== id)
}

onBeforeUnmount(() => {
  attachments.value.forEach(revokeAttachmentUrl)
})

const commentError = computed(() => {
  if (comment.value.trim().length === 0) {
    return 'Добавьте поясняющий комментарий.'
  }
  if (comment.value.trim().length < MIN_COMMENT_LENGTH) {
    return `Комментарий должен содержать не менее ${MIN_COMMENT_LENGTH} символов.`
  }
  if (comment.value.trim().length > 1000) {
    return 'Комментарий не должен превышать 1000 символов.'
  }
  return ''
})

const showCommentError = computed(() => (commentTouched.value || submitAttempted.value) && Boolean(commentError.value))

const attachmentsError = computed(() => {
  if (attachments.value.length === 0 && submitAttempted.value) {
    return 'Прикрепите хотя бы одно подтверждающее фото.'
  }
  return ''
})

const isSubmitDisabled = computed(() => {
  if (isSubmitting.value) {
    return true
  }
  if (attachments.value.length === 0) {
    return true
  }
  if (comment.value.trim().length < MIN_COMMENT_LENGTH) {
    return true
  }
  if (comment.value.trim().length > 1000) {
    return true
  }
  return false
})

const submitButtonText = computed(() => (isSubmitting.value ? 'Отправка…' : 'Отправить на проверку'))

const handleCommentBlur = () => {
  commentTouched.value = true
}

const handleBack = () => {
  router.push(fromPath.value)
}

const handleSubmit = async () => {
  submitAttempted.value = true
  formError.value = ''

  if (isSubmitDisabled.value) {
    return
  }

  try {
    isSubmitting.value = true
    const formData = new FormData()
    attachments.value.forEach((item) => {
      formData.append('photos', item.file, item.name)
    })
    formData.append('comment', comment.value.trim())

    await nuxtApp.$fetch(`/api/orders/${orderId.value}/submit-review`, {
      method: 'POST',
      body: formData,
    })

    await router.push({
      path: `/orders/${orderId.value}`,
      query: {
        submitted: '1',
      },
    })
  } catch (error: any) {
    const message =
      error?.data?.statusMessage ??
      error?.data?.message ??
      error?.statusMessage ??
      error?.message ??
      'Не удалось отправить данные. Попробуйте ещё раз.'
    formError.value = message
  } finally {
    isSubmitting.value = false
  }
}

useHead({
  title: () => `Отправка на проверку — ${order.value.title}`,
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
        <p class="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-[#9da6b9]">Отправка на проверку</p>
        <h1 class="line-clamp-2 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          {{ order.title }}
        </h1>
      </div>
    </header>

    <main class="flex-1 space-y-6 px-4 py-6 pb-36 sm:pb-32">
      <section class="rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium text-gray-500 dark:text-[#9da6b9]">Заказ</p>
          <div class="flex flex-wrap items-center gap-2 text-sm text-black/80 dark:text-white/80">
            <span class="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black/70 dark:bg-white/5 dark:text-white/70">
              {{ order.code }}
            </span>
            <span class="text-sm leading-tight">{{ order.summary }}</span>
          </div>
        </div>
      </section>

      <form :id="reviewFormId" class="space-y-6" novalidate @submit.prevent="handleSubmit">
        <section class="rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label for="photo-upload" class="text-base font-semibold text-black dark:text-white">Фотографии результата</label>
              <p class="text-sm text-gray-500 dark:text-[#9da6b9]">
                Добавьте до {{ MAX_PHOTOS }} файлов в формате JPG, PNG или WEBP (до {{ MAX_FILE_SIZE_MB }} МБ каждый).
              </p>
            </div>

            <label
              for="photo-upload"
              class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-black/5 px-6 py-8 text-center text-sm text-gray-600 transition hover:border-primary/40 hover:bg-primary/5 dark:border-white/10 dark:bg-white/5 dark:text-[#9da6b9] dark:hover:border-primary/60 dark:hover:bg-primary/10"
            >
              <span class="material-symbols-outlined text-4xl text-primary">cloud_upload</span>
              <span class="text-base font-semibold text-black dark:text-white">Перетащите фото или выберите файлы</span>
              <span class="text-xs text-gray-500 dark:text-[#9da6b9]">Можно выбрать несколько изображений сразу.</span>
              <input
                id="photo-upload"
                class="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                @change="handleFilesChange"
              />
            </label>

            <ul v-if="attachments.length" class="space-y-3" role="list">
              <li
                v-for="file in attachments"
                :key="file.id"
                class="flex items-center gap-4 rounded-xl bg-black/5 p-3 dark:bg-white/5"
              >
                <div class="size-16 shrink-0 overflow-hidden rounded-lg bg-black/10 dark:bg-white/10">
                  <img :src="file.url" :alt="`Превью ${file.name}`" class="size-full object-cover" />
                </div>
                <div class="flex flex-1 flex-col gap-1 text-left">
                  <p class="truncate text-sm font-semibold text-black dark:text-white">{{ file.name }}</p>
                  <span class="text-xs text-gray-500 dark:text-[#9da6b9]">{{ file.sizeLabel }}</span>
                </div>
                <button
                  type="button"
                  class="flex size-10 items-center justify-center rounded-full bg-black/10 text-gray-600 transition hover:bg-black/20 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                  aria-label="Удалить файл"
                  @click="handleRemoveAttachment(file.id)"
                >
                  <span class="material-symbols-outlined text-xl">close</span>
                </button>
              </li>
            </ul>

            <p v-if="attachmentsError" class="text-sm text-red-500">{{ attachmentsError }}</p>
            <div v-if="fileErrors.length" class="space-y-1 text-sm text-amber-600 dark:text-amber-400">
              <p>Следующие файлы не были добавлены:</p>
              <ul class="list-disc space-y-1 pl-5 text-left">
                <li v-for="error in fileErrors" :key="error">{{ error }}</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
          <label class="flex flex-col gap-2">
            <span class="text-base font-semibold text-black dark:text-white">Комментарий</span>
            <textarea
              v-model="comment"
              class="min-h-36 w-full rounded-xl border border-black/10 bg-black/5 p-4 text-base leading-normal text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9da6b9]"
              placeholder="Опишите, что было сделано и на что обратить внимание при проверке."
              enterkeyhint="done"
              maxlength="1000"
              @blur="handleCommentBlur"
            ></textarea>
            <p v-if="showCommentError" class="text-sm text-red-500">{{ commentError }}</p>
            <p class="text-xs text-gray-500 dark:text-[#9da6b9]">Минимум {{ MIN_COMMENT_LENGTH }} символов.</p>
          </label>
        </section>
      </form>
    </main>

    <footer
      class="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-background-light/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <div class="space-y-2">
        <p v-if="formError" class="text-sm text-red-500">{{ formError }}</p>
        <button
          :form="reviewFormId"
          type="submit"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:bg-primary/60 disabled:text-white/80"
          :disabled="isSubmitDisabled"
        >
          <span>{{ submitButtonText }}</span>
          <span class="material-symbols-outlined">send</span>
        </button>
      </div>
    </footer>
  </div>
</template>
