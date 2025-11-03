<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import { useProjects } from '~/composables/useProjects'
import { useProjectsState } from '~/composables/useProjectTasks'
import { useProjectTeam } from '~/composables/useProjectTeam'

const router = useRouter()
const route = useRoute()
const projectsState = useProjectsState()
const { createProject, updateProject, isCreating, isUpdating } = useProjects()

const title = ref('')
const description = ref('')
const color = ref('#3B82F6')
const titleTouched = ref(false)
const submitAttempted = ref(false)
const submitError = ref('')

const editProjectId = computed(() => {
  const edit = route.query.edit
  if (typeof edit === 'string' && edit.length > 0) {
    return edit
  }
  return ''
})

const editableProject = computed(() => {
  if (!editProjectId.value) {
    return undefined
  }

  return projectsState.value.find((project) => project.id === editProjectId.value)
})

const isEditing = computed(() => editProjectId.value.length > 0)
const projectNotFound = computed(() => isEditing.value && !editableProject.value)

const { memberCount: teamMemberCount } = useProjectTeam(editProjectId)

const titleError = computed(() => {
  if (title.value.trim().length > 0) {
    return ''
  }
  return 'Введите название проекта'
})

const showTitleError = computed(() => (titleTouched.value || submitAttempted.value) && Boolean(titleError.value))
const isSubmitting = computed(() => (isEditing.value ? isUpdating.value : isCreating.value))
const isSubmitDisabled = computed(
  () => isSubmitting.value || Boolean(titleError.value) || projectNotFound.value,
)

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
  if (isEditing.value && editableProject.value) {
    return `/projects/${editableProject.value.id}/tasks`
  }
  return '/'
})

const handleClose = () => {
  router.push(returnPath.value)
}

const inviteProjectId = computed(() => {
  if (!isEditing.value || projectNotFound.value || !editableProject.value) {
    return ''
  }

  return editableProject.value.id
})

const inviteReturnPath = computed(() => route.fullPath)

const pageTitle = computed(() => (isEditing.value ? 'Редактирование проекта' : 'Новый проект'))
const closeAriaLabel = computed(() =>
  isEditing.value ? 'Закрыть редактирование проекта' : 'Закрыть создание проекта',
)
const submitButtonText = computed(() => {
  if (isEditing.value) {
    return isUpdating.value ? 'Сохранение…' : 'Сохранить изменения'
  }
  return isCreating.value ? 'Создание…' : 'Создать проект'
})

const handleTitleBlur = () => {
  titleTouched.value = true
}

const handleSubmit = async () => {
  submitAttempted.value = true
  submitError.value = ''

  if (titleError.value || projectNotFound.value) {
    if (projectNotFound.value) {
      submitError.value = 'Проект не найден. Вернитесь назад и попробуйте снова.'
    }
    return
  }

  try {
    if (isEditing.value && editableProject.value) {
      const updatedProject = await updateProject({
        id: editableProject.value.id,
        title: title.value,
        description: description.value,
        color: color.value,
      })

      await router.push(returnPath.value || `/projects/${updatedProject.id}/tasks`)
      return
    }

    const project = await createProject({
      title: title.value,
      description: description.value,
      color: color.value,
    })

    await router.push(`/projects/${project.id}/tasks`)
  } catch (error) {
    submitError.value = isEditing.value
      ? 'Не удалось сохранить изменения. Попробуйте ещё раз.'
      : 'Не удалось создать проект. Попробуйте ещё раз.'
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
    if (projectTitle && isEditing.value) {
      title.value = projectTitle
      submitError.value = ''
    }
  },
  { immediate: true },
)

watch(
  () => editableProject.value?.description,
  (projectDescription) => {
    if (isEditing.value) {
      description.value = projectDescription ?? ''
    }
  },
  { immediate: true },
)

watch(
  () => editableProject.value?.color,
  (projectColor) => {
    if (projectColor && isEditing.value) {
      color.value = projectColor
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="relative flex min-h-screen w-full flex-col bg-background-dark text-white">
    <header class="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background-dark/80 p-4 pb-3 backdrop-blur-sm">
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/5"
        :aria-label="closeAriaLabel"
        @click="handleClose"
      >
        <span class="material-symbols-outlined text-3xl">close</span>
      </button>
      <h1 class="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em]">{{ pageTitle }}</h1>
      <div class="flex w-12 items-center justify-end"></div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 pt-4 pb-32">
      <div class="flex flex-col space-y-6">
        <div
          v-if="projectNotFound"
          class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-red-300"
        >
          Проект не найден. Возможно, он был удалён. Вернитесь назад.
        </div>
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
        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Описание</p>
          <textarea
            v-model="description"
            class="form-input min-h-36 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Добавьте детали о проекте, цели и задачи"
            enterkeyhint="done"
          ></textarea>
        </label>
        <ColorSelector v-model="color" />
        <ProjectInviteLink
          :project-id="inviteProjectId"
          :project-title="title"
          :member-count="teamMemberCount"
          :return-path="inviteReturnPath"
        />
      </div>
    </main>

    <footer class="fixed bottom-0 left-0 z-10 w-full bg-background-dark/80 p-4 backdrop-blur-sm">
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
  </div>
</template>
