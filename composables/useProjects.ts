import { ref } from 'vue'
import type { Project } from '~/data/projects'
import { useProjectsState } from '~/composables/useProjectTasks'

export interface CreateProjectInput {
  title: string
  description?: string
  color?: string
}

export interface UpdateProjectInput {
  id: string
  title: string
  description?: string
  color?: string
}

export const useProjects = () => {
  const projectsState = useProjectsState()
  const isCreating = ref(false)
  const isUpdating = ref(false)
  const isFetching = ref(false)
  const isDeleting = ref(false)

  /**
   * Fetch all projects from the server
   */
  const fetchProjects = async (): Promise<Project[]> => {
    isFetching.value = true

    try {
      const response = await $fetch<Project[]>('/api/projects')

      // Update local state
      projectsState.value = response.map((project) => ({
        ...project,
        tasks: project.tasks || [],
      }))

      console.info('[projects] Загружены проекты', {
        count: response.length,
      })

      return projectsState.value
    } catch (error) {
      console.error('[projects] Не удалось загрузить проекты', error)
      throw error
    } finally {
      isFetching.value = false
    }
  }

  /**
   * Fetch a single project by ID from the server
   */
  const fetchProject = async (projectId: string): Promise<Project> => {
    isFetching.value = true

    try {
      const project = await $fetch<Project>(`/api/projects/${projectId}`)

      // Update local state
      const projectIndex = projectsState.value.findIndex((p) => p.id === projectId)
      const projectWithTasks = {
        ...project,
        tasks: project.tasks || [],
      }

      if (projectIndex !== -1) {
        projectsState.value.splice(projectIndex, 1, projectWithTasks)
      } else {
        projectsState.value.push(projectWithTasks)
      }

      console.info('[projects] Загружен проект', {
        projectId: project.id,
        title: project.title,
      })

      return projectWithTasks
    } catch (error) {
      console.error('[projects] Не удалось загрузить проект', error)
      throw error
    } finally {
      isFetching.value = false
    }
  }

  /**
   * Create a new project on the server
   */
  const createProject = async (input: CreateProjectInput): Promise<Project> => {
    const trimmedTitle = input.title.trim()
    const trimmedDescription = input.description?.trim() ?? ''
    const projectColor = input.color

    if (!trimmedTitle) {
      throw new Error('Название проекта не может быть пустым')
    }

    isCreating.value = true

    try {
      const newProject = await $fetch<Project>('/api/projects', {
        method: 'POST',
        body: {
          title: trimmedTitle,
          description: trimmedDescription,
          color: projectColor,
        },
      })

      // Update local state
      const projectWithTasks: Project = {
        ...newProject,
        tasks: newProject.tasks || [],
      }

      projectsState.value = [projectWithTasks, ...projectsState.value]

      console.info('[projects] Создан новый проект', {
        projectId: newProject.id,
        title: newProject.title,
      })

      return projectWithTasks
    } catch (error) {
      console.error('[projects] Не удалось создать проект', error)
      throw error
    } finally {
      isCreating.value = false
    }
  }

  /**
   * Update an existing project on the server
   */
  const updateProject = async (input: UpdateProjectInput): Promise<Project> => {
    const trimmedTitle = input.title.trim()
    const hasDescription = typeof input.description === 'string'
    const trimmedDescription = hasDescription ? input.description.trim() : undefined
    const projectColor = input.color

    if (!trimmedTitle) {
      throw new Error('Название проекта не может быть пустым')
    }

    isUpdating.value = true

    try {
      const updatedProject = await $fetch<Project>(`/api/projects/${input.id}`, {
        method: 'PUT',
        body: {
          title: trimmedTitle,
          description: trimmedDescription,
          color: projectColor,
        },
      })

      // Update local state
      const projectIndex = projectsState.value.findIndex((project) => project.id === input.id)
      const projectWithTasks: Project = {
        ...updatedProject,
        tasks: updatedProject.tasks || [],
      }

      if (projectIndex !== -1) {
        // Preserve existing tasks if project already exists in state
        const existingProject = projectsState.value[projectIndex]
        projectWithTasks.tasks = existingProject.tasks || []
        projectsState.value.splice(projectIndex, 1, projectWithTasks)
      } else {
        projectsState.value.push(projectWithTasks)
      }

      console.info('[projects] Обновлен проект', {
        projectId: updatedProject.id,
        title: updatedProject.title,
      })

      return projectWithTasks
    } catch (error) {
      console.error('[projects] Не удалось обновить проект', error)
      throw error
    } finally {
      isUpdating.value = false
    }
  }

  /**
   * Delete a project from the server
   */
  const deleteProject = async (projectId: string): Promise<void> => {
    isDeleting.value = true

    try {
      await $fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      // Update local state
      const projectIndex = projectsState.value.findIndex((project) => project.id === projectId)
      if (projectIndex !== -1) {
        projectsState.value.splice(projectIndex, 1)
      }

      console.info('[projects] Удален проект', {
        projectId,
      })
    } catch (error) {
      console.error('[projects] Не удалось удалить проект', error)
      throw error
    } finally {
      isDeleting.value = false
    }
  }

  return {
    isCreating,
    isUpdating,
    isFetching,
    isDeleting,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
  }
}
