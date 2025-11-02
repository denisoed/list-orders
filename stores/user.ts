import { defineStore } from 'pinia'

/**
 * TypeScript interface for user data from Supabase
 */
export interface User {
  telegram_id: number
  first_name: string | null
  last_name: string | null
  username: string | null
  language_code: string | null
  is_premium: boolean | null
  photo_url: string | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Pinia store for managing user data
 */
export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetches user data from server by telegram_id
   * @param telegramId - Telegram user ID
   */
  async function fetchUser(telegramId: number): Promise<void> {
    if (!telegramId || telegramId <= 0) {
      error.value = 'Invalid telegram_id'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ user: User }>(`/api/user/get`, {
        method: 'GET',
        query: {
          telegram_id: telegramId
        }
      })

      if (response.user) {
        user.value = response.user
        error.value = null
      } else {
        error.value = 'User data not found in response'
      }
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to fetch user'
      error.value = errorMessage
      console.warn('[User Store] Error fetching user:', errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Sets user data directly (useful for testing or manual updates)
   * @param userData - User object or null to clear
   */
  function setUser(userData: User | null): void {
    user.value = userData
    error.value = null
  }

  /**
   * Clears user data from store
   */
  function clearUser(): void {
    user.value = null
    error.value = null
    isLoading.value = false
  }

  // Getters as computed refs
  const userComputed = computed(() => user.value)
  const isLoadingComputed = computed(() => isLoading.value)
  const errorComputed = computed(() => error.value)

  return {
    // State (exposed as readonly)
    user: userComputed,
    isLoading: isLoadingComputed,
    error: errorComputed,
    // Actions
    fetchUser,
    setUser,
    clearUser
  }
})

