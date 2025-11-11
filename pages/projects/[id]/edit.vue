<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import { useProjects } from '~/composables/useProjects'
import { useProjectsStore } from '~/stores/projects'
import { useUserStore } from '~/stores/user'
import ConfirmationModal from '~/components/ConfirmationModal.vue'
import type { ProjectFeaturesSettings } from '~/data/projects'

type TabId = 'general' | 'links' | 'metrics'

interface TabDefinition {
  id: TabId
  label: string
  disabled?: boolean
}

const router = useRouter()
const route = useRoute()
const projectsStore = useProjectsStore()
const userStore = useUserStore()
const { updateProject, archiveProject, isUpdating } = useProjects()

const title = ref('')
const description = ref('')
const color = ref('#3B82F6')
const featuresSettings = ref<ProjectFeaturesSettings>({ requireReview: false })
const titleTouched = ref(false)
const submitAttempted = ref(false)
const submitError = ref('')
const isSubmittingLocal = ref(false)
const isArchiving = ref(false)
const archiveError = ref('')
const isArchiveModalOpen = ref(false)
const activeTab = ref<TabId>('general')

const tabs: TabDefinition[] = [
  { id: 'general', label: 'Основное' },
  { id: 'links', label: 'Настройки' },
  { id: 'metrics', label: 'Метрики' },
]

const internalTabs: TabId[] = ['general', 'links']

const resolveTabFromQuery = (value: unknown): TabId => {
  if (typeof value === 'string' && internalTabs.includes(value as TabId)) {
    return value as TabId
  }

  if (Array.isArray(value) && value.length > 0) {
    const [first] = value
    if (typeof first === 'string' && internalTabs.includes(first as TabId)) {
      return first as TabId
    }
  }

  return 'general'
}

const projectId = computed(() => {
  const { id } = route.params
  if (Array.isArray(id)) {
    return id[0] ?? ''
  }
  return typeof id === 'string' ? id : ''
})

const editableProject = computed(() => {
  if (!projectId.value) {
    return undefined
  }
  return projectsStore.getProjectById(projectId.value)
})

const projectNotFound = computed(() => projectId.value.length > 0 && !editableProject.value)

const titleError = computed(() => {
  if (title.value.trim().length > 0) {
    return ''
  }
  return 'Введите название проекта'
})

const showTitleError = computed(() => (titleTouched.value || submitAttempted.value) && Boolean(titleError.value))
const isSubmitting = computed(() => isSubmittingLocal.value || isUpdating.value)
const isSubmitDisabled = computed(() => isSubmitting.value || Boolean(titleError.value) || projectNotFound.value)

const fallbackPath = computed(() => {
  const fallback = route.query.fallback
  if (typeof fallback === 'string' && fallback.length > 0) {
    return fallback
  }
  return ''
})

const returnPath = computed(() => {
  const from = route.query.from
  if (typeof from === 'string' && from.length > 0) {
    return from
  }
  if (fallbackPath.value.length > 0) {
    return fallbackPath.value
  }
  if (editableProject.value) {
    return `/projects/${editableProject.value.id}/orders`
  }
  return '/'
})

const inviteProjectId = computed(() => editableProject.value?.id ?? '')

const isProjectOwner = computed(() => {
  if (!editableProject.value || !userStore.user) {
    return false
  }
  return editableProject.value.ownerTelegramId === userStore.user.telegram_id
})

const isProjectArchived = computed(() => editableProject.value?.archived === true)

const submitButtonText = computed(() => (isSubmitting.value ? 'Сохранение…' : 'Сохранить изменения'))

const pageTitle = 'Настройки проекта'
const closeAriaLabel = 'Закрыть редактирование проекта'

const updateTabQuery = (tabId: TabId) => {
  const query = { ...route.query }

  if (tabId === 'general') {
    if (!('tab' in query)) {
      return
    }

    delete query.tab
  } else {
    if (query.tab === tabId) {
      return
    }

    query.tab = tabId
  }

  router.replace({
    path: route.path,
    query,
  })
}

const selectTab = (tab: TabDefinition) => {
  if (tab.disabled) {
    return
  }

  if (tab.id === 'metrics') {
    if (!projectId.value) {
      return
    }

    const metricsQuery: Record<string, string> = { from: route.fullPath }
    const targetReturnPath = returnPath.value

    if (targetReturnPath.length > 0 && targetReturnPath !== route.fullPath) {
      metricsQuery.fallback = targetReturnPath
    }

    router.push({
      path: `/projects/${projectId.value}/metrics`,
      query: metricsQuery,
    })
    return
  }

  activeTab.value = tab.id
  updateTabQuery(tab.id)
}

const getTabButtonClasses = (tab: TabDefinition) => {
  if (tab.disabled) {
    return 'flex-1 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500/60 cursor-not-allowed'
  }
  if (activeTab.value === tab.id) {
    return 'flex-1 rounded-xl bg-primary/15 px-3 py-2 text-sm font-semibold text-white shadow-inner transition-colors'
  }
  return 'flex-1 rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white'
}

watch(
  () => route.query.tab,
  (tabQuery) => {
    const resolved = resolveTabFromQuery(tabQuery)
    if (internalTabs.includes(resolved)) {
      activeTab.value = resolved
    }
  },
  { immediate: true },
)

const handleTitleBlur = () => {
  titleTouched.value = true
}

const handleSubmit = async () => {
  submitAttempted.value = true
  submitError.value = ''

  if (titleError.value || !editableProject.value) {
    if (!editableProject.value) {
      submitError.value = 'Проект не найден. Вернитесь назад и попробуйте снова.'
    }
    return
  }

  isSubmittingLocal.value = true

  try {
    const updatedProject = await updateProject(editableProject.value.id, {
      title: title.value,
      description: description.value,
      color: color.value,
      featuresSettings: featuresSettings.value,
    })

    await router.push(returnPath.value || `/projects/${updatedProject.id}/orders`)
  } catch (error) {
    submitError.value = 'Не удалось сохранить изменения. Попробуйте ещё раз.'
  } finally {
    isSubmittingLocal.value = false
  }
}

const handleArchive = () => {
  if (!editableProject.value || isArchiving.value) {
    return
  }

  isArchiveModalOpen.value = true
}

const handleArchiveConfirm = async () => {
  if (!editableProject.value || isArchiving.value) {
    return
  }

  isArchiving.value = true
  archiveError.value = ''

  try {
    await archiveProject(editableProject.value.id)
    isArchiveModalOpen.value = false
    await router.push('/')
  } catch (error) {
    console.error('Failed to archive project:', error)
    archiveError.value = 'Не удалось заархивировать проект. Попробуйте ещё раз.'
    isArchiveModalOpen.value = false
  } finally {
    isArchiving.value = false
  }
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

watch(
  () => editableProject.value?.title,
  (projectTitle) => {
    if (projectTitle !== undefined) {
      title.value = projectTitle ?? ''
      submitError.value = ''
    }
  },
  { immediate: true },
)

watch(
  () => editableProject.value?.description,
  (projectDescription) => {
    if (projectDescription !== undefined) {
      description.value = projectDescription ?? ''
    }
  },
  { immediate: true },
)

watch(
  () => editableProject.value?.color,
  (projectColor) => {
    if (projectColor !== undefined) {
      color.value = projectColor ?? '#3B82F6'
    }
  },
  { immediate: true },
)

watch(
  () => editableProject.value?.featuresSettings,
  (projectFeaturesSettings) => {
    featuresSettings.value = projectFeaturesSettings || { requireReview: false }
  },
  { immediate: true },
)
</script>

<template>
  <div class="relative flex min-h-screen w-full flex-col bg-background-dark text-white">
    <header
      class="flex items-center justify-between border-b border-white/10 bg-background-dark/90 p-4 pb-3 backdrop-blur-sm"
    >
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/5"
        :aria-label="closeAriaLabel"
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>
      <h1 class="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em]">{{ pageTitle }}</h1>
      <div class="flex w-12 items-center justify-end"></div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 pt-4 pb-12">
      <div class="flex flex-col space-y-6">
        <div
          v-if="projectNotFound"
          class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-red-300"
        >
          Проект не найден. Возможно, он был удалён. Вернитесь назад.
        </div>

        <template v-else>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-1">
            <div class="flex gap-1" role="tablist" aria-label="Редактирование проекта">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                :class="getTabButtonClasses(tab)"
                :id="`tab-${tab.id}`"
                :aria-selected="activeTab === tab.id"
                :aria-controls="`tab-panel-${tab.id}`"
                :disabled="tab.disabled"
                role="tab"
                @click="selectTab(tab)"
              >
                <span class="flex items-center justify-center gap-2">
                  {{ tab.label }}
                  <span
                    v-if="tab.disabled"
                    class="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  >
                    скоро
                  </span>
                </span>
              </button>
            </div>
          </div>

          <section
            v-if="activeTab === 'general'"
            id="tab-panel-general"
            role="tabpanel"
            aria-labelledby="tab-general"
            class="space-y-6"
          >
            <label class="flex flex-col">
              <p class="pb-2 text-base font-medium leading-normal">Название проекта</p>
              <input
                v-model="title"
                class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
                type="text"
                placeholder="Введите название проекта"
                :aria-invalid="showTitleError"
                enterkeyhint="done"
                @blur="handleTitleBlur"
              />
              <p v-if="showTitleError" class="pt-1 text-sm text-red-400">{{ titleError }}</p>
            </label>
            <ColorSelector v-model="color" />
            <label class="flex flex-col">
              <p class="pb-2 text-base font-medium leading-normal">Описание</p>
              <textarea
                v-model="description"
                class="form-input min-h-36 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Добавьте детали о проекте, цели и задачи"
                enterkeyhint="enter"
              ></textarea>
            </label>
          </section>

          <section
            v-else-if="activeTab === 'links'"
            id="tab-panel-links"
            role="tabpanel"
            aria-labelledby="tab-links"
            class="space-y-4"
          >
            <div v-if="inviteProjectId" class="rounded-xl border border-white/10 bg-white/5 p-4">
              <div class="space-y-3">
                <div>
                  <h3 class="text-base font-semibold leading-tight text-white">Список коллег</h3>
                  <p class="mt-1 text-sm text-gray-400">Управление участниками проекта</p>
                </div>
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  @click="
                    $router.push({
                      path: `/projects/${inviteProjectId}/team`,
                      query: returnPath ? { from: returnPath } : {},
                    })
                  "
                >
                  <span class="material-symbols-outlined text-base">group_add</span>
                  Открыть список коллег
                </button>
              </div>
            </div>

            <div v-if="isProjectOwner && !isProjectArchived" class="rounded-xl border border-white/10 bg-white/5 p-4">
              <div class="space-y-3">
                <div>
                  <h3 class="text-base font-semibold leading-tight text-white">Настройки функций</h3>
                  <p class="mt-1 text-sm text-gray-400">Управление функциями проекта</p>
                </div>
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  @click="
                    $router.push({
                      path: `/projects/${projectId}/settings`,
                      query: returnPath ? { from: returnPath } : {},
                    })
                  "
                >
                  <span class="material-symbols-outlined text-base">settings</span>
                  Открыть настройки проекта
                </button>
              </div>
            </div>

            <div v-if="isProjectOwner && !isProjectArchived" class="rounded-xl border border-white/10 bg-white/5 p-4">
              <div class="space-y-3">
                <div>
                  <h3 class="text-base font-semibold leading-tight text-white">Действия с проектом</h3>
                  <p class="mt-1 text-sm text-gray-400">Управление проектом</p>
                </div>
                <div v-if="archiveError" class="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
                  {{ archiveError }}
                </div>
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="isArchiving || isSubmitting"
                  @click="handleArchive"
                >
                  <span class="material-symbols-outlined text-base">archive</span>
                  Заархивировать проект
                </button>
              </div>
            </div>
          </section>
        </template>
      </div>
    </main>

    <footer class="mt-auto w-full border-t border-white/10 bg-background-dark p-4 pb-8">
      <div class="space-y-2">
        <p v-if="submitError" class="text-sm text-red-400">{{ submitError }}</p>
        <button
          type="button"
          class="w-full rounded-xl bg-primary px-5 py-4 text-center text-base font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
          :disabled="isSubmitDisabled"
          @click="handleSubmit"
        >
          {{ submitButtonText }}
        </button>
      </div>
    </footer>

    <ConfirmationModal
      :is-open="isArchiveModalOpen"
      :is-loading="isArchiving"
      title="Заархивировать проект"
      message="Вы уверены, что хотите заархивировать этот проект? Проект будет скрыт из основного списка, но его можно будет восстановить из архива."
      confirm-text="Заархивировать"
      cancel-text="Отмена"
      variant="danger"
      @close="isArchiveModalOpen = false"
      @confirm="handleArchiveConfirm"
    />
  </div>
</template>
