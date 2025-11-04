<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string
  value: string
  name?: string
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isChecked = computed({
  get: () => props.modelValue === props.value,
  set: () => emit('update:modelValue', props.value),
})

const handleClick = () => {
  if (!props.disabled) {
    isChecked.value = true
  }
}
</script>

<template>
  <div class="relative inline-flex items-center">
    <input
      :id="`${name}-${value}`"
      :checked="isChecked"
      :name="name"
      :value="value"
      :disabled="disabled"
      type="radio"
      class="sr-only"
      @change="handleClick"
    />
    <button
      type="button"
      :disabled="disabled"
      :aria-checked="isChecked"
      :aria-label="`Выбрать ${value}`"
      class="flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
      :class="
        isChecked
          ? 'border-primary bg-primary'
          : 'border-[#3b4354] bg-[#1c1f27]'
      "
      @click.prevent="handleClick"
    >
      <span
        v-if="isChecked"
        class="size-2.5 rounded-full bg-white"
      ></span>
    </button>
  </div>
</template>
