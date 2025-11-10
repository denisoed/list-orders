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
  const projects = computed(() => store.projects)
  const archivedProjects = computed(() => store.archivedProjects)
  const isLoading = computed(() => store.isLoading)
  const isLoadingArchived = computed(() => store.isLoadingArchived)
  const isCreating = computed(() => store.isCreating)
  const isUpdating = computed(() => store.isUpdating)
  const isDeleting = computed(() => store.isDeleting)
  const error = computed(() => store.error)

  /**
   * Fetch all projects from the server
   */
  const fetchProjects = async (): Promise<Project[]> => {
    return await store.fetchProjects()
  }

  /**
   * Fetch archived projects from the server
   */
  const fetchArchivedProjects = async (): Promise<Project[]> => {
    return await store.fetchArchivedProjects()
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
   * Archive a project
   */
  const archiveProject = async (projectId: string): Promise<Project> => {
    return await store.archiveProject(projectId)
  }

  /**
   * Unarchive a project
   */
  const unarchiveProject = async (projectId: string): Promise<Project> => {
    return await store.unarchiveProject(projectId)
  }

  /**
   * Delete a project from the server
   */
  const deleteProject = async (projectId: string): Promise<void> => {
    await store.deleteProject(projectId)
  }

  return {
    // State
    projects,
    archivedProjects,
    isLoading,
    isLoadingArchived,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    // Actions
    fetchProjects,
    fetchArchivedProjects,
    fetchProject,
    createProject,
    updateProject,
    archiveProject,
    unarchiveProject,
    deleteProject,
    // Additional helpers
    getProjectById: store.getProjectById,
  }
}

