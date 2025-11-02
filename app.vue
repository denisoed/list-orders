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

const { getInitData } = useTelegram()

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
})
</script>