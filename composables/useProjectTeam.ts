import { useState } from '#imports'
import { computed, ref, watch, type Ref } from 'vue'
import { PROJECT_TEAMS, type ProjectTeam, type ProjectTeamMember } from '~/data/team'
import { filterTeamMembers } from '~/utils/projectTeam'

const cloneTeams = (): ProjectTeam[] =>
  PROJECT_TEAMS.map((team) => ({
    projectId: team.projectId,
    members: team.members.map((member) => ({ ...member })),
  }))

export const useProjectTeamsState = () => useState<ProjectTeam[]>('project-teams', cloneTeams)

export interface UseProjectTeamResult {
  members: Ref<ProjectTeamMember[]>
  filteredMembers: Ref<ProjectTeamMember[]>
  memberCount: Ref<number>
  searchQuery: Ref<string>
  setSearchQuery: (value: string) => void
  setMembers: (value: ProjectTeamMember[]) => void
}

export const useProjectTeam = (projectId: Ref<string> | string): UseProjectTeamResult => {
  const teamsState = useProjectTeamsState()
  const projectIdRef = computed(() => (typeof projectId === 'string' ? projectId : projectId.value))

  const team = computed(() => teamsState.value.find((item) => item.projectId === projectIdRef.value))
  const members = computed(() => team.value?.members ?? [])

  const searchQuery = ref('')
  const filteredMembers = computed(() => filterTeamMembers(members.value, searchQuery.value))
  const memberCount = computed(() => members.value.length)

  watch(projectIdRef, () => {
    searchQuery.value = ''
  })

  const setMembers = (value: ProjectTeamMember[]) => {
    const targetIndex = teamsState.value.findIndex((item) => item.projectId === projectIdRef.value)

    if (targetIndex === -1) {
      teamsState.value = [
        ...teamsState.value,
        {
          projectId: projectIdRef.value,
          members: value.map((member) => ({ ...member })),
        },
      ]
      return
    }

    teamsState.value.splice(targetIndex, 1, {
      projectId: projectIdRef.value,
      members: value.map((member) => ({ ...member })),
    })
  }

  return {
    members,
    filteredMembers,
    memberCount,
    searchQuery,
    setSearchQuery: (value: string) => {
      searchQuery.value = value
    },
    setMembers,
  }
}
