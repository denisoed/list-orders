import { computed, reactive, ref, watch, type Ref } from 'vue'
import { findProjectById, PROJECTS, type Project, type ProjectTask } from '~/data/projects'

const createdProjectTasks = reactive<Record<string, ProjectTask[]>>({})

export const registerCreatedProjectTask = (projectId: string, task: ProjectTask) => {
  if (!createdProjectTasks[projectId]) {
    createdProjectTasks[projectId] = []
  }

  createdProjectTasks[projectId] = [task, ...createdProjectTasks[projectId]!]
}

export const getCreatedProjectTasks = (projectId: string) => {
  return createdProjectTasks[projectId] ?? []
}

export const TASK_STATUS_FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'overdue', label: 'Просрочено' },
  { value: 'review', label: 'На проверку' },
  { value: 'done', label: 'Сделано' },
] as const

export type TaskStatusFilter = (typeof TASK_STATUS_FILTERS)[number]['value']

export interface UseProjectTasksResult {
  project: Ref<Project | undefined>
  allTasks: Ref<ProjectTask[]>
  filteredTasks: Ref<ProjectTask[]>
  searchQuery: Ref<string>
  activeStatus: Ref<TaskStatusFilter>
  setSearchQuery: (value: string) => void
  setActiveStatus: (value: TaskStatusFilter) => void
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
  const projectIdRef = computed(() => (typeof projectId === 'string' ? projectId : projectId.value))

  const project = computed(() => findProjectById(projectIdRef.value))
  const createdTasks = computed(() => createdProjectTasks[projectIdRef.value] ?? [])
  const allTasks = computed(() => [...createdTasks.value, ...(project.value?.tasks ?? [])])

  const searchQuery = ref('')
  const activeStatus = ref<TaskStatusFilter>('all')

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
    setSearchQuery: (value: string) => {
      searchQuery.value = value
    },
    setActiveStatus: (value: TaskStatusFilter) => {
      activeStatus.value = value
    },
  }
}

export const useAllProjects = () => {
  return computed(() => PROJECTS)
}
