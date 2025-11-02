import { useState } from '#imports'
import { computed } from 'vue'

const TELEGRAM_SCRIPT_SRC = 'https://telegram.org/js/telegram-web-app.js'
const TELEGRAM_SCRIPT_ID = 'telegram-webapp-script'

interface TelegramThemeSettings {
  headerColor: string
  backgroundColor: string
}

interface TelegramWebApp {
  ready: () => void
  expand?: () => void
  themeParams?: Record<string, string | undefined>
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  disableVerticalSwipes?: () => void
  initData?: string
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

let scriptPromise: Promise<void> | null = null

const loadTelegramScript = (): Promise<void> => {
  if (!import.meta.client) {
    return Promise.resolve()
  }

  if (window.Telegram?.WebApp) {
    return Promise.resolve()
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(TELEGRAM_SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript?.dataset.loaded === 'true') {
      resolve()
      return
    }

    const script = existingScript ?? document.createElement('script')
    script.id = TELEGRAM_SCRIPT_ID
    script.src = TELEGRAM_SCRIPT_SRC
    script.async = true

    const handleLoad = () => {
      script.dataset.loaded = 'true'
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
      resolve()
    }

    const handleError = () => {
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
      reject(new Error('Failed to load Telegram WebApp script'))
    }

    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)

    if (!existingScript) {
      document.head.appendChild(script)
    }
  })

  return scriptPromise
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

  const sendInitDataToServer = async (): Promise<void> => {
    if (!import.meta.client) {
      return
    }

    const initData = getInitData()
    if (!initData) {
      return
    }

    try {
      await $fetch('/api/telegram/validate-init-data', {
        method: 'POST',
        body: { initData },
      })
    } catch (error) {
      console.warn('[Telegram] Failed to send initData to server', error)
    }
  }

  const initTelegram = async (overrides?: Partial<TelegramThemeSettings>) => {
    if (!import.meta.client) {
      return
    }

    try {
      setCssVariables(themeSettings.value)
      await loadTelegramScript()
    } catch (error) {
      console.warn('[Telegram] Script loading failed', error)
      return
    }

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

    // Send initData to server after initialization
    await sendInitDataToServer()
  }

  return {
    telegram: computed(() => webApp.value),
    theme: computed(() => themeSettings.value),
    initTelegram,
    applyTheme,
    getInitData,
    sendInitDataToServer,
  }
}
