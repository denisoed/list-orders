<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import { useProjectTeam } from '~/composables/useProjectTeam'
import { useProjectsStore } from '~/stores/projects'
import { useProjects } from '~/composables/useProjects'
import { useTelegram } from '~/composables/useTelegram'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''
})

const projectsStore = useProjectsStore()
const project = computed(() => projectId.value ? projectsStore.getProjectById(projectId.value) : undefined)
const { fetchProject } = useProjects()
const projectIdRef = computed(() => projectId.value || '')
const { members, fetchMembers } = useProjectTeam(projectIdRef)
const { getInitData } = useTelegram()

const isLoading = ref(true)
const isAdding = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const checkAndAddMember = async () => {
  if (!projectId.value) {
    error.value = 'ID проекта не указан'
    isLoading.value = false
    return
  }

  const initData = getInitData()
  if (!initData || typeof initData !== 'string' || !initData.trim()) {
    error.value = 'Необходима авторизация через Telegram'
    isLoading.value = false
    return
  }

  // Ensure initData is valid (contains hash and auth_date)
  if (!initData.includes('hash=') || !initData.includes('auth_date=')) {
    error.value = 'Недействительные данные авторизации'
    isLoading.value = false
    return
  }

  try {
    // Get current user's telegram_id from initData
    const response = await $fetch<{ success: boolean; user: { telegram_id: number } | null }>('/api/user', {
      method: 'POST',
      headers: {
        'x-telegram-init-data': initData,
      },
      body: {
        initData,
      },
    })

    if (!response?.user?.telegram_id) {
      error.value = 'Не удалось получить данные пользователя'
      isLoading.value = false
      return
    }

    const userTelegramId = response.user.telegram_id

    // Add user to project
    isAdding.value = true
    try {
      // Re-get initData to ensure it's still valid
      const currentInitData = getInitData()
      if (!currentInitData || typeof currentInitData !== 'string') {
        throw new Error('Недействительные данные авторизации')
      }

      await $fetch(`/api/projects/${projectId.value}/members`, {
        method: 'POST',
        headers: {
          'x-telegram-init-data': currentInitData,
        },
        body: {
          initData: currentInitData,
          memberTelegramId: userTelegramId,
          role: 'Участник',
        },
      })

      success.value = true
      // Refresh members list
      await fetchMembers()
      // Load project to display its title (user now has access)
      try {
        await fetchProject(projectId.value)
      } catch (err) {
        // Ignore errors when loading project for display
        console.warn('Failed to load project for display:', err)
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/projects/${projectId.value}/orders`)
      }, 2000)
    } catch (err: any) {
      if (err.statusCode === 409) {
        // User is already a member (race condition)
        success.value = true
        await fetchMembers()
        // Load project to display its title (user now has access)
        try {
          await fetchProject(projectId.value)
        } catch (fetchErr) {
          // Ignore errors when loading project for display
          console.warn('Failed to load project for display:', fetchErr)
        }
        setTimeout(() => {
          router.push(`/projects/${projectId.value}/orders`)
        }, 2000)
      } else {
        error.value = err.data?.message || 'Не удалось добавить вас в проект'
      }
    } finally {
      isAdding.value = false
      isLoading.value = false
    }
  } catch (err: any) {
    console.error('Failed to add member:', err)
    error.value = err.data?.message || 'Произошла ошибка при обработке приглашения'
    isLoading.value = false
  }
}

onMounted(() => {
  checkAndAddMember()
})

useHead({
  title: 'Приглашение в проект',
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
    class="relative flex min-h-screen w-full flex-col items-center justify-center bg-background-light text-black dark:bg-background-dark dark:text-white px-4"
    :style="{ backgroundColor: 'var(--telegram-background-color, #f6f6f8)' }"
  >
    <div class="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-[#1C2431]">
      <div v-if="isLoading || isAdding" class="flex flex-col items-center gap-4">
        <span class="material-symbols-outlined text-5xl animate-spin text-primary">hourglass_empty</span>
        <p class="text-center text-base text-zinc-700 dark:text-zinc-300">
          {{ isAdding ? 'Добавление в проект...' : 'Обработка приглашения...' }}
        </p>
      </div>

      <div v-else-if="error" class="flex flex-col items-center gap-4">
        <span class="material-symbols-outlined text-5xl text-red-500">error</span>
        <p class="text-center text-base font-medium text-zinc-900 dark:text-white">
          Ошибка
        </p>
        <p class="text-center text-sm text-zinc-600 dark:text-zinc-400">
          {{ error }}
        </p>
        <button
          type="button"
          class="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          @click="checkAndAddMember"
        >
          Попробовать снова
        </button>
      </div>

      <div v-else-if="success" class="flex flex-col items-center gap-4">
        <span class="material-symbols-outlined text-5xl text-green-500">check_circle</span>
        <p class="text-center text-base font-medium text-zinc-900 dark:text-white">
          Вы успешно добавлены в проект{{ project ? ` «${project.title}»` : '' }}!
        </p>
        <p class="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Перенаправление...
        </p>
      </div>
    </div>
  </div>
</template>

