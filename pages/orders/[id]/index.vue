<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { convertOrderToOrderDetail } from '~/data/orders'
import type { Order, OrderDetail, OrderStatusTone } from '~/data/orders'
import { renderMarkdown } from '~/utils/markdown'
import { useUserStore } from '~/stores/user'
import type { DropdownMenuItem } from '~/components/DropdownMenu.vue'
import DropdownMenu from '~/components/DropdownMenu.vue'
import ConfirmationModal from '~/components/ConfirmationModal.vue'
import { useOrders } from '~/composables/useOrders'
import { useProjects } from '~/composables/useProjects'
import DataLoadingIndicator from '~/components/DataLoadingIndicator.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { fetchOrder, updateOrder } = useOrders()
const { getProjectById, fetchProject } = useProjects()

const orderId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] ?? '' : raw?.toString() ?? ''
})

const order = ref<OrderDetail | null>(null)
const orderData = ref<Order | null>(null) // Store original Order data
const project = ref<ReturnType<typeof getProjectById> | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const isTakingInWork = ref(false)
const isSubmittingForReview = ref(false)
const isMarkingAsDone = ref(false)
const isDeclineModalOpen = ref(false)
const isArchiveModalOpen = ref(false)
const isDeclining = ref(false)
const isArchiving = ref(false)

// Get order fields settings from project
const orderFieldsSettings = computed(() => {
  const defaultFields = {
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
  
  if (!project.value?.featuresSettings?.orderFields) {
    return defaultFields
  }
  
  return {
    ...defaultFields,
    ...project.value.featuresSettings.orderFields,
  }
})

// Computed properties for field visibility
const showDescription = computed(() => orderFieldsSettings.value.description !== false)
const showAttachments = computed(() => orderFieldsSettings.value.attachments === true)
const showPayment = computed(() => orderFieldsSettings.value.payment === true)
const showDelivery = computed(() => orderFieldsSettings.value.delivery === true)
const showClient = computed(() => orderFieldsSettings.value.clientName === true || orderFieldsSettings.value.clientPhone === true)
const showDueDate = computed(() => orderFieldsSettings.value.dueDate === true || orderFieldsSettings.value.dueTime === true)

// Handle startapp parameter from query string (for direct link opening)
const startAppParam = computed(() => {
  const startapp = route.query.startapp
  if (typeof startapp === 'string') {
    return startapp
  }
  return null
})

// Load order from API
const loadOrder = async () => {
  if (!orderId.value) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const fetchedOrder = await fetchOrder(orderId.value)
    orderData.value = fetchedOrder
    
    // Load project to check features settings
    let projectData = getProjectById(fetchedOrder.projectId)
    if (!projectData) {
      try {
        projectData = await fetchProject(fetchedOrder.projectId)
      } catch (error) {
        console.error('Failed to load project:', error)
      }
    }
    project.value = projectData
    
    const orderDetail = convertOrderToOrderDetail(fetchedOrder, projectData?.title)
    order.value = orderDetail
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Не удалось загрузить задачу'
    error.value = errorMessage
    console.error('Error loading order:', err)
  } finally {
    isLoading.value = false
  }
}

// Update order when route changes
watch(orderId, () => {
  loadOrder()
})

// Handle startapp parameter from query - redirect if it doesn't match current order
watch([startAppParam, orderId], ([startapp, currentId]) => {
  if (startapp && startapp !== currentId) {
    router.replace(`/orders/${startapp}`)
  }
})

// Load order on mount
onMounted(() => {
  loadOrder()
})

const hasAssignee = computed(() => Boolean(order.value?.assignee))

const isReviewStatus = computed(() => {
  if (!orderData.value) return false
  return orderData.value.status === 'review'
})

// Check if current user is the assignee (executor)
const isOrderAssignee = computed(() => {
  if (!orderData.value || !userStore.user) return false
  return orderData.value.assigneeTelegramId === userStore.user.telegram_id
})

// Check if current user is the creator
const isOrderCreator = computed(() => {
  if (!orderData.value || !userStore.user) return false
  return orderData.value.creatorTelegramId === userStore.user.telegram_id
})

const isOrderArchived = computed(() => orderData.value?.archived === true)
const canArchiveOrder = computed(
  () => isOrderCreator.value && !isOrderArchived.value,
)

// Check if order is in progress
const isInProgressStatus = computed(() => {
  if (!orderData.value) return false
  return orderData.value.status === 'in_progress'
})

// Check if order is done
const isDoneStatus = computed(() => {
  if (!orderData.value) return false
  return orderData.value.status === 'done'
})

const descriptionHtml = computed(() => {
  if (!order.value?.description) {
    return ''
  }

  return renderMarkdown(order.value.description)
})

const isPhoneCopied = ref(false)
let copyResetTimeout: ReturnType<typeof setTimeout> | null = null

const whatsappLink = computed(() => {
  if (!order.value) return null
  const digits = order.value.client.phone.replace(/\D+/g, '')

  if (!digits) {
    return null
  }

  return `https://wa.me/${digits}`
})

const handleCopyPhone = async () => {
  if (!order.value) return
  const phone = order.value.client.phone.trim()

  if (!phone) {
    return
  }

  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return
  }

  try {
    await navigator.clipboard.writeText(phone)
    isPhoneCopied.value = true

    if (copyResetTimeout) {
      clearTimeout(copyResetTimeout)
    }

    copyResetTimeout = setTimeout(() => {
      isPhoneCopied.value = false
      copyResetTimeout = null
    }, 2000)
  } catch (error) {
    console.error('Не удалось скопировать номер телефона', error)
  }
}

const hasClientPaymentDetails = computed(() => {
  if (!order.value) return false
  const { prepayment, totalAmount } = order.value.client
  return Boolean(prepayment?.trim() || totalAmount?.trim())
})

const quickInfoItems = computed(() => {
  const items = []
  
  if (orderFieldsSettings.value.dueDate !== false || orderFieldsSettings.value.dueTime !== false) {
    items.push({
      id: 'due-date',
      icon: 'calendar_today',
      label: 'Срок выполнения',
      value: order.value?.dueDateLabel || '',
    })
  }
  
  return items
})

const statusToneClass = (tone: OrderStatusTone) => {
  const toneClasses: Record<OrderStatusTone, string> = {
    info: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-300',
    warning: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300',
    danger: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300',
    success: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
  }

  return toneClasses[tone]
}

const primaryStatusChip = computed(() => {
  // Use the status from order (from API)
  if (!order.value) return null
  const chip = order.value.statusChips[0]
  if (!chip) {
    return null
  }

  return {
    ...chip,
    classes: statusToneClass(chip.tone),
  }
})

const baseIconContainerClass =
  'flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-700 dark:bg-[#282e39] dark:text-white'

const quickInfoCardClass = (itemId: string) =>
  [
    'flex items-center gap-4 rounded-2xl p-4 shadow-sm',
    itemId === 'due-date'
      ? 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-100'
      : 'bg-white text-black dark:bg-[#1C2431] dark:text-white',
  ]

const quickInfoLabelClass = (itemId: string) =>
  itemId === 'due-date'
    ? 'text-sm font-medium text-red-500 dark:text-red-200'
    : 'text-sm font-medium text-gray-500 dark:text-[#9da6b9]'

const quickInfoValueClass = (itemId: string) =>
  itemId === 'due-date'
    ? 'mt-1 text-base font-semibold leading-tight text-red-700 dark:text-red-50'
    : 'mt-1 text-base font-semibold leading-tight'

const quickInfoIconClass = (itemId: string) =>
  [
    baseIconContainerClass,
    itemId === 'due-date'
      ? 'bg-red-500 text-white dark:bg-red-400 dark:text-white'
      : '',
  ]

const examplesCountLabel = computed(() => {
  if (!order.value) return '0 примеров'
  const count = order.value.attachments.length

  if (count === 0) {
    return '0 примеров'
  }

  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} пример`
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} примера`
  }

  return `${count} примеров`
})

const handleImageClick = (attachment: { id: string; previewUrl: string }) => {
  // Use previewUrl (which contains the actual image URL) as imageId
  // Encode the URL to handle special characters
  const imageUrl = typeof attachment === 'string' ? attachment : attachment.previewUrl
  router.push({
    path: `/images/${encodeURIComponent(imageUrl)}`,
    query: {
      orderId: orderId.value,
      source: 'order-details',
    },
  })
}

const handleTakeInWork = async () => {
  const currentUser = userStore.user

  if (!currentUser) {
    console.warn('Пользователь не загружен')
    return
  }

  if (!orderId.value || isTakingInWork.value) {
    return
  }

  isTakingInWork.value = true

  try {
    // Update order status to "in_progress" and set assignee
    await updateOrder(orderId.value, {
      status: 'in_progress',
      assignee_telegram_id: currentUser.telegram_id,
      assignee_telegram_name: (currentUser.first_name || '') + ' ' + (currentUser.last_name || '') || currentUser.username || '',
      assignee_telegram_avatar_url: currentUser.photo_url || '',
    })

    // Reload order to get updated data
    await loadOrder()
  } catch (err) {
    console.error('Не удалось взять задачу в работу:', err)
  } finally {
    isTakingInWork.value = false
  }
}

// Check if project requires review
const requiresReview = computed(() => {
  if (!project.value?.featuresSettings) {
    return false // Default to review disabled
  }
  return project.value.featuresSettings.requireReview === true
})

const handleMarkCompleted = async () => {
  const targetOrderId = orderId.value

  if (!targetOrderId || isSubmittingForReview.value || isMarkingAsDone.value) {
    return
  }

  // If review is not required, mark as done directly
  if (!requiresReview.value) {
    isMarkingAsDone.value = true
    try {
      await updateOrder(targetOrderId, {
        status: 'done',
      })
      // Reload order to get updated data
      await loadOrder()
    } catch (err) {
      console.error('Не удалось завершить задачу:', err)
    } finally {
      isMarkingAsDone.value = false
    }
    return
  }

  // If review is required, navigate to review page
  isSubmittingForReview.value = true

  router.push({
    path: `/orders/${targetOrderId}/review`,
  }).finally(() => {
    isSubmittingForReview.value = false
  })
}

onBeforeUnmount(() => {
  if (copyResetTimeout) {
    clearTimeout(copyResetTimeout)
  }
})

const handleShare = async () => {
  if (!orderId.value) {
    return
  }

  // Use Telegram bot link for sharing
  // When opened in Telegram, this will be available as start_param
  const shareUrl = `https://t.me/list_orders_bot/app?startapp=${orderId.value}`

  if (!order.value) return
  const shareData = {
    title: order.value.title || 'Детали задачи',
    text: order.value.description || 'Посмотрите детали задачи',
    url: shareUrl,
  }

  // Check if Telegram WebApp is available
  const telegramWebApp = window.Telegram?.WebApp
  
  // Use Web Share API if available (it works in Telegram Mini App and shows native share dialog)
  if (typeof navigator !== 'undefined' && navigator.share) {
    // Check if we can share (if canShare is available)
    const canShare = navigator.canShare 
      ? navigator.canShare(shareData) 
      : true
    
    if (canShare) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        // User cancelled or share failed
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Ошибка при открытии окна поделиться:', error)
        } else {
          // User cancelled, don't fallback
          return
        }
      }
    }
  }

  // Fallback for Telegram WebApp: use openLink/openTelegramLink
  if (telegramWebApp) {
    try {
      if (telegramWebApp.openTelegramLink) {
        telegramWebApp.openTelegramLink(shareUrl)
      } else if (telegramWebApp.openLink) {
        telegramWebApp.openLink(shareUrl)
      }
      return
    } catch (error) {
      console.error('Ошибка при открытии ссылки через Telegram:', error)
    }
  }
  
  // Final fallback: copy to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl)
      // You could show a toast notification here
      console.log('Ссылка скопирована в буфер обмена')
    } catch (error) {
      console.error('Не удалось скопировать ссылку:', error)
    }
  }
}

const handleEdit = () => {
  const targetOrderId = orderId.value

  if (!targetOrderId || !orderData.value) {
    return
  }

  // Redirect to edit page with projectId
  router.push({
    path: `/projects/${orderData.value.projectId}/orders/new`,
    query: {
      orderId: targetOrderId,
      from: route.fullPath,
    },
  })
}

const handleArchive = () => {
  if (!orderId.value || !canArchiveOrder.value || isArchiving.value) {
    return
  }

  isArchiveModalOpen.value = true
}

const handleArchiveConfirm = async () => {
  if (!orderId.value || !canArchiveOrder.value || isArchiving.value) {
    return
  }

  isArchiving.value = true
  const projectId = orderData.value?.projectId

  try {
    await updateOrder(orderId.value, {
      archived: true,
    })

    isArchiveModalOpen.value = false
    if (projectId) {
      await router.push(`/projects/${projectId}/orders`)
    } else {
      await loadOrder()
    }
  } catch (err) {
    console.error('Не удалось архивировать задачу:', err)
    isArchiveModalOpen.value = false
  } finally {
    isArchiving.value = false
  }
}

const handleDecline = () => {
  if (!orderId.value || !isOrderAssignee.value || !isInProgressStatus.value || isDeclining.value) {
    return
  }

  isDeclineModalOpen.value = true
}

const handleDeclineConfirm = async () => {
  if (!orderId.value || !isOrderAssignee.value || !isInProgressStatus.value || isDeclining.value) {
    return
  }

  isDeclining.value = true

  try {
    // Update order: set status to pending and remove assignee
    await updateOrder(orderId.value, {
      status: 'pending',
      assignee_telegram_id: null,
      assignee_telegram_name: null,
      assignee_telegram_avatar_url: null,
    })

    isDeclineModalOpen.value = false
    // Reload order to get updated data
    await loadOrder()
  } catch (err) {
    console.error('Не удалось отказаться от задачи:', err)
    isDeclineModalOpen.value = false
  } finally {
    isDeclining.value = false
  }
}

const menuItems = computed<DropdownMenuItem[]>(() => {
  const items: DropdownMenuItem[] = [
    {
      id: 'share',
      label: 'Поделиться',
      icon: 'share',
      action: handleShare,
    },
  ]

  // Show "Edit" button only for creator
  if (isOrderCreator.value) {
    items.push({
      id: 'edit',
      label: 'Изменить',
      icon: 'edit',
      action: handleEdit,
    })

    if (canArchiveOrder.value) {
      items.push({
        id: 'archive',
        label: 'Архивировать',
        icon: 'archive',
        variant: 'danger',
        action: handleArchive,
      })
    }
  }

  // Show "Decline" button only for assignee and when order is in progress
  if (isOrderAssignee.value && isInProgressStatus.value) {
    items.push({
      id: 'decline',
      label: 'Отказаться',
      icon: 'cancel',
      action: handleDecline,
    })
  }

  return items
})

useHead({
  title: order.value?.title || 'Задача',
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
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
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
        aria-label="Вернуться назад"
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col items-start text-left">
        <h1 class="line-clamp-2 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          {{ order?.title || 'Задача' }}
        </h1>
      </div>

      <DropdownMenu
        :items="menuItems"
        button-aria-label="Дополнительные действия для задачи"
      />
    </header>

    <main class="flex-1 space-y-6 px-4 py-6 pb-28 sm:pb-24">
      <DataLoadingIndicator v-if="isLoading" message="Загрузка задачи..." />

      <div v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
        {{ error }}
      </div>

      <div v-else-if="!order" class="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-[#1C2431] dark:text-gray-400">
        Задача не найдена
      </div>

      <template v-else>
      <section v-if="primaryStatusChip" class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <span
            class="inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm font-medium"
            :class="primaryStatusChip.classes"
          >
            <span class="material-symbols-outlined text-base">adjust</span>
            <span>{{ primaryStatusChip.label }}</span>
          </span>
        </div>
      </section>

      <section v-if="(orderFieldsSettings.assignee !== false && hasAssignee) || quickInfoItems.length > 0" class="grid gap-4 lg:grid-cols-2">
        <article v-if="orderFieldsSettings.assignee !== false && hasAssignee" class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
          <img
            :src="order.assignee!.avatarUrl"
            :alt="`Аватар ответственного ${order.assignee!.name}`"
            class="size-14 rounded-full object-cover"
          />
          <div class="flex flex-1 flex-col">
            <p class="text-sm font-medium text-gray-500 dark:text-[#9da6b9]">Ответственный</p>
            <p class="mt-1 text-base font-semibold leading-tight">{{ order.assignee!.name }}</p>
            <p class="text-sm text-gray-500 dark:text-[#9da6b9]">{{ order.assignee!.role }}</p>
          </div>
        </article>

        <article v-for="item in quickInfoItems" :key="item.id" :class="quickInfoCardClass(item.id)">
          <div :class="quickInfoIconClass(item.id)">
            <span class="material-symbols-outlined text-2xl">{{ item.icon }}</span>
          </div>
          <div class="flex flex-1 flex-col">
            <p :class="quickInfoLabelClass(item.id)">{{ item.label }}</p>
            <p :class="quickInfoValueClass(item.id)">{{ item.value }}</p>
          </div>
        </article>
      </section>

      <section v-if="showDescription" class="space-y-3">
        <details class="group rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]" open>
          <summary
            class="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-black dark:text-white"
          >
            Описание
            <span class="material-symbols-outlined text-gray-400 transition group-open:rotate-180">expand_more</span>
          </summary>
          <div class="mt-3 text-sm leading-6 text-gray-600 dark:text-[#9da6b9]">
            <div v-if="descriptionHtml" v-html="descriptionHtml" />
            <p v-else>{{ order.description }}</p>
          </div>
        </details>
      </section>

      <section v-if="showAttachments" class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold">Примеры</h2>
          <span class="text-sm text-gray-500 dark:text-[#9da6b9]">{{ examplesCountLabel }}</span>
        </div>
        <div v-if="order.attachments.length" class="flex items-center gap-4">
          <ul class="flex items-center gap-4 overflow-x-auto" role="list">
            <li
              v-for="attachment in order.attachments"
              :key="attachment.id"
              role="listitem"
              class="relative cursor-pointer"
              @click="handleImageClick(attachment)"
            >
              <img
                :src="attachment.previewUrl"
                :alt="`Пример ${attachment.name}`"
                class="h-24 w-24 min-h-24 min-w-24 rounded-xl object-cover"
                @error="(e) => { console.error('Failed to load image:', attachment.previewUrl); (e.target as HTMLImageElement).style.display = 'none'; }"
              />
            </li>
          </ul>
        </div>
        <p v-else class="rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-sm dark:bg-[#1C2431] dark:text-[#9da6b9]">
          Примеры пока отсутствуют.
        </p>
      </section>

      <section v-if="showClient" class="space-y-3">
        <details class="group rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
          <summary
            class="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-black dark:text-white"
          >
            Клиент
            <span class="material-symbols-outlined text-gray-400 transition group-open:rotate-180">expand_more</span>
          </summary>
          <div class="mt-3 space-y-3 text-sm leading-6 text-gray-600 dark:text-[#9da6b9]">
            <div v-if="orderFieldsSettings.clientName !== false">
              <p class="font-medium text-gray-700 dark:text-gray-300">Имя клиента</p>
              <p class="mt-1">{{ order.client.name }}</p>
            </div>
            <div v-if="orderFieldsSettings.clientPhone !== false">
              <p class="font-medium text-gray-700 dark:text-gray-300">Номер телефона</p>
              <div class="mt-1 flex flex-wrap items-center justify-between gap-3">
                <p class="mt-1">{{ order.client.phone }}</p>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                    aria-label="Скопировать номер телефона"
                    @click="handleCopyPhone"
                  >
                    <span class="material-symbols-outlined text-base">
                      {{ isPhoneCopied ? 'check' : 'content_copy' }}
                    </span>
                  </button>
                  <a
                    v-if="whatsappLink"
                    :href="whatsappLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                    aria-label="Открыть номер в WhatsApp"
                  >
                    <span class="material-symbols-outlined text-base">chat</span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </details>
      </section>

      <section v-if="showPayment && hasClientPaymentDetails" class="space-y-3">
        <details class="group rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
          <summary
            class="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-black dark:text-white"
          >
            Оплата
            <span class="material-symbols-outlined text-gray-400 transition group-open:rotate-180">expand_more</span>
          </summary>
          <div class="mt-3 space-y-3 text-sm leading-6 text-gray-600 dark:text-[#9da6b9]">
            <div v-if="order.client.prepayment">
              <p class="font-medium text-gray-700 dark:text-gray-300">Предоплата</p>
              <p class="mt-1">{{ order.client.prepayment }}</p>
            </div>
            <div v-if="order.client.totalAmount">
              <p class="font-medium text-gray-700 dark:text-gray-300">Вся сумма</p>
              <p class="mt-1">{{ order.client.totalAmount }}</p>
            </div>
          </div>
        </details>
      </section>

      <section v-if="showDelivery" class="space-y-3">
        <details class="group rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
          <summary
            class="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-black dark:text-white"
          >
            Доставка
            <span class="material-symbols-outlined text-gray-400 transition group-open:rotate-180">expand_more</span>
          </summary>
          <div class="mt-3 space-y-3 text-sm leading-6 text-gray-600 dark:text-[#9da6b9]">
            <div>
              <p class="font-medium text-gray-700 dark:text-gray-300">{{ order.deliveryAddress ? 'Адрес доставки' : 'Тип доставки' }}</p>
              <p class="mt-1">{{ order.deliveryAddress || 'Самовывоз' }}</p>
            </div>
          </div>
        </details>
      </section>

      <section class="space-y-3">
        <details class="group rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1C2431]">
          <summary
            class="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-black dark:text-white"
          >
            История изменений
            <span class="material-symbols-outlined text-gray-400 transition group-open:rotate-180">expand_more</span>
          </summary>
          <div class="mt-4 space-y-4">
            <div v-for="entry in order.history" :key="entry.id" class="flex gap-4">
              <div class="flex flex-col items-center">
                <div :class="baseIconContainerClass">
                  <span class="material-symbols-outlined">{{ entry.icon }}</span>
                </div>
                <div
                  v-if="entry.id !== order.history[order.history.length - 1]?.id"
                  class="mt-2 w-px flex-1 bg-gray-200 dark:bg-[#282e39]"
                ></div>
              </div>
              <div class="flex-1 rounded-2xl bg-white p-4 shadow-sm dark:bg-[#282e39]">
                <p class="text-sm leading-6 text-black dark:text-white">{{ entry.description }}</p>
                <p class="mt-2 text-xs uppercase tracking-wide text-gray-500 dark:text-[#9da6b9]">{{ entry.timestamp }}</p>
                <p v-if="entry.author" class="mt-1 text-xs text-gray-600 dark:text-[#9da6b9]">{{ entry.author }}</p>
              </div>
            </div>
          </div>
        </details>
      </section>
      </template>
    </main>

    <footer
      v-if="order && !isLoading"
      class="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-background-light/95 p-4 pb-8 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <button
        v-if="isDoneStatus"
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-300 py-3 text-base font-semibold text-gray-600 shadow-lg transition dark:bg-gray-700 dark:text-gray-400"
        disabled
      >
        <span>Сделано</span>
      </button>
      <button
        v-else-if="hasAssignee && isReviewStatus"
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-300 py-3 text-base font-semibold text-gray-600 shadow-lg transition dark:bg-gray-700 dark:text-gray-400"
        disabled
      >
        <span>Проверяется</span>
      </button>
      <button
        v-else-if="isInProgressStatus && hasAssignee && !isOrderAssignee"
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-300 py-3 text-base font-semibold text-gray-600 shadow-lg transition dark:bg-gray-700 dark:text-gray-400"
        disabled
      >
        <span>В работе</span>
      </button>
      <button
        v-else-if="hasAssignee && isOrderAssignee && isInProgressStatus"
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="isSubmittingForReview || isMarkingAsDone"
        @click="handleMarkCompleted"
      >
        <template v-if="isSubmittingForReview || isMarkingAsDone">
          <span class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          <span>{{ isSubmittingForReview ? 'Отправляем...' : 'Завершаем...' }}</span>
        </template>
        <template v-else>
          <span v-if="requiresReview">Отдать на проверку</span>
          <span v-else>Готово</span>
        </template>
      </button>
      <button
        v-else
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="isTakingInWork"
        @click="handleTakeInWork"
      >
        <span v-if="isTakingInWork" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
        <span>{{ isTakingInWork ? 'Обрабатываем...' : 'Взять в работу' }}</span>
      </button>
    </footer>

    <ConfirmationModal
      :is-open="isArchiveModalOpen"
      :is-loading="isArchiving"
      title="Архивировать задачу"
      message="Вы уверены, что хотите архивировать эту задачу? Она переместится в архив и исчезнет из списка активных задач."
      confirm-text="Архивировать"
      cancel-text="Отмена"
      variant="danger"
      @close="isArchiveModalOpen = false"
      @confirm="handleArchiveConfirm"
    />

    <ConfirmationModal
      :is-open="isDeclineModalOpen"
      :is-loading="isDeclining"
      title="Отказаться от задачи"
      message="Вы уверены, что хотите отказаться от этой задачи? Задача вернётся в статус «Ожидает выполнения» и будет доступна другим исполнителям."
      confirm-text="Отказаться"
      cancel-text="Отмена"
      variant="warning"
      @close="isDeclineModalOpen = false"
      @confirm="handleDeclineConfirm"
    />
  </div>
</template>
