<script setup lang="ts">
import { useAllProjects } from '~/composables/useProjectTasks'
import type { Project } from '~/data/projects'

const route = useRoute()
const projects = useAllProjects()
const router = useRouter()

const visibleProjects = computed<Project[]>(() => {
  return route.query.empty === 'true' ? [] : projects.value
})

const hasProjects = computed(() => visibleProjects.value.length > 0)

const userProfile = computed(() => {
  const showEmptyAvatar = route.query.noAvatar === 'true'

  return {
    name: 'Анна Смирнова',
    profileUrl: '/profile',
    avatarUrl: showEmptyAvatar ? null : 'https://i.pravatar.cc/160?img=5',
  }
})

const calculateProgress = (project: Project) => {
  if (project.total === 0) {
    return 0
  }
  return Math.min(100, (project.completed / project.total) * 100)
}

const formatProgressLabel = (project: Project) => {
  return `${project.completed} из ${project.total} задач выполнено`
}

const formatProgressPercent = (project: Project) => {
  return `${Math.round(calculateProgress(project))}%`
}

const handleAddProject = () => {
  router.push('/projects/new')
}

useHead({
  title: 'Мои проекты',
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
    <ProjectsPageHeader
      title="Мои проекты"
      :profile-url="userProfile.profileUrl"
      :avatar-url="userProfile.avatarUrl"
      :user-name="userProfile.name"
    />

    <main class="flex-1 px-4 pt-4">
      <div v-if="hasProjects" class="flex flex-col gap-3">
        <NuxtLink
          v-for="project in visibleProjects"
          :key="project.id"
          :to="`/projects/${project.id}/tasks`"
          class="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm transition-shadow hover:shadow-lg focus-visible:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/10 dark:bg-[#1C2431]/80"
          :aria-label="`Перейти к задачам проекта «${project.title}»`"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-black/5 text-black transition group-hover:bg-black/10 dark:bg-white/10 dark:text-white dark:group-hover:bg-white/15"
            >
              <span class="material-symbols-outlined text-2xl">folder</span>
            </div>
            <div class="flex-1 space-y-1">
              <p class="text-base font-semibold leading-tight text-zinc-900 dark:text-white">
                {{ project.title }}
              </p>
              <p class="text-sm leading-6 text-gray-500 dark:text-[#9da6b9]">
                {{ project.description }}
              </p>
            </div>
            <span
              class="material-symbols-outlined shrink-0 text-gray-400 transition group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400"
            >
              chevron_right
            </span>
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-primary">check_circle</span>
                {{ formatProgressLabel(project) }}
              </span>
              <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-[#9da6b9]">
                {{ formatProgressPercent(project) }}
              </span>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-[#3b4354]">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${calculateProgress(project)}%` }"
              ></div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div
        v-else
        class="mx-auto mt-20 flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600 dark:border-gray-700 dark:bg-[#1C2431] dark:text-[#9da6b9]"
      >
        <span class="material-symbols-outlined text-5xl text-primary">folder_off</span>
        <div class="space-y-2">
          <p class="text-lg font-semibold text-black dark:text-white">Проектов пока нет</p>
          <p class="max-w-sm text-sm leading-6 text-gray-500 dark:text-[#9da6b9]">
            Создайте первый проект, чтобы начать работу с задачами и отслеживать прогресс вашей команды.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="handleAddProject"
        >
          <span class="material-symbols-outlined !text-base">add</span>
          Создать проект
        </button>
      </div>
    </main>

    <div class="fixed bottom-5 right-5 z-20">
      <button
        type="button"
        class="flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Добавить проект"
        @click="handleAddProject"
      >
        <span class="material-symbols-outlined !text-3xl">add</span>
      </button>
    </div>
  </div>
</template>
