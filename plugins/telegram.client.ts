import { defineNuxtPlugin } from '#app'
import { useTelegram } from '#imports'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return
  }

  const { initTelegram } = useTelegram()

  const isDark = document.documentElement.classList.contains('dark')
  const theme = isDark
    ? { headerColor: '#101622', backgroundColor: '#101622' }
    : { headerColor: '#f6f6f8', backgroundColor: '#f6f6f8' }

  initTelegram(theme)
})
