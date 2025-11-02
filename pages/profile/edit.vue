<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useHead, useRouter } from '#imports'
import { useUserStore, type UserProfileUpdates } from '~/stores/user'

type FormField = 'firstName' | 'lastName' | 'username' | 'languageCode'

const router = useRouter()
const userStore = useUserStore()
const { user, isLoading, isSaving, saveError } = storeToRefs(userStore)

const form = reactive({
  firstName: '',
  lastName: '',
  username: '',
  languageCode: '',
})

const touched = reactive<Record<FormField, boolean>>({
  firstName: false,
  lastName: false,
  username: false,
  languageCode: false,
})

const errors = reactive<Record<FormField, string>>({
  firstName: '',
  lastName: '',
  username: '',
  languageCode: '',
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
      form.username = ''
      form.languageCode = ''
      return
    }

    form.firstName = value.first_name ?? ''
    form.lastName = value.last_name ?? ''
    form.username = value.username ?? ''
    form.languageCode = value.language_code ?? ''
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

const premiumStatus = computed(() => user.value?.is_premium === true)

const premiumStatusLabel = computed(() => (premiumStatus.value ? 'Активен' : 'Неактивен'))

const premiumDescription = computed(() =>
  premiumStatus.value
    ? 'У пользователя активна подписка Telegram Premium'
    : 'Подписка Telegram Premium не активна',
)

const usernamePattern = /^[a-zA-Z0-9_]{3,32}$/
const languagePattern = /^[a-z]{2}$/i

const validateField = (field: FormField) => {
  const value = form[field].trim()

  switch (field) {
    case 'firstName':
      errors.firstName = value.length > 0 ? '' : 'Введите имя'
      break
    case 'username':
      if (value.length === 0) {
        errors.username = ''
      }
      else if (!usernamePattern.test(value)) {
        errors.username = 'Используйте 3–32 символа: латиница, цифры и нижнее подчёркивание'
      }
      else {
        errors.username = ''
      }
      break
    case 'languageCode':
      if (value.length === 0) {
        errors.languageCode = ''
      }
      else if (!languagePattern.test(value)) {
        errors.languageCode = 'Используйте двухбуквенный код, например «ru»'
      }
      else {
        errors.languageCode = ''
      }
      break
    case 'lastName':
      errors.lastName = ''
      break
  }
}

const validateForm = () => {
  ;(['firstName', 'lastName', 'username', 'languageCode'] as FormField[]).forEach((field) => {
    validateField(field)
  })

  return !errors.firstName && !errors.username && !errors.languageCode
}

const hasChanges = computed(() => {
  const current = user.value
  if (!current) {
    return false
  }

  const firstName = form.firstName.trim()
  const lastName = form.lastName.trim()
  const username = form.username.trim()
  const language = form.languageCode.trim()

  return (
    firstName !== (current.first_name ?? '') ||
    lastName !== (current.last_name ?? '') ||
    username !== (current.username ?? '') ||
    language !== (current.language_code ?? '')
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
  () => [form.firstName, form.lastName, form.username, form.languageCode],
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

watch(
  () => form.username,
  () => {
    if (touched.username || submitAttempted.value) {
      validateField('username')
    }
  },
)

watch(
  () => form.languageCode,
  () => {
    if (touched.languageCode || submitAttempted.value) {
      validateField('languageCode')
    }
  },
)

const prepareUpdates = (): UserProfileUpdates => {
  const firstName = form.firstName.trim()
  const lastName = form.lastName.trim()
  const username = form.username.trim()
  const language = form.languageCode.trim().toLowerCase()

  return {
    first_name: firstName,
    last_name: lastName.length > 0 ? lastName : null,
    username: username.length > 0 ? username : null,
    language_code: language.length > 0 ? language : null,
  }
}

const handleSubmit = async () => {
  submitAttempted.value = true
  ;(['firstName', 'lastName', 'username', 'languageCode'] as FormField[]).forEach((field) => {
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

const handleNavigateHome = () => {
  router.push('/')
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
        @click="handleNavigateHome"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col text-left">
        <h1 class="line-clamp-1 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          Редактирование профиля
        </h1>
        <p class="text-sm text-gray-500 dark:text-[#9da6b9]">Обновите личные данные и настройки аккаунта</p>
      </div>

      <NuxtLink
        v-if="user?.telegram_id"
        :to="`/profile/${user.telegram_id}`"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span class="material-symbols-outlined text-2xl">person_search</span>
        <span class="sr-only">Посмотреть публичный профиль</span>
      </NuxtLink>
      <div v-else class="flex size-12 shrink-0 items-center justify-center"></div>
    </header>

    <main class="flex-1 space-y-6 px-4 py-6 pb-24">
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
            @click="handleNavigateHome"
          >
            На главную
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
              <div class="space-y-1">
                <p class="text-lg font-semibold leading-tight text-zinc-900 dark:text-white">{{ displayName }}</p>
                <p class="text-sm text-gray-500 dark:text-[#9da6b9]">
                  ID в Telegram: {{ user.telegram_id }}
                </p>
              </div>
            </div>

            <div
              class="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary dark:border-primary/30 dark:bg-primary/10"
            >
              <span class="material-symbols-outlined text-2xl">workspace_premium</span>
              <div class="flex flex-col">
                <span>Премиум статус: {{ premiumStatusLabel }}</span>
                <span class="text-xs font-normal text-primary/80 dark:text-primary/70">{{ premiumDescription }}</span>
              </div>
            </div>
          </div>
        </div>

        <form
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

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Имя пользователя Telegram
              <input
                v-model="form.username"
                type="text"
                inputmode="text"
                name="username"
                autocomplete="username"
                placeholder="username"
                class="h-11 rounded-xl border border-black/10 bg-white px-4 text-base text-zinc-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-transparent dark:text-white"
                @blur="handleBlur('username')"
              />
              <span
                v-if="showFieldError('username')"
                class="text-xs font-normal text-red-500"
                role="alert"
              >
                {{ errors.username }}
              </span>
            </label>

            <label class="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Язык интерфейса
              <input
                v-model="form.languageCode"
                type="text"
                name="languageCode"
                maxlength="5"
                autocomplete="off"
                placeholder="ru"
                class="h-11 rounded-xl border border-black/10 bg-white px-4 text-base text-zinc-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-transparent dark:text-white"
                @blur="handleBlur('languageCode')"
              />
              <span
                v-if="showFieldError('languageCode')"
                class="text-xs font-normal text-red-500"
                role="alert"
              >
                {{ errors.languageCode }}
              </span>
            </label>
          </div>

          <div class="space-y-3">
            <h3 class="text-lg font-semibold leading-tight text-zinc-900 dark:text-white">Аватар</h3>
            <p class="text-sm text-gray-500 dark:text-[#9da6b9]">
              Изображение берётся из Telegram и обновляется автоматически. Чтобы изменить его, обновите фото в Telegram.
            </p>
            <div class="flex items-center gap-4">
              <div
                class="flex size-16 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-500 dark:bg-[#282e39] dark:text-gray-300"
              >
                <img
                  v-if="user.photo_url"
                  :src="user.photo_url"
                  :alt="avatarAltText"
                  class="size-full object-cover"
                />
                <span v-else class="material-symbols-outlined text-3xl">person</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-[#9da6b9]">
                Для обновления изображения откройте настройки Telegram. После синхронизации изменения появятся автоматически.
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-lg font-semibold leading-tight text-zinc-900 dark:text-white">Уведомления</h3>
            <p class="text-sm text-gray-500 dark:text-[#9da6b9]">
              Уведомления отправляются через Telegram. Настройки канала доставки будут доступны после подключения CRM.
            </p>
          </div>

          <div class="space-y-3">
            <h3 class="text-lg font-semibold leading-tight text-zinc-900 dark:text-white">Сохранение</h3>
            <p class="text-sm text-gray-500 dark:text-[#9da6b9]">
              Проверьте данные перед сохранением. Изменения применяются мгновенно и отображаются для всей команды.
            </p>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                class="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                :disabled="isSaving || !hasChanges"
              >
                <span class="material-symbols-outlined text-base" aria-hidden="true">
                  {{ isSaving ? 'progress_activity' : 'save' }}
                </span>
                {{ isSaving ? 'Сохраняем…' : 'Сохранить изменения' }}
              </button>

              <span class="text-xs text-gray-500 dark:text-[#9da6b9]">
                Последнее обновление: {{ user.updated_at ? new Date(user.updated_at).toLocaleString('ru-RU') : 'нет данных' }}
              </span>
            </div>

            <div class="space-y-2" aria-live="polite">
              <div
                v-if="submitSuccess"
                class="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
              >
                <span class="material-symbols-outlined text-base">check_circle</span>
                {{ submitSuccess }}
              </div>

              <div
                v-if="submitError || saveError"
                class="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/15 dark:text-red-300"
                role="alert"
              >
                <span class="material-symbols-outlined text-base">error</span>
                {{ submitError || saveError }}
              </div>
            </div>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>
