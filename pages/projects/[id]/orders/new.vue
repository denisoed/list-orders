<script setup lang="ts">
import { computed } from 'vue'
import { navigateTo, useRoute } from '#imports'

const route = useRoute()

const targetQuery = computed(() => {
  const query: Record<string, string> = {}

  const projectIdParam = route.params.id
  if (typeof projectIdParam === 'string' && projectIdParam.trim().length > 0) {
    query.projectId = projectIdParam
  }

  const orderIdParam = route.query.orderId
  if (typeof orderIdParam === 'string' && orderIdParam.length > 0) {
    query.orderId = orderIdParam
  }

  const fromParam = route.query.from
  if (typeof fromParam === 'string' && fromParam.length > 0) {
    query.from = fromParam
  }

  const fallbackParam = route.query.fallback
  if (typeof fallbackParam === 'string' && fallbackParam.length > 0) {
    query.fallback = fallbackParam
  }

  return query
})

await navigateTo(
  {
    path: '/orders/new',
    query: targetQuery.value,
  },
  { replace: true },
)
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background-dark text-white">
    <p class="text-sm text-[#9da6b9]">Перенаправление…</p>
  </div>
</template>
