<script setup lang="ts">
import type { OrderStatusChip } from '~/data/orders'

const props = defineProps<{
  statuses: OrderStatusChip[]
}>()

const appearanceClassMap: Record<OrderStatusChip['appearance'], string> = {
  success: 'bg-emerald-500/15 text-emerald-400 dark:bg-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 dark:bg-amber-500/20',
  danger: 'bg-rose-500/15 text-rose-400 dark:bg-rose-500/20',
  info: 'bg-sky-500/15 text-sky-400 dark:bg-sky-500/20',
}
</script>

<template>
  <div v-if="props.statuses.length > 0" class="flex flex-wrap gap-2">
    <p class="sr-only">Статусы заказа</p>
    <span
      v-for="status in props.statuses"
      :key="status.id"
      class="inline-flex h-8 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium"
      :class="appearanceClassMap[status.appearance]"
    >
      {{ status.label }}
    </span>
  </div>
</template>
