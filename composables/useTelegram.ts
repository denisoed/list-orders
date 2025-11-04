import { useState } from '#imports'
import { computed } from 'vue'

interface TelegramThemeSettings {
  headerColor: string
  backgroundColor: string
}

interface TelegramWebAppInitDataUnsafe {
  start_param?: string
  start_app?: string
  [key: string]: unknown
}

interface TelegramWebApp {
  ready: () => void
  expand?: () => void
  themeParams?: Record<string, string | undefined>
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  disableVerticalSwipes?: () => void
  initData?: string
  initDataUnsafe?: TelegramWebAppInitDataUnsafe
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void
  openTelegramLink?: (url: string) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

type MaybeTelegramWebApp = TelegramWebApp | null

const STORAGE_KEY = 'telegram-init-data'

const LIGHT_THEME: TelegramThemeSettings = {
  headerColor: '#f6f6f8',
  backgroundColor: '#f6f6f8',
}

const DARK_THEME: TelegramThemeSettings = {
  headerColor: '#101622',
  backgroundColor: '#101622',
}

const pickTheme = (): TelegramThemeSettings => {
  if (!import.meta.client) {
    return LIGHT_THEME
  }

  const isDark = document.documentElement.classList.contains('dark')
  return isDark ? { ...DARK_THEME } : { ...LIGHT_THEME }
}

const setCssVariables = (theme: TelegramThemeSettings) => {
  if (!import.meta.client) {
    return
  }

  const root = document.documentElement
  root.style.setProperty('--telegram-header-color', theme.headerColor)
  root.style.setProperty('--telegram-background-color', theme.backgroundColor)
}

export const useTelegram = () => {
  const webApp = useState<MaybeTelegramWebApp>('telegram-webapp-instance', () => null)
  const themeSettings = useState<TelegramThemeSettings>('telegram-theme-settings', () => pickTheme())

  const getWebAppInstance = (): MaybeTelegramWebApp => {
    if (!import.meta.client) {
      return null
    }

    if (webApp.value) {
      return webApp.value
    }

    const instance = window.Telegram?.WebApp ?? null
    webApp.value = instance

    return instance
  }

  const applyTheme = (overrides?: Partial<TelegramThemeSettings>) => {
    const theme = { ...pickTheme(), ...overrides }
    themeSettings.value = theme
    setCssVariables(theme)

    if (!import.meta.client) {
      return
    }

    const instance = getWebAppInstance()
    if (!instance) {
      return
    }

    try {
      instance.setHeaderColor(theme.headerColor)
    } catch (error) {
      console.warn('[Telegram] Unable to set header color', error)
    }

    try {
      instance.setBackgroundColor(theme.backgroundColor)
    } catch (error) {
      console.warn('[Telegram] Unable to set background color', error)
    }
  }

  /**
   * Validates initData format to ensure it's not empty or invalid
   * Checks that initData contains required parameters (hash and auth_date)
   */
  const isValidInitData = (initData: string | null | undefined): boolean => {
    if (!initData || typeof initData !== 'string') {
      return false
    }
    
    // Check that it's not just "query_id" or empty string
    if (initData === 'query_id' || initData.trim() === '') {
      return false
    }
    
    // Check that initData contains necessary parameters
    // Valid initData should contain at least hash and auth_date
    const hasHash = initData.includes('hash=')
    const hasAuthDate = initData.includes('auth_date=')
    
    return hasHash && hasAuthDate
  }

  /**
   * Loads initData from localStorage
   */
  const loadInitDataFromStorage = (): string | null => {
    if (!import.meta.client) {
      return null
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && isValidInitData(stored)) {
        console.log('[Telegram] Loaded initData from localStorage')
        return stored
      }
      if (stored && !isValidInitData(stored)) {
        // Remove invalid stored data
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.warn('[Telegram] Failed to load initData from localStorage', error)
      localStorage.removeItem(STORAGE_KEY)
    }

    return null
  }

  /**
   * Saves initData to localStorage if it's valid
   */
  const saveInitDataToStorage = (initData: string | null): void => {
    if (!import.meta.client) {
      return
    }

    try {
      if (initData && isValidInitData(initData)) {
        localStorage.setItem(STORAGE_KEY, initData)
        console.log('[Telegram] Saved valid initData to localStorage')
      } else {
        localStorage.removeItem(STORAGE_KEY)
        console.log('[Telegram] Removed invalid initData from localStorage')
      }
    } catch (error) {
      console.warn('[Telegram] Failed to save initData to localStorage', error)
    }
  }

  const getInitData = (): string | null => {
    if (!import.meta.client) {
      return null
    }

    // Always get fresh instance to ensure initData is available
    const instance = window.Telegram?.WebApp ?? null
    const newInitData = instance?.initData ?? null
    
    // If new initData is valid, use it and update storage
    if (isValidInitData(newInitData)) {
      saveInitDataToStorage(newInitData)
      return newInitData
    }
    
    // If new initData is not valid, try to load from storage
    const storedInitData = loadInitDataFromStorage()
    if (storedInitData) {
      return storedInitData
    }
    
    return null
  }

  /**
   * Waits for Telegram WebApp to be ready and available
   * This ensures the script is loaded and WebApp instance exists
   */
  const waitForWebAppReady = async (maxAttempts = 50, delayMs = 100): Promise<MaybeTelegramWebApp> => {
    if (!import.meta.client) {
      return null
    }

    // Check if already available
    if (window.Telegram?.WebApp) {
      return window.Telegram.WebApp
    }

    // Wait for script to load
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (window.Telegram?.WebApp) {
        return window.Telegram.WebApp
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }

    // If we reach here, Telegram WebApp is not available
    return null
  }

  const getStartParam = (): string | null => {
    if (!import.meta.client) {
      return null
    }

    const instance = window.Telegram?.WebApp ?? null
    return instance?.initDataUnsafe?.start_param ?? null
  }

  const openLink = (url: string, options?: { try_instant_view?: boolean }): void => {
    if (!import.meta.client) {
      return
    }

    const instance = window.Telegram?.WebApp ?? null
    if (instance?.openLink) {
      instance.openLink(url, options)
    } else {
      // Fallback for non-Telegram environment
      window.open(url, '_blank')
    }
  }

  const openTelegramLink = (url: string): void => {
    if (!import.meta.client) {
      return
    }

    const instance = window.Telegram?.WebApp ?? null
    if (instance?.openTelegramLink) {
      instance.openTelegramLink(url)
    } else if (instance?.openLink) {
      // Fallback to openLink if openTelegramLink is not available
      instance.openLink(url)
    } else {
      // Fallback for non-Telegram environment
      window.open(url, '_blank')
    }
  }

  const initTelegram = async (overrides?: Partial<TelegramThemeSettings>) => {
    if (!import.meta.client) {
      return
    }

    // Wait for Telegram WebApp script to load
    const instance = await waitForWebAppReady()
    if (!instance) {
      console.warn('[Telegram] WebApp is not available')
      return
    }

    // Cache the instance
    webApp.value = instance

    // Set CSS variables first
    setCssVariables(themeSettings.value)

    // Apply theme
    applyTheme(overrides)

    // Initialize WebApp according to Telegram documentation:
    // 1. Expand first (to fill the screen)
    // 2. Disable vertical swipes
    // 3. Call ready() to signal that Mini App is ready
    try {
      instance.expand?.()
    } catch (error) {
      console.warn('[Telegram] Unable to expand WebApp', error)
    }

    try {
      instance.disableVerticalSwipes?.()
    } catch (error) {
      console.warn('[Telegram] Unable to disable vertical swipes', error)
    }

    try {
      instance.ready()
    } catch (error) {
      console.warn('[Telegram] Unable to call ready()', error)
    }
  }

  return {
    telegram: computed(() => webApp.value),
    theme: computed(() => themeSettings.value),
    initTelegram,
    applyTheme,
    getInitData,
    waitForWebAppReady,
    getStartParam,
    openLink,
    openTelegramLink,
    saveInitDataToStorage,
    loadInitDataFromStorage,
  }
}
