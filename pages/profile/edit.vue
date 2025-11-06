<script setup lang="ts">
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useHead, useRouter } from '#imports'
import { useUserStore, type UserProfileUpdates } from '~/stores/user'

type FormField = 'firstName' | 'lastName'

const router = useRouter()
const userStore = useUserStore()
const { user, isLoading, isSaving, saveError } = storeToRefs(userStore)

const form = reactive({
  firstName: '',
  lastName: '',
})

const touched = reactive<Record<FormField, boolean>>({
  firstName: false,
  lastName: false,
})

const errors = reactive<Record<FormField, string>>({
  firstName: '',
  lastName: '',
})

const submitAttempted = ref(false)
const submitSuccess = ref('')
const submitError = ref('')

watch(
  user,
  (value) => {
    if (!value) {
      form.firstName = ''
      form.lastName = ''
      return
    }

    form.firstName = value.first_name ?? ''
    form.lastName = value.last_name ?? ''
  },
  { immediate: true },
)

const displayName = computed(() => {
  const current = user.value
  if (!current) {
    return 'Профиль пользователя'
  }

  const parts = [current.first_name, current.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : current.username ?? 'Профиль пользователя'
})

const avatarAltText = computed(() => `Аватар пользователя ${displayName.value}`)

const telegramIdText = computed(() => (user.value?.telegram_id ? String(user.value.telegram_id) : ''))

const canCopyTelegramId = computed(() => telegramIdText.value.length > 0)

const isCopyingTelegramId = ref(false)

const telegramIdCopyStatus = ref<'idle' | 'copied' | 'error'>('idle')
const telegramIdCopyResetTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const clearTelegramIdCopyResetTimeout = () => {
  if (telegramIdCopyResetTimeout.value) {
    clearTimeout(telegramIdCopyResetTimeout.value)
    telegramIdCopyResetTimeout.value = null
  }
}

const resetTelegramIdStatus = () => {
  clearTelegramIdCopyResetTimeout()
  telegramIdCopyStatus.value = 'idle'
}

const handleCopyTelegramId = async () => {
  if (!canCopyTelegramId.value || isCopyingTelegramId.value) {
    return
  }

  if (typeof navigator === 'undefined' || typeof navigator.clipboard === 'undefined') {
    telegramIdCopyStatus.value = 'error'
    return
  }

  try {
    isCopyingTelegramId.value = true
    await navigator.clipboard.writeText(telegramIdText.value)
    telegramIdCopyStatus.value = 'copied'
    clearTelegramIdCopyResetTimeout()
    telegramIdCopyResetTimeout.value = setTimeout(() => {
      telegramIdCopyStatus.value = 'idle'
      telegramIdCopyResetTimeout.value = null
    }, 2000)
  }
  catch (error) {
    console.error('[ProfileEdit] Failed to copy Telegram ID', error)
    telegramIdCopyStatus.value = 'error'
  }
  finally {
    isCopyingTelegramId.value = false
  }
}

watch(telegramIdText, resetTelegramIdStatus)

onBeforeUnmount(() => {
  clearTelegramIdCopyResetTimeout()
})

const validateField = (field: FormField) => {
  const value = form[field].trim()

  switch (field) {
    case 'firstName':
      errors.firstName = value.length > 0 ? '' : 'Введите имя'
      break
    case 'lastName':
      errors.lastName = ''
      break
  }
}

const validateForm = () => {
  ;(['firstName', 'lastName'] as FormField[]).forEach((field) => {
    validateField(field)
  })

  return !errors.firstName
}

const hasChanges = computed(() => {
  const current = user.value
  if (!current) {
    return false
  }

  const firstName = form.firstName.trim()
  const lastName = form.lastName.trim()
  return (
    firstName !== (current.first_name ?? '') ||
    lastName !== (current.last_name ?? '')
  )
})

const handleBlur = (field: FormField) => {
  touched[field] = true
  validateField(field)
}

const resetFeedback = () => {
  if (submitSuccess.value) {
    submitSuccess.value = ''
  }
  if (submitError.value) {
    submitError.value = ''
  }
}

watch(
  () => [form.firstName, form.lastName],
  resetFeedback,
)

watch(
  () => form.firstName,
  () => {
    if (touched.firstName || submitAttempted.value) {
      validateField('firstName')
    }
  },
)

const prepareUpdates = (): UserProfileUpdates => {
  const firstName = form.firstName.trim()
  const lastName = form.lastName.trim()

  return {
    first_name: firstName,
    last_name: lastName.length > 0 ? lastName : null,
  }
}

const handleSubmit = async () => {
  submitAttempted.value = true
  ;(['firstName', 'lastName'] as FormField[]).forEach((field) => {
    touched[field] = true
  })

  if (!validateForm()) {
    submitError.value = 'Проверьте выделенные поля и исправьте ошибки'
    return
  }

  if (!user.value) {
    submitError.value = 'Пользователь не найден. Попробуйте обновить страницу'
    return
  }

  if (!hasChanges.value) {
    submitError.value = 'Нет изменений для сохранения'
    return
  }

  const result = await userStore.updateUserProfile(prepareUpdates())

  if (result.success) {
    submitSuccess.value = 'Профиль успешно обновлён'
    submitError.value = ''
  }
  else {
    submitSuccess.value = ''
    submitError.value = result.error ?? 'Не удалось обновить профиль'
  }
}

const handleRetry = () => {
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

const showFieldError = (field: FormField) => (submitAttempted.value || touched[field]) && Boolean(errors[field])

useHead({
  title: 'Редактирование профиля',
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
  <div
    class="relative flex min-h-screen w-full flex-col bg-background-light text-black dark:bg-background-dark dark:text-white"
    :style="{ backgroundColor: 'var(--telegram-background-color, #f6f6f8)' }"
  >
    <header
      class="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-background-light/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        aria-label="Вернуться на главную"
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col text-left">
        <h1 class="line-clamp-1 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          Редактирование профиля
        </h1>
        <p class="text-sm text-gray-500 dark:text-[#9da6b9]">Обновите личные данные и настройки аккаунта</p>
      </div>

      <div class="flex w-12 shrink-0 items-center justify-end"></div>
    </header>

    <main class="flex-1 space-y-6 px-4 py-6 pb-40">
      <section v-if="isLoading" class="mt-16 flex flex-col items-center gap-4 text-center">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p class="text-sm text-gray-600 dark:text-[#9da6b9]">Загружаем профиль пользователя…</p>
      </section>

      <section
        v-else-if="!user"
        class="mt-16 flex flex-col items-center gap-4 text-center text-gray-600 dark:text-[#9da6b9]"
      >
        <div class="flex size-20 items-center justify-center rounded-full bg-white text-primary shadow-lg dark:bg-[#1C2431]">
          <span class="material-symbols-outlined text-4xl">person_off</span>
        </div>
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-zinc-900 dark:text-white">Профиль недоступен</h2>
          <p class="max-w-xs text-sm">
            Мы не смогли загрузить данные пользователя. Обновите страницу или вернитесь на главную, чтобы попробовать снова.
          </p>
        </div>
        <div class="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            class="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-lg transition hover:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="handleRetry"
          >
            Обновить страницу
          </button>
          <button
            type="button"
            class="rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="$router.back()"
          >
            Вернуться назад
          </button>
        </div>
      </section>

      <section v-else class="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div class="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1C2431]">
          <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div class="flex items-center gap-4">
              <div
                class="flex size-20 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-500 dark:bg-[#282e39] dark:text-gray-300"
              >
                <img
                  v-if="user.photo_url"
                  :src="user.photo_url"
                  :alt="avatarAltText"
                  class="size-full object-cover"
                />
                <span v-else class="material-symbols-outlined text-4xl">person</span>
              </div>
              <div class="space-y-2">
                <p class="text-lg font-semibold leading-tight text-zinc-900 dark:text-white">{{ displayName }}</p>
                <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-[#9da6b9]" aria-live="polite">
                  <span class="text-sm">ID:</span>
                  <span v-if="canCopyTelegramId" class="font-semibold text-zinc-900 dark:text-white">{{ telegramIdText }}</span>
                  <span v-else class="text-sm font-medium text-zinc-900 dark:text-white">нет данных</span>
                  <button
                    v-if="canCopyTelegramId"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                    aria-label="Скопировать Telegram ID"
                    @click="handleCopyTelegramId"
                  >
                    <span class="material-symbols-outlined text-base">
                      {{ telegramIdCopyStatus === 'copied' ? 'check' : 'content_copy' }}
                    </span>
                  </button>
                  <span
                    v-if="telegramIdCopyStatus === 'error'"
                    class="text-xs font-medium text-red-500"
                  >
                    Не удалось скопировать
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form
          id="profile-form"
          class="space-y-5 rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1C2431]"
          novalidate
          @submit.prevent="handleSubmit"
        >
          <div class="space-y-1">
            <h2 class="text-lg font-semibold leading-tight text-zinc-900 dark:text-white">Основная информация</h2>
            <p class="text-sm text-gray-500 dark:text-[#9da6b9]">
              Эти данные видят коллеги и клиенты. Обязательно заполните имя.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Имя
              <input
                v-model="form.firstName"
                type="text"
                name="firstName"
                required
                autocomplete="given-name"
                class="h-11 rounded-xl border border-black/10 bg-white px-4 text-base text-zinc-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-transparent dark:text-white"
                @blur="handleBlur('firstName')"
              />
              <span
                v-if="showFieldError('firstName')"
                class="text-xs font-normal text-red-500"
                role="alert"
              >
                {{ errors.firstName }}
              </span>
            </label>

            <label class="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Фамилия
              <input
                v-model="form.lastName"
                type="text"
                name="lastName"
                autocomplete="family-name"
                class="h-11 rounded-xl border border-black/10 bg-white px-4 text-base text-zinc-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-transparent dark:text-white"
                @blur="handleBlur('lastName')"
              />
            </label>
          </div>
        </form>

        <NuxtLink
          to="/profile/archived-projects"
          class="group flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-[#1C2431]"
        >
          <div class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-black/5 text-primary dark:bg-white/10">
            <span class="material-symbols-outlined text-2xl">archive</span>
          </div>
          <div class="flex-1">
            <p class="text-base font-semibold leading-tight text-zinc-900 dark:text-white">Заархивированные проекты</p>
            <p class="mt-1 text-sm text-gray-500 dark:text-[#9da6b9]">Просмотр и управление заархивированными проектами</p>
          </div>
          <span class="material-symbols-outlined shrink-0 text-gray-400 transition group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400">
            chevron_right
          </span>
        </NuxtLink>
      </section>
    </main>
    <footer
      class="fixed bottom-0 left-0 z-20 w-full border-t border-black/10 bg-background-light/90 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-background-dark/90"
    >
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <div class="space-y-2" aria-live="polite">
          <div
            v-if="submitSuccess"
            class="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
          >
            <span class="material-symbols-outlined text-base" aria-hidden="true">check_circle</span>
            {{ submitSuccess }}
          </div>

          <div
            v-if="submitError || saveError"
            class="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/15 dark:text-red-300"
            role="alert"
          >
            <span class="material-symbols-outlined text-base" aria-hidden="true">error</span>
            {{ submitError || saveError }}
          </div>
        </div>
        <button
          type="submit"
          form="profile-form"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 text-base font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-primary/50"
          :disabled="isSaving || !hasChanges"
        >
          <span class="material-symbols-outlined text-base" aria-hidden="true">
            {{ isSaving ? 'progress_activity' : 'save' }}
          </span>
          {{ isSaving ? 'Сохраняем…' : 'Сохранить изменения' }}
        </button>
      </div>
    </footer>
  </div>
</template>
