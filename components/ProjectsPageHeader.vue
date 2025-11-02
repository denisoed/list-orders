<script setup lang="ts">
import { computed, toRefs } from 'vue'
interface Props {
  title: string
  profileUrl?: string
  avatarUrl?: string | null
  userName?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Мои проекты',
  profileUrl: '/profile',
  avatarUrl: null,
  userName: undefined,
})

const { title, profileUrl, avatarUrl } = toRefs(props)

const avatarAltText = computed(() => {
  if (props.userName) {
    return `Аватар пользователя ${props.userName}`
  }

  return 'Аватар пользователя'
})
</script>

<template>
  <header
    class="sticky top-0 z-10 flex items-center justify-between p-4 pb-2 backdrop-blur-sm"
    :style="{ backgroundColor: 'var(--telegram-header-color, #f6f6f8)' }"
  >
    <h1 class="flex-1 text-lg font-bold leading-tight tracking-[-0.015em] text-black dark:text-white">
      {{ title }}
    </h1>
    <div class="flex items-center">
      <NuxtLink
        :to="profileUrl"
        class="flex size-10 items-center justify-center overflow-hidden rounded-full border border-transparent bg-gray-200 text-black transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-[#282e39] dark:text-white"
        aria-label="Перейти в профиль"
      >
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="avatarAltText"
          class="size-full object-cover"
        />
        <span v-else class="material-symbols-outlined text-2xl text-gray-500 dark:text-gray-300">person</span>
      </NuxtLink>
    </div>
  </header>
</template>
