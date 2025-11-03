<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectedColor = computed({
  get: () => props.modelValue ?? COLORS[0].value,
  set: (value) => emit('update:modelValue', value),
})

const COLORS = [
  { name: 'Синий', value: '#3B82F6', class: 'bg-blue-500' },
  { name: 'Зелёный', value: '#10B981', class: 'bg-emerald-500' },
  { name: 'Красный', value: '#EF4444', class: 'bg-red-500' },
  { name: 'Оранжевый', value: '#F59E0B', class: 'bg-amber-500' },
  { name: 'Фиолетовый', value: '#8B5CF6', class: 'bg-violet-500' },
  { name: 'Розовый', value: '#EC4899', class: 'bg-pink-500' },
  { name: 'Бирюзовый', value: '#14B8A6', class: 'bg-teal-500' },
  { name: 'Голубой', value: '#06B6D4', class: 'bg-cyan-500' },
]
</script>

<template>
  <div class="flex flex-col">
    <p class="pb-2 text-base font-medium leading-normal">Цвет проекта</p>
    <div class="grid grid-cols-4 gap-3">
      <button
        v-for="color in COLORS"
        :key="color.value"
        type="button"
        class="group relative flex aspect-square items-center justify-center rounded-xl transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:focus-visible:outline-primary"
        :class="color.class"
        :aria-label="`Выбрать цвет ${color.name}`"
        :aria-pressed="selectedColor === color.value"
        @click="selectedColor = color.value"
      >
        <span
          v-if="selectedColor === color.value"
          class="material-symbols-outlined text-4xl text-white drop-shadow-lg"
        >
          check
        </span>
      </button>
    </div>
  </div>
</template>

