<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  message: undefined,
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-10">
    <span
      class="material-symbols-outlined animate-spin text-primary"
      :class="{
        'text-2xl': size === 'sm',
        'text-4xl': size === 'md',
        'text-5xl': size === 'lg',
      }"
    >
      progress_activity
    </span>
    <p
      v-if="message"
      class="text-sm font-medium text-gray-600 dark:text-gray-400"
    >
      {{ message }}
    </p>
  </div>
</template>
