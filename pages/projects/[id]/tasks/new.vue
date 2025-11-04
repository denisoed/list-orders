<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import type { TaskReminderOffset } from '~/data/projects'
import { findTaskInProjects, useProjectTasks } from '~/composables/useProjectTasks'
import type { ImageAttachment } from '~/components/ImageUploader.vue'
import { useOrders } from '~/composables/useOrders'
import { convertOrderToOrderDetail } from '~/data/orders'
import { useProjects } from '~/composables/useProjects'

interface AssigneeOption {
  id: string
  name: string
  avatarUrl: string
}

const route = useRoute()
const router = useRouter()

const projectId = computed(() => String(route.params.id ?? ''))
const orderId = computed(() => {
  const orderIdParam = route.query.orderId
  return typeof orderIdParam === 'string' ? orderIdParam : null
})

const isEditMode = computed(() => Boolean(orderId.value))

const { project, createTask, updateTask, isCreating, isUpdating } = useProjectTasks(projectId)
const { fetchOrder } = useOrders()
const { getProjectById } = useProjects()

const fallbackTasksRoute = computed(() => `/projects/${projectId.value}/tasks`)
const returnPath = computed(() => {
  const from = route.query.from
  if (typeof from === 'string' && from.length > 0) {
    return from
  }
  return fallbackTasksRoute.value
})

const title = ref('')
const description = ref('')
const clientName = ref('')
const clientPhone = ref('')
const deliveryAddress = ref('')
const deliveryOption = ref<'pickup' | 'delivery' | ''>('')
const dueDate = ref('')
const dueTime = ref('')
const selectedAssigneeId = ref('unassigned')
const customAssignee = ref<{ name: string; avatarUrl: string } | null>(null)
const attachments = ref<ImageAttachment[]>([])
const reminderOffset = ref<TaskReminderOffset | null>(null)
const hasPrepayment = ref(false)
const paymentAmount = ref('')
const prepaymentAmount = ref('')

const titleTouched = ref(false)
const clientNameTouched = ref(false)
const clientPhoneTouched = ref(false)
const deliveryAddressTouched = ref(false)
const submitAttempted = ref(false)
const submitError = ref('')

const DEFAULT_ASSIGNEE: AssigneeOption = {
  id: 'unassigned',
  name: 'Не назначен',
  avatarUrl:
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23282e39%22/%3E%3Cpath d=%22M32 34c6.075 0 11-4.925 11-11S38.075 12 32 12s-11 4.925-11 11 4.925 11 11 11Zm0 4c-7.732 0-21 3.882-21 11.5V52a4 4 0 0 0 4 4h34a4 4 0 0 0 4-4v-2.5C53 41.882 39.732 38 32 38Z%22 fill=%22%239da6b9%22/%3E%3C/svg%3E',
}

const assigneeOptions = computed<AssigneeOption[]>(() => {
  const unique = new Map<string, AssigneeOption>()
  const projectValue = project.value

  if (projectValue) {
    projectValue.tasks.forEach((task) => {
      if (!unique.has(task.assignee.name)) {
        unique.set(task.assignee.name, {
          id: task.assignee.name,
          name: task.assignee.name,
          avatarUrl: task.assignee.avatarUrl,
        })
      }
    })
  }

  return [DEFAULT_ASSIGNEE, ...unique.values()]
})

const selectedAssignee = computed(() => {
  if (customAssignee.value) {
    return {
      id: customAssignee.value.name,
      name: customAssignee.value.name,
      avatarUrl: customAssignee.value.avatarUrl,
    }
  }
  const found = assigneeOptions.value.find((option) => option.id === selectedAssigneeId.value)
  return found ?? DEFAULT_ASSIGNEE
})

const titleError = computed(() => {
  if (title.value.trim().length > 0) {
    return ''
  }
  return 'Введите название заказа'
})

const clientNameError = computed(() => {
  if (clientName.value.trim().length > 0) {
    return ''
  }
  return 'Введите имя клиента'
})

const clientPhoneError = computed(() => {
  const digits = clientPhone.value.replace(/\D/g, '')
  if (digits.length >= 10) {
    return ''
  }
  return 'Введите номер телефона'
})

const isDeliverySelected = computed(() => deliveryOption.value === 'delivery')

const deliveryAddressError = computed(() => {
  if (!isDeliverySelected.value) {
    return ''
  }

  if (deliveryAddress.value.trim().length > 0) {
    return ''
  }

  return 'Введите адрес доставки'
})

const showTitleError = computed(() => (titleTouched.value || submitAttempted.value) && Boolean(titleError.value))
const showClientNameError = computed(
  () => (clientNameTouched.value || submitAttempted.value) && Boolean(clientNameError.value),
)
const showClientPhoneError = computed(
  () => (clientPhoneTouched.value || submitAttempted.value) && Boolean(clientPhoneError.value),
)
const showDeliveryAddressError = computed(
  () =>
    isDeliverySelected.value && (deliveryAddressTouched.value || submitAttempted.value) && Boolean(deliveryAddressError.value),
)

const shouldShowDeliveryAddress = computed(() => isDeliverySelected.value)

const dueDateLabel = computed(() => {
  if (!dueDate.value) {
    return 'Не задан'
  }

  const dateLabel = new Date(dueDate.value).toLocaleDateString('ru-RU')

  return dateLabel
})

const isFormValid = computed(() => {
  return (
    titleError.value.length === 0 &&
    clientNameError.value.length === 0 &&
    clientPhoneError.value.length === 0 &&
    deliveryAddressError.value.length === 0
  )
})

const createTimeOptions = (stepMinutes: number): string[] => {
  const options: string[] = []
  const totalMinutesInDay = 24 * 60

  for (let minutes = 0; minutes < totalMinutesInDay; minutes += stepMinutes) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    const formatted = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    options.push(formatted)
  }

  return options
}

const timeOptions = createTimeOptions(15)

const reminderOptions: ReadonlyArray<{ label: string; value: TaskReminderOffset }> = [
  { label: '1 час', value: '1h' },
  { label: '3 часа', value: '3h' },
  { label: '1 день', value: '1d' },
]

const handleToggleReminder = (value: TaskReminderOffset) => {
  reminderOffset.value = reminderOffset.value === value ? null : value
}

const isSubmitDisabled = computed(() => !project.value || !isFormValid.value || isCreating.value || isUpdating.value)

// Load order data for edit mode
onMounted(async () => {
  if (orderId.value) {
    // First, try to find task in all projects
    const found = findTaskInProjects(orderId.value)
    
    if (found) {
      // If task found in another project, redirect to that project's edit page
      if (found.project.id !== projectId.value) {
        router.replace({
          path: `/projects/${found.project.id}/tasks/new`,
          query: {
            ...route.query,
            orderId: orderId.value,
          },
        })
        return
      }
      
      // If task found in current project, fill form with task data
      const task = found.task
      title.value = task.title || ''
      description.value = task.description || ''
      clientName.value = task.clientName || ''
      clientPhone.value = task.clientPhone || ''
      deliveryAddress.value = task.deliveryAddress || ''
      deliveryOption.value = task.isPickup ? 'pickup' : (task.deliveryAddress ? 'delivery' : '')
      dueDate.value = task.dueDate || ''
      dueTime.value = task.dueTime || ''
      reminderOffset.value = task.remindBefore || null
      
      if (task.attachments) {
        attachments.value = task.attachments.map((att) => ({
          id: att.id,
          name: att.name,
          previewUrl: att.previewUrl,
        }))
      }
      
      const assigneeOption = assigneeOptions.value.find((opt) => opt.name === task.assignee.name)
      if (assigneeOption) {
        selectedAssigneeId.value = assigneeOption.id
      } else {
        // If assignee not found in options, store it as custom assignee
        customAssignee.value = {
          name: task.assignee.name,
          avatarUrl: task.assignee.avatarUrl,
        }
        selectedAssigneeId.value = 'unassigned'
      }
    } else {
      // If task not found in projects, try to load from order data via API
      try {
        const orderData = await fetchOrder(orderId.value)
        const project = getProjectById(orderData.projectId)
        const order = convertOrderToOrderDetail(orderData, project?.title)
        
        // Fill form with order data
        title.value = order.title || ''
        description.value = order.description || ''
        clientName.value = order.client.name || ''
        clientPhone.value = order.client.phone || ''
        
        // Parse due date from dueDateLabel (format: "26 октября 2024, 18:00")
        if (order.dueDateLabel) {
          const dateMatch = order.dueDateLabel.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/)
          if (dateMatch) {
            const months: Record<string, string> = {
              'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
              'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
              'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
            }
            const day = dateMatch[1].padStart(2, '0')
            const month = months[dateMatch[2]] || '01'
            const year = dateMatch[3]
            dueDate.value = `${year}-${month}-${day}`
            
            // Parse time if available
            const timeMatch = order.dueDateLabel.match(/(\d{1,2}):(\d{2})/)
            if (timeMatch) {
              dueTime.value = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
            }
          }
        }
        
        // Set delivery option - assume delivery if no specific indication
        deliveryOption.value = 'pickup'
        
        // Set prepayment - parse from formatted string
        if (order.client.prepayment) {
          // Extract numeric value from formatted string like "50 000 ₽"
          const prepaymentMatch = order.client.prepayment.match(/[\d\s]+/)
          if (prepaymentMatch) {
            hasPrepayment.value = true
            prepaymentAmount.value = prepaymentMatch[0].replace(/\s/g, '')
          }
        }
        
        if (order.client.totalAmount) {
          // Extract numeric value from formatted string
          const totalMatch = order.client.totalAmount.match(/[\d\s]+/)
          if (totalMatch) {
            paymentAmount.value = totalMatch[0].replace(/\s/g, '')
          }
        }
        
        // Convert attachments
        if (order.attachments && order.attachments.length > 0) {
          attachments.value = order.attachments.map((att) => ({
            id: att.id,
            name: att.name,
            previewUrl: att.previewUrl,
          }))
        }
        
        // Set assignee
        if (order.assignee) {
          const assigneeOption = assigneeOptions.value.find((opt) => opt.name === order.assignee?.name)
          if (assigneeOption) {
            selectedAssigneeId.value = assigneeOption.id
          } else {
            // If assignee not found in options, store it as custom assignee
            customAssignee.value = {
              name: order.assignee.name,
              avatarUrl: order.assignee.avatarUrl,
            }
            selectedAssigneeId.value = 'unassigned'
          }
        }
      } catch (error) {
        console.error('Failed to load order data:', error)
        // If order loading fails, form will remain empty
      }
    }
  }
})

const handleImageClick = (attachment: ImageAttachment) => {
  // Use previewUrl as imageId for blob URLs
  router.push({
    path: `/images/${encodeURIComponent(attachment.previewUrl)}`,
    query: {
      projectId: projectId.value,
      source: 'task-create',
    },
  })
}

const handleSubmit = async () => {
  submitAttempted.value = true
  submitError.value = ''

  if (!isFormValid.value) {
    return
  }

  if (!project.value) {
    submitError.value = isEditMode.value 
      ? 'Проект недоступен для редактирования задачи.'
      : 'Проект недоступен для создания задачи.'
    return
  }

  try {
    const taskData = {
      title: title.value,
      description: description.value,
      clientName: clientName.value,
      clientPhone: clientPhone.value,
      deliveryAddress: deliveryAddress.value,
      isPickup: deliveryOption.value === 'pickup',
      dueDate: dueDate.value || undefined,
      dueTime: dueTime.value || undefined,
      remindBefore: reminderOffset.value || undefined,
      attachments: attachments.value.map(({ id, name, previewUrl }) => ({ id, name, previewUrl })),
      assignee:
        customAssignee.value
          ? { name: customAssignee.value.name, avatarUrl: customAssignee.value.avatarUrl }
          : selectedAssignee.value.id === DEFAULT_ASSIGNEE.id || selectedAssignee.value.id === 'unassigned'
          ? undefined
          : { name: selectedAssignee.value.name, avatarUrl: selectedAssignee.value.avatarUrl },
    }

    if (isEditMode.value && orderId.value) {
      // Try to find task in projects
      const found = findTaskInProjects(orderId.value)
      
      if (found && found.project.id === projectId.value) {
        // Task found in current project, update it
        await updateTask(orderId.value, taskData)
        await router.push(`/orders/${orderId.value}`)
      } else {
        // Task not found or in different project, create new task with same ID
        // Note: This would require modifying createTask to accept an ID, or we create it and redirect
        // For now, we'll create a new task and redirect to order details
        await createTask(taskData)
        attachments.value = []
        reminderOffset.value = null
        await router.push(`/orders/${orderId.value}`)
      }
    } else {
      await createTask(taskData)
      attachments.value = []
      reminderOffset.value = null
      await router.push(returnPath.value)
    }
  } catch (error) {
    submitError.value = isEditMode.value
      ? 'Не удалось сохранить изменения. Попробуйте ещё раз.'
      : 'Не удалось создать задачу. Попробуйте ещё раз.'
  }
}

const handleTitleBlur = () => {
  titleTouched.value = true
}

const handleClientNameBlur = () => {
  clientNameTouched.value = true
}

const handleClientPhoneBlur = () => {
  clientPhoneTouched.value = true
}

const handleDeliveryAddressBlur = () => {
  deliveryAddressTouched.value = true
}

watch(deliveryOption, (value) => {
  if (value !== 'delivery') {
    deliveryAddressTouched.value = false
  }
})

watch(dueDate, (value) => {
  if (!value) {
    dueTime.value = ''
  }
})

watch(selectedAssigneeId, (value) => {
  if (value !== 'unassigned' && customAssignee.value) {
    customAssignee.value = null
  }
})

watch(
  hasPrepayment,
  (value) => {
    if (!value) {
      prepaymentAmount.value = ''
    }
  },
  { flush: 'post' },
)

const pageTitle = computed(() => isEditMode.value ? 'Редактирование заказа' : 'Новая задача')
const submitButtonLabel = computed(() => {
  if (isCreating.value) return 'Создание…'
  if (isUpdating.value) return 'Сохранение…'
  return isEditMode.value ? 'Сохранить изменения' : 'Создать задачу'
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
        aria-label="Закрыть создание задачи"
        @click="router.back()"
      >
        <span class="material-symbols-outlined text-3xl">close</span>
      </button>
      <h1 class="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em]">{{ pageTitle }}</h1>
      <div class="flex w-12 items-center justify-end"></div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 pt-4 pb-32">
      <div v-if="project" class="flex flex-col space-y-6">
        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Название заказа</p>
          <input
            v-model="title"
            class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            type="text"
            placeholder="Введите короткое название заказа"
            :aria-invalid="showTitleError"
            enterkeyhint="done"
            @blur="handleTitleBlur"
          />
          <p v-if="showTitleError" class="pt-1 text-sm text-red-400">{{ titleError }}</p>
        </label>

        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Описание</p>
          <textarea
            v-model="description"
            class="form-input min-h-36 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Добавьте детали, чек-лист и важные требования"
            enterkeyhint="done"
          ></textarea>
        </label>

        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Имя клиента</p>
          <input
            v-model="clientName"
            class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            type="text"
            placeholder="Введите имя клиента"
            :aria-invalid="showClientNameError"
            enterkeyhint="done"
            @blur="handleClientNameBlur"
          />
          <p v-if="showClientNameError" class="pt-1 text-sm text-red-400">{{ clientNameError }}</p>
        </label>

        <label class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Номер телефона клиента</p>
          <input
            v-model="clientPhone"
            class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
            type="tel"
            inputmode="tel"
            placeholder="Введите номер телефона"
            :aria-invalid="showClientPhoneError"
            enterkeyhint="done"
            @blur="handleClientPhoneBlur"
          />
          <p v-if="showClientPhoneError" class="pt-1 text-sm text-red-400">{{ clientPhoneError }}</p>
        </label>

        <div class="flex flex-col space-y-4 rounded-xl border border-[#3b4354] bg-[#1c1f27] p-4">
          <p class="text-base font-medium leading-normal">Оплата</p>
          <div class="flex flex-col gap-3">
            <label class="flex items-center gap-3 text-base font-medium leading-normal">
              <input
                v-model="hasPrepayment"
                type="checkbox"
                class="size-5 border-2 border-[#3b4354] bg-[#1c1f27] text-primary focus:ring-primary"
                name="payment-prepayment"
              />
              <span>Предоплата</span>
            </label>
            <label v-if="hasPrepayment" class="flex flex-col">
              <span class="pb-2 text-base font-medium leading-normal">Сумма предоплаты</span>
              <input
                v-model="prepaymentAmount"
                class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
                type="number"
                inputmode="decimal"
                placeholder="Введите сумму предоплаты"
                min="0"
              />
            </label>
          </div>
          <label class="flex flex-col">
            <span class="pb-2 text-base font-medium leading-normal">Вся сумма</span>
            <input
              v-model="paymentAmount"
              class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
              type="number"
              inputmode="decimal"
              placeholder="Введите сумму заказа"
              min="0"
            />
          </label>
        </div>

        <div class="flex flex-col space-y-4 rounded-xl border border-[#3b4354] bg-[#1c1f27] p-4">
          <p class="text-base font-medium leading-normal">Доставка</p>
          <div class="flex flex-col gap-3">
            <label class="flex items-center gap-3 text-base font-medium leading-normal">
              <input
                v-model="deliveryOption"
                type="radio"
                value="pickup"
                class="size-5 border-2 border-[#3b4354] bg-[#1c1f27] text-primary focus:ring-primary"
                name="delivery-option"
              />
              <span>Самовывоз</span>
            </label>
            <label class="flex items-center gap-3 text-base font-medium leading-normal">
              <input
                v-model="deliveryOption"
                type="radio"
                value="delivery"
                class="size-5 border-2 border-[#3b4354] bg-[#1c1f27] text-primary focus:ring-primary"
                name="delivery-option"
              />
              <span>Доставка</span>
            </label>
          </div>

          <label v-if="shouldShowDeliveryAddress" class="flex flex-col">
            <span class="pb-2 text-base font-medium leading-normal">Адрес доставки</span>
            <input
              v-model="deliveryAddress"
              class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
              type="text"
              placeholder="Введите адрес доставки"
              :aria-invalid="showDeliveryAddressError"
              enterkeyhint="done"
              @blur="handleDeliveryAddressBlur"
            />
            <p v-if="showDeliveryAddressError" class="pt-1 text-sm text-red-400">{{ deliveryAddressError }}</p>
          </label>
        </div>

        <div class="flex flex-col space-y-4">
          <p class="text-base font-medium leading-normal">Фото примеров</p>
          <ImageUploader
            v-model="attachments"
            button-size="md"
            variant="dark"
            :clickable="true"
            @image-click="handleImageClick"
          />
          <p class="text-sm text-gray-500 dark:text-[#9da6b9]">
            Поддерживаются изображения в форматах JPEG, PNG и SVG.
          </p>
        </div>

        <div class="flex flex-col divide-y divide-[#3b4354] rounded-lg border border-[#3b4354] bg-[#1c1f27]">
          <!-- Assignee -->
          <div class="flex min-h-14 items-center justify-between gap-4 p-4">
            <div class="flex items-center gap-4">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#282e39] text-white">
                <span class="material-symbols-outlined">person</span>
              </div>
              <div>
                <p class="text-base font-normal leading-normal">Исполнитель</p>
                <p class="text-sm text-[#9da6b9]" :class="{ 'text-emerald-600 dark:text-emerald-400': selectedAssignee.id !== DEFAULT_ASSIGNEE.id }">{{ selectedAssignee.name }}</p>
              </div>
            </div>
            <div class="relative">
              <select
                v-model="selectedAssigneeId"
                class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                aria-label="Выберите исполнителя"
              >
                <option v-for="option in assigneeOptions" :key="option.id" :value="option.id">
                  {{ option.name }}
                </option>
              </select>
              <div class="flex items-center gap-2 text-base font-medium leading-normal text-primary">
                <span>{{ selectedAssignee.id === DEFAULT_ASSIGNEE.id ? 'Выбрать' : 'Изменить' }}</span>
                <span class="material-symbols-outlined text-xl">arrow_forward_ios</span>
              </div>
            </div>
          </div>

          <!-- Due Date -->
          <div class="flex min-h-14 items-center justify-between gap-4 p-4">
            <div class="flex items-center gap-4">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#282e39] text-white">
                <span class="material-symbols-outlined">calendar_today</span>
              </div>
              <div>
                <p class="text-base font-normal leading-normal">Дата</p>
                <p class="text-sm text-[#9da6b9]" :class="{ 'text-emerald-600 dark:text-emerald-400': dueDate }">{{ dueDateLabel }}</p>
              </div>
            </div>
            <div class="relative">
              <input
                v-model="dueDate"
                type="date"
                class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                aria-label="Установите срок выполнения"
              />
              <div class="flex items-center gap-2 text-base font-medium leading-normal text-primary">
                <span>{{ dueDate ? 'Изменить' : 'Установить' }}</span>
                <span class="material-symbols-outlined text-xl">arrow_forward_ios</span>
              </div>
            </div>
          </div>

          <!-- Due Time -->
          <div class="flex min-h-14 items-center justify-between gap-4 p-4">
            <div class="flex items-center gap-4">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#282e39] text-white">
                <span class="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <p class="text-base font-normal leading-normal">Время</p>
                <p class="text-sm text-[#9da6b9]" :class="{ 'text-emerald-600 dark:text-emerald-400': dueTime }">{{ dueTime ? dueTime : 'Не задано' }}</p>
              </div>
            </div>
            <div class="relative">
              <select
                v-model="dueTime"
                class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                aria-label="Установите время выполнения"
              >
                <option value="">Не задано</option>
                <option v-for="option in timeOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
              <div class="flex items-center gap-2 text-base font-medium leading-normal text-primary">
                <span>{{ dueTime ? 'Изменить' : 'Установить' }}</span>
                <span class="material-symbols-outlined text-xl">arrow_forward_ios</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col space-y-3">
          <p class="text-base font-medium leading-normal">Напомнить за:</p>
          <div class="flex items-center gap-3">
            <button
              v-for="option in reminderOptions"
              :key="option.value"
              type="button"
              class="flex-1 rounded-xl px-4 py-3 text-base font-medium leading-normal transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :class="
                reminderOffset === option.value
                  ? 'bg-primary text-white'
                  : 'bg-[#282e39] text-white/80 hover:bg-[#323a47]'
              "
              :aria-pressed="reminderOffset === option.value"
              @click="handleToggleReminder(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center gap-4 py-20 text-center text-[#9da6b9]">
        <span class="material-symbols-outlined text-4xl text-primary">search_off</span>
        <p class="text-base font-medium text-white">Проект не найден</p>
        <p>Проверьте ссылку или вернитесь к списку задач.</p>
        <button
          type="button"
          class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="router.back()"
        >
          Вернуться к задачам
        </button>
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
          {{ submitButtonLabel }}
        </button>
      </div>
    </footer>
  </div>
</template>
