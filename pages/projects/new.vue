<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import { useProjects } from '~/composables/useProjects'

const router = useRouter()
const route = useRoute()
const { createProject, isCreating } = useProjects()

const title = ref('')
const titleTouched = ref(false)
const submitAttempted = ref(false)
const submitError = ref('')

const titleError = computed(() => {
  if (title.value.trim().length > 0) {
    return ''
  }
  return 'Введите название проекта'
})

const showTitleError = computed(() => (titleTouched.value || submitAttempted.value) && Boolean(titleError.value))
const isSubmitDisabled = computed(() => isCreating.value || Boolean(titleError.value))

const returnPath = computed(() => {
  const from = route.query.from
  if (typeof from === 'string' && from.length > 0) {
    return from
  }
  return '/'
})

const handleClose = () => {
  router.push(returnPath.value)
}

const handleTitleBlur = () => {
  titleTouched.value = true
}

const handleSubmit = async () => {
  submitAttempted.value = true
  submitError.value = ''

  if (titleError.value) {
    return
  }

  try {
    const project = await createProject({
      title: title.value,
    })

    await router.push(`/projects/${project.id}/tasks`)
  } catch (error) {
    submitError.value = 'Не удалось создать проект. Попробуйте ещё раз.'
  }
}

useHead({
  title: 'Новый проект',
  htmlAttrs: {
    lang: 'ru',
    class: 'dark',
  },
  bodyAttrs: {
    class: 'bg-background-light dark:bg-background-dark font-display',
    style: 'min-height: 100dvh;',
  },
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
    },
  ],
})
</script>

<template>
  <div class="relative flex min-h-screen w-full flex-col bg-background-dark text-white">
    <header class="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background-dark/80 p-4 pb-3 backdrop-blur-sm">
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Закрыть создание проекта"
        @click="handleClose"
      >
        <span class="material-symbols-outlined text-3xl">close</span>
      </button>
      <h1 class="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em]">Новый проект</h1>
      <div class="flex w-10 items-center justify-end"></div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 pt-4 pb-32">
      <div class="flex flex-col space-y-6">
        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Название проекта</p>
          <input
            v-model="title"
            class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            type="text"
            placeholder="Введите название проекта"
            :aria-invalid="showTitleError"
            enterkeyhint="done"
            @blur="handleTitleBlur"
          />
          <p v-if="showTitleError" class="pt-1 text-sm text-red-400">{{ titleError }}</p>
        </label>
      </div>
    </main>

    <footer class="fixed bottom-0 left-0 z-10 w-full bg-background-dark/80 p-4 backdrop-blur-sm">
      <div class="space-y-2">
        <p v-if="submitError" class="text-sm text-red-400">{{ submitError }}</p>
        <button
          type="button"
          class="w-full rounded-xl bg-primary px-5 py-4 text-center text-base font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
          :disabled="isSubmitDisabled"
          @click="handleSubmit"
        >
          {{ isCreating ? 'Создание…' : 'Создать проект' }}
        </button>
      </div>
    </footer>
  </div>
</template>
