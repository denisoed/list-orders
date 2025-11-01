<script setup lang="ts">
import { computed } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import { useProjectTeam } from '~/composables/useProjectTeam'
import { useProjectsState } from '~/composables/useProjectTasks'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''
})

const projectsState = useProjectsState()
const project = computed(() => projectsState.value.find((item) => item.id === projectId.value))
const projectTitle = computed(() => project.value?.title ?? 'Проект')

const { filteredMembers, members, memberCount, searchQuery, setSearchQuery } = useProjectTeam(projectId)

const memberCountLabel = computed(() => {
  const count = memberCount.value
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} участник`
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} участника`
  }

  return `${count} участников`
})

const hasMembers = computed(() => members.value.length > 0)
const filteredHasItems = computed(() => filteredMembers.value.length > 0)

const backPath = computed(() => {
  const from = route.query.from
  if (typeof from === 'string' && from.length > 0) {
    return from
  }
  return projectId.value.length > 0 ? `/projects/${projectId.value}/tasks` : '/projects/new'
})

const handleBack = () => {
  router.push(backPath.value)
}

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  setSearchQuery(target.value)
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
    <header class="sticky top-0 z-10 bg-white/90 px-4 pb-3 pt-4 shadow-sm backdrop-blur-sm dark:bg-background-dark/80">
      <div class="flex items-center justify-between">
        <button
          type="button"
          class="flex size-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-black/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-white/70 dark:hover:bg-white/5"
          aria-label="Вернуться к проекту"
          @click="handleBack"
        >
          <span class="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 class="flex-1 text-center text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
          Управление командой
        </h1>
        <div class="flex size-10 shrink-0 items-center justify-center"></div>
      </div>
      <p class="mt-2 text-center text-sm text-gray-500 dark:text-[#9da6b9]">
        {{ projectTitle }} · {{ memberCountLabel }}
      </p>
      <div class="mt-3">
        <label class="relative flex h-11 w-full items-center">
          <span class="material-symbols-outlined pointer-events-none absolute left-3.5 text-2xl text-gray-400 dark:text-[#9da6b9]">
            search
          </span>
          <input
            :value="searchQuery"
            class="form-input h-full w-full rounded-xl border-none bg-white pl-11 pr-4 text-base leading-normal text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-[#1c2431] dark:text-white dark:placeholder:text-[#9da6b9]"
            type="search"
            placeholder="Поиск по имени"
            enterkeyhint="search"
            @input="handleSearchInput"
          />
        </label>
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
