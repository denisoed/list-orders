<script setup lang="ts">
import { computed } from 'vue'
import type { OrderTimelineEvent } from '~/data/orders'
import { formatDateTime } from '~/utils/formatters'

const props = defineProps<{
  events: OrderTimelineEvent[]
}>()

const sortedEvents = computed(() =>
  [...props.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
)
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white/60 p-4 dark:bg-white/5">
    <header>
      <h2 class="text-base font-semibold text-gray-900 dark:text-white">История</h2>
    </header>

    <p v-if="sortedEvents.length === 0" class="rounded-lg bg-gray-100/70 p-4 text-sm text-gray-500 dark:bg-white/10 dark:text-gray-400">
      История действий пока пустая. Как только по заказу появятся события, они отобразятся здесь.
    </p>

    <ol v-else class="space-y-4">
      <li v-for="event in sortedEvents" :key="event.id" class="flex gap-4">
        <div class="flex flex-col items-center">
          <span class="flex size-9 items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white">
            <span class="material-symbols-outlined text-base">{{ event.icon }}</span>
          </span>
          <div class="mt-1 w-px flex-1 bg-gray-200 dark:bg-white/10"></div>
        </div>
        <div class="flex-1 pb-4">
          <p class="text-sm text-gray-900 dark:text-white">
            <span class="font-semibold">{{ event.actor }}</span>
            {{ event.action }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(event.timestamp) }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>
