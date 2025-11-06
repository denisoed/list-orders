<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: boolean
  name?: string
  disabled?: boolean
  label?: string
  description?: string
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
  <div class="flex items-center justify-between gap-4">
    <div class="flex flex-1 flex-col gap-1">
      <label
        v-if="label"
        :for="name"
        class="text-base font-medium leading-normal text-white"
        :class="{ 'cursor-pointer': !disabled, 'cursor-not-allowed opacity-50': disabled }"
        @click="!disabled && handleClick()"
      >
        {{ label }}
      </label>
      <p
        v-if="description"
        class="text-sm text-gray-400"
        :class="{ 'opacity-50': disabled }"
      >
        {{ description }}
      </p>
    </div>
    <button
      type="button"
      :disabled="disabled"
      :aria-checked="isChecked"
      :aria-label="isChecked ? 'Выключить' : 'Включить'"
      class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
      :class="
        isChecked
          ? 'bg-primary'
          : 'bg-white/10'
      "
      @click="handleClick"
    >
      <span
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
        :class="isChecked ? 'translate-x-5' : 'translate-x-0.5'"
      />
    </button>
  </div>
</template>

