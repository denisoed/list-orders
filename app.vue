<template>
  <NuxtLayout>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTelegram } from '~/composables/useTelegram'
import { useUserStore, type User } from '~/stores/user'

const { getStartParam, getInitData } = useTelegram()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

onMounted(async () => {
  try {
    const initData = getInitData()
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const response = await $fetch<{ success: boolean; user: User | null }>('/api/user', {
      method: 'POST',
      body: { initData, timeZone },
    })

    // After successful validation, set user data directly from response
    if (response.user) {
      userStore.setUser(response.user)
    }
  } catch (error) {
    console.warn('[Telegram] Failed to send initData to server', error)
  }

  // Handle start_param for deep linking
  const startParam = getStartParam()
  if (startParam) {
    // Check if it's an invite link (format: invite_{projectId})
    if (startParam.startsWith('invite_')) {
      const projectId = startParam.replace('invite_', '')
      const currentProjectId = route.params.id
      const isInvitePage = route.path.startsWith(`/projects/${projectId}/invite`)
      
      // Only redirect if we're not already on the target invite page
      if (!isInvitePage || currentProjectId !== projectId) {
        router.push(`/projects/${projectId}/invite`)
      }
    } else {
      // Handle order details deep linking
      const currentOrderId = route.params.id
      const isOrderDetailsPage = route.path.startsWith('/orders/')
      
      // Only redirect if we're not already on the target page
      if (!isOrderDetailsPage || currentOrderId !== startParam) {
        router.push(`/orders/${startParam}`)
      }
    }
  }
})
</script>