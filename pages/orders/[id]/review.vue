<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { convertOrderToOrderDetail } from '~/data/orders'
import type { Order, OrderDetail } from '~/data/orders'
import { submitOrderReview } from '~/utils/orderReviewSubmission'
import type { ImageAttachment } from '~/components/ImageUploader.vue'
import { useOrders } from '~/composables/useOrders'
import { useProjects } from '~/composables/useProjects'

const route = useRoute()
const router = useRouter()

const orderId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] ?? '' : raw?.toString() ?? ''
})

const { fetchOrder } = useOrders()
const { getProjectById } = useProjects()

const order = ref<OrderDetail | null>(null)
const orderProjectId = ref<string | null>(null)
const isLoading = ref(false)
const loadError = ref<string | null>(null)

// Load order data
onMounted(async () => {
  if (!orderId.value) {
    loadError.value = 'Order ID is missing'
    return
  }

  isLoading.value = true
  loadError.value = null

  try {
    const orderData = await fetchOrder(orderId.value)
    const project = getProjectById(orderData.projectId)
    const orderDetail = convertOrderToOrderDetail(orderData, project?.title)
    order.value = orderDetail
    orderProjectId.value = orderData.projectId
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Не удалось загрузить заказ'
    loadError.value = errorMessage
    console.error('Error loading order:', err)
  } finally {
    isLoading.value = false
  }
})

const attachments = ref<ImageAttachment[]>([])
const comment = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

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
      attachments: response.attachments.length,
    })

    attachments.value = []
    comment.value = ''

    // Redirect to project orders list page
    if (orderProjectId.value) {
      await router.replace({
        path: `/projects/${orderProjectId.value}/orders`,
      })
    } else {
      // Fallback to home page if projectId is not available
      await router.replace({
        path: '/',
      })
    }
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

const pageTitle = computed(() => {
  const orderTitle = order.value?.title
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
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col items-start text-left">
        <h1 class="line-clamp-2 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          {{ order?.title || 'Отправка на проверку' }}
        </h1>
      </div>
    </header>

    <main class="flex-1 space-y-8 px-4 py-6 pb-28 sm:pb-24">
      <div v-if="isLoading" class="flex items-center justify-center py-10">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <div v-else-if="loadError" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
        {{ loadError }}
      </div>

      <div v-else-if="!order" class="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-[#1C2431] dark:text-gray-400">
        Заказ не найден
      </div>

      <template v-else>
      <section class="space-y-4">
        <div class="space-y-3">
          <p class="text-base font-semibold text-black dark:text-white">Фото результата</p>
          <ImageUploader
            v-model="attachments"
            button-size="md"
            variant="light"
          />
          <p class="text-sm text-gray-500 dark:text-[#9da6b9]">
            Поддерживаются изображения в форматах JPEG, PNG и SVG.
          </p>
        </div>

        <div class="space-y-3">
          <label class="flex flex-col space-y-3">
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
      </template>
    </main>

    <footer
      v-if="order && !isLoading"
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
