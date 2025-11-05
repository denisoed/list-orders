<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { convertOrderToOrderDetail } from '~/data/orders'
import type { Order, OrderDetail } from '~/data/orders'
import { submitOrderReview } from '~/utils/orderReviewSubmission'
import type { ImageAttachment } from '~/components/ImageUploader.vue'
import { useOrders } from '~/composables/useOrders'
import { useProjects } from '~/composables/useProjects'
import { useUserStore } from '~/stores/user'
import ReturnOrderModal from '~/components/ReturnOrderModal.vue'
import { mapDbStatusToOrderStatus } from '~/utils/orderStatuses'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const orderId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] ?? '' : raw?.toString() ?? ''
})

const { fetchOrder, updateOrder } = useOrders()
const { getProjectById, fetchProject } = useProjects()

const order = ref<Order | null>(null)
const orderProjectId = ref<string | null>(null)
const project = ref<ReturnType<typeof getProjectById> | null>(null)
const isLoading = ref(false)
const loadError = ref<string | null>(null)

// Review data
const attachments = ref<ImageAttachment[]>([])
const existingImageUrls = ref<string[]>([]) // Track existing image URLs separately
const comment = ref('')
const isSubmitting = ref(false)
const isReturning = ref(false)
const isCompleting = ref(false)
const isFinishing = ref(false)
const isReturnModalOpen = ref(false)
const errorMessage = ref<string | null>(null)

// Determine user role
const isOrderAuthor = computed(() => {
  if (!project.value || !userStore.user) {
    return false
  }
  return project.value.ownerTelegramId === userStore.user.telegram_id
})

const isOrderAssignee = computed(() => {
  if (!order.value || !userStore.user) {
    return false
  }
  return order.value.assigneeTelegramId === userStore.user.telegram_id
})

const canEdit = computed(() => {
  // Assignee can always edit, author can also edit but sees different buttons
  return isOrderAssignee.value || isOrderAuthor.value
})

// Normalized order status
const orderStatus = computed(() => {
  if (!order.value) return null
  return mapDbStatusToOrderStatus(order.value.status)
})

// Show "Finish" button for assignee when status is in_progress
const showFinishButton = computed(() => {
  return isOrderAssignee.value && orderStatus.value === 'in_progress'
})

// Show "Update" button for assignee when status is review
const showUpdateButton = computed(() => {
  return isOrderAssignee.value && orderStatus.value === 'review'
})

// Show "Return" button for assignee or author when status is review
const showReturnButton = computed(() => {
  return (isOrderAssignee.value || isOrderAuthor.value) && orderStatus.value === 'review'
})

// Show "Complete" button for author when status is review
const showCompleteButton = computed(() => {
  return isOrderAuthor.value && orderStatus.value === 'review'
})

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
    order.value = orderData
    orderProjectId.value = orderData.projectId

    // Load project if not already loaded
    let projectData = getProjectById(orderData.projectId)
    if (!projectData) {
      try {
        projectData = await fetchProject(orderData.projectId)
      } catch (error) {
        console.error('Failed to load project:', error)
      }
    }
    project.value = projectData

    // Load existing review data if order is in review status
    const normalizedStatus = mapDbStatusToOrderStatus(orderData.status)
    if (normalizedStatus === 'review') {
      comment.value = orderData.reviewComment || ''
      existingImageUrls.value = orderData.reviewImages || []

      // Convert existing image URLs to ImageAttachment format for display
      // These won't have File objects, only previewUrl
      attachments.value = existingImageUrls.value.map((url, index) => ({
        id: `existing-${index}`,
        name: `image-${index + 1}.jpg`,
        previewUrl: url,
        file: new File([], 'existing-image'), // Placeholder file
      }))
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Не удалось загрузить заказ'
    loadError.value = errorMessage
    console.error('Error loading order:', err)
  } finally {
    isLoading.value = false
  }
})

const handleImageClick = (attachment: ImageAttachment) => {
  // Use previewUrl as imageId
  const imageUrl = attachment.previewUrl
  router.push({
    path: `/images/${encodeURIComponent(imageUrl)}`,
    query: {
      orderId: orderId.value,
      source: 'order-review',
    },
  })
}

// Separate new files from existing URLs
const getNewFiles = (): Array<{ attachment: ImageAttachment; file: File }> => {
  return attachments.value
    .filter((att) => {
      // Existing images have IDs starting with "existing-"
      const isExisting = att.id.startsWith('existing-')
      // PreviewUrl is a data URL (data:image/...) for new files
      const isDataUrl = att.previewUrl.startsWith('data:')
      // New files have actual File objects with size > 0 and data URL preview
      return !isExisting && att.file && att.file.size > 0 && isDataUrl
    })
    .map((att) => ({ attachment: att, file: att.file }))
}

// Get all image URLs (existing that are not deleted + new ones)
const getAllImageUrls = async (): Promise<string[]> => {
  const urls: string[] = []

  // Keep existing URLs that are still in attachments (not deleted)
  const existingUrls = attachments.value
    .filter((att) => att.id.startsWith('existing-'))
    .map((att) => att.previewUrl)
    .filter((url) => url.startsWith('http://') || url.startsWith('https://'))
  urls.push(...existingUrls)

  // Upload new files and get their URLs
  const newFiles = getNewFiles()
  if (newFiles.length > 0) {
    try {
      const initData = getInitData()
      const headers: Record<string, string> = {}
      if (initData) {
        headers['x-telegram-init-data'] = initData
      }

      // Upload each new file and update its previewUrl
      for (const { attachment, file } of newFiles) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await $fetch<{ url: string; path: string }>('/api/images', {
          method: 'POST',
          body: formData,
          headers,
        })
        
        // Update attachment previewUrl to the uploaded URL
        attachment.previewUrl = response.url
        urls.push(response.url)
      }
    } catch (error) {
      console.error('Failed to upload new images:', error)
      throw new Error('Не удалось загрузить новые изображения')
    }
  }

  return urls
}

// Get initData helper
const getInitData = (): string | null => {
  if (!import.meta.client) {
    return null
  }

  const instance = window.Telegram?.WebApp ?? null
  const newInitData = instance?.initData ?? import.meta.env.telegramInitData ?? null

  if (newInitData && typeof newInitData === 'string') {
    const hasHash = newInitData.includes('hash=')
    const hasAuthDate = newInitData.includes('auth_date=')
    if (hasHash && hasAuthDate) {
      return newInitData
    }
  }

  try {
    const stored = localStorage.getItem('telegram-init-data')
    if (stored) {
      const hasHash = stored.includes('hash=')
      const hasAuthDate = stored.includes('auth_date=')
      if (hasHash && hasAuthDate) {
        return stored
      }
    }
  } catch (error) {
    // Ignore localStorage errors
  }

  return null
}

// Finish order (for assignee when status is in_progress)
const handleFinish = async () => {
  if (!orderId.value || isFinishing.value) {
    return
  }

  errorMessage.value = null
  isFinishing.value = true

  try {
    const imageUrls = await getAllImageUrls()

    await updateOrder(orderId.value, {
      status: 'review',
      review_comment: comment.value.trim() || null,
      review_images: imageUrls,
    })

    // Reload order to get updated data
    const orderData = await fetchOrder(orderId.value)
    order.value = orderData

    // Update attachments with new URLs
    existingImageUrls.value = orderData.reviewImages || []
    
    // Update attachments: keep non-existing ones (newly uploaded), replace existing ones
    const updatedAttachments: ImageAttachment[] = []
    
    // Add existing URLs from server
    existingImageUrls.value.forEach((url, index) => {
      updatedAttachments.push({
        id: `existing-${index}`,
        name: `image-${index + 1}.jpg`,
        previewUrl: url,
        file: new File([], 'existing-image'),
      })
    })
    
    // Keep attachments that are not existing (have data URLs or are newly uploaded)
    attachments.value.forEach((att) => {
      if (!att.id.startsWith('existing-') && (att.previewUrl.startsWith('http://') || att.previewUrl.startsWith('https://'))) {
        // This is a newly uploaded file that now has a URL - convert to existing
        updatedAttachments.push({
          id: `existing-${updatedAttachments.length}`,
          name: att.name,
          previewUrl: att.previewUrl,
          file: new File([], 'existing-image'),
        })
      } else if (!att.id.startsWith('existing-') && att.previewUrl.startsWith('data:')) {
        // This is a new file not yet uploaded - keep it
        updatedAttachments.push(att)
      }
    })
    
    attachments.value = updatedAttachments

    // Redirect to project orders list page
    if (orderProjectId.value) {
      await router.replace({
        path: `/projects/${orderProjectId.value}/orders`,
      })
    } else {
      await router.replace({
        path: '/',
      })
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Не удалось завершить заказ. Попробуйте ещё раз.'
    errorMessage.value = message
    console.error('Error finishing order:', error)
    isFinishing.value = false
  }
}

// Update review data (for assignee when status is review)
const handleUpdate = async () => {
  if (!orderId.value || isSubmitting.value) {
    return
  }

  errorMessage.value = null
  isSubmitting.value = true

  try {
    const imageUrls = await getAllImageUrls()

    await updateOrder(orderId.value, {
      review_comment: comment.value.trim() || null,
      review_images: imageUrls,
    })

    // Reload order to get updated data
    const orderData = await fetchOrder(orderId.value)
    order.value = orderData

    // Update attachments with new URLs - keep current attachments but update existing ones
    existingImageUrls.value = orderData.reviewImages || []
    
    // Update attachments: keep non-existing ones (newly uploaded), replace existing ones
    const updatedAttachments: ImageAttachment[] = []
    
    // Add existing URLs from server
    existingImageUrls.value.forEach((url, index) => {
      updatedAttachments.push({
        id: `existing-${index}`,
        name: `image-${index + 1}.jpg`,
        previewUrl: url,
        file: new File([], 'existing-image'),
      })
    })
    
    // Keep attachments that are not existing (have data URLs or are newly uploaded)
    attachments.value.forEach((att) => {
      if (!att.id.startsWith('existing-') && (att.previewUrl.startsWith('http://') || att.previewUrl.startsWith('https://'))) {
        // This is a newly uploaded file that now has a URL - convert to existing
        updatedAttachments.push({
          id: `existing-${updatedAttachments.length}`,
          name: att.name,
          previewUrl: att.previewUrl,
          file: new File([], 'existing-image'),
        })
      } else if (!att.id.startsWith('existing-') && att.previewUrl.startsWith('data:')) {
        // This is a new file not yet uploaded - keep it
        updatedAttachments.push(att)
      }
    })
    
    attachments.value = updatedAttachments

    // Show success message or just reload silently
    console.info('Review data updated successfully')
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Не удалось обновить данные проверки. Попробуйте ещё раз.'
    errorMessage.value = message
    console.error('Error updating review:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Handle return order
const handleReturn = async (reason: string) => {
  if (!orderId.value || isReturning.value) {
    return
  }

  isReturning.value = true
  isReturnModalOpen.value = false

  try {
    await updateOrder(orderId.value, {
      status: 'in_progress',
      review_answer: reason,
    })

    // Redirect to project orders list page
    if (orderProjectId.value) {
      await router.replace({
        path: `/projects/${orderProjectId.value}/orders`,
      })
    } else {
      await router.replace({
        path: '/',
      })
    }
  } catch (error) {
    console.error('Не удалось вернуть заказ:', error)
    errorMessage.value = 'Не удалось вернуть заказ. Попробуйте ещё раз.'
    isReturning.value = false
  }
}

// Handle complete order
const handleComplete = async () => {
  if (!orderId.value || isCompleting.value) {
    return
  }

  isCompleting.value = true

  try {
    await updateOrder(orderId.value, {
      status: 'done',
    })

    // Redirect to project orders list page
    if (orderProjectId.value) {
      await router.replace({
        path: `/projects/${orderProjectId.value}/orders`,
      })
    } else {
      await router.replace({
        path: '/',
      })
    }
  } catch (error) {
    console.error('Не удалось завершить заказ:', error)
    errorMessage.value = 'Не удалось завершить заказ. Попробуйте ещё раз.'
    isCompleting.value = false
  }
}

const isUpdateDisabled = computed(() => {
  if (isSubmitting.value) {
    return true
  }
  // For assignee, allow updating even without comment if there are images
  if (isOrderAssignee.value) {
    return false
  }
  // For author, updating is not the main action
  return false
})

const pageTitle = computed(() => {
  const orderTitle = order.value?.title
  return orderTitle ? `Проверка заказа — ${orderTitle}` : 'Проверка заказа'
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
          {{ order?.title || 'Проверка заказа' }}
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
            :clickable="true"
            @image-click="handleImageClick"
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
      <!-- Assignee: Finish button when status is in_progress -->
      <div v-if="showFinishButton" class="flex gap-3">
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="isFinishing"
          @click="handleFinish"
        >
          <span v-if="isFinishing" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          <span>{{ isFinishing ? 'Завершаем...' : 'Завершить' }}</span>
        </button>
      </div>

      <!-- Assignee: Update and Return buttons when status is review -->
      <div v-else-if="showUpdateButton" class="flex gap-3">
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-3 text-base font-semibold text-black shadow-sm transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:hover:bg-white/5"
          :disabled="isUpdateDisabled || isSubmitting || isReturning"
          @click="handleUpdate"
        >
          <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          <span>{{ isSubmitting ? 'Обновляем...' : 'Обновить' }}</span>
        </button>

        <button
          v-if="showReturnButton"
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500 bg-white py-3 text-base font-semibold text-red-600 shadow-sm transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-500/40 dark:bg-[#1C2431] dark:text-red-400 dark:hover:bg-red-500/10"
          :disabled="isSubmitting || isReturning"
          @click="isReturnModalOpen = true"
        >
          <span v-if="isReturning" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          <span>{{ isReturning ? 'Возвращаем...' : 'Вернуть' }}</span>
        </button>
      </div>

      <!-- Author: Return and Complete buttons when status is review -->
      <div v-else-if="showCompleteButton" class="flex gap-3">
        <button
          v-if="showReturnButton"
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500 bg-white py-3 text-base font-semibold text-red-600 shadow-sm transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-500/40 dark:bg-[#1C2431] dark:text-red-400 dark:hover:bg-red-500/10"
          :disabled="isReturning || isCompleting"
          @click="isReturnModalOpen = true"
        >
          <span v-if="isReturning" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          <span>{{ isReturning ? 'Возвращаем...' : 'Вернуть' }}</span>
        </button>

        <button
          v-if="showCompleteButton"
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="isReturning || isCompleting"
          @click="handleComplete"
        >
          <span v-if="isCompleting" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          <span>{{ isCompleting ? 'Завершаем...' : 'Готово' }}</span>
        </button>
      </div>
    </footer>

    <!-- Return Order Modal -->
    <ReturnOrderModal
      :is-open="isReturnModalOpen"
      :is-loading="isReturning"
      @close="isReturnModalOpen = false"
      @return="handleReturn"
    />
  </div>
</template>