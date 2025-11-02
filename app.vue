<template>
  <NuxtLayout>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useTelegram } from '~/composables/useTelegram'
import { useUserStore } from '~/stores/user'

const { getInitData } = useTelegram()

onBeforeMount(async () => {
  const initData = getInitData()
  if (initData) {
    try {
      const response = await $fetch<{ success: boolean; telegram_id: number | null }>('/api/telegram/validate-init-data', {
        method: 'POST',
        body: { initData },
      })

      // After successful validation, fetch user data using telegram_id from response
      if (response.telegram_id && typeof response.telegram_id === 'number') {
        const userStore = useUserStore()
        // Fetch user in background, errors are logged but don't block initialization
        userStore.fetchUser(response.telegram_id).catch((error: unknown) => {
          console.warn('[Telegram] Failed to fetch user after validation:', error)
        })
      }
    } catch (error) {
      console.warn('[Telegram] Failed to send initData to server', error)
    }
  }
})
</script>