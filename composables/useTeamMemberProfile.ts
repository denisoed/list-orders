import { useState } from '#imports'
import { computed, ref, type Ref, watch } from 'vue'
import {
  TEAM_MEMBER_PROFILES,
  cloneTeamMemberProfile,
  type TeamMemberProfile,
  type TeamMemberOrderStatus,
} from '~/data/teamMemberProfiles'

const cloneProfiles = (): TeamMemberProfile[] => TEAM_MEMBER_PROFILES.map((profile) => cloneTeamMemberProfile(profile))

export const useTeamMemberProfilesState = () => useState<TeamMemberProfile[]>('team-member-profiles', cloneProfiles)

export interface UseTeamMemberProfileResult {
  profile: Ref<TeamMemberProfile | undefined>
  currentStatus: Ref<TeamMemberOrderStatus>
  setStatus: (value: TeamMemberOrderStatus) => void
}

export const useTeamMemberProfile = (
  memberId: Ref<string> | string,
  defaultStatus: TeamMemberOrderStatus = 'in-progress',
): UseTeamMemberProfileResult => {
  const profilesState = useTeamMemberProfilesState()
  const memberIdRef = computed(() => (typeof memberId === 'string' ? memberId : memberId.value))

  const profile = computed(() => profilesState.value.find((item) => item.id === memberIdRef.value))
  const currentStatus = ref<TeamMemberOrderStatus>(defaultStatus)

  watch(
    () => memberIdRef.value,
    () => {
      currentStatus.value = defaultStatus
    },
  )

  return {
    profile,
    currentStatus,
    setStatus: (value: TeamMemberOrderStatus) => {
      currentStatus.value = value
    },
  }
}
