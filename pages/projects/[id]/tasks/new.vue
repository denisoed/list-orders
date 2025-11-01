<script setup lang="ts">
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, useHead, onBeforeRouteLeave } from '#imports'
import type { TaskAssignee } from '~/data/projects'
import { useProjectTasks } from '~/composables/useProjectTasks'
import { useTaskCreation, type CreateTaskAttachment } from '~/composables/useTaskCreation'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => String(route.params.id ?? ''))

const { project } = useProjectTasks(projectId)
const { createTask, isCreating, error } = useTaskCreation(projectId)

interface FormState {
  title: string
  description: string
  link: string
  attachments: CreateTaskAttachment[]
  assignee: TaskAssignee | null
  dueDate: string
}

const MAX_ATTACHMENTS = 5

const form = reactive<FormState>({
  title: '',
  description: '',
  link: '',
  attachments: [],
  assignee: null,
  dueDate: '',
})

const touched = reactive({
  title: false,
  description: false,
  link: false,
})

const attachmentsError = ref('')
const submissionError = ref('')
const showAssigneePicker = ref(false)
const showDeadlinePicker = ref(false)
const deadlineDraft = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const assigneeOptions = computed(() => {
  const unique = new Map<string, TaskAssignee>()
  project.value?.tasks.forEach((task) => {
    if (!unique.has(task.assignee.name)) {
      unique.set(task.assignee.name, task.assignee)
    }
  })

  return Array.from(unique.values())
})

const isTitleValid = computed(() => form.title.trim().length > 0)
const isDescriptionValid = computed(() => form.description.trim().length > 0)

const normalizedLink = computed(() => form.link.trim())

const isLinkValid = computed(() => {
  if (!normalizedLink.value) {
    return true
  }

  try {
    // eslint-disable-next-line no-new
    new URL(normalizedLink.value)
    return true
  } catch (error) {
    return false
  }
})

const hasExceededAttachments = computed(() => form.attachments.length > MAX_ATTACHMENTS)

const isFormValid = computed(
  () =>
    isTitleValid.value &&
    isDescriptionValid.value &&
    isLinkValid.value &&
    !hasExceededAttachments.value &&
    !isCreating.value,
)

const isDirty = computed(() => {
  return (
    Boolean(form.title) ||
    Boolean(form.description) ||
    Boolean(form.link) ||
    form.attachments.length > 0 ||
    form.assignee !== null ||
    Boolean(form.dueDate)
  )
})

const deadlineLabel = computed(() => {
  if (!form.dueDate) {
    return 'Не задан'
  }

  try {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(form.dueDate))
  } catch (error) {
    return form.dueDate
  }
})

const assigneeLabel = computed(() => form.assignee?.name ?? 'Не выбрано')

const handleFileTrigger = () => {
  fileInput.value?.click()
}

const resetSubmissionError = () => {
  submissionError.value = ''
}

const revokeAttachmentUrl = (attachment: CreateTaskAttachment) => {
  if (attachment.url.startsWith('blob:')) {
    URL.revokeObjectURL(attachment.url)
  }
}

const handleFilesChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) {
    return
  }

  attachmentsError.value = ''

  const availableSlots = Math.max(0, MAX_ATTACHMENTS - form.attachments.length)
  const selectedFiles = Array.from(files).slice(0, availableSlots)

  selectedFiles.forEach((file) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${file.name}`
    const url = URL.createObjectURL(file)
    form.attachments.push({
      id,
      name: file.name,
      url,
      type: file.type,
      size: file.size,
      file,
    })
  })

  if (files.length > selectedFiles.length) {
    attachmentsError.value = `Можно добавить не более ${MAX_ATTACHMENTS} файлов`
  }

  input.value = ''
}

const removeAttachment = (id: string) => {
  const attachmentIndex = form.attachments.findIndex((item) => item.id === id)
  if (attachmentIndex === -1) {
    return
  }

  const [removed] = form.attachments.splice(attachmentIndex, 1)
  if (removed) {
    revokeAttachmentUrl(removed)
  }
  attachmentsError.value = ''
}

const openAssigneePicker = () => {
  showAssigneePicker.value = true
}

const selectAssignee = (assignee: TaskAssignee | null) => {
  form.assignee = assignee
  showAssigneePicker.value = false
}

const openDeadlinePicker = () => {
  deadlineDraft.value = form.dueDate
  showDeadlinePicker.value = true
}

const applyDeadline = () => {
  form.dueDate = deadlineDraft.value
  showDeadlinePicker.value = false
}

const clearDeadline = () => {
  deadlineDraft.value = ''
  form.dueDate = ''
  showDeadlinePicker.value = false
}

const closeDeadlinePicker = () => {
  showDeadlinePicker.value = false
}

const confirmNavigation = () => {
  if (!isDirty.value) {
    return true
  }

  return window.confirm('У вас есть несохранённые изменения. Выйти без сохранения?')
}

const handleClose = () => {
  if (!confirmNavigation()) {
    return
  }

  router.back()
}

const handleSubmit = async () => {
  touched.title = true
  touched.description = true
  touched.link = true

  if (!isFormValid.value) {
    return
  }

  try {
    await createTask({
      title: form.title,
      description: form.description,
      link: normalizedLink.value || undefined,
      dueDate: form.dueDate || undefined,
      assignee: form.assignee ?? undefined,
      attachments: form.attachments,
    })

    router.replace(`/projects/${projectId.value}/tasks`)
  } catch (error: unknown) {
    submissionError.value = error instanceof Error ? error.message : 'Не удалось создать задачу'
  }
}

const handleAssigneePickerKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showAssigneePicker.value = false
  }
}

const handleDeadlinePickerKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showDeadlinePicker.value = false
  }
}

const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
  if (!isDirty.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

onBeforeMount(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
  form.attachments.forEach(revokeAttachmentUrl)
})

onBeforeRouteLeave((_to, _from, next) => {
  if (!confirmNavigation()) {
    next(false)
    return
  }

  next()
})

watch(
  () => isCreating.value,
  () => {
    if (isCreating.value) {
      resetSubmissionError()
    }
  },
)

useHead({
  title: 'Новая задача',
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
  <div class="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
    <header
      class="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background-dark/80 p-4 pb-3 text-white backdrop-blur-sm"
    >
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Закрыть"
        @click="handleClose"
      >
        <span class="material-symbols-outlined text-3xl">close</span>
      </button>
      <h1 class="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em]">Новая задача</h1>
      <div class="flex size-10 items-center justify-center" aria-hidden="true"></div>
    </header>

    <main class="flex-1 px-4 pt-4 pb-28 text-white">
      <form id="new-task-form" class="flex flex-col space-y-6" novalidate @submit.prevent="handleSubmit">
        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Название задачи</p>
          <input
            v-model="form.title"
            type="text"
            name="title"
            class="form-input h-14 w-full min-w-0 flex-1 rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Введите краткий заголовок"
            @blur="touched.title = true"
          />
          <p v-if="touched.title && !isTitleValid" class="pt-1 text-sm text-red-400">Укажите название задачи</p>
        </label>

        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Описание задачи</p>
          <textarea
            v-model="form.description"
            name="description"
            class="form-input min-h-36 w-full min-w-0 flex-1 rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Опишите задачу"
            @blur="touched.description = true"
          ></textarea>
          <p v-if="touched.description && !isDescriptionValid" class="pt-1 text-sm text-red-400">Добавьте описание</p>
        </label>

        <div class="flex flex-col space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-base font-medium leading-normal">Вложения</p>
            <p class="text-sm text-[#9da6b9]">{{ form.attachments.length }}/{{ MAX_ATTACHMENTS }}</p>
          </div>
          <div class="flex items-center gap-4">
            <button
              type="button"
              class="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-[#3b4354] bg-[#1c1f27] text-[#9da6b9] transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              @click="handleFileTrigger"
            >
              <span class="material-symbols-outlined text-3xl">add_photo_alternate</span>
            </button>
            <ul class="flex items-center gap-4">
              <li v-for="attachment in form.attachments" :key="attachment.id" class="relative h-20 w-20">
                <img :src="attachment.url" :alt="attachment.name" class="h-full w-full rounded-lg object-cover" />
                <button
                  type="button"
                  class="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-white"
                  aria-label="Удалить вложение"
                  @click="removeAttachment(attachment.id)"
                >
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
              </li>
            </ul>
          </div>
          <p v-if="attachmentsError" class="text-sm text-red-400">{{ attachmentsError }}</p>
        </div>

        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Ссылка</p>
          <input
            v-model="form.link"
            type="url"
            name="link"
            class="form-input h-14 w-full min-w-0 flex-1 rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://example.com"
            @blur="touched.link = true"
          />
          <p v-if="touched.link && !isLinkValid" class="pt-1 text-sm text-red-400">Введите корректный URL</p>
        </label>

        <div class="flex flex-col divide-y divide-[#3b4354] rounded-lg border border-[#3b4354] bg-[#1c1f27]">
          <div class="flex min-h-14 items-center justify-between gap-4 p-4">
            <div class="flex items-center gap-4">
              <div class="flex size-10 items-center justify-center rounded-lg bg-[#282e39] text-white">
                <span class="material-symbols-outlined">person</span>
              </div>
              <div>
                <p class="text-base font-normal leading-normal">Исполнитель</p>
                <p class="text-sm text-[#9da6b9]">{{ assigneeLabel }}</p>
              </div>
            </div>
            <button
              type="button"
              class="flex shrink-0 items-center gap-2 text-base font-medium leading-normal text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              @click="openAssigneePicker"
            >
              <span>Выбрать</span>
              <span class="material-symbols-outlined text-xl">arrow_forward_ios</span>
            </button>
          </div>
          <div class="flex min-h-14 items-center justify-between gap-4 p-4">
            <div class="flex items-center gap-4">
              <div class="flex size-10 items-center justify-center rounded-lg bg-[#282e39] text-white">
                <span class="material-symbols-outlined">calendar_today</span>
              </div>
              <div>
                <p class="text-base font-normal leading-normal">Дедлайн</p>
                <p class="text-sm text-[#9da6b9]">{{ deadlineLabel }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                v-if="form.dueDate"
                type="button"
                class="text-sm font-medium text-red-400 transition hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                @click="clearDeadline"
              >
                Очистить
              </button>
              <button
                type="button"
                class="flex shrink-0 items-center gap-2 text-base font-medium leading-normal text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                @click="openDeadlinePicker"
              >
                <span>Выбрать дату</span>
                <span class="material-symbols-outlined text-xl">arrow_forward_ios</span>
              </button>
            </div>
          </div>
        </div>

        <p v-if="submissionError" class="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{{ submissionError }}</p>
        <p v-else-if="error" class="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{{ error }}</p>
      </form>
    </main>

    <footer class="fixed bottom-0 left-0 z-10 w-full bg-background-dark/80 p-4 backdrop-blur-sm">
      <button
        type="submit"
        form="new-task-form"
        class="w-full rounded-xl bg-primary px-5 py-4 text-center text-base font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:bg-primary/50"
        :disabled="!isFormValid"
        @click="resetSubmissionError"
      >
        <span v-if="isCreating" class="inline-flex items-center justify-center gap-2">
          <svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          Создание...
        </span>
        <span v-else>Создать задачу</span>
      </button>
    </footer>

    <input ref="fileInput" type="file" class="hidden" accept="image/*" multiple @change="handleFilesChange" />

    <Teleport to="body">
      <div
        v-if="showAssigneePicker"
        class="fixed inset-0 z-30 flex items-end justify-center bg-black/60 px-4 pb-6"
        role="dialog"
        aria-modal="true"
        @keydown.esc="showAssigneePicker = false"
      >
        <div class="w-full max-w-md rounded-2xl bg-[#1c1f27] p-6 text-white shadow-xl" @keydown="handleAssigneePickerKeydown">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Выбор исполнителя</h2>
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Закрыть выбор исполнителя"
              @click="showAssigneePicker = false"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="space-y-2">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-xl bg-[#282e39] px-4 py-3 text-left transition hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              @click="selectAssignee(null)"
            >
              <span>Не назначать исполнителя</span>
              <span v-if="!form.assignee" class="material-symbols-outlined text-primary">check</span>
            </button>
            <button
              v-for="assignee in assigneeOptions"
              :key="assignee.name"
              type="button"
              class="flex w-full items-center justify-between rounded-xl bg-[#282e39] px-4 py-3 text-left transition hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              @click="selectAssignee(assignee)"
            >
              <span>{{ assignee.name }}</span>
              <span v-if="form.assignee?.name === assignee.name" class="material-symbols-outlined text-primary">check</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showDeadlinePicker"
        class="fixed inset-0 z-40 flex items-end justify-center bg-black/60 px-4 pb-6"
        role="dialog"
        aria-modal="true"
      >
        <div class="w-full max-w-md rounded-2xl bg-[#1c1f27] p-6 text-white shadow-xl" @keydown="handleDeadlinePickerKeydown">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Выбор даты</h2>
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Закрыть выбор даты"
              @click="closeDeadlinePicker"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="space-y-4">
            <input
              v-model="deadlineDraft"
              type="date"
              class="w-full rounded-xl bg-[#282e39] p-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div class="flex justify-end gap-3">
              <button
                type="button"
                class="rounded-xl px-4 py-2 text-sm font-medium text-[#9da6b9] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                @click="closeDeadlinePicker"
              >
                Отмена
              </button>
              <button
                type="button"
                class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:bg-primary/50"
                :disabled="!deadlineDraft"
                @click="applyDeadline"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
