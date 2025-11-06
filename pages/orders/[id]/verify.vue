<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { convertOrderToOrderDetail } from '~/data/orders'
import type { Order, OrderDetail } from '~/data/orders'
import { useOrders } from '~/composables/useOrders'
import { useProjects } from '~/composables/useProjects'
import OrderCard from '~/components/OrderCard.vue'
import ReturnOrderModal from '~/components/ReturnOrderModal.vue'
import type { ProjectOrder } from '~/data/projects'
import { mapDbStatusToOrderStatus } from '~/utils/orderStatuses'

const route = useRoute()
const router = useRouter()

const orderId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] ?? '' : raw?.toString() ?? ''
})

const { fetchOrder, updateOrder } = useOrders()
const { getProjectById } = useProjects()

const order = ref<Order | null>(null)
const orderDetail = ref<OrderDetail | null>(null)
const isLoading = ref(false)
const loadError = ref<string | null>(null)
const isReturning = ref(false)
const isCompleting = ref(false)
const isReturnModalOpen = ref(false)

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
    const project = getProjectById(orderData.projectId)
    const detail = convertOrderToOrderDetail(orderData, project?.title)
    orderDetail.value = detail
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Не удалось загрузить задачу'
    loadError.value = errorMessage
    console.error('Error loading task:', err)
  } finally {
    isLoading.value = false
  }
})

// Convert Order to ProjectOrder for OrderCard
const projectOrder = computed<ProjectOrder | null>(() => {
  if (!order.value) {
    return null
  }

  const orderStatus = mapDbStatusToOrderStatus(order.value.status)

  // Format due date
  let dueDate = new Date().toISOString().slice(0, 10)
  if (order.value.dueDate) {
    try {
      const date = new Date(order.value.dueDate)
      dueDate = date.toISOString().slice(0, 10)
    } catch (error) {
      console.error('Error parsing due date:', error)
    }
  }

  return {
    id: order.value.id,
    title: order.value.title,
    assignee: {
      name: order.value.assigneeTelegramName || 'Не назначен',
      avatarUrl: order.value.assigneeTelegramAvatarUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23282e39%22/%3E%3Cpath d=%22M32 34c6.075 0 11-4.925 11-11S38.075 12 32 12s-11 4.925-11 11 4.925 11 11 11Zm0 4c-7.732 0-21 3.882-21 11.5V52a4 4 0 0 0 4 4h34a4 4 0 0 0 4-4v-2.5C53 41.882 39.732 38 32 38Z%22 fill=%22%239da6b9%22/%3E%3C/svg%3E',
    },
    status: orderStatus,
    dueDate,
    dueTime: order.value.dueTime || undefined,
    description: order.value.description || undefined,
    clientName: order.value.clientName,
    clientPhone: order.value.clientPhone,
  }
})

// Handle image click
const handleImageClick = (imageUrl: string) => {
  router.push({
    path: `/images/${encodeURIComponent(imageUrl)}`,
    query: {
      orderId: orderId.value,
      source: 'order-verify',
    },
  })
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

    // Reload order to get updated data
    const orderData = await fetchOrder(orderId.value)
    order.value = orderData
    const project = getProjectById(orderData.projectId)
    const detail = convertOrderToOrderDetail(orderData, project?.title)
    orderDetail.value = detail
  } catch (error) {
    console.error('Не удалось вернуть задачу:', error)
    // Show error message to user
    alert('Не удалось вернуть задачу. Попробуйте ещё раз.')
  } finally {
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

    // Redirect to orders list page
    if (order.value?.projectId) {
      await router.replace({
        path: `/projects/${order.value.projectId}/orders`,
      })
    } else {
      // Fallback to home page
      await router.replace({
        path: '/',
      })
    }
  } catch (error) {
    console.error('Не удалось завершить задачу:', error)
    // Show error message to user
    alert('Не удалось завершить задачу. Попробуйте ещё раз.')
    isCompleting.value = false
  }
}

const pageTitle = computed(() => {
  const orderTitle = order.value?.title
  return orderTitle ? `Подтверждение задачи — ${orderTitle}` : 'Подтверждение задачи'
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
          Проверка задачи
        </h1>
      </div>
    </header>

    <main class="flex-1 space-y-6 px-4 py-6 pb-28 sm:pb-24">
      <div v-if="isLoading" class="flex items-center justify-center py-10">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <div v-else-if="loadError" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
        {{ loadError }}
      </div>

      <div v-else-if="!order || !orderDetail" class="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-[#1C2431] dark:text-gray-400">
        Задача не найдена
      </div>

      <template v-else>
        <!-- Order Card -->
        <section class="space-y-3">
          <h2 class="text-base font-semibold text-black dark:text-white">Задача</h2>
          <div v-if="projectOrder">
            <OrderCard :order="projectOrder" />
          </div>
        </section>

        <!-- Review Images -->
        <section v-if="order.reviewImages && order.reviewImages.length > 0" class="space-y-3">
          <h2 class="text-base font-semibold text-black dark:text-white">Фото результата</h2>
          <div class="flex items-center gap-4 overflow-x-auto">
            <ul class="flex items-center gap-4" role="list">
              <li
                v-for="(imageUrl, index) in order.reviewImages"
                :key="index"
                role="listitem"
                class="relative cursor-pointer"
                @click="handleImageClick(imageUrl)"
              >
                <img
                  :src="imageUrl"
                  :alt="`Фото результата ${index + 1}`"
                  class="h-24 w-24 min-h-24 min-w-24 rounded-xl object-cover"
                  @error="(e) => { console.error('Failed to load image:', imageUrl); (e.target as HTMLImageElement).style.display = 'none'; }"
                />
              </li>
            </ul>
          </div>
        </section>

        <!-- Review Comment -->
        <section v-if="order.reviewComment" class="space-y-3">
          <h2 class="text-base font-semibold text-black dark:text-white">Комментарий</h2>
          <div class="rounded-2xl border border-black/10 bg-white p-4 text-base text-black dark:border-white/10 dark:bg-[#1C2431] dark:text-white">
            <p class="whitespace-pre-wrap">{{ order.reviewComment }}</p>
          </div>
        </section>
      </template>
    </main>

    <footer
      v-if="order && !isLoading"
      class="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-background-light/95 p-4 pb-8 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <div class="flex gap-3">
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500 bg-white py-3 text-base font-semibold text-red-600 shadow-sm transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-500/40 dark:bg-[#1C2431] dark:text-red-400 dark:hover:bg-red-500/10"
          :disabled="isReturning || isCompleting"
          @click="isReturnModalOpen = true"
        >
          <span v-if="isReturning" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          <span>{{ isReturning ? 'Возвращаем...' : 'Вернуть' }}</span>
        </button>

        <button
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
