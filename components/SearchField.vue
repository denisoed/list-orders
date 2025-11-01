<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
  ariaLabel?: string
  enterKeyHint?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Поиск',
  ariaLabel: 'Поле поиска',
  enterKeyHint: 'search',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <label class="relative flex h-11 w-full items-center">
    <span class="material-symbols-outlined pointer-events-none absolute left-3.5 text-2xl text-gray-400 dark:text-[#9da6b9]">
      search
    </span>
    <input
      :value="props.modelValue"
      class="form-input h-full w-full rounded-xl border-none bg-white pl-11 pr-4 text-base leading-normal text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-[#1c2431] dark:text-white dark:placeholder:text-[#9da6b9]"
      type="search"
      :placeholder="props.placeholder"
      :aria-label="props.ariaLabel"
      :enterkeyhint="props.enterKeyHint"
      @input="handleInput"
    />
  </label>
</template>
