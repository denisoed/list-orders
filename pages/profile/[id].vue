<script setup lang="ts">
import { computed, watch } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import { useTeamMemberProfile } from '~/composables/useTeamMemberProfile'
import type { TeamMemberContact, TeamMemberOrderStatus } from '~/data/teamMemberProfiles'

const route = useRoute()
const router = useRouter()

const memberId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
})

const projectId = computed(() => {
  const raw = route.query.projectId
  if (Array.isArray(raw)) {
    return raw[0] ?? ''
  }
  return typeof raw === 'string' ? raw : ''
})

const { profile, isLoading, error, currentStatus, setStatus, refresh } = useTeamMemberProfile(memberId, {
  projectId,
})

const statusOptions: { value: TeamMemberOrderStatus; label: string }[] = [
  { value: 'in-progress', label: 'В работе' },
  { value: 'completed', label: 'Завершено' },
  { value: 'overdue', label: 'Просрочено' },
]

const ensureStatusMatchesData = () => {
  if (!profile.value) {
    return
  }

  const hasOrdersForCurrent = profile.value.orders.some((order) => order.status === currentStatus.value)

  if (hasOrdersForCurrent) {
    return
  }

  const nextStatus = statusOptions.find((option) =>
    profile.value?.orders.some((order) => order.status === option.value),
  )?.value

  setStatus(nextStatus ?? 'in-progress')
}

watch(profile, ensureStatusMatchesData, { immediate: true })

const filteredOrders = computed(() => {
  if (!profile.value) {
    return []
  }

  return profile.value.orders.filter((order) => order.status === currentStatus.value)
})

const hasOrders = computed(() => filteredOrders.value.length > 0)

const hasProjectContext = computed(() => projectId.value.length > 0)

const isNotFoundError = computed(() => error.value === 'Профиль не найден')

const showProfileNotFound = computed(() => {
  if (!hasProjectContext.value || isLoading.value) {
    return false
  }

  if (isNotFoundError.value) {
    return true
  }

  return !profile.value && !error.value
})

const showProfileError = computed(() => {
  if (!hasProjectContext.value || isLoading.value) {
    return false
  }

  if (isNotFoundError.value) {
    return false
  }

  return Boolean(error.value)
})

const showMissingProject = computed(() => !isLoading.value && !hasProjectContext.value)

const handleRetry = async () => {
  await refresh()
}

const OrderStatusDotClass = (status: TeamMemberOrderStatus) => {
  const map: Record<TeamMemberOrderStatus, string> = {
    'in-progress': 'bg-yellow-500',
    completed: 'bg-emerald-500',
    overdue: 'bg-red-500',
  }

  return map[status]
}

const filterButtonClass = (status: TeamMemberOrderStatus) => {
  const isActive = currentStatus.value === status

  return [
    'flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-white'
      : 'bg-white text-gray-600 hover:bg-black/5 dark:bg-[#1C2431] dark:text-[#9da6b9] dark:hover:bg-white/5',
  ]
}

const contactTarget = (type: TeamMemberContact['type']) => (type === 'telegram' ? '_blank' : undefined)

useHead(() => ({
  title: profile.value ? `${profile.value.name} — профиль` : 'Профиль коллеги',
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
}))
</script>

<template>
  <div
    class="relative flex min-h-screen w-full flex-col bg-background-light text-black dark:bg-background-dark dark:text-white"
    :style="{ backgroundColor: 'var(--telegram-background-color, #0f1729)' }"
  >
    <header
      class="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-background-light/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        aria-label="Вернуться назад"
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col text-left">
        <h1 class="line-clamp-1 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          {{ profile?.name ?? 'Профиль коллеги' }}
        </h1>
        <p v-if="profile" class="text-sm text-gray-500 dark:text-[#9da6b9]">{{ profile.department }}</p>
      </div>

      <div class="flex size-12 shrink-0 items-center justify-center"></div>
    </header>

    <main class="flex-1 space-y-8 px-4 py-6 pb-24">
      <section v-if="isLoading" class="mt-12 text-center text-gray-500 dark:text-[#9da6b9]">
        Загрузка профиля...
      </section>

      <section
        v-else-if="showMissingProject"
        class="mt-12 flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-10 text-center text-gray-600 shadow-sm dark:bg-[#1C2431] dark:text-[#9da6b9]"
      >
        <span class="material-symbols-outlined text-4xl opacity-70">info</span>
        <div class="space-y-1">
          <p class="text-base font-semibold text-zinc-900 dark:text-white">Не удалось определить проект</p>
          <p class="text-sm">Откройте профиль коллеги из списка команды проекта и попробуйте снова.</p>
        </div>
        <button
          type="button"
          class="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white shadow-lg transition hover:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="$router.back()"
        >
          Вернуться назад
        </button>
      </section>

      <section
        v-else-if="showProfileError"
        class="mt-12 flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-10 text-center text-gray-600 shadow-sm dark:bg-[#1C2431] dark:text-[#9da6b9]"
      >
        <span class="material-symbols-outlined text-4xl opacity-70">error_circle_rounded</span>
        <div class="space-y-2">
          <p class="text-base font-semibold text-zinc-900 dark:text-white">Не удалось загрузить профиль</p>
          <p class="text-sm">{{ error }}</p>
        </div>
        <button
          type="button"
          class="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white shadow-lg transition hover:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="handleRetry"
        >
          Повторить попытку
        </button>
      </section>

      <section
        v-else-if="showProfileNotFound"
        class="mt-12 flex flex-col items-center gap-4 text-center"
      >
        <div class="flex size-20 items-center justify-center rounded-full bg-white text-red-500 shadow-lg shadow-black/10 dark:bg-[#1C2431] dark:text-red-300">
          <span class="material-symbols-outlined text-4xl">person_off</span>
        </div>
        <div class="space-y-2">
          <h2 class="text-xl font-semibold">Сотрудник не найден</h2>
          <p class="max-w-xs text-sm text-gray-600 dark:text-[#9da6b9]">
            Возможно, профиль был удалён или ссылка устарела. Попробуйте вернуться на предыдущую страницу.
          </p>
        </div>
        <button
          type="button"
          class="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white shadow-lg transition hover:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="$router.back()"
        >
          Вернуться назад
        </button>
      </section>

      <template v-else-if="profile">
        <section class="flex flex-col items-center">
          <div class="flex flex-col items-center gap-3">
            <div
              class="flex size-28 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-500 dark:bg-[#282e39] dark:text-gray-300"
            >
              <img
                v-if="profile.avatarUrl"
                :src="profile.avatarUrl"
                :alt="`Аватар ${profile.name}`"
                class="size-full object-cover"
                loading="lazy"
              />
              <span v-else class="material-symbols-outlined text-4xl">person</span>
            </div>
            <div class="flex flex-col items-center gap-1 text-center">
              <p class="text-2xl font-semibold leading-tight tracking-[-0.015em]">{{ profile.name }}</p>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold leading-tight text-zinc-900 dark:text-white">Контакты</h2>
          <div class="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
            <a
              v-for="contact in profile.contacts"
              :key="contact.id"
              :href="contact.href"
              :target="contactTarget(contact.type)"
              :rel="contactTarget(contact.type) ? 'noopener noreferrer' : undefined"
              class="flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-white/5"
            >
              <span class="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-[#9da6b9]">
                <span class="material-symbols-outlined text-base">{{ contact.icon }}</span>
                {{ contact.label }}
              </span>
              <span class="text-sm font-semibold text-zinc-900 dark:text-white">{{ contact.value }}</span>
            </a>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold leading-tight text-zinc-900 dark:text-white">Активные задачи</h2>
          </div>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              type="button"
              :class="filterButtonClass(option.value)"
              @click="setStatus(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <div v-if="hasOrders" class="flex flex-col gap-3">
            <article
              v-for="order in filteredOrders"
              :key="order.id"
              class="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]"
            >
              <div class="flex items-start justify-between gap-3">
                <p class="text-base font-semibold leading-tight text-zinc-900 dark:text-white">{{ order.title }}</p>
                <span :class="['mt-1.5 h-3 w-3 shrink-0 rounded-full', OrderStatusDotClass(order.status)]"></span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-[#9da6b9]">Срок</span>
                <span class="font-medium text-zinc-900 dark:text-white">{{ order.dueDateLabel }}</span>
              </div>
            </article>
          </div>
          <div
            v-else
            class="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 py-10 text-center text-gray-600 shadow-sm dark:bg-[#1C2431] dark:text-[#9da6b9]"
          >
            <span class="material-symbols-outlined text-4xl opacity-70">task_alt</span>
            <div class="space-y-1">
              <p class="text-base font-semibold text-zinc-900 dark:text-white">Нет задач в выбранном статусе</p>
              <p class="text-sm">Попробуйте переключить фильтр, чтобы увидеть другие задачи коллеги.</p>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold leading-tight text-zinc-900 dark:text-white">История задач</h2>
          <div v-if="profile.history.length" class="flex flex-col gap-3">
            <article
              v-for="item in profile.history"
              :key="item.id"
              class="flex flex-col gap-2 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:bg-[#1C2431]/70"
            >
              <p class="text-base font-semibold leading-tight text-zinc-900 dark:text-white">{{ item.title }}</p>
              <p class="text-sm text-gray-500 dark:text-[#9da6b9]">Завершено: {{ item.completedAtLabel }}</p>
            </article>
          </div>
          <div
            v-else
            class="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 py-10 text-center text-gray-600 shadow-sm dark:bg-[#1C2431] dark:text-[#9da6b9]"
          >
            <span class="material-symbols-outlined text-4xl opacity-70">history</span>
            <div class="space-y-1">
              <p class="text-base font-semibold text-zinc-900 dark:text-white">Пока нет завершённых задач</p>
              <p class="text-sm">Как только коллега закроет задачи, они появятся здесь.</p>
            </div>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>
