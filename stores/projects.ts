import { defineStore } from 'pinia'
import type { Project } from '~/data/projects'
import { useTelegram } from '~/composables/useTelegram'

export interface CreateProjectInput {
  title: string
  description?: string
  color?: string
}

export interface UpdateProjectInput {
  title: string
  description?: string
  color?: string
}

/**
 * Pinia store for managing projects CRUD operations
 */
export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const isCreating = ref(false)
  const isUpdating = ref(false)
  const isDeleting = ref(false)
  const error = ref<string | null>(null)

  /**
   * Helper function to get fetch options with initData header
   */
  function getFetchOptions(options: any = {}): any {
    const { getInitData } = useTelegram()
    const initData = getInitData()

    const headers = {
      ...(options.headers || {}),
    }

    if (initData) {
      headers['x-telegram-init-data'] = initData
    }

    return {
      ...options,
      headers,
    }
  }

  /**
   * Fetch all projects from the server
   */
  async function fetchProjects(): Promise<Project[]> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<Project[]>('/api/projects', getFetchOptions())

      const transformedProjects = response

      projects.value = transformedProjects

      console.info('[ProjectsStore] Projects fetched successfully', {
        count: transformedProjects.length,
      })

      return transformedProjects
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось загрузить проекты'
      error.value = errorMessage
      console.error('[ProjectsStore] Error fetching projects:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single project by ID from the server
   */
  async function fetchProject(projectId: string): Promise<Project> {
    isLoading.value = true
    error.value = null

    try {
      const project = await $fetch<Project>(`/api/projects/${projectId}`, getFetchOptions())

      // Update or add project in the list
      const projectIndex = projects.value.findIndex((p) => p.id === projectId)
      if (projectIndex !== -1) {
        projects.value.splice(projectIndex, 1, project)
      } else {
        projects.value.push(project)
      }

      console.info('[ProjectsStore] Project fetched successfully', {
        projectId: project.id,
        title: project.title,
      })

      return project
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось загрузить проект'
      error.value = errorMessage
      console.error('[ProjectsStore] Error fetching project:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new project on the server
   */
  async function createProject(input: CreateProjectInput): Promise<Project> {
    const trimmedTitle = input.title.trim()
    const trimmedDescription = input.description?.trim() ?? ''
    const projectColor = input.color

    if (!trimmedTitle) {
      const errorMessage = 'Название проекта не может быть пустым'
      error.value = errorMessage
      throw new Error(errorMessage)
    }

    isCreating.value = true
    error.value = null

    try {
      const newProject = await $fetch<Project>('/api/projects', getFetchOptions({
        method: 'POST',
        body: {
          title: trimmedTitle,
          description: trimmedDescription,
          color: projectColor,
        },
      }))

      const newProjectData: Project = newProject

      // Add new project to the beginning of the list
      projects.value = [newProjectData, ...projects.value]

      console.info('[ProjectsStore] Project created successfully', {
        projectId: newProject.id,
        title: newProject.title,
      })

      return newProjectData
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось создать проект'
      error.value = errorMessage
      console.error('[ProjectsStore] Error creating project:', err)
      throw err
    } finally {
      isCreating.value = false
    }
  }

  /**
   * Update an existing project on the server
   */
  async function updateProject(
    projectId: string,
    input: UpdateProjectInput,
  ): Promise<Project> {
    const trimmedTitle = input.title.trim()
    const hasDescription = typeof input.description === 'string'
    const trimmedDescription = hasDescription && input.description ? input.description.trim() : undefined
    const projectColor = input.color

    if (!trimmedTitle) {
      const errorMessage = 'Название проекта не может быть пустым'
      error.value = errorMessage
      throw new Error(errorMessage)
    }

    isUpdating.value = true
    error.value = null

    try {
      const updatedProject = await $fetch<Project>(`/api/projects/${projectId}`, getFetchOptions({
        method: 'PUT',
        body: {
          title: trimmedTitle,
          description: trimmedDescription,
          color: projectColor,
        },
      }))

      const projectIndex = projects.value.findIndex((project) => project.id === projectId)

      if (projectIndex !== -1) {
        projects.value.splice(projectIndex, 1, updatedProject)
      } else {
        projects.value.push(updatedProject)
      }

      console.info('[ProjectsStore] Project updated successfully', {
        projectId: updatedProject.id,
        title: updatedProject.title,
      })

      return updatedProject
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось обновить проект'
      error.value = errorMessage
      console.error('[ProjectsStore] Error updating project:', err)
      throw err
    } finally {
      isUpdating.value = false
    }
  }

  /**
   * Delete a project from the server
   */
  async function deleteProject(projectId: string): Promise<void> {
    isDeleting.value = true
    error.value = null

    try {
      await $fetch(`/api/projects/${projectId}`, getFetchOptions({
        method: 'DELETE',
      }))

      // Remove project from the list
      const projectIndex = projects.value.findIndex((project) => project.id === projectId)
      if (projectIndex !== -1) {
        projects.value.splice(projectIndex, 1)
      }

      console.info('[ProjectsStore] Project deleted successfully', {
        projectId,
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось удалить проект'
      error.value = errorMessage
      console.error('[ProjectsStore] Error deleting project:', err)
      throw err
    } finally {
      isDeleting.value = false
    }
  }

  /**
   * Get a project by ID from the store (without fetching from server)
   */
  function getProjectById(projectId: string): Project | undefined {
    return projects.value.find((project) => project.id === projectId)
  }

  /**
   * Set projects directly (useful for testing or manual updates)
   */
  function setProjects(newProjects: Project[]): void {
    projects.value = newProjects
  }

  /**
   * Clear all projects from the store
   */
  function clearProjects(): void {
    projects.value = []
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    error.value = null
  }


  // Getters as computed refs
  const projectsComputed = computed(() => projects.value)
  const isLoadingComputed = computed(() => isLoading.value)
  const isCreatingComputed = computed(() => isCreating.value)
  const isUpdatingComputed = computed(() => isUpdating.value)
  const isDeletingComputed = computed(() => isDeleting.value)
  const errorComputed = computed(() => error.value)

  return {
    // State (projects is writable for local task management)
    projects: projects,
    isLoading: isLoadingComputed,
    isCreating: isCreatingComputed,
    isUpdating: isUpdatingComputed,
    isDeleting: isDeletingComputed,
    error: errorComputed,
    // Actions
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    setProjects,
    clearProjects,
    clearError,
  }
})
