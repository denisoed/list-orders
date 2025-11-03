import { useState } from '#imports'
import { computed, ref, watch, type Ref } from 'vue'
import {
  PROJECTS,
  type Project,
  type ProjectTask,
  type TaskAssignee,
  type TaskAttachment,
  type TaskReminderOffset,
} from '~/data/projects'

export const TASK_STATUS_FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'review', label: 'Проверяется' },
  { value: 'done', label: 'Сделано' },
] as const

export type TaskStatusFilter = (typeof TASK_STATUS_FILTERS)[number]['value']

export interface CreateProjectTaskInput {
  title: string
  description: string
  dueDate?: string
  dueTime?: string
  attachments: TaskAttachment[]
  assignee?: TaskAssignee
  status?: ProjectTask['status']
  clientName?: string
  clientPhone?: string
  deliveryAddress?: string
  isPickup?: boolean
  remindBefore?: TaskReminderOffset
}

export interface UseProjectTasksResult {
  project: Ref<Project | undefined>
  allTasks: Ref<ProjectTask[]>
  filteredTasks: Ref<ProjectTask[]>
  searchQuery: Ref<string>
  activeStatus: Ref<TaskStatusFilter>
  isCreating: Ref<boolean>
  isUpdating: Ref<boolean>
  setSearchQuery: (value: string) => void
  setActiveStatus: (value: TaskStatusFilter) => void
  createTask: (input: CreateProjectTaskInput) => Promise<ProjectTask>
  updateTask: (taskId: string, input: CreateProjectTaskInput) => Promise<ProjectTask>
  getTaskById: (taskId: string) => ProjectTask | undefined
}

const cloneProjects = (): Project[] => {
  return PROJECTS.map((project) => ({
    ...project,
    tasks: project.tasks.map((task) => ({
      ...task,
      assignee: { ...task.assignee },
      attachments: task.attachments?.map((attachment) => ({ ...attachment })),
    })),
  }))
}

export const useProjectsState = () => useState<Project[]>('projects-data', cloneProjects)

const generateTaskId = () => `task-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`

export const filterProjectTasks = (
  tasks: ProjectTask[],
  status: TaskStatusFilter,
  query: string,
): ProjectTask[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU')

  return tasks.filter((task) => {
    const matchesStatus = status === 'all' ? true : task.status === status
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [task.title, task.assignee.name].some((value) => value.toLocaleLowerCase('ru-RU').includes(normalizedQuery))

    return matchesStatus && matchesQuery
  })
}

export const useProjectTasks = (projectId: Ref<string> | string): UseProjectTasksResult => {
  const projectsState = useProjectsState()
  const projectIdRef = computed(() => (typeof projectId === 'string' ? projectId : projectId.value))

  const project = computed(() => projectsState.value.find((item) => item.id === projectIdRef.value))
  const allTasks = computed(() => project.value?.tasks ?? [])

  const searchQuery = ref('')
  const activeStatus = ref<TaskStatusFilter>('all')
  const isCreating = ref(false)
  const isUpdating = ref(false)

  const filteredTasks = computed(() => filterProjectTasks(allTasks.value, activeStatus.value, searchQuery.value))

  watch(projectIdRef, () => {
    searchQuery.value = ''
    activeStatus.value = 'all'
  })

  return {
    project,
    allTasks,
    filteredTasks,
    searchQuery,
    activeStatus,
    isCreating,
    isUpdating,
    setSearchQuery: (value: string) => {
      searchQuery.value = value
    },
    setActiveStatus: (value: TaskStatusFilter) => {
      activeStatus.value = value
    },
    getTaskById: (taskId: string) => {
      return allTasks.value.find((task) => task.id === taskId)
    },
    createTask: async (input: CreateProjectTaskInput) => {
      const currentProjectIndex = projectsState.value.findIndex((item) => item.id === projectIdRef.value)

      if (currentProjectIndex === -1) {
        throw new Error('Проект не найден для создания задачи')
      }

      const projectSnapshot = projectsState.value[currentProjectIndex]
      const assignee = input.assignee ?? {
        name: 'Не назначен',
        avatarUrl:
          'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23282e39%22/%3E%3Cpath d=%22M32 34c6.075 0 11-4.925 11-11S38.075 12 32 12s-11 4.925-11 11 4.925 11 11 11Zm0 4c-7.732 0-21 3.882-21 11.5V52a4 4 0 0 0 4 4h34a4 4 0 0 0 4-4v-2.5C53 41.882 39.732 38 32 38Z%22 fill=%22%239da6b9%22/%3E%3C/svg%3E',
      }

      const nextTask: ProjectTask = {
        id: generateTaskId(),
        title: input.title.trim(),
        description: input.description.trim(),
        dueDate: input.dueDate ?? new Date().toISOString().slice(0, 10),
        dueTime: input.dueTime,
        status: input.status ?? 'pending',
        assignee,
        attachments: input.attachments.map((attachment) => ({ ...attachment })),
        clientName: input.clientName?.trim() || undefined,
        clientPhone: input.clientPhone?.trim() || undefined,
        deliveryAddress:
          input.isPickup === true ? undefined : input.deliveryAddress?.trim() || undefined,
        isPickup: input.isPickup ?? false,
        remindBefore: input.remindBefore,
      }

      isCreating.value = true

      try {
        const updatedProject: Project = {
          ...projectSnapshot,
          total: projectSnapshot.total + 1,
          tasks: [nextTask, ...projectSnapshot.tasks],
        }

        projectsState.value.splice(currentProjectIndex, 1, updatedProject)

        console.info('[tasks] Создана новая задача', {
          projectId: projectIdRef.value,
          taskId: nextTask.id,
          title: nextTask.title,
        })

        return nextTask
      } catch (error) {
        console.error('[tasks] Не удалось создать задачу', error)
        throw error
      } finally {
        isCreating.value = false
      }
    },
    updateTask: async (taskId: string, input: CreateProjectTaskInput) => {
      const currentProjectIndex = projectsState.value.findIndex((item) => item.id === projectIdRef.value)

      if (currentProjectIndex === -1) {
        throw new Error('Проект не найден для обновления задачи')
      }

      const projectSnapshot = projectsState.value[currentProjectIndex]
      const taskIndex = projectSnapshot.tasks.findIndex((task) => task.id === taskId)

      if (taskIndex === -1) {
        throw new Error('Задача не найдена для обновления')
      }

      const existingTask = projectSnapshot.tasks[taskIndex]
      const assignee = input.assignee ?? {
        name: 'Не назначен',
        avatarUrl:
          'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23282e39%22/%3E%3Cpath d=%22M32 34c6.075 0 11-4.925 11-11S38.075 12 32 12s-11 4.925-11 11 4.925 11 11 11Zm0 4c-7.732 0-21 3.882-21 11.5V52a4 4 0 0 0 4 4h34a4 4 0 0 0 4-4v-2.5C53 41.882 39.732 38 32 38Z%22 fill=%22%239da6b9%22/%3E%3C/svg%3E',
      }

      const updatedTask: ProjectTask = {
        ...existingTask,
        title: input.title.trim(),
        description: input.description.trim(),
        dueDate: input.dueDate ?? existingTask.dueDate,
        dueTime: input.dueTime,
        assignee,
        attachments: input.attachments.map((attachment) => ({ ...attachment })),
        clientName: input.clientName?.trim() || undefined,
        clientPhone: input.clientPhone?.trim() || undefined,
        deliveryAddress:
          input.isPickup === true ? undefined : input.deliveryAddress?.trim() || undefined,
        isPickup: input.isPickup ?? false,
        remindBefore: input.remindBefore,
      }

      isUpdating.value = true

      try {
        const updatedTasks = [...projectSnapshot.tasks]
        updatedTasks[taskIndex] = updatedTask

        const updatedProject: Project = {
          ...projectSnapshot,
          tasks: updatedTasks,
        }

        projectsState.value.splice(currentProjectIndex, 1, updatedProject)

        console.info('[tasks] Обновлена задача', {
          projectId: projectIdRef.value,
          taskId: updatedTask.id,
          title: updatedTask.title,
        })

        return updatedTask
      } catch (error) {
        console.error('[tasks] Не удалось обновить задачу', error)
        throw error
      } finally {
        isUpdating.value = false
      }
    },
  }
}

export const useAllProjects = () => {
  const projectsState = useProjectsState()
  return computed(() => projectsState.value)
}

export const findTaskInProjects = (taskId: string): { project: Project; task: ProjectTask } | null => {
  const projectsState = useProjectsState()
  
  for (const project of projectsState.value) {
    const task = project.tasks.find((t) => t.id === taskId)
    if (task) {
      return { project, task }
    }
  }
  
  return null
}
