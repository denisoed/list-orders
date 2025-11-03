<template>
  <NuxtLayout>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useTelegram } from '~/composables/useTelegram'
import { useUserStore, type User } from '~/stores/user'

const { getInitData, getStartParam } = useTelegram()
const router = useRouter()
const route = useRoute()

onBeforeMount(async () => {
  const initData = getInitData()
  if (initData) {
    try {
      const response = await $fetch<{ success: boolean; user: User | null }>('/api/user', {
        method: 'POST',
        body: { initData },
      })

      // After successful validation, set user data directly from response
      if (response.user) {
        const userStore = useUserStore()
        userStore.setUser(response.user)
      }
    } catch (error) {
      console.warn('[Telegram] Failed to send initData to server', error)
    }
  }

  // Handle start_param for deep linking to order details
  const startParam = getStartParam()
  if (startParam) {
    // Check if we're already on the order details page for this order
    const currentOrderId = route.params.id
    const isOrderDetailsPage = route.path.startsWith('/orders/')
    
    // Only redirect if we're not already on the target page
    if (!isOrderDetailsPage || currentOrderId !== startParam) {
      router.push(`/orders/${startParam}`)
    }
  }
})
</script>