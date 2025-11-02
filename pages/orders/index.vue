<script setup lang="ts">
import { computed } from 'vue'
import OrderListCard from '~/components/orders/OrderListCard.vue'
import { useOrdersState } from '~/composables/useOrderDetails'

const route = useRoute()

const orders = useOrdersState()

const sanitizedQuery = computed(() => {
  const entries = Object.entries(route.query).filter(([key]) => key !== 'state')
  return entries.reduce<Record<string, string | string[]>>((acc, [key, value]) => {
    if (value == null) {
      return acc
    }

    acc[key] = Array.isArray(value) ? value : value
    return acc
  }, {})
})

const encodedState = computed(() => {
  const state = {
    path: route.path || '/orders',
    query: sanitizedQuery.value,
  }

  try {
    return encodeURIComponent(JSON.stringify(state))
  } catch (error) {
    console.warn('[orders] не удалось сериализовать состояние списка', error)
    return undefined
  }
})

const buildOrderLink = (id: string) => {
  const state = encodedState.value

  return {
    path: `/orders/${id}`,
    query: state ? { state } : undefined,
  }
}

useHead({
  title: 'Заказы',
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
    <header class="sticky top-0 z-20 border-b border-white/10 bg-background-light/95 px-4 py-4 backdrop-blur dark:bg-background-dark/95">
      <h1 class="text-lg font-semibold leading-tight">Заказы</h1>
    </header>

    <main class="flex-1 space-y-6 px-4 py-6">
      <section class="space-y-4">
        <h2 class="text-sm font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Активные заказы</h2>
        <ul class="flex flex-col gap-4" role="list">
          <li v-for="order in orders" :key="order.id" role="listitem">
            <OrderListCard :order="order" :to="buildOrderLink(order.id)" />
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>
