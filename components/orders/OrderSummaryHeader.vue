<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatDateTime } from '~/utils/formatters'

const props = defineProps<{
  title: string
  orderNumber: string
  projectName: string
  createdAt: string
  totalAmount: number
  currency: string
}>()

const createdLabel = computed(() => formatDateTime(props.createdAt, { hour: '2-digit', minute: '2-digit' }))
const totalLabel = computed(() => formatCurrency(props.totalAmount, props.currency))
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-xl bg-white/60 p-4 text-gray-900 shadow-sm backdrop-blur dark:bg-white/5 dark:text-white"
  >
    <div class="flex flex-col gap-1">
      <p class="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Заказ {{ orderNumber }}</p>
      <h1 class="text-xl font-semibold leading-tight">{{ title }}</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ projectName }}</p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="flex items-center gap-3 rounded-lg bg-gray-100/80 p-3 dark:bg-white/10">
        <span class="material-symbols-outlined text-2xl text-primary">payments</span>
        <div class="flex flex-col">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Сумма заказа</p>
          <p class="text-base font-semibold">{{ totalLabel }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-lg bg-gray-100/80 p-3 dark:bg-white/10">
        <span class="material-symbols-outlined text-2xl text-primary">schedule</span>
        <div class="flex flex-col">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Создан</p>
          <p class="text-base font-semibold">{{ createdLabel }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
