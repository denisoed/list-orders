<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHead, useRouter } from '#imports'
import { useProjects } from '~/composables/useProjects'

const router = useRouter()
const { createProject, isCreating } = useProjects()

const title = ref('')
const description = ref('')
const color = ref('#3B82F6')
const titleTouched = ref(false)
const submitAttempted = ref(false)
const submitError = ref('')
const isSubmittingLocal = ref(false)

const pageTitle = 'Новый проект'
const closeAriaLabel = 'Закрыть создание проекта'

const titleError = computed(() => {
  if (title.value.trim().length > 0) {
    return ''
  }
  return 'Введите название проекта'
})

const showTitleError = computed(() => (titleTouched.value || submitAttempted.value) && Boolean(titleError.value))
const isSubmitting = computed(() => isSubmittingLocal.value || isCreating.value)
const isSubmitDisabled = computed(() => isSubmitting.value || Boolean(titleError.value))
const submitButtonText = computed(() => (isSubmitting.value ? 'Создание…' : 'Создать проект'))

const handleTitleBlur = () => {
  titleTouched.value = true
}

const handleSubmit = async () => {
  submitAttempted.value = true
  submitError.value = ''

  if (titleError.value) {
    return
  }

  isSubmittingLocal.value = true

  try {
    const project = await createProject({
      title: title.value,
      description: description.value,
      color: color.value,
    })

    await router.push(`/projects/${project.id}/orders`)
  } catch (error) {
    submitError.value = 'Не удалось создать проект. Попробуйте ещё раз.'
  } finally {
    isSubmittingLocal.value = false
  }
}

useHead({
  title: pageTitle,
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
    <header
      class="flex items-center justify-between border-b border-white/10 bg-background-dark p-4 pb-3"
    >
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/5"
        :aria-label="closeAriaLabel"
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>
      <h1 class="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em]">{{ pageTitle }}</h1>
      <div class="flex w-12 items-center justify-end"></div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 pt-4 pb-12">
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
        <ColorSelector v-model="color" />
        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Описание</p>
          <textarea
            v-model="description"
            class="form-input min-h-36 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Добавьте детали о проекте, цели и задачи"
            enterkeyhint="enter"
          ></textarea>
        </label>
      </div>
    </main>

    <footer class="mt-auto w-full border-t border-white/10 bg-background-dark p-4 pb-8">
      <div class="space-y-2">
        <p v-if="submitError" class="text-sm text-red-400">{{ submitError }}</p>
        <button
          type="button"
          class="w-full rounded-xl bg-primary px-5 py-4 text-center text-base font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
          :disabled="isSubmitDisabled"
          @click="handleSubmit"
        >
          {{ submitButtonText }}
        </button>
      </div>
    </footer>
  </div>
</template>
