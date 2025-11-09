import { useState } from '#imports'
import { computed, ref, type Ref, watch } from 'vue'
import type { TeamMemberProfile, TeamMemberOrderStatus } from '~/data/teamMemberProfiles'
import { useTelegram } from '~/composables/useTelegram'

interface CachedTeamMemberProfile {
  profile?: TeamMemberProfile
  fetchedAt: number
}

const createProfilesCache = (): Record<string, CachedTeamMemberProfile> => ({})

export const useTeamMemberProfilesState = () =>
  useState<Record<string, CachedTeamMemberProfile>>('team-member-profiles', createProfilesCache)

export interface UseTeamMemberProfileResult {
  profile: Ref<TeamMemberProfile | undefined>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  currentStatus: Ref<TeamMemberOrderStatus>
  setStatus: (value: TeamMemberOrderStatus) => void
  refresh: () => Promise<void>
}

interface UseTeamMemberProfileOptions {
  projectId: Ref<string> | string
  defaultStatus?: TeamMemberOrderStatus
}

const createFetchHeaders = () => {
  const { getInitData } = useTelegram()
  const initData = getInitData()

  const headers: Record<string, string> = {}
  if (initData) {
    headers['x-telegram-init-data'] = initData
  }

  return headers
}

export const useTeamMemberProfile = (
  memberId: Ref<string> | string,
  options: UseTeamMemberProfileOptions,
): UseTeamMemberProfileResult => {
  const { projectId, defaultStatus = 'in-progress' } = options

  const profilesState = useTeamMemberProfilesState()

  const memberIdRef = computed(() => (typeof memberId === 'string' ? memberId : memberId.value))
  const projectIdRef = computed(() => (typeof projectId === 'string' ? projectId : projectId.value))
  const cacheKey = computed(() => {
    const member = memberIdRef.value
    const project = projectIdRef.value

    if (!member || !project) {
      return null
    }

    return `${project}:${member}`
  })

  const currentStatus = ref<TeamMemberOrderStatus>(defaultStatus)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const profile = computed<TeamMemberProfile | undefined>(() => {
    const key = cacheKey.value
    if (!key) {
      return undefined
    }

    return profilesState.value[key]?.profile
  })

  const fetchProfile = async (force = false): Promise<void> => {
    const key = cacheKey.value
    const member = memberIdRef.value
    const project = projectIdRef.value

    if (!key || !member || !project) {
      return
    }

    if (!force && profilesState.value[key]?.profile !== undefined) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<TeamMemberProfile>(`/api/team-members/${encodeURIComponent(member)}`, {
        headers: createFetchHeaders(),
        query: {
          projectId: project,
        },
      })

      profilesState.value = {
        ...profilesState.value,
        [key]: {
          profile: response,
          fetchedAt: Date.now(),
        },
      }
    } catch (err: any) {
      const statusCode = err?.status ?? err?.statusCode ?? err?.response?.status
      if (statusCode === 404) {
        error.value = 'Профиль не найден'
        profilesState.value = {
          ...profilesState.value,
          [key]: {
            profile: undefined,
            fetchedAt: Date.now(),
          },
        }
      } else {
        console.error('[useTeamMemberProfile] Failed to load profile', err)
        error.value = 'Не удалось загрузить профиль'
      }
    } finally {
      isLoading.value = false
    }
  }

  watch(
    [memberIdRef, projectIdRef],
    async ([member, project]) => {
      currentStatus.value = defaultStatus

      if (!member || !project) {
        return
      }

      await fetchProfile()
    },
    { immediate: true },
  )

  return {
    profile,
    isLoading,
    error,
    currentStatus,
    setStatus: (value: TeamMemberOrderStatus) => {
      currentStatus.value = value
    },
    refresh: () => fetchProfile(true),
  }
}
