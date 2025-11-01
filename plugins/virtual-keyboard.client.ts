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

  const dismissKeyboard = (element: HTMLInputElement | HTMLTextAreaElement) => {
    if (typeof navigator.virtualKeyboard?.hide === 'function') {
      navigator.virtualKeyboard.hide()
      return
    }

    window.requestAnimationFrame(() => {
      if (element === document.activeElement) {
        element.blur()
      }
    })
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

    dismissKeyboard(target)
  }

  const handleDoneKey = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') {
      return
    }

    const target = event.target

    if (!(target instanceof HTMLInputElement)) {
      return
    }

    const hintAttr = target.getAttribute('enterkeyhint')
    const hintProp = 'enterKeyHint' in target ? target.enterKeyHint : undefined
    const hint = (hintAttr ?? hintProp ?? '').toLowerCase()
    if (hint !== 'done') {
      return
    }

    event.preventDefault()
    dismissKeyboard(target)
  }

  window.addEventListener('blur', hideKeyboard, true)
  window.addEventListener('focusout', hideKeyboard, true)
  window.addEventListener('keydown', handleDoneKey, true)
})

export {}
