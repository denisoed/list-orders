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

  const getInitData = (): string | null => {
    if (!import.meta.client) {
      return null
    }

    // Always get fresh instance to ensure initData is available
    const instance = window.Telegram?.WebApp ?? null
    return instance?.initData ?? null
  }

  /**
   * Waits for Telegram WebApp to be ready and returns initData
   * This is useful when the app is reloaded and Telegram WebApp might not be initialized yet
   */
  const waitForInitData = async (maxAttempts = 10, delayMs = 100): Promise<string | null> => {
    if (!import.meta.client) {
      return null
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const instance = window.Telegram?.WebApp ?? null
      const initData = instance?.initData

      if (initData) {
        return initData
      }

      // Wait before next attempt
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    // If we reach here, Telegram WebApp is not available or initData is not set
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

    setCssVariables(themeSettings.value)

    applyTheme(overrides)

    const instance = getWebAppInstance()
    if (!instance) {
      return
    }

    try {
      instance.disableVerticalSwipes?.()
    } catch (error) {
      console.warn('[Telegram] Unable to disable vertical swipes', error)
    }

    try {
      instance.expand?.()
      instance.ready()
    } catch (error) {
      console.warn('[Telegram] Unable to initialize WebApp', error)
    }
  }

  return {
    telegram: computed(() => webApp.value),
    theme: computed(() => themeSettings.value),
    initTelegram,
    applyTheme,
    getInitData,
    waitForInitData,
    getStartParam,
    openLink,
    openTelegramLink,
  }
}
