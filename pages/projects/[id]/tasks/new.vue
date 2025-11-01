<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import type { TaskAttachment } from '~/data/projects'
import { useProjectTasks } from '~/composables/useProjectTasks'

interface FormAttachment extends TaskAttachment {
  file: File
}

interface AssigneeOption {
  id: string
  name: string
  avatarUrl: string
}

const route = useRoute()
const router = useRouter()

const projectId = computed(() => String(route.params.id ?? ''))

const { project, createTask, isCreating } = useProjectTasks(projectId)

const fallbackTasksRoute = computed(() => `/projects/${projectId.value}/tasks`)
const returnPath = computed(() => {
  const from = route.query.from
  if (typeof from === 'string' && from.length > 0) {
    return from
  }
  return fallbackTasksRoute.value
})

const title = ref('')
const description = ref('')
const link = ref('')
const dueDate = ref('')
const selectedAssigneeId = ref('unassigned')
const attachments = ref<FormAttachment[]>([])

const titleTouched = ref(false)
const linkTouched = ref(false)
const submitAttempted = ref(false)
const submitError = ref('')

const fileInputRef = ref<HTMLInputElement | null>(null)

const DEFAULT_ASSIGNEE: AssigneeOption = {
  id: 'unassigned',
  name: 'Не назначен',
  avatarUrl:
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23282e39%22/%3E%3Cpath d=%22M32 34c6.075 0 11-4.925 11-11S38.075 12 32 12s-11 4.925-11 11 4.925 11 11 11Zm0 4c-7.732 0-21 3.882-21 11.5V52a4 4 0 0 0 4 4h34a4 4 0 0 0 4-4v-2.5C53 41.882 39.732 38 32 38Z%22 fill=%22%239da6b9%22/%3E%3C/svg%3E',
}

const assigneeOptions = computed<AssigneeOption[]>(() => {
  const unique = new Map<string, AssigneeOption>()
  const projectValue = project.value

  if (projectValue) {
    projectValue.tasks.forEach((task) => {
      if (!unique.has(task.assignee.name)) {
        unique.set(task.assignee.name, {
          id: task.assignee.name,
          name: task.assignee.name,
          avatarUrl: task.assignee.avatarUrl,
        })
      }
    })
  }

  return [DEFAULT_ASSIGNEE, ...unique.values()]
})

const selectedAssignee = computed(() => {
  const found = assigneeOptions.value.find((option) => option.id === selectedAssigneeId.value)
  return found ?? DEFAULT_ASSIGNEE
})

const titleError = computed(() => {
  if (title.value.trim().length > 0) {
    return ''
  }
  return 'Введите название задачи'
})

const linkError = computed(() => {
  const value = link.value.trim()
  if (value.length === 0) {
    return ''
  }

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? '' : 'Введите корректную ссылку'
  } catch (error) {
    return 'Введите корректную ссылку'
  }
})

const showTitleError = computed(() => (titleTouched.value || submitAttempted.value) && Boolean(titleError.value))
const showLinkError = computed(() => (linkTouched.value || submitAttempted.value) && Boolean(linkError.value))

const isFormValid = computed(() => {
  return titleError.value.length === 0 && linkError.value.length === 0
})

const isSubmitDisabled = computed(() => !project.value || !isFormValid.value || isCreating.value)

const revokeAttachmentPreview = (attachment: FormAttachment) => {
  if (attachment.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(attachment.previewUrl)
  }
}

const handleClose = () => {
  router.push(returnPath.value)
}

const handleAddAttachment = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target?.files?.length) {
    return
  }

  const files = Array.from(target.files)
  const nextAttachments = files.map<FormAttachment>((file) => ({
    id: `file-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`,
    name: file.name,
    previewUrl: URL.createObjectURL(file),
    file,
  }))

  attachments.value = [...attachments.value, ...nextAttachments]
  target.value = ''
}

const handleRemoveAttachment = (attachmentId: string) => {
  const attachment = attachments.value.find((item) => item.id === attachmentId)
  if (!attachment) {
    return
  }

  revokeAttachmentPreview(attachment)
  attachments.value = attachments.value.filter((item) => item.id !== attachmentId)
}

const handleSubmit = async () => {
  submitAttempted.value = true
  submitError.value = ''

  if (!isFormValid.value) {
    return
  }

  if (!project.value) {
    submitError.value = 'Проект недоступен для создания задачи.'
    return
  }

  try {
    await createTask({
      title: title.value,
      description: description.value,
      link: link.value.trim() || undefined,
      dueDate: dueDate.value || undefined,
      attachments: attachments.value.map(({ id, name, previewUrl }) => ({ id, name, previewUrl })),
      assignee:
        selectedAssignee.value.id === DEFAULT_ASSIGNEE.id
          ? undefined
          : { name: selectedAssignee.value.name, avatarUrl: selectedAssignee.value.avatarUrl },
    })

    attachments.value.forEach(revokeAttachmentPreview)
    attachments.value = []

    await router.push(returnPath.value)
  } catch (error) {
    submitError.value = 'Не удалось создать задачу. Попробуйте ещё раз.'
  }
}

const handleTitleBlur = () => {
  titleTouched.value = true
}

const handleLinkBlur = () => {
  linkTouched.value = true
}

onBeforeUnmount(() => {
  attachments.value.forEach(revokeAttachmentPreview)
})

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
  <div class="relative flex min-h-screen w-full flex-col bg-background-dark text-white">
    <header class="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background-dark/80 p-4 pb-3 backdrop-blur-sm">
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Закрыть создание задачи"
        @click="handleClose"
      >
        <span class="material-symbols-outlined text-3xl">close</span>
      </button>
      <h1 class="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em]">Новая задача</h1>
      <div class="flex w-10 items-center justify-end"></div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 pt-4 pb-32">
      <div v-if="project" class="flex flex-col space-y-6">
        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Название задачи</p>
          <input
            v-model="title"
            class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            type="text"
            placeholder="Введите короткое название задачи"
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
            placeholder="Добавьте детали, чек-лист и важные требования"
            enterkeyhint="done"
          ></textarea>
        </label>

        <div class="flex flex-col space-y-4">
          <p class="text-base font-medium leading-normal">Вложения</p>
          <div class="flex items-center gap-4">
            <button
              type="button"
              class="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-[#3b4354] bg-[#1c1f27] text-[#9da6b9] transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Добавить вложения"
              @click="handleAddAttachment"
            >
              <span class="material-symbols-outlined text-3xl">add_photo_alternate</span>
            </button>
            <ul v-if="attachments.length" class="flex items-center gap-4" role="list">
              <li v-for="attachment in attachments" :key="attachment.id" role="listitem" class="relative">
                <img :src="attachment.previewUrl" :alt="`Вложение ${attachment.name}`" class="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  class="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                  :aria-label="`Удалить вложение ${attachment.name}`"
                  @click="handleRemoveAttachment(attachment.id)"
                >
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
              </li>
            </ul>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept="image/*"
            class="sr-only"
            @change="handleFileChange"
          />
        </div>

        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Ссылка</p>
          <input
            v-model="link"
            class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            type="url"
            placeholder="https://example.com"
            :aria-invalid="showLinkError"
            enterkeyhint="done"
            @blur="handleLinkBlur"
          />
          <p v-if="showLinkError" class="pt-1 text-sm text-red-400">{{ linkError }}</p>
        </label>

        <div class="flex flex-col divide-y divide-[#3b4354] rounded-lg border border-[#3b4354] bg-[#1c1f27]">
          <div class="flex min-h-14 items-center justify-between gap-4 p-4">
            <div class="flex items-center gap-4">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#282e39] text-white">
                <span class="material-symbols-outlined">person</span>
              </div>
              <div>
                <p class="text-base font-normal leading-normal">Исполнитель</p>
                <p class="text-sm text-[#9da6b9]">{{ selectedAssignee.name }}</p>
              </div>
            </div>
            <div class="relative">
              <select
                v-model="selectedAssigneeId"
                class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                aria-label="Выберите исполнителя"
              >
                <option v-for="option in assigneeOptions" :key="option.id" :value="option.id">
                  {{ option.name }}
                </option>
              </select>
              <div class="flex items-center gap-2 text-base font-medium leading-normal text-primary">
                <span>{{ selectedAssignee.id === DEFAULT_ASSIGNEE.id ? 'Выбрать исполнителя' : 'Изменить' }}</span>
                <span class="material-symbols-outlined text-xl">arrow_forward_ios</span>
              </div>
            </div>
          </div>
          <div class="flex min-h-14 items-center justify-between gap-4 p-4">
            <div class="flex items-center gap-4">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#282e39] text-white">
                <span class="material-symbols-outlined">calendar_today</span>
              </div>
              <div>
                <p class="text-base font-normal leading-normal">Дедлайн</p>
                <p class="text-sm text-[#9da6b9]">
                  {{ dueDate ? new Date(dueDate).toLocaleDateString('ru-RU') : 'Не задан' }}
                </p>
              </div>
            </div>
            <div class="relative">
              <input
                v-model="dueDate"
                type="date"
                class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                aria-label="Установите срок выполнения"
              />
              <div class="flex items-center gap-2 text-base font-medium leading-normal text-primary">
                <span>{{ dueDate ? 'Изменить дату' : 'Установить дату' }}</span>
                <span class="material-symbols-outlined text-xl">arrow_forward_ios</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center gap-4 py-20 text-center text-[#9da6b9]">
        <span class="material-symbols-outlined text-4xl text-primary">search_off</span>
        <p class="text-base font-medium text-white">Проект не найден</p>
        <p>Проверьте ссылку или вернитесь к списку задач.</p>
        <button
          type="button"
          class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="handleClose"
        >
          Вернуться к задачам
        </button>
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
          {{ isCreating ? 'Создание…' : 'Создать задачу' }}
        </button>
      </div>
    </footer>
  </div>
</template>
