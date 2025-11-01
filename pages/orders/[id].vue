<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter, useAsyncData, useHead } from '#imports'
import { fetchOrderDetails } from '~/data/orders'
import type { OrderDetails } from '~/data/orders'
import type { ProjectTask } from '~/data/projects'
import { useProjectsState } from '~/composables/useProjectTasks'

const route = useRoute()
const router = useRouter()
const projectsState = useProjectsState()

const orderId = computed(() => String(route.params.id ?? ''))
const projectId = computed(() => {
  const value = route.query.project
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }
  return undefined
})

const projectsVersion = computed(() =>
  projectsState.value
    .map((project) => {
      const tasksFingerprint = project.tasks
        .map((task) => `${task.id}:${task.status}:${task.overdueDays ?? 0}`)
        .join('|')
      return `${project.id}:${project.completed}:${project.total}:${tasksFingerprint}`
    })
    .join(';'),
)

const {
  data: orderDetails,
  pending,
  error,
  refresh,
} = useAsyncData<OrderDetails>(
  () => ['order-details', orderId.value, projectId.value ?? 'all', projectsVersion.value],
  () =>
    fetchOrderDetails(orderId.value, {
      projectId: projectId.value,
      source: projectsState.value,
    }),
  {
    watch: [orderId, projectId, projectsVersion],
  },
)

const task = computed<ProjectTask | null>(() => orderDetails.value?.task ?? null)
const project = computed(() => orderDetails.value?.project)

const mainTitle = computed(() => task.value?.title ?? 'Детали заказа')

const statusLabels: Record<ProjectTask['status'], string> = {
  in_progress: 'В работе',
  overdue: 'Просрочено',
  review: 'На проверке',
  done: 'Выполнено',
}

const statusTone: Record<ProjectTask['status'], 'info' | 'warning' | 'danger' | 'success'> = {
  in_progress: 'info',
  overdue: 'danger',
  review: 'info',
  done: 'success',
}

const reminderLabels: Record<ProjectTask['remindBefore'], string> = {
  '1h': 'за 1 час',
  '3h': 'за 3 часа',
  '1d': 'за 1 день',
}

const toneClasses: Record<'info' | 'warning' | 'danger' | 'success', string> = {
  info: 'bg-blue-500/20 text-blue-400',
  warning: 'bg-amber-500/20 text-amber-500 dark:text-amber-400',
  danger: 'bg-red-500/20 text-red-400',
  success: 'bg-green-500/20 text-green-400',
}

const statusChips = computed(() => {
  const result: { id: string; label: string; tone: 'info' | 'warning' | 'danger' | 'success' }[] = []
  if (!task.value) {
    return result
  }

  result.push({ id: 'status', label: statusLabels[task.value.status], tone: statusTone[task.value.status] })

  if ((task.value.overdueDays ?? 0) > 0) {
    const days = task.value.overdueDays ?? 0
    const formatter = new Intl.PluralRules('ru-RU', { type: 'cardinal' })
    const plural = formatter.select(days)
    let suffix = 'дней'
    if (plural === 'one') {
      suffix = 'день'
    } else if (plural === 'few') {
      suffix = 'дня'
    }

    result.push({ id: 'overdue', label: `Просрочено на ${days} ${suffix}`, tone: 'danger' })
  }

  if (task.value.remindBefore) {
    result.push({ id: 'reminder', label: `Напоминание ${reminderLabels[task.value.remindBefore]}`, tone: 'info' })
  }

  task.value.statusChips?.forEach((chip) => {
    result.push({ id: chip.id, label: chip.label, tone: chip.tone })
  })

  return result
})

const formatDate = (value?: string) => {
  if (!value) {
    return 'Не указано'
  }
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value))
  } catch (err) {
    console.error('[orders] Failed to format date', err)
    return value
  }
}

const formatCurrency = (value: number) => {
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value)
  } catch (err) {
    console.error('[orders] Failed to format currency', err)
    return `${value} ₽`
  }
}

const dueDateLabel = computed(() => formatDate(task.value?.dueDate))

const priorityMeta = computed(() => {
  const priority = task.value?.priority ?? 'medium'
  switch (priority) {
    case 'high':
      return { icon: 'priority_high', label: 'Высокий', class: 'text-amber-500' }
    case 'low':
      return { icon: 'signal_cellular_4_bar', label: 'Низкий', class: 'text-green-500', iconClass: '-rotate-90' }
    default:
      return { icon: 'horizontal_rule', label: 'Средний', class: 'text-zinc-500 dark:text-zinc-300' }
  }
})

const itemsWithTotal = computed(() => {
  if (!task.value?.items?.length) {
    return []
  }

  return task.value.items.map((item) => ({
    ...item,
    total: item.price * item.quantity,
  }))
})

const itemsTotal = computed(() =>
  itemsWithTotal.value.reduce((acc, item) => acc + item.total, 0),
)

const contactRows = computed(() => {
  if (!task.value) {
    return []
  }
  const rows: { id: string; label: string; value: string }[] = []
  if (task.value.clientName) {
    rows.push({ id: 'client', label: 'Клиент', value: task.value.clientName })
  }
  if (task.value.clientPhone) {
    rows.push({ id: 'phone', label: 'Телефон', value: task.value.clientPhone })
  }
  if (task.value.deliveryAddress) {
    rows.push({ id: 'address', label: 'Адрес', value: task.value.deliveryAddress })
  }
  let deliveryValue = 'Не указано'
  if (task.value.isPickup === true) {
    deliveryValue = 'Самовывоз'
  } else if (task.value.deliveryAddress) {
    deliveryValue = 'Доставка'
  }
  rows.push({ id: 'delivery', label: 'Получение', value: deliveryValue })
  return rows
})

const actionLoading = ref(false)
const actionError = ref<string | null>(null)
const actionMessage = ref('')
let feedbackTimer: ReturnType<typeof setTimeout> | undefined

watch(actionMessage, (value) => {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer)
    feedbackTimer = undefined
  }
  if (value) {
    feedbackTimer = setTimeout(() => {
      actionMessage.value = ''
      feedbackTimer = undefined
    }, 4000)
  }
})

onBeforeUnmount(() => {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer)
  }
})

const handleToggleComplete = async () => {
  if (!task.value || !project.value) {
    return
  }

  actionLoading.value = true
  actionError.value = null

  try {
    const projectIndex = projectsState.value.findIndex((item) => item.id === project.value?.id)

    if (projectIndex === -1) {
      throw new Error('PROJECT_NOT_FOUND')
    }

    const projectSnapshot = projectsState.value[projectIndex]
    const taskIndex = projectSnapshot.tasks.findIndex((item) => item.id === task.value?.id)

    if (taskIndex === -1) {
      throw new Error('TASK_NOT_FOUND')
    }

    const currentTask = projectSnapshot.tasks[taskIndex]
    const nextStatus = currentTask.status === 'done' ? 'in_progress' : 'done'

    const updatedTask: ProjectTask = {
      ...currentTask,
      status: nextStatus,
      overdueDays: nextStatus === 'done' ? undefined : currentTask.overdueDays,
    }

    const updatedTasks = [...projectSnapshot.tasks]
    updatedTasks.splice(taskIndex, 1, updatedTask)

    let completedDelta = 0

    if (currentTask.status !== 'done' && nextStatus === 'done') {
      completedDelta = 1
    } else if (currentTask.status === 'done' && nextStatus !== 'done') {
      completedDelta = -1
    }

    const updatedProject = {
      ...projectSnapshot,
      completed: Math.max(
        0,
        Math.min(projectSnapshot.total, projectSnapshot.completed + completedDelta),
      ),
      tasks: updatedTasks,
    }

    projectsState.value.splice(projectIndex, 1, updatedProject)

    await refresh()

    actionMessage.value =
      nextStatus === 'done'
        ? 'Задача отмечена выполненной'
        : 'Статус задачи возвращён в работу'
  } catch (err) {
    console.error('[orders] Не удалось изменить статус', err)
    actionError.value = 'Не удалось обновить статус. Попробуйте снова.'
  } finally {
    actionLoading.value = false
  }
}

const handleRefresh = () => {
  refresh()
}

const fallbackPath = computed(() => {
  if (route.query.from && typeof route.query.from === 'string' && route.query.from.length > 0) {
    return route.query.from
  }
  if (project.value) {
    return `/projects/${project.value.id}/tasks`
  }
  if (projectId.value) {
    return `/projects/${projectId.value}/tasks`
  }
  return '/'
})

const handleBack = () => {
  const target = fallbackPath.value
  if (typeof window !== 'undefined' && window.history.length > 1 && !route.query.from) {
    router.back()
    return
  }
  router.push(target)
}

const isNotFound = computed(() => {
  const currentError = error.value
  if (!currentError) {
    return false
  }
  return (currentError as Error & { code?: string }).code === 'ORDER_NOT_FOUND'
})

useHead({
  title: `${mainTitle.value} • Детали заказа`,
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
    class="relative flex min-h-screen w-full flex-col bg-background-light text-black transition-colors dark:bg-background-dark dark:text-white"
    :style="{ backgroundColor: 'var(--telegram-background-color, #f6f6f8)' }"
  >
    <header
      class="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background-light p-4 pb-3 dark:bg-background-dark"
    >
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-white/10"
        aria-label="Назад"
        @click="handleBack"
      >
        <span class="material-symbols-outlined text-2xl">arrow_back</span>
      </button>

      <h1 class="flex-1 truncate text-center text-lg font-bold leading-tight">{{ mainTitle }}</h1>

      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-white/10"
        aria-label="Обновить данные"
        :disabled="pending"
        @click="handleRefresh"
      >
        <span class="material-symbols-outlined text-2xl">refresh</span>
      </button>
    </header>

    <main class="flex-1 space-y-6 p-4 pb-24">
      <section v-if="pending" class="space-y-4">
        <div class="h-10 w-40 animate-pulse rounded-lg bg-white/40 dark:bg-white/10"></div>
        <div class="h-32 animate-pulse rounded-xl bg-white/40 dark:bg-white/10"></div>
        <div class="h-24 animate-pulse rounded-xl bg-white/30 dark:bg-white/5"></div>
      </section>

      <section v-else-if="error" class="space-y-4">
        <div class="rounded-2xl border border-red-400/40 bg-red-500/10 p-6 text-sm text-red-100 dark:text-red-200">
          <p v-if="isNotFound" class="font-semibold text-red-200">Заказ не найден</p>
          <p v-else class="font-semibold text-red-200">Произошла ошибка при загрузке данных</p>
          <p class="mt-2 text-red-100/80">
            {{ isNotFound ? 'Похоже, заказ был удалён или недоступен.' : 'Проверьте подключение и попробуйте снова.' }}
          </p>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="handleRefresh"
          >
            <span class="material-symbols-outlined text-base">refresh</span>
            Повторить попытку
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="handleBack"
          >
            <span class="material-symbols-outlined text-base">arrow_back</span>
            Назад
          </button>
        </div>
      </section>

      <section v-else-if="task" class="space-y-6">
        <div v-if="statusChips.length" class="flex flex-wrap gap-2">
          <div
            v-for="chip in statusChips"
            :key="chip.id"
            class="flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium"
            :class="toneClasses[chip.tone]"
          >
            <span>{{ chip.label }}</span>
          </div>
        </div>

        <div class="space-y-4">
          <div class="space-y-1 rounded-xl bg-white/10 p-4 shadow-sm backdrop-blur-lg dark:bg-white/5">
            <h2 class="text-base font-semibold">Основные сведения</h2>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="flex items-center gap-3 rounded-lg bg-white/5 p-3 dark:bg-white/5">
                <img
                  v-if="task.assignee.avatarUrl"
                  :src="task.assignee.avatarUrl"
                  :alt="`Аватар ${task.assignee.name}`"
                  class="h-12 w-12 rounded-full object-cover"
                />
                <div class="flex flex-col">
                  <span class="text-xs uppercase tracking-wide text-zinc-400">Исполнитель</span>
                  <span class="text-sm font-medium text-zinc-900 dark:text-white">{{ task.assignee.name }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-white/5 p-3 dark:bg-white/5">
                <div class="flex items-center gap-3">
                  <div class="flex size-10 items-center justify-center rounded-lg bg-white/10">
                    <span class="material-symbols-outlined text-xl">calendar_today</span>
                  </div>
                  <div>
                    <span class="text-xs uppercase tracking-wide text-zinc-400">Срок</span>
                    <p class="text-sm font-medium text-zinc-900 dark:text-white">{{ dueDateLabel }}</p>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-white/5 p-3 dark:bg-white/5">
                <div class="flex items-center gap-3">
                  <div class="flex size-10 items-center justify-center rounded-lg bg-white/10">
                    <span class="material-symbols-outlined text-xl">flag</span>
                  </div>
                  <div>
                    <span class="text-xs uppercase tracking-wide text-zinc-400">Приоритет</span>
                    <p class="flex items-center gap-2 text-sm font-medium" :class="priorityMeta.class">
                      <span class="material-symbols-outlined text-lg" :class="priorityMeta.iconClass">{{ priorityMeta.icon }}</span>
                      {{ priorityMeta.label }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-white/5 p-3 dark:bg-white/5">
                <div class="flex items-center gap-3">
                  <div class="flex size-10 items-center justify-center rounded-lg bg-white/10">
                    <span class="material-symbols-outlined text-xl">folder</span>
                  </div>
                  <div>
                    <span class="text-xs uppercase tracking-wide text-zinc-400">Проект</span>
                    <p class="text-sm font-medium text-zinc-900 dark:text-white">{{ project?.title }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="task.description" class="space-y-2 rounded-xl bg-white/10 p-4 shadow-sm backdrop-blur-lg dark:bg-white/5">
            <h2 class="text-base font-semibold">Описание</h2>
            <p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{{ task.description }}</p>
          </div>

          <div v-if="itemsWithTotal.length" class="space-y-3 rounded-xl bg-white/10 p-4 shadow-sm backdrop-blur-lg dark:bg-white/5">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">Состав заказа</h2>
              <span class="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{{ formatCurrency(itemsTotal) }}</span>
            </div>
            <ul class="space-y-2">
              <li
                v-for="item in itemsWithTotal"
                :key="item.id"
                class="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm dark:bg-white/5"
              >
                <div class="flex flex-1 flex-col">
                  <span class="font-medium">{{ item.name }}</span>
                  <span class="text-xs text-zinc-400">{{ item.quantity }} шт. × {{ formatCurrency(item.price) }}</span>
                </div>
                <span class="text-sm font-semibold">{{ formatCurrency(item.total) }}</span>
              </li>
            </ul>
          </div>

          <div v-if="contactRows.length" class="space-y-2 rounded-xl bg-white/10 p-4 shadow-sm backdrop-blur-lg dark:bg-white/5">
            <h2 class="text-base font-semibold">Контакты</h2>
            <ul class="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <li
                v-for="row in contactRows"
                :key="row.id"
                class="flex items-center justify-between gap-4 rounded-lg bg-white/5 px-3 py-2 dark:bg-white/5"
              >
                <span class="text-xs uppercase tracking-wide text-zinc-400">{{ row.label }}</span>
                <span class="text-sm font-medium text-zinc-900 dark:text-white">{{ row.value }}</span>
              </li>
            </ul>
          </div>

          <div v-if="task.attachments?.length" class="space-y-3 rounded-xl bg-white/10 p-4 shadow-sm backdrop-blur-lg dark:bg-white/5">
            <h2 class="text-base font-semibold">Вложения</h2>
            <ul class="space-y-2">
              <li
                v-for="attachment in task.attachments"
                :key="attachment.id"
                class="flex items-center gap-3 rounded-lg bg-white/5 p-3 text-sm dark:bg-white/5"
              >
                <div class="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <span class="material-symbols-outlined text-base">attach_file</span>
                </div>
                <div class="flex flex-1 flex-col">
                  <span class="font-medium text-zinc-900 dark:text-white">{{ attachment.name }}</span>
                  <span class="text-xs text-zinc-500 dark:text-zinc-400">Предпросмотр доступен</span>
                </div>
                <button
                  type="button"
                  class="flex size-10 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label="Скачать вложение"
                >
                  <span class="material-symbols-outlined text-xl">download</span>
                </button>
              </li>
            </ul>
          </div>

          <div v-if="task.history?.length" class="space-y-3 rounded-xl bg-white/10 p-4 shadow-sm backdrop-blur-lg dark:bg-white/5">
            <h2 class="text-base font-semibold">История</h2>
            <ul class="space-y-4">
              <li v-for="entry in task.history" :key="entry.id" class="flex gap-4">
                <div class="flex flex-col items-center">
                  <div class="flex size-8 items-center justify-center rounded-full bg-white/20">
                    <span class="material-symbols-outlined text-sm">{{ entry.icon }}</span>
                  </div>
                  <div class="mt-1 h-full w-px flex-1 bg-white/20"></div>
                </div>
                <div class="flex-1 text-sm text-zinc-600 dark:text-zinc-300">
                  <p>
                    <span class="font-semibold text-zinc-900 dark:text-white">{{ entry.actor }}</span>
                    <span class="ml-1">{{ entry.description }}</span>
                  </p>
                  <p class="mt-1 text-xs text-zinc-400">{{ formatDate(entry.timestamp) }}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div v-if="actionError" class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {{ actionError }}
        </div>
        <div v-else-if="actionMessage" class="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
          {{ actionMessage }}
        </div>
      </section>

      <section v-else class="space-y-4">
        <div class="rounded-2xl border border-white/20 bg-white/5 p-6 text-sm text-zinc-400 dark:text-zinc-300">
          <p>Детали заказа будут показаны здесь.</p>
        </div>
      </section>
    </main>

    <footer
      v-if="task"
      class="sticky bottom-0 z-10 border-t border-white/10 bg-background-light p-4 dark:bg-background-dark"
    >
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="actionLoading"
        @click="handleToggleComplete"
      >
        <span>{{ task.status === 'done' ? 'Вернуть в работу' : 'Отметить выполненной' }}</span>
        <span class="material-symbols-outlined text-xl">{{ task.status === 'done' ? 'undo' : 'check_circle' }}</span>
      </button>
    </footer>
  </div>
</template>
