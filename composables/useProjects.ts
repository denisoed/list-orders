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

const generateProjectId = () => `project-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`

export const useProjects = () => {
  const projectsState = useProjectsState()
  const isCreating = ref(false)
  const isUpdating = ref(false)

  const createProject = async (input: CreateProjectInput): Promise<Project> => {
    const trimmedTitle = input.title.trim()
    const trimmedDescription = input.description?.trim() ?? ''
    const projectColor = input.color

    if (!trimmedTitle) {
      throw new Error('Название проекта не может быть пустым')
    }

    isCreating.value = true

    try {
      const newProject: Project = {
        id: generateProjectId(),
        title: trimmedTitle,
        description: trimmedDescription,
        completed: 0,
        total: 0,
        tasks: [],
        color: projectColor,
      }

      projectsState.value = [newProject, ...projectsState.value]

      console.info('[projects] Создан новый проект', {
        projectId: newProject.id,
        title: newProject.title,
      })

      return newProject
    } catch (error) {
      console.error('[projects] Не удалось создать проект', error)
      throw error
    } finally {
      isCreating.value = false
    }
  }

  const updateProject = async (input: UpdateProjectInput): Promise<Project> => {
    const trimmedTitle = input.title.trim()
    const hasDescription = typeof input.description === 'string'
    const trimmedDescription = hasDescription ? input.description.trim() : undefined
    const projectColor = input.color

    if (!trimmedTitle) {
      throw new Error('Название проекта не может быть пустым')
    }

    const projectIndex = projectsState.value.findIndex((project) => project.id === input.id)

    if (projectIndex === -1) {
      throw new Error('Проект не найден')
    }

    isUpdating.value = true

    try {
      const existingProject = projectsState.value[projectIndex]
      const updatedProject: Project = {
        ...existingProject,
        title: trimmedTitle,
        description:
          trimmedDescription !== undefined ? trimmedDescription : existingProject.description,
        color: projectColor !== undefined ? projectColor : existingProject.color,
      }

      projectsState.value.splice(projectIndex, 1, updatedProject)

      console.info('[projects] Обновлен проект', {
        projectId: updatedProject.id,
        title: updatedProject.title,
      })

      return updatedProject
    } catch (error) {
      console.error('[projects] Не удалось обновить проект', error)
      throw error
    } finally {
      isUpdating.value = false
    }
  }

  return {
    isCreating,
    createProject,
    isUpdating,
    updateProject,
  }
}
