<script setup lang="ts">
interface Project {
  id: string
  title: string
  completed: number
  total: number
}

const projects = ref<Project[]>([
  { id: 'design-refresh', title: 'Разработка нового дизайна', completed: 5, total: 12 },
  { id: 'marketing-q4', title: 'Маркетинговая кампания Q4', completed: 22, total: 25 },
  { id: 'api-upgrade', title: 'Обновление API сервера', completed: 2, total: 10 },
])

const hasProjects = computed(() => projects.value.length > 0)

const calculateProgress = (project: Project) => {
  if (project.total === 0) {
    return 0
  }
  return Math.min(100, (project.completed / project.total) * 100)
}

const formatProgressLabel = (project: Project) => {
  return `${project.completed} из ${project.total} задач выполнено`
}

const handleAddProject = () => {
  // Здесь будет логика добавления проекта
  console.info('Открыть создание нового проекта')
}

useHead({
  title: 'Мои проекты',
  htmlAttrs: {
    lang: 'ru',
    class: 'dark',
  },
  bodyAttrs: {
    class: 'bg-background-light dark:bg-background-dark font-display',
    style: 'min-height: max(884px, 100dvh);',
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
  <div class="relative flex min-h-screen w-full flex-col bg-background-light text-black dark:bg-background-dark dark:text-white">
    <NuxtRouteAnnouncer />
    <header class="sticky top-0 z-10 flex items-center justify-between bg-background-light/80 p-4 pb-2 backdrop-blur-sm dark:bg-background-dark/80">
      <h1 class="flex-1 text-lg font-bold leading-tight tracking-[-0.015em]">Мои проекты</h1>
      <div class="flex items-center">
        <button
          type="button"
          class="flex size-12 items-center justify-center text-black transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-white"
          aria-label="Поиск по проектам"
        >
          <span class="material-symbols-outlined">search</span>
        </button>
      </div>
    </header>

    <main class="flex-1 px-4 pt-4 pb-24">
      <div v-if="hasProjects" class="flex flex-col gap-2">
        <a
          v-for="project in projects"
          :key="project.id"
          href="#"
          class="flex cursor-pointer items-center gap-4 rounded-lg bg-white p-3 transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-[#1C2431] dark:hover:bg-white/5"
        >
          <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-[#282e39]">
            <span class="material-symbols-outlined text-gray-600 dark:text-gray-300">folder</span>
          </div>
          <div class="flex flex-1 flex-col justify-center gap-1">
            <p class="text-base font-medium leading-normal">{{ project.title }}</p>
            <p class="text-sm font-normal leading-normal text-gray-500 dark:text-[#9da6b9]">
              {{ formatProgressLabel(project) }}
            </p>
            <div class="mt-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-[#3b4354]">
              <div class="h-1 rounded-full bg-primary" :style="{ width: `${calculateProgress(project)}%` }"></div>
            </div>
          </div>
          <span class="shrink-0 text-gray-400 dark:text-gray-600">
            <span class="material-symbols-outlined">chevron_right</span>
          </span>
        </a>
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
