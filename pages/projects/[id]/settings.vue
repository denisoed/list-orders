<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import { useProjects } from '~/composables/useProjects'
import { useUserStore } from '~/stores/user'
import Toggle from '~/components/Toggle.vue'
import type { ProjectFeaturesSettings } from '~/data/projects'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { getProjectById, fetchProject, updateProject, isUpdating } = useProjects()

const projectId = computed(() => String(route.params.id ?? ''))
const project = computed(() => getProjectById(projectId.value))

const isProjectOwner = computed(() => {
  if (!project.value || !userStore.user) {
    return false
  }
  return project.value.ownerTelegramId === userStore.user.telegram_id
})

// Default order fields settings
const defaultOrderFields = {
  title: true,
  description: true,
  assignee: false,
  attachments: false,
  payment: false,
  delivery: false,
  clientName: false,
  clientPhone: false,
  dueDate: false,
  dueTime: false,
  reminder: false,
}

const featuresSettings = ref<ProjectFeaturesSettings>({
  requireReview: true,
  orderFields: { ...defaultOrderFields },
})

const submitError = ref('')
const isSubmittingLocal = ref(false)

const isSubmitting = computed(() => isSubmittingLocal.value || isUpdating.value)
const isSubmitDisabled = computed(() => isSubmitting.value)

const returnPath = computed(() => {
  const from = route.query.from
  if (typeof from === 'string' && from.length > 0) {
    return from
  }
  return `/projects/${projectId.value}/orders`
})

// Load project settings
onMounted(async () => {
  if (!project.value) {
    try {
      await fetchProject(projectId.value)
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }
})

// Watch for projectId changes
watch(projectId, async () => {
  if (!project.value && projectId.value) {
    try {
      await fetchProject(projectId.value)
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }
}, { immediate: true })

// Watch for project changes and update settings
watch(
  () => project.value?.featuresSettings,
  (projectFeaturesSettings) => {
    if (projectFeaturesSettings) {
      featuresSettings.value = {
        requireReview: projectFeaturesSettings.requireReview ?? true,
        orderFields: {
          ...defaultOrderFields,
          ...projectFeaturesSettings.orderFields,
        },
      }
    } else {
      featuresSettings.value = {
        requireReview: true,
        orderFields: { ...defaultOrderFields },
      }
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  submitError.value = ''

  if (!project.value || !isProjectOwner.value) {
    submitError.value = 'У вас нет прав для изменения настроек проекта.'
    return
  }

  isSubmittingLocal.value = true

  try {
    await updateProject(projectId.value, {
      title: project.value.title,
      description: project.value.description,
      color: project.value.color,
      featuresSettings: featuresSettings.value,
    })

    await router.push(returnPath.value)
  } catch (error) {
    submitError.value = 'Не удалось сохранить настройки. Попробуйте ещё раз.'
  } finally {
    isSubmittingLocal.value = false
  }
}

const pageTitle = computed(() => {
  if (!project.value) {
    return 'Настройки проекта'
  }
  return `Настройки • ${project.value.title}`
})

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
    <header class="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background-dark/80 p-4 pb-3 backdrop-blur-sm">
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/5"
        aria-label="Закрыть настройки"
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>
      <h1 class="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em]">Настройки проекта</h1>
      <div class="flex w-12 items-center justify-end"></div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 pt-4 pb-32">
      <div v-if="project && isProjectOwner" class="flex flex-col space-y-6">
        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold leading-tight text-white">Функции проекта</h3>
              <p class="mt-1 text-sm text-gray-400">Управление функциями проекта</p>
            </div>
            <div class="space-y-4">
              <Toggle
                v-model="featuresSettings.requireReview"
                label="Требовать проверку"
                description="Если включено, задачи отправляются на проверку. Если выключено, исполнитель может сразу завершить задачу."
              />
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold leading-tight text-white">Поля при создании заказа</h3>
              <p class="mt-1 text-sm text-gray-400">Выберите поля, которые будут отображаться при создании и редактировании заказов</p>
            </div>
            <div class="space-y-4">
              <Toggle
                v-model="featuresSettings.orderFields!.title"
                label="Название"
                description="Название задачи (обязательное поле)"
              />
              <Toggle
                v-model="featuresSettings.orderFields!.description"
                label="Описание"
                description="Детальное описание задачи"
              />
              <Toggle
                v-model="featuresSettings.orderFields!.assignee"
                label="Исполнитель"
                description="Выбор исполнителя задачи"
              />
              <Toggle
                v-model="featuresSettings.orderFields!.attachments"
                label="Фото примеров"
                description="Загрузка изображений-примеров"
              />
              <Toggle
                v-model="featuresSettings.orderFields!.payment"
                label="Оплата"
                description="Информация об оплате и предоплате"
              />
              <Toggle
                v-model="featuresSettings.orderFields!.delivery"
                label="Доставка"
                description="Тип доставки и адрес"
              />
              <Toggle
                v-model="featuresSettings.orderFields!.clientName"
                label="Имя клиента"
                description="Имя клиента"
              />
              <Toggle
                v-model="featuresSettings.orderFields!.clientPhone"
                label="Номер телефона клиента"
                description="Контактный телефон клиента"
              />
              <Toggle
                v-model="featuresSettings.orderFields!.dueDate"
                label="Дата"
                description="Срок выполнения задачи"
              />
              <Toggle
                v-model="featuresSettings.orderFields!.dueTime"
                label="Время"
                description="Время выполнения задачи"
              />
              <Toggle
                v-model="featuresSettings.orderFields!.reminder"
                label="Напоминание"
                description="Напоминание о задаче"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="project && !isProjectOwner" class="flex flex-col items-center justify-center gap-4 py-20 text-center text-[#9da6b9]">
        <span class="material-symbols-outlined text-4xl text-primary">lock</span>
        <p class="text-base font-medium text-white">Нет доступа</p>
        <p>Только владелец проекта может изменять настройки.</p>
        <button
          type="button"
          class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="$router.back()"
        >
          Вернуться назад
        </button>
      </div>

      <div v-else class="flex flex-col items-center justify-center gap-4 py-20 text-center text-[#9da6b9]">
        <span class="material-symbols-outlined text-4xl text-primary">search_off</span>
        <p class="text-base font-medium text-white">Проект не найден</p>
        <p>Проверьте ссылку или вернитесь к списку проектов.</p>
        <button
          type="button"
          class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="$router.back()"
        >
          Вернуться назад
        </button>
      </div>
    </main>

    <footer v-if="project && isProjectOwner" class="fixed bottom-0 left-0 z-10 w-full bg-background-dark/80 p-4 pb-8 backdrop-blur-sm">
      <div class="space-y-2">
        <p v-if="submitError" class="text-sm text-red-400">{{ submitError }}</p>
        <button
          type="button"
          class="w-full rounded-xl bg-primary px-5 py-4 text-center text-base font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
          :disabled="isSubmitDisabled"
          @click="handleSubmit"
        >
          {{ isSubmitting ? 'Сохранение…' : 'Сохранить изменения' }}
        </button>
      </div>
    </footer>
  </div>
</template>

