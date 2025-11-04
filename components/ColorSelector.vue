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
  { name: 'Зелёный', value: '#22C55E', class: 'bg-green-500' },
  { name: 'Красный', value: '#EF4444', class: 'bg-red-500' },
  { name: 'Жёлтый', value: '#EAB308', class: 'bg-yellow-500' },
  { name: 'Фиолетовый', value: '#A855F7', class: 'bg-purple-500' },
  { name: 'Розовый', value: '#EC4899', class: 'bg-pink-500' },
  { name: 'Индиго', value: '#6366F1', class: 'bg-indigo-500' },
  { name: 'Оранжевый', value: '#F97316', class: 'bg-orange-500' },
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

