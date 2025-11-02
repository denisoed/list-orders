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

  /**
   * Sets user data directly (useful for testing or manual updates)
   * @param userData - User object or null to clear
   */
  function setUser(userData: User | null): void {
    user.value = userData
  }

  /**
   * Clears user data from store
   */
  function clearUser(): void {
    user.value = null
  }

  // Getters as computed refs
  const userComputed = computed(() => user.value)
  const isLoadingComputed = computed(() => isLoading.value)

  return {
    // State (exposed as readonly)
    user: userComputed,
    isLoading: isLoadingComputed,
    setUser,
    clearUser
  }
})

