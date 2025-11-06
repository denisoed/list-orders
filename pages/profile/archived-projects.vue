<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHead, useRouter } from '#imports'
import { useProjects } from '~/composables/useProjects'
import type { Project } from '~/data/projects'
import DataLoadingIndicator from '~/components/DataLoadingIndicator.vue'

const router = useRouter()
const { archivedProjects, fetchArchivedProjects, unarchiveProject, isLoadingArchived, isUpdating } = useProjects()

const isUnarchiving = ref<string | null>(null)
const error = ref<string | null>(null)

// Load archived projects on mount
onMounted(async () => {
  try {
    await fetchArchivedProjects()
  } catch (err) {
    console.error('Failed to load archived projects:', err)
    error.value = 'Не удалось загрузить заархивированные проекты'
  }
})

const hasProjects = computed(() => archivedProjects.value.length > 0)

const declOfNum = (count: number, forms: [string, string, string]) => {
  const mod100 = count % 100
  if (mod100 > 4 && mod100 < 20)
    return forms[2]

  const mod10 = count % 10
  if (mod10 === 1)
    return forms[0]
  if (mod10 >= 2 && mod10 <= 4)
    return forms[1]

  return forms[2]
}

const formatOrderCount = (project: Project) => {
  const count = project.total || 0
  return `${count} ${declOfNum(count, ['задача', 'задачи', 'задач'])}`
}

const formatParticipantCount = (project: Project) => {
  const count = project.membersCount ?? 0
  return `${count} ${declOfNum(count, ['участник', 'участника', 'участников'])}`
}

const handleUnarchive = async (project: Project) => {
  if (isUnarchiving.value) {
    return
  }

  isUnarchiving.value = project.id
  error.value = null

  try {
    await unarchiveProject(project.id)
    // Remove from archived list (it will be moved to active projects)
    const index = archivedProjects.value.findIndex((p) => p.id === project.id)
    if (index !== -1) {
      archivedProjects.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Failed to unarchive project:', err)
    error.value = 'Не удалось разархивировать проект'
  } finally {
    isUnarchiving.value = null
  }
}

useHead({
  title: 'Заархивированные проекты',
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
    <header
      class="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-background-light/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        aria-label="Вернуться назад"
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col text-left">
        <h1 class="line-clamp-1 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          Заархивированные проекты
        </h1>
        <p class="text-sm text-gray-500 dark:text-[#9da6b9]">Проекты, которые вы заархивировали</p>
      </div>

      <div class="flex w-12 shrink-0 items-center justify-end"></div>
    </header>

    <main class="flex-1 px-4 pt-4">
      <div v-if="error" class="mb-4 rounded-xl border border-red-300/50 bg-red-500/10 p-4 text-sm text-red-200">
        {{ error }}
      </div>

      <DataLoadingIndicator v-if="isLoadingArchived" message="Загрузка заархивированных проектов..." />

      <div v-else-if="hasProjects" class="flex flex-col gap-3 pb-24">
        <div
          v-for="project in archivedProjects"
          :key="project.id"
          class="group flex flex-col gap-4 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-[#1C2431]/80"
        >
          <div class="flex items-start gap-3">
            <div class="flex items-start gap-2 flex-1" :class="{ 'items-center': !project.description }">
              <div
                class="flex size-12 shrink-0 items-center justify-center rounded-xl transition group-hover:opacity-80"
                :style="project.color ? { backgroundColor: project.color + '20', color: project.color } : {}"
                :class="!project.color && 'bg-black/5 text-black dark:bg-white/10 dark:text-white group-hover:bg-black/10 dark:group-hover:bg-white/15'"
              >
                <span class="material-symbols-outlined text-2xl">archive</span>
              </div>
              <div class="flex-1 space-y-1">
                <p class="text-base font-semibold leading-tight text-zinc-900 dark:text-white">
                  {{ project.title }}
                </p>
                <p v-if="project.description" class="text-sm leading-6 text-gray-500 dark:text-[#9da6b9]">
                  {{ project.description }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-primary">checklist</span>
              {{ formatOrderCount(project) }}
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-primary">group</span>
              {{ formatParticipantCount(project) }}
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="w-full inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isUnarchiving === project.id || isUpdating"
              @click="handleUnarchive(project)"
            >
              <span v-if="isUnarchiving === project.id" class="material-symbols-outlined text-base animate-spin">hourglass_empty</span>
              <span v-else class="material-symbols-outlined text-base">unarchive</span>
              {{ isUnarchiving === project.id ? 'Разархивирование…' : 'Разархивировать' }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-else-if="!isLoadingArchived"
        class="mx-auto mt-20 flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600 dark:border-gray-700 dark:bg-[#1C2431] dark:text-[#9da6b9]"
      >
        <span class="material-symbols-outlined text-5xl text-primary">archive</span>
        <div class="space-y-2">
          <p class="text-lg font-semibold text-black dark:text-white">Нет заархивированных проектов</p>
          <p class="max-w-sm text-sm leading-6 text-gray-500 dark:text-[#9da6b9]">
            Заархивированные проекты будут отображаться здесь. Вы можете архивировать проекты из списка проектов.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

