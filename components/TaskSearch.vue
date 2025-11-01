<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Найти по названию или исполнителю…',
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
  <label class="block">
    <span class="sr-only">Поиск по задачам</span>
    <div class="flex h-12 w-full items-center overflow-hidden rounded-xl bg-zinc-200 transition focus-within:ring-2 focus-within:ring-primary dark:bg-zinc-800">
      <div class="flex h-full items-center justify-center px-4 text-zinc-500 dark:text-zinc-400">
        <span class="material-symbols-outlined">search</span>
      </div>
      <input
        :value="props.modelValue"
        type="search"
        class="form-input flex-1 border-none bg-transparent text-base text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-zinc-400"
        :placeholder="props.placeholder"
        autocomplete="off"
        aria-label="Поиск по задачам"
        enterkeyhint="done"
        @input="handleInput"
      />
    </div>
  </label>
</template>
