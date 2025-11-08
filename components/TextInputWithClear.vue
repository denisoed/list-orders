<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

interface Props {
  modelValue: string
  placeholder?: string
  type?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  type: 'text',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'clear'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const attrs = useAttrs()

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs as Record<string, unknown>
  return rest
})

const inputClass = computed(() => attrs.class)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
  requestAnimationFrame(() => {
    inputRef.value?.focus()
  })
}
</script>

<template>
  <div class="relative">
    <input
      ref="inputRef"
      :value="props.modelValue"
      :type="props.type"
      :placeholder="props.placeholder"
      class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 pr-12 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
      :class="inputClass"
      v-bind="inputAttrs"
      @input="handleInput"
    />
    <button
      v-if="props.modelValue"
      type="button"
      class="absolute inset-y-0 right-3 flex items-center justify-center text-[#9da6b9] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label="Очистить текст"
      @click="handleClear"
    >
      <span class="material-symbols-outlined text-2xl">close</span>
    </button>
  </div>
</template>
