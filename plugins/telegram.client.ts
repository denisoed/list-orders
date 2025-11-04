import { defineNuxtPlugin } from '#app'
import { useTelegram } from '#imports'

export default defineNuxtPlugin(async () => {
  if (!import.meta.client) {
    return
  }

  // Wait for DOM to be ready if needed
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      if (document.readyState !== 'loading') {
        resolve(undefined)
      } else {
        document.addEventListener('DOMContentLoaded', () => resolve(undefined), { once: true })
      }
    })
  }

  const { initTelegram } = useTelegram()

  const isDark = document.documentElement.classList.contains('dark')
  const theme = isDark
    ? { headerColor: '#101622', backgroundColor: '#101622' }
    : { headerColor: '#f6f6f8', backgroundColor: '#f6f6f8' }

  // Initialize Telegram WebApp
  // Script is loaded in head with async, initTelegram will wait for it to be ready
  await initTelegram(theme)
})
