<script setup lang="ts">
import { computed } from 'vue'
import { useOrderDetails } from '~/composables/useOrderDetails'
import OrderAttachmentsList from '~/components/orders/OrderAttachmentsList.vue'
import OrderCustomerCard from '~/components/orders/OrderCustomerCard.vue'
import OrderDetailSkeleton from '~/components/orders/OrderDetailSkeleton.vue'
import OrderErrorState from '~/components/orders/OrderErrorState.vue'
import OrderInfoRow from '~/components/orders/OrderInfoRow.vue'
import OrderItemsList from '~/components/orders/OrderItemsList.vue'
import OrderStatusChips from '~/components/orders/OrderStatusChips.vue'
import OrderSummaryHeader from '~/components/orders/OrderSummaryHeader.vue'
import OrderTimeline from '~/components/orders/OrderTimeline.vue'
import { formatDate } from '~/utils/formatters'

const route = useRoute()
const router = useRouter()

const orderId = computed(() => {
  const param = route.params.id
  return Array.isArray(param) ? param[0] : param
})

const listState = computed(() => {
  const raw = route.query.state

  if (typeof raw !== 'string') {
    return null
  }

  try {
    return JSON.parse(decodeURIComponent(raw)) as { path: string; query?: Record<string, string | string[]> }
  } catch (error) {
    console.warn('[orders] не удалось разобрать состояние списка', error)
    return null
  }
})

const { order, statusChips, isLoading, error, isCompleting, refresh, markAsCompleted } = useOrderDetails(orderId)

const priorityMap: Record<string, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

const infoRows = computed(() => {
  if (!order.value) {
    return []
  }

  return [
    {
      icon: 'calendar_today',
      label: 'Дедлайн',
      value: formatDate(order.value.dueDate),
    },
    {
      icon: 'flag',
      label: 'Приоритет',
      value: priorityMap[order.value.priority] ?? order.value.priority,
    },
    {
      icon: 'folder',
      label: 'Проект',
      value: order.value.projectName,
    },
  ]
})

const shippingSummary = computed(() => {
  if (!order.value) {
    return ''
  }

  const address = order.value.shippingAddress
  return [address.line1, address.line2, `${address.city}, ${address.postalCode}`, address.country]
    .filter(Boolean)
    .join(', ')
})

const billingSummary = computed(() => {
  if (!order.value) {
    return ''
  }

  const address = order.value.billingAddress
  return [address.line1, address.line2, `${address.city}, ${address.postalCode}`, address.country]
    .filter(Boolean)
    .join(', ')
})

const errorCode = computed(() => {
  const value = error.value as (Error & { statusCode?: number }) | null
  return value?.statusCode ?? null
})

const errorMessage = computed(() => {
  const value = error.value as (Error & { statusMessage?: string; message: string }) | null
  return value?.statusMessage ?? value?.message ?? ''
})

const isActionDisabled = computed(() => {
  return !order.value?.allowCompletion || isCompleting.value
})

const handleBack = () => {
  if (listState.value) {
    router.push({ path: listState.value.path, query: listState.value.query })
    return
  }

  if (process.client && window.history.length > 1) {
    router.back()
    return
  }

  router.push('/')
}

const handleRetry = () => {
  void refresh()
}

const handleComplete = async () => {
  await markAsCompleted()
}

useHead({
  title: computed(() => (order.value ? `${order.value.title} — заказ ${order.value.orderNumber}` : 'Заказ')), 
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
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
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
      class="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-background-light/95 px-4 py-3 backdrop-blur dark:bg-background-dark/95"
    >
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-full transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-white/10"
        @click="handleBack"
        aria-label="Вернуться к списку заказов"
      >
        <span class="material-symbols-outlined text-2xl">arrow_back</span>
      </button>
      <h1 class="flex-1 text-center text-base font-semibold leading-tight">
        {{ order ? order.title : 'Детали заказа' }}
      </h1>
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-full transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-white/10"
        aria-label="Дополнительные действия"
      >
        <span class="material-symbols-outlined text-2xl">more_vert</span>
      </button>
    </header>

    <main class="flex-1 space-y-4 px-4 py-4">
      <OrderDetailSkeleton v-if="isLoading" />

      <template v-else>
        <OrderErrorState
          v-if="error && !order"
          :title="errorCode === 403 ? 'Доступ ограничен' : 'Заказ не найден'"
          :description="errorMessage || 'Попробуйте обновить страницу или вернитесь к списку заказов.'"
          :icon="errorCode === 403 ? 'lock' : 'sentiment_dissatisfied'"
          @retry="handleRetry"
        />

        <div v-else-if="order" class="space-y-4 pb-20">
          <OrderSummaryHeader
            :title="order.title"
            :order-number="order.orderNumber"
            :project-name="order.projectName"
            :created-at="order.createdAt"
            :total-amount="order.pricing.total"
            :currency="order.pricing.currency"
          />

          <OrderStatusChips :statuses="statusChips" />

          <OrderCustomerCard :customer="order.customer" />

          <section class="grid gap-3 md:grid-cols-2">
            <OrderInfoRow
              v-for="row in infoRows"
              :key="row.label"
              :icon="row.icon"
              :label="row.label"
              :value="row.value"
            />
          </section>

          <section class="grid gap-3 md:grid-cols-2">
            <OrderInfoRow icon="local_shipping" label="Доставка" :value="shippingSummary" :description="order.shippingAddress.comment" />
            <OrderInfoRow icon="receipt_long" label="Платёж" :value="billingSummary" />
          </section>

          <details class="group rounded-xl bg-white/60 p-4 dark:bg-white/5" open>
            <summary class="flex cursor-pointer items-center justify-between text-base font-semibold text-gray-900 transition group-open:pb-2 dark:text-white">
              Описание
              <span class="material-symbols-outlined text-gray-500 transition-transform duration-300 group-open:rotate-180 dark:text-gray-400">
                expand_more
              </span>
            </summary>
            <p class="text-sm leading-6 text-gray-600 dark:text-gray-300">
              {{ order.description }}
            </p>
          </details>

          <details class="group rounded-xl bg-white/60 p-4 dark:bg-white/5">
            <summary class="flex cursor-pointer items-center justify-between text-base font-semibold text-gray-900 transition group-open:pb-2 dark:text-white">
              Заметки
              <span class="material-symbols-outlined text-gray-500 transition-transform duration-300 group-open:rotate-180 dark:text-gray-400">
                expand_more
              </span>
            </summary>
            <p class="text-sm leading-6 text-gray-600 dark:text-gray-300">
              {{ order.notes }}
            </p>
          </details>

          <OrderAttachmentsList :attachments="order.attachments" />

          <OrderTimeline :events="order.timeline" />

          <OrderItemsList :items="order.items" :pricing="order.pricing" />
        </div>
      </template>
    </main>

    <footer
      v-if="order"
      class="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-background-light/95 px-4 py-4 backdrop-blur dark:bg-background-dark/95"
    >
      <div class="mx-auto flex w-full max-w-3xl gap-3">
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-white shadow-lg transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-primary/60"
          :disabled="isActionDisabled"
          @click="handleComplete"
        >
          <span class="material-symbols-outlined text-xl">check_circle</span>
          {{ order && order.allowCompletion ? 'Отметить как выполненный' : 'Заказ завершён' }}
        </button>
      </div>
    </footer>
  </div>
</template>
