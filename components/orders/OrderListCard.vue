<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { OrderDetail } from '~/data/orders'
import OrderStatusChips from '~/components/orders/OrderStatusChips.vue'
import { formatCurrency, formatDate } from '~/utils/formatters'

const props = defineProps<{
  order: OrderDetail
  to: RouteLocationRaw
}>()

const formattedDueDate = computed(() => formatDate(props.order.dueDate))
const formattedCreatedAt = computed(() => formatDate(props.order.createdAt, { day: '2-digit', month: 'long' }))
const formattedTotal = computed(() => formatCurrency(props.order.pricing.total, props.order.pricing.currency))
</script>

<template>
  <NuxtLink
    :to="props.to"
    class="group flex flex-col gap-4 rounded-2xl border border-transparent bg-white/70 p-4 transition hover:border-primary/50 hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:hover:bg-white/10"
    :aria-label="`Открыть детали заказа ${props.order.orderNumber}`"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
          Заказ {{ props.order.orderNumber }}
        </p>
        <h2 class="text-base font-semibold leading-snug text-gray-900 transition group-hover:text-primary dark:text-white">
          {{ props.order.title }}
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Проект: <span class="font-medium text-gray-700 dark:text-gray-200">{{ props.order.projectName }}</span>
        </p>
      </div>
      <span
        class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition group-hover:bg-primary/15 group-hover:text-primary dark:bg-primary/15"
      >
        <span>Детали заказа</span>
        <span class="material-symbols-outlined text-base leading-none">chevron_right</span>
      </span>
    </div>

    <OrderStatusChips :statuses="props.order.statuses" />

    <div class="grid gap-3 sm:grid-cols-2">
      <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <span class="material-symbols-outlined text-base text-gray-400 dark:text-gray-500">calendar_today</span>
        <span class="font-medium text-gray-700 dark:text-gray-200">{{ formattedDueDate }}</span>
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <span class="material-symbols-outlined text-base text-gray-400 dark:text-gray-500">payments</span>
        <span class="font-medium text-gray-700 dark:text-gray-200">{{ formattedTotal }}</span>
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">
        <span class="material-symbols-outlined text-base text-gray-400 dark:text-gray-500">person</span>
        <span>
          <span class="font-medium text-gray-700 dark:text-gray-200">{{ props.order.customer.name }}</span>
          <span class="text-gray-500 dark:text-gray-400"> · создан {{ formattedCreatedAt }}</span>
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
