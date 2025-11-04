<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: boolean
  name?: string
  disabled?: boolean
}>(), {
  modelValue: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isChecked = computed({
  get: () => props.modelValue ?? false,
  set: (value) => emit('update:modelValue', value),
})

const handleClick = () => {
  if (!props.disabled) {
    isChecked.value = !isChecked.value
  }
}
</script>

<template>
  <div class="relative inline-flex items-center">
    <input
      :id="name"
      :checked="isChecked"
      :name="name"
      :disabled="disabled"
      type="checkbox"
      class="sr-only"
      @change="handleClick"
    />
    <button
      type="button"
      :disabled="disabled"
      :aria-checked="isChecked"
      :aria-label="isChecked ? 'Снять флажок' : 'Установить флажок'"
      class="flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
      :class="
        isChecked
          ? 'border-primary bg-primary text-white'
          : 'border-[#3b4354] bg-[#1c1f27] text-transparent'
      "
      @click.prevent="handleClick"
    >
      <span class="material-symbols-outlined text-base leading-none">check</span>
    </button>
  </div>
</template>
