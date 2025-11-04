<script setup lang="ts">
import { computed, watch } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import SearchField from '~/components/SearchField.vue'
import { useProjectTeam } from '~/composables/useProjectTeam'
import { useProjectsState } from '~/composables/useProjectTasks'
import { useProjects } from '~/composables/useProjects'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''
})

const projectsState = useProjectsState()
const project = computed(() => projectsState.value.find((item) => item.id === projectId.value))
const { filteredMembers, members, searchQuery, setSearchQuery } = useProjectTeam(projectId)
const { fetchProject } = useProjects()

// Load project if not found in local state
watch(
  [projectId, project],
  async ([id, currentProject]) => {
    if (id && !currentProject) {
      try {
        await fetchProject(id)
      } catch (error) {
        console.error('Failed to load project:', error)
      }
    }
  },
  { immediate: true },
)

const hasMembers = computed(() => members.value.length > 0)
const filteredHasItems = computed(() => filteredMembers.value.length > 0)

const backPath = computed(() => {
  const from = route.query.from
  if (typeof from === 'string' && from.length > 0) {
    return from
  }
  return projectId.value.length > 0 ? `/projects/${projectId.value}/tasks` : '/projects/new'
})

const handleSearchUpdate = (value: string) => {
  setSearchQuery(value)
}

const handleOpenProfile = (memberId: string) => {
  router.push({
    path: `/profile/${memberId}`,
    query: {
      from: route.fullPath,
      projectId: projectId.value,
    },
  })
}

useHead({
  title: 'Управление командой',
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
    :style="{ backgroundColor: 'var(--tg-theme-bg-color, var(--telegram-background-color, #101622))' }"
  >
    <header
      class="sticky top-0 z-20 flex flex-col bg-background-light/95 px-4 pb-3 pt-4 backdrop-blur-sm transition-colors dark:bg-background-dark/80"
      :style="{ backgroundColor: 'var(--telegram-header-color, rgba(246, 246, 248, 0.95))' }"
    >
      <div class="flex items-center justify-between gap-3">
        <button
          type="button"
          class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/5"
          aria-label="Вернуться к проекту"
          @click="$router.back()"
        >
          <span class="material-symbols-outlined text-3xl">arrow_back</span>
        </button>
        <div class="flex flex-1 flex-col items-start text-left">
          <h1 class="text-lg font-bold leading-tight tracking-[-0.015em] text-zinc-900 dark:text-white">Управление командой</h1>
        </div>
        <div class="flex size-12 shrink-0 items-center justify-center"></div>
      </div>
      <div class="mt-3">
        <SearchField
          :model-value="searchQuery"
          placeholder="Поиск по имени"
          aria-label="Поиск по имени"
          @update:model-value="handleSearchUpdate"
        />
      </div>
    </header>

    <main class="flex-1 px-4 pt-3 pb-24">
      <div v-if="!project" class="mt-10 rounded-xl border border-red-300/50 bg-red-500/10 p-4 text-sm text-red-200">
        Проект не найден. Проверьте ссылку и вернитесь назад.
      </div>
      <template v-else>
        <div v-if="!hasMembers" class="mt-12 text-center text-gray-500 dark:text-[#9da6b9]">
          В команде ещё нет участников. Добавьте коллег, чтобы начать сотрудничество.
        </div>
        <div v-else>
          <div v-if="filteredHasItems" class="flex flex-col gap-2">
            <TeamMemberCard
              v-for="member in filteredMembers"
              :key="member.id"
              :name="member.name"
              :role="member.role"
              :avatar-url="member.avatarUrl"
              :action-aria-label="`Открыть действия для ${member.name}`"
              :profile-aria-label="`Открыть профиль ${member.name}`"
              @open-profile="handleOpenProfile(member.id)"
            />
          </div>
          <div v-else class="mt-12 text-center text-gray-500 dark:text-[#9da6b9]">
            Не найдено участников по запросу «{{ searchQuery }}».
          </div>
        </div>
      </template>
    </main>

    <div class="fixed bottom-6 right-6">
      <button
        type="button"
        class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95"
        aria-label="Добавить участника"
      >
        <span class="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  </div>
</template>
