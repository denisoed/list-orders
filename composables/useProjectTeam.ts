import { useState } from '#imports'
import { computed, ref, watch, type Ref } from 'vue'
import type { ProjectTeamMember } from '~/data/team'
import { filterTeamMembers } from '~/utils/projectTeam'
import { useTelegram } from '~/composables/useTelegram'

interface ProjectTeamState {
  projectId: string
  members: ProjectTeamMember[]
}

const createEmptyTeamState = (): Record<string, ProjectTeamState> => ({})

export const useProjectTeamsState = () => useState<Record<string, ProjectTeamState>>('project-teams', createEmptyTeamState)

export interface UseProjectTeamResult {
  members: Ref<ProjectTeamMember[]>
  filteredMembers: Ref<ProjectTeamMember[]>
  memberCount: Ref<number>
  searchQuery: Ref<string>
  isLoading: Ref<boolean>
  isAdding: Ref<boolean>
  setSearchQuery: (value: string) => void
  fetchMembers: () => Promise<void>
  addMember: (telegramId: number, role?: string) => Promise<ProjectTeamMember | null>
  removeMember: (memberId: string) => Promise<void>
}

export const useProjectTeam = (projectId: Ref<string> | string): UseProjectTeamResult => {
  const teamsState = useProjectTeamsState()
  const projectIdRef = computed(() => (typeof projectId === 'string' ? projectId : projectId.value))

  const isLoading = ref(false)
  const isAdding = ref(false)

  const team = computed(() => teamsState.value[projectIdRef.value])
  const members = computed(() => team.value?.members ?? [])

  const searchQuery = ref('')
  const filteredMembers = computed(() => filterTeamMembers(members.value, searchQuery.value))
  const memberCount = computed(() => members.value.length)

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

  watch(projectIdRef, () => {
    searchQuery.value = ''
  })

  const fetchMembers = async (): Promise<void> => {
    if (!projectIdRef.value) return

    isLoading.value = true
    try {
      const response = await $fetch<ProjectTeamMember[]>(`/api/projects/${projectIdRef.value}/members`, getFetchOptions())
      
      teamsState.value = {
        ...teamsState.value,
        [projectIdRef.value]: {
          projectId: projectIdRef.value,
          members: response || [],
        },
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error)
      // Initialize with empty array if fetch fails
      teamsState.value = {
        ...teamsState.value,
        [projectIdRef.value]: {
          projectId: projectIdRef.value,
          members: [],
        },
      }
    } finally {
      isLoading.value = false
    }
  }

  const addMember = async (telegramId: number, role: string = 'Участник'): Promise<ProjectTeamMember | null> => {
    if (!projectIdRef.value) return null

    isAdding.value = true
    try {
      const member = await $fetch<ProjectTeamMember>(`/api/projects/${projectIdRef.value}/members`, getFetchOptions({
        method: 'POST',
        body: {
          memberTelegramId: telegramId,
          role,
        },
      }))

      // Update local state
      const currentTeam = teamsState.value[projectIdRef.value]
      if (currentTeam) {
        currentTeam.members = [...currentTeam.members, member]
      } else {
        teamsState.value = {
          ...teamsState.value,
          [projectIdRef.value]: {
            projectId: projectIdRef.value,
            members: [member],
          },
        }
      }

      return member
    } catch (error) {
      console.error('Failed to add member:', error)
      return null
    } finally {
      isAdding.value = false
    }
  }

  const removeMember = async (memberId: string): Promise<void> => {
    if (!projectIdRef.value) return

    try {
      await $fetch(`/api/projects/${projectIdRef.value}/members/${memberId}`, getFetchOptions({
        method: 'DELETE',
      }))

      // Update local state
      const currentTeam = teamsState.value[projectIdRef.value]
      if (currentTeam) {
        currentTeam.members = currentTeam.members.filter((m) => m.id !== memberId)
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
      throw error
    }
  }

  return {
    members,
    filteredMembers,
    memberCount,
    searchQuery,
    isLoading,
    isAdding,
    setSearchQuery: (value: string) => {
      searchQuery.value = value
    },
    fetchMembers,
    addMember,
    removeMember,
  }
}
