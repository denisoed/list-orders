import { useState } from '#imports'
import { computed, ref, type Ref, watch } from 'vue'
import {
  TEAM_MEMBER_PROFILES,
  cloneTeamMemberProfile,
  type TeamMemberProfile,
  type TeamMemberTaskStatus,
} from '~/data/teamMemberProfiles'

const cloneProfiles = (): TeamMemberProfile[] => TEAM_MEMBER_PROFILES.map((profile) => cloneTeamMemberProfile(profile))

export const useTeamMemberProfilesState = () => useState<TeamMemberProfile[]>('team-member-profiles', cloneProfiles)

export interface UseTeamMemberProfileResult {
  profile: Ref<TeamMemberProfile | undefined>
  currentStatus: Ref<TeamMemberTaskStatus>
  setStatus: (value: TeamMemberTaskStatus) => void
}

export const useTeamMemberProfile = (
  memberId: Ref<string> | string,
  defaultStatus: TeamMemberTaskStatus = 'in-progress',
): UseTeamMemberProfileResult => {
  const profilesState = useTeamMemberProfilesState()
  const memberIdRef = computed(() => (typeof memberId === 'string' ? memberId : memberId.value))

  const profile = computed(() => profilesState.value.find((item) => item.id === memberIdRef.value))
  const currentStatus = ref<TeamMemberTaskStatus>(defaultStatus)

  watch(
    () => memberIdRef.value,
    () => {
      currentStatus.value = defaultStatus
    },
  )

  return {
    profile,
    currentStatus,
    setStatus: (value: TeamMemberTaskStatus) => {
      currentStatus.value = value
    },
  }
}
