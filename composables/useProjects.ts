import { ref } from 'vue'
import type { Project } from '~/data/projects'
import { useProjectsState } from '~/composables/useProjectTasks'

export interface CreateProjectInput {
  title: string
}

const generateProjectId = () => `project-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`

export const useProjects = () => {
  const projectsState = useProjectsState()
  const isCreating = ref(false)

  const createProject = async (input: CreateProjectInput): Promise<Project> => {
    const trimmedTitle = input.title.trim()

    if (!trimmedTitle) {
      throw new Error('Название проекта не может быть пустым')
    }

    isCreating.value = true

    try {
      const newProject: Project = {
        id: generateProjectId(),
        title: trimmedTitle,
        description: '',
        completed: 0,
        total: 0,
        tasks: [],
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

  return {
    isCreating,
    createProject,
  }
}
