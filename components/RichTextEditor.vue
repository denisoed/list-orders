<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex items-center gap-1 rounded-full bg-[#1c1f27] px-3 py-2 text-sm font-medium text-[#9da6b9] transition hover:bg-[#222836] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="() => applyInlineFormat('**', '**')"
      >
        <span class="material-symbols-outlined text-base">format_bold</span>
        <span class="hidden sm:inline">Жирный</span>
      </button>
      <button
        type="button"
        class="flex items-center gap-1 rounded-full bg-[#1c1f27] px-3 py-2 text-sm font-medium text-[#9da6b9] transition hover:bg-[#222836] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="() => applyInlineFormat('*', '*')"
      >
        <span class="material-symbols-outlined text-base">format_italic</span>
        <span class="hidden sm:inline">Курсив</span>
      </button>
      <button
        v-if="props.showListButton"
        type="button"
        class="flex items-center gap-1 rounded-full bg-[#1c1f27] px-3 py-2 text-sm font-medium text-[#9da6b9] transition hover:bg-[#222836] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="applyBulletedList"
      >
        <span class="material-symbols-outlined text-base">format_list_bulleted</span>
        <span class="hidden sm:inline">Список</span>
      </button>
    </div>

    <textarea
      ref="textareaRef"
      :value="modelValue"
      class="form-input min-h-36 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
      :placeholder="placeholder"
      enterkeyhint="enter"
      @input="handleInput"
    ></textarea>

    <div
      v-if="showPreview && modelValue?.trim().length"
      class="rounded-xl border border-[#3b4354] bg-[#1c1f27] p-4 text-base leading-relaxed text-[#e2e6f0]"
    >
      <div v-html="previewHtml" />
    </div>
    <p v-else-if="showPreview" class="text-sm text-[#9da6b9]">
      Добавьте текст, чтобы увидеть предпросмотр форматирования.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { renderMarkdown } from '~/utils/markdown'

interface Props {
  modelValue: string
  placeholder?: string
  showListButton?: boolean
  showPreview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showListButton: true,
  showPreview: true,
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const previewHtml = computed(() => renderMarkdown(props.modelValue))

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function applyInlineFormat(prefix: string, suffix: string) {
  const textarea = textareaRef.value
  if (!textarea) {
    return
  }

  const { selectionStart, selectionEnd, value } = textarea
  const selectedText = value.slice(selectionStart, selectionEnd) || 'текст'
  const newValue = `${value.slice(0, selectionStart)}${prefix}${selectedText}${suffix}${value.slice(selectionEnd)}`

  emit('update:modelValue', newValue)

  requestAnimationFrame(() => {
    textarea.focus()
    const cursorPosition = selectionStart + prefix.length
    textarea.setSelectionRange(cursorPosition, cursorPosition + selectedText.length)
  })
}

function applyBulletedList() {
  const textarea = textareaRef.value
  if (!textarea) {
    return
  }

  const { selectionStart, selectionEnd, value } = textarea
  const before = value.slice(0, selectionStart)
  const selected = value.slice(selectionStart, selectionEnd)
  const after = value.slice(selectionEnd)

  const lines = (selected || 'Пункт списка').split(/\r?\n/)
  const formatted = lines.map((line) => {
    const trimmed = line.trim()
    return trimmed.startsWith('- ') ? trimmed : `- ${trimmed || 'Пункт списка'}`
  })

  const newValue = `${before}${formatted.join('\n')}${after}`

  emit('update:modelValue', newValue)

  requestAnimationFrame(() => {
    textarea.focus()
    const start = before.length
    textarea.setSelectionRange(start, start + formatted.join('\n').length)
  })
}

</script>
