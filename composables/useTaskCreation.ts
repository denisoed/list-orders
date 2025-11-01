import { computed, ref, type Ref } from 'vue'
import { registerCreatedProjectTask } from './useProjectTasks'
import type { ProjectTask, TaskAttachment, TaskAssignee } from '~/data/projects'

export interface CreateTaskAttachment extends TaskAttachment {
  file?: File
}

export interface CreateTaskInput {
  title: string
  description: string
  link?: string
  dueDate?: string
  assignee?: TaskAssignee
  attachments: CreateTaskAttachment[]
}

const DEFAULT_ASSIGNEE: TaskAssignee = {
  name: 'Не назначен',
  avatarUrl:
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%233b4354"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, sans-serif" font-size="36" fill="white">?</text></svg>',
}

export const useTaskCreation = (projectId: Ref<string> | string) => {
  const projectIdRef = computed(() => (typeof projectId === 'string' ? projectId : projectId.value))

  const isCreating = ref(false)
  const error = ref<string | null>(null)

  const createTask = async (input: CreateTaskInput) => {
    if (!input.title.trim() || !input.description.trim()) {
      throw new Error('Заголовок и описание обязательны для создания задачи')
    }

    isCreating.value = true
    error.value = null

    try {
      const now = new Date()
      const task: ProjectTask = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `task-${Date.now()}`,
        title: input.title.trim(),
        assignee: input.assignee ?? DEFAULT_ASSIGNEE,
        status: 'in_progress',
        dueDate: input.dueDate ?? now.toISOString(),
        priority: 'medium',
        description: input.description.trim(),
        link: input.link?.trim() || undefined,
        attachments:
          input.attachments.length > 0
            ? input.attachments.map(({ id, name, url, type, size }) => ({ id, name, url, type, size }))
            : undefined,
      }

      registerCreatedProjectTask(projectIdRef.value, task)

      return task
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Не удалось создать задачу'
      error.value = message
      console.error('[useTaskCreation] Failed to create task', cause)
      throw new Error(message)
    } finally {
      isCreating.value = false
    }
  }

  return {
    createTask,
    isCreating,
    error,
  }
}
