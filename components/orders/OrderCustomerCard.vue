<script setup lang="ts">
import type { OrderCustomer } from '~/data/orders'

const props = defineProps<{
  customer: OrderCustomer
}>()

const getInitials = (name: string) => {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
</script>

<template>
  <article class="flex items-center gap-4 rounded-xl bg-white/60 p-4 dark:bg-white/5">
    <span
      v-if="props.customer.avatarUrl"
      class="size-14 shrink-0 overflow-hidden rounded-full bg-center bg-cover"
      :style="{ backgroundImage: `url(${props.customer.avatarUrl})` }"
      :aria-label="`Аватар клиента ${props.customer.name}`"
    ></span>
    <div
      v-else
      class="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary"
      aria-hidden="true"
    >
      {{ getInitials(props.customer.name) }}
    </div>
    <div class="flex flex-1 flex-col gap-1">
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Клиент</p>
      <p class="text-base font-semibold text-gray-900 dark:text-white">{{ props.customer.name }}</p>
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ props.customer.location }}</p>
      <div class="mt-1 flex flex-wrap gap-3 text-sm text-primary">
        <a class="inline-flex items-center gap-1 hover:underline" :href="`mailto:${props.customer.email}`">
          <span class="material-symbols-outlined text-base">mail</span>
          <span>{{ props.customer.email }}</span>
        </a>
        <a class="inline-flex items-center gap-1 hover:underline" :href="`tel:${props.customer.phone}`">
          <span class="material-symbols-outlined text-base">call</span>
          <span>{{ props.customer.phone }}</span>
        </a>
      </div>
    </div>
  </article>
</template>
