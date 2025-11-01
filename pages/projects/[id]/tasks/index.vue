<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from '#imports'
import TaskCard from '~/components/TaskCard.vue'
import TaskEmptyState from '~/components/TaskEmptyState.vue'
import TaskPageHeader from '~/components/TaskPageHeader.vue'
import TaskSearch from '~/components/TaskSearch.vue'
import TaskStatusChips from '~/components/TaskStatusChips.vue'
import { TASK_STATUS_FILTERS, useProjectTasks, type TaskStatusFilter } from '~/composables/useProjectTasks'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => String(route.params.id ?? ''))

const { project, allTasks, filteredTasks, searchQuery, activeStatus, setSearchQuery, setActiveStatus } = useProjectTasks(projectId)

const statusOptions = computed(() =>
  TASK_STATUS_FILTERS.map((option) => ({
    ...option,
    count:
      option.value === 'all'
        ? allTasks.value.length
        : allTasks.value.filter((task) => task.status === option.value).length,
  })),
)

const hasTasks = computed(() => allTasks.value.length > 0)
const hasFilteredTasks = computed(() => filteredTasks.value.length > 0)

const subtitle = computed(() => {
  if (!project.value) {
    return undefined
  }
  return `${project.value.completed} из ${project.value.total} задач выполнено`
})

const pageTitle = computed(() => {
  if (!project.value) {
    return 'Задачи'
  }
  return `Задачи • ${project.value.title}`
})

const projectsListRoute = '/'

const handleBack = () => {
  router.push(projectsListRoute)
}

const getReturnPath = () => {
  const fallbackPath = `/projects/${projectId.value}/tasks`
  const returnPath = typeof route.fullPath === 'string' && route.fullPath.length > 0 ? route.fullPath : fallbackPath

  return { fallbackPath, returnPath }
}

const handleAddTask = () => {
  const { returnPath } = getReturnPath()

  router.push({
    path: `/projects/${projectId.value}/tasks/new`,
    query: {
      from: returnPath,
    },
  })
}

const handleEditProject = () => {
  if (!project.value) {
    return
  }

  const { fallbackPath, returnPath } = getReturnPath()

  router.push({
    path: '/projects/new',
    query: {
      from: returnPath,
      edit: projectId.value,
      fallback: fallbackPath,
    },
  })
}

const handleSearchUpdate = (value: string) => {
  setSearchQuery(value)
}

const handleStatusChange = (value: string) => {
  setActiveStatus(value as TaskStatusFilter)
}

useHead({
  title: pageTitle,
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
    class="relative flex min-h-screen w-full flex-col bg-background-light text-black transition-colors dark:bg-background-dark dark:text-white"
    :style="{ backgroundColor: 'var(--telegram-background-color, #f6f6f8)' }"
  >
    <TaskPageHeader
      :title="project?.title ?? 'Задачи'"
      :subtitle="subtitle"
      @back="handleBack"
      @edit="handleEditProject"
    />

    <main class="flex-1 px-4 pb-24">
      <section v-if="project" class="space-y-4 py-4">
        <TaskSearch :model-value="searchQuery" @update:model-value="handleSearchUpdate" />
        <TaskStatusChips :model-value="activeStatus" :options="statusOptions" @update:model-value="handleStatusChange" />

        <div class="flex flex-col gap-4 pt-2">
          <template v-if="hasTasks">
            <ul v-if="hasFilteredTasks" class="flex flex-col gap-4" role="list">
              <li v-for="task in filteredTasks" :key="task.id" role="listitem">
                <TaskCard :task="task" />
              </li>
            </ul>
            <TaskEmptyState
              v-else
              icon="manage_search"
              title="Нет задач по выбранным параметрам"
              description="Измените фильтры или попробуйте другой запрос."
            />
          </template>
          <TaskEmptyState v-else />
        </div>
      </section>

      <section v-else class="py-10">
        <TaskEmptyState
          icon="search_off"
          title="Проект не найден"
          description="Проект недоступен или был удалён. Вернитесь к списку проектов, чтобы выбрать другой."
        />
        <div class="mt-6 flex justify-center">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="handleBack"
          >
            <span class="material-symbols-outlined !text-base">arrow_back</span>
            Вернуться на главную
          </button>
        </div>
      </section>
    </main>

    <button
      type="button"
      class="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label="Добавить задачу"
      @click="handleAddTask"
    >
      <span class="material-symbols-outlined !text-3xl">add</span>
    </button>
  </div>
</template>
