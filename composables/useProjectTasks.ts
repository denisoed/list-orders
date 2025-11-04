import { computed, ref, watch, type Ref } from 'vue'
import type { Project, ProjectTask, TaskAssignee, TaskAttachment, TaskReminderOffset } from '~/data/projects'
import { useProjectsStore } from '~/stores/projects'

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
  searchQuery: Ref<string>
  activeStatus: Ref<TaskStatusFilter>
  isCreating: Ref<boolean>
  isUpdating: Ref<boolean>
  setSearchQuery: (value: string) => void
  setActiveStatus: (value: TaskStatusFilter) => void
}

// Legacy function for backward compatibility (deprecated, use Pinia store instead)
export const useProjectsState = () => {
  const store = useProjectsStore()
  return store.projects
}

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
  const store = useProjectsStore()
  const projectIdRef = computed(() => (typeof projectId === 'string' ? projectId : projectId.value))

  const project = computed(() => store.projects.find((item) => item.id === projectIdRef.value))

  const searchQuery = ref('')
  const activeStatus = ref<TaskStatusFilter>('all')
  const isCreating = ref(false)
  const isUpdating = ref(false)

  watch(projectIdRef, () => {
    searchQuery.value = ''
    activeStatus.value = 'all'
  })

  return {
    project,
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
  }
}

export const useAllProjects = () => {
  const store = useProjectsStore()
  return computed(() => store.projects)
}

