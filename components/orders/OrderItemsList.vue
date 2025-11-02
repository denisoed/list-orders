<script setup lang="ts">
import type { OrderItem, OrderPricing } from '~/data/orders'
import { formatCurrency } from '~/utils/formatters'

const props = defineProps<{
  items: OrderItem[]
  pricing: OrderPricing
}>()
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white/60 p-4 dark:bg-white/5">
    <header class="flex flex-col gap-1">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white">Состав заказа</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Всего позиций: {{ props.items.length }}</p>
    </header>

    <p v-if="props.items.length === 0" class="rounded-lg bg-gray-100/70 p-4 text-sm text-gray-500 dark:bg-white/10 dark:text-gray-400">
      Позиции заказа отсутствуют. Добавьте товары или услуги, чтобы сформировать чек.
    </p>

    <div v-else class="overflow-hidden rounded-xl border border-gray-100 dark:border-white/10">
      <table class="min-w-full divide-y divide-gray-100 text-left text-sm dark:divide-white/10">
        <thead class="bg-gray-100/60 dark:bg-white/10">
          <tr>
            <th scope="col" class="px-4 py-3 font-semibold text-gray-500 dark:text-gray-300">Товар</th>
            <th scope="col" class="px-4 py-3 font-semibold text-gray-500 dark:text-gray-300">SKU</th>
            <th scope="col" class="px-4 py-3 font-semibold text-gray-500 dark:text-gray-300">Кол-во</th>
            <th scope="col" class="px-4 py-3 font-semibold text-gray-500 dark:text-gray-300">Цена</th>
            <th scope="col" class="px-4 py-3 font-semibold text-gray-500 dark:text-gray-300">Сумма</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-white/5">
          <tr v-for="item in props.items" :key="item.id" class="bg-white/70 dark:bg-transparent">
            <td class="px-4 py-3 text-gray-900 dark:text-white">{{ item.title }}</td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ item.sku }}</td>
            <td class="px-4 py-3 text-gray-900 dark:text-white">{{ item.quantity }}</td>
            <td class="px-4 py-3 text-gray-900 dark:text-white">
              {{ formatCurrency(item.price, item.currency) }}
            </td>
            <td class="px-4 py-3 text-gray-900 dark:text-white">
              {{ formatCurrency(item.price * item.quantity, item.currency) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="grid gap-3 bg-gray-50/80 p-4 text-sm dark:bg-white/5">
        <div class="flex justify-between text-gray-500 dark:text-gray-300">
          <span>Подитог</span>
          <span>{{ formatCurrency(props.pricing.subtotal, props.pricing.currency) }}</span>
        </div>
        <div class="flex justify-between text-gray-500 dark:text-gray-300">
          <span>Доставка</span>
          <span>{{ formatCurrency(props.pricing.shipping, props.pricing.currency) }}</span>
        </div>
        <div class="flex justify-between text-gray-500 dark:text-gray-300">
          <span>Скидка</span>
          <span>-{{ formatCurrency(props.pricing.discount, props.pricing.currency) }}</span>
        </div>
        <div class="flex justify-between text-gray-500 dark:text-gray-300">
          <span>Налог</span>
          <span>{{ formatCurrency(props.pricing.tax, props.pricing.currency) }}</span>
        </div>
        <div class="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900 dark:border-white/10 dark:text-white">
          <span>Итого</span>
          <span>{{ formatCurrency(props.pricing.total, props.pricing.currency) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
