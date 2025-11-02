declare global {
  interface Window {
    __disableDoubleTapHandler?: (event: TouchEvent) => void
  }
}

export default defineNuxtPlugin(() => {
  let lastTouchEnd = 0

  const handleTouchEnd = (event: TouchEvent) => {
    const now = Date.now()

    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }

    lastTouchEnd = now
  }

  if (window.__disableDoubleTapHandler) {
    document.removeEventListener('touchend', window.__disableDoubleTapHandler)
  }

  window.__disableDoubleTapHandler = handleTouchEnd
  document.addEventListener('touchend', handleTouchEnd, { passive: false })
})
