declare global {
  interface Navigator {
    virtualKeyboard?: {
      hide?: () => Promise<void> | void
      show?: () => Promise<void> | void
    }
  }
}

export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return
  }

  const isTextInput = (element: EventTarget | null): element is HTMLInputElement | HTMLTextAreaElement => {
    if (!(element instanceof HTMLElement)) {
      return false
    }

    if (element instanceof HTMLInputElement) {
      const textTypes = new Set([
        'text',
        'search',
        'email',
        'url',
        'tel',
        'password',
        'number'
      ])

      return textTypes.has(element.type) || element.type === ''
    }

    return element instanceof HTMLTextAreaElement
  }

  const hideKeyboard = (event: FocusEvent) => {
    const target = event.target

    if (!isTextInput(target)) {
      return
    }

    const nextFocused = event.relatedTarget
    if (isTextInput(nextFocused)) {
      return
    }

    if (typeof navigator.virtualKeyboard?.hide === 'function') {
      navigator.virtualKeyboard.hide()
      return
    }

    window.requestAnimationFrame(() => {
      if (target === document.activeElement) {
        target.blur()
      }
    })
  }

  window.addEventListener('blur', hideKeyboard, true)
  window.addEventListener('focusout', hideKeyboard, true)
})

export {}
