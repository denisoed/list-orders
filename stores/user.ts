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
  time_zone: string | null
  created_at: string | null
  updated_at: string | null
}

export interface UserProfileUpdates {
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  language_code?: string | null
  time_zone?: string | null
}

/**
 * Pinia store for managing user data
 */
export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)

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

  async function updateUserProfile(
    updates: UserProfileUpdates,
  ): Promise<{ success: true; user: User } | { success: false; error: string }> {
    const currentUser = user.value

    if (!currentUser) {
      const errorMessage = 'Невозможно обновить профиль: пользователь не загружен'
      saveError.value = errorMessage
      console.error('[UserStore] updateUserProfile failed:', errorMessage)

      return { success: false, error: errorMessage }
    }

    isSaving.value = true
    saveError.value = null

    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 450))

      const updatedUser: User = {
        ...currentUser,
        ...updates,
        updated_at: new Date().toISOString(),
      }

      user.value = updatedUser

      console.info('[UserStore] Profile updated successfully', {
        telegram_id: updatedUser.telegram_id,
      })

      return { success: true, user: updatedUser }
    }
    catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Неизвестная ошибка при обновлении профиля'

      saveError.value = errorMessage
      console.error('[UserStore] updateUserProfile encountered an error:', error)

      return { success: false, error: errorMessage }
    }
    finally {
      isSaving.value = false
    }
  }

  // Getters as computed refs
  const userComputed = computed(() => user.value)
  const isLoadingComputed = computed(() => isLoading.value)
  const isSavingComputed = computed(() => isSaving.value)
  const saveErrorComputed = computed(() => saveError.value)

  return {
    // State (exposed as readonly)
    user: userComputed,
    isLoading: isLoadingComputed,
    isSaving: isSavingComputed,
    saveError: saveErrorComputed,
    setUser,
    clearUser,
    updateUserProfile,
  }
})

