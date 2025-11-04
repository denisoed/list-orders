import type { Project } from '~/data/projects'
import {
  useProjectsStore,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '~/stores/projects'

/**
 * Composable for using projects with Pinia store
 * Provides a convenient interface to the projects store
 */
export const useProjects = () => {
  const store = useProjectsStore()

  /**
   * Fetch all projects from the server
   */
  const fetchProjects = async (): Promise<Project[]> => {
    return await store.fetchProjects()
  }

  /**
   * Fetch a single project by ID from the server
   */
  const fetchProject = async (projectId: string): Promise<Project> => {
    return await store.fetchProject(projectId)
  }

  /**
   * Create a new project on the server
   */
  const createProject = async (input: CreateProjectInput): Promise<Project> => {
    return await store.createProject(input)
  }

  /**
   * Update an existing project on the server
   */
  const updateProject = async (
    projectId: string,
    input: UpdateProjectInput,
  ): Promise<Project> => {
    return await store.updateProject(projectId, input)
  }

  /**
   * Delete a project from the server
   */
  const deleteProject = async (projectId: string): Promise<void> => {
    await store.deleteProject(projectId)
  }

  return {
    // State
    projects: store.projects,
    isLoading: store.isLoading,
    isCreating: store.isCreating,
    isUpdating: store.isUpdating,
    isDeleting: store.isDeleting,
    error: store.error,
    // Actions
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    // Additional helpers
    getProjectById: store.getProjectById,
  }
}

// Re-export types for convenience
export type { CreateProjectInput, UpdateProjectInput }
