<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import { useOrders } from '~/composables/useOrders'
import { useProjects } from '~/composables/useProjects'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => String(route.params.id ?? ''))
const orderId = computed(() => {
  const orderIdParam = route.query.orderId
  return typeof orderIdParam === 'string' ? orderIdParam : null
})

const isEditMode = computed(() => Boolean(orderId.value))

const { createOrder, updateOrder, fetchOrder, isCreating, isUpdating } = useOrders()
const { getProjectById } = useProjects()

const fallbackOrdersRoute = computed(() => `/projects/${projectId.value}/orders`)
const returnPath = computed(() => {
  const from = route.query.from
  if (typeof from === 'string' && from.length > 0) {
    return from
  }
  return fallbackOrdersRoute.value
})

const title = ref('')
const summary = ref('')
const description = ref('')
const clientName = ref('')
const clientPhone = ref('')
const dueDate = ref('')
const dueTime = ref('')
const paymentType = ref<string>('')
const prepaymentAmount = ref('')
const totalAmount = ref('')
const status = ref('new')

const titleTouched = ref(false)
const clientNameTouched = ref(false)
const clientPhoneTouched = ref(false)
const submitAttempted = ref(false)
const submitError = ref('')
const isLoading = ref(false)

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

const showTitleError = computed(() => (titleTouched.value || submitAttempted.value) && Boolean(titleError.value))
const showClientNameError = computed(
  () => (clientNameTouched.value || submitAttempted.value) && Boolean(clientNameError.value),
)
const showClientPhoneError = computed(
  () => (clientPhoneTouched.value || submitAttempted.value) && Boolean(clientPhoneError.value),
)

const isSubmitting = computed(() => (isEditMode.value ? isUpdating.value : isCreating.value))
const isSubmitDisabled = computed(
  () => isSubmitting.value || Boolean(titleError.value) || Boolean(clientNameError.value) || Boolean(clientPhoneError.value),
)

const pageTitle = computed(() => (isEditMode.value ? 'Редактирование заказа' : 'Новый заказ'))
const submitButtonText = computed(() => {
  if (isEditMode.value) {
    return isUpdating.value ? 'Сохранение…' : 'Сохранить изменения'
  }
  return isCreating.value ? 'Создание…' : 'Создать заказ'
})

const paymentTypeOptions = [
  { value: '', label: 'Не выбрано' },
  { value: 'prepayment', label: 'Предоплата' },
  { value: 'full', label: 'Полная оплата' },
  { value: 'partial', label: 'Частичная оплата' },
  { value: 'on_delivery', label: 'Оплата при доставке' },
  { value: 'on_completion', label: 'Оплата по факту' },
]

const statusOptions = [
  { value: 'new', label: 'Новый' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'review', label: 'Проверяется' },
  { value: 'done', label: 'Сделано' },
  { value: 'cancelled', label: 'Отменен' },
]

const project = computed(() => getProjectById(projectId.value))

// Load order data if in edit mode
onMounted(async () => {
  if (isEditMode.value && orderId.value) {
    isLoading.value = true
    try {
      const orderData = await fetchOrder(orderId.value)
      title.value = orderData.title
      summary.value = orderData.summary || ''
      description.value = orderData.description || ''
      clientName.value = orderData.clientName
      clientPhone.value = orderData.clientPhone
      paymentType.value = orderData.paymentType || ''
      prepaymentAmount.value = orderData.prepaymentAmount?.toString() || ''
      totalAmount.value = orderData.totalAmount?.toString() || ''
      status.value = orderData.status || 'new'

      if (orderData.dueDate) {
        const date = new Date(orderData.dueDate)
        dueDate.value = date.toISOString().slice(0, 10)
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        dueTime.value = `${hours}:${minutes}`
      }
    } catch (error) {
      console.error('Failed to load order:', error)
      submitError.value = 'Не удалось загрузить заказ'
    } finally {
      isLoading.value = false
    }
  }
})

const handleTitleBlur = () => {
  titleTouched.value = true
}

const handleClientNameBlur = () => {
  clientNameTouched.value = true
}

const handleClientPhoneBlur = () => {
  clientPhoneTouched.value = true
}

const handleSubmit = async () => {
  submitAttempted.value = true

  if (isSubmitDisabled.value) {
    return
  }

  submitError.value = ''

  try {
    // Prepare due date
    let dueDateValue: string | null = null
    if (dueDate.value) {
      if (dueTime.value) {
        dueDateValue = `${dueDate.value}T${dueTime.value}:00`
      } else {
        dueDateValue = `${dueDate.value}T00:00:00`
      }
    }

    // Prepare payment amounts
    const prepaymentAmountValue = prepaymentAmount.value
      ? parseFloat(prepaymentAmount.value.replace(/,/g, '.').replace(/\s/g, ''))
      : null
    const totalAmountValue = totalAmount.value
      ? parseFloat(totalAmount.value.replace(/,/g, '.').replace(/\s/g, ''))
      : null

    if (isEditMode.value && orderId.value) {
      await updateOrder(orderId.value, {
        title: title.value.trim(),
        summary: summary.value.trim() || undefined,
        description: description.value.trim() || undefined,
        client_name: clientName.value.trim(),
        client_phone: clientPhone.value.trim(),
        due_date: dueDateValue,
        payment_type: paymentType.value || null,
        prepayment_amount: prepaymentAmountValue,
        total_amount: totalAmountValue,
        status: status.value,
      })
    } else {
      await createOrder({
        project_id: projectId.value,
        title: title.value.trim(),
        summary: summary.value.trim() || undefined,
        description: description.value.trim() || undefined,
        client_name: clientName.value.trim(),
        client_phone: clientPhone.value.trim(),
        due_date: dueDateValue,
        payment_type: paymentType.value || null,
        prepayment_amount: prepaymentAmountValue,
        total_amount: totalAmountValue,
        status: status.value,
      })
    }

    await router.push(returnPath.value)
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : isEditMode.value
          ? 'Не удалось сохранить заказ'
          : 'Не удалось создать заказ'
    submitError.value = errorMessage
    console.error('Error submitting order:', error)
  }
}

const handleClose = () => {
  router.push(returnPath.value)
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
        aria-label="Закрыть"
        @click="handleClose"
      >
        <span class="material-symbols-outlined text-3xl">close</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col items-start text-left">
        <h1 class="line-clamp-2 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          {{ pageTitle }}
        </h1>
        <p v-if="project" class="text-sm text-gray-500 dark:text-[#9da6b9]">
          {{ project.title }}
        </p>
      </div>
    </header>

    <main v-if="!isLoading" class="flex-1 space-y-6 overflow-y-auto px-4 py-6 pb-28 sm:pb-24">
      <section class="space-y-4">
        <div class="space-y-3">
          <label class="flex flex-col space-y-2">
            <span class="text-base font-semibold text-black dark:text-white">Название заказа *</span>
            <input
              v-model="title"
              type="text"
              class="w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:placeholder:text-[#9da6b9] dark:focus:ring-primary/40"
              placeholder="Введите название заказа"
              @blur="handleTitleBlur"
            />
            <p v-if="showTitleError" class="text-sm text-red-600 dark:text-red-400">
              {{ titleError }}
            </p>
          </label>
        </div>

        <div class="space-y-3">
          <label class="flex flex-col space-y-2">
            <span class="text-base font-semibold text-black dark:text-white">Краткое описание</span>
            <input
              v-model="summary"
              type="text"
              class="w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:placeholder:text-[#9da6b9] dark:focus:ring-primary/40"
              placeholder="Краткое описание заказа"
            />
          </label>
        </div>

        <div class="space-y-3">
          <label class="flex flex-col space-y-2">
            <span class="text-base font-semibold text-black dark:text-white">Описание</span>
            <textarea
              v-model="description"
              class="min-h-32 w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:placeholder:text-[#9da6b9] dark:focus:ring-primary/40"
              placeholder="Подробное описание заказа"
            ></textarea>
          </label>
        </div>

        <div class="space-y-3">
          <label class="flex flex-col space-y-2">
            <span class="text-base font-semibold text-black dark:text-white">Имя клиента *</span>
            <input
              v-model="clientName"
              type="text"
              class="w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:placeholder:text-[#9da6b9] dark:focus:ring-primary/40"
              placeholder="Введите имя клиента"
              @blur="handleClientNameBlur"
            />
            <p v-if="showClientNameError" class="text-sm text-red-600 dark:text-red-400">
              {{ clientNameError }}
            </p>
          </label>
        </div>

        <div class="space-y-3">
          <label class="flex flex-col space-y-2">
            <span class="text-base font-semibold text-black dark:text-white">Номер телефона клиента *</span>
            <input
              v-model="clientPhone"
              type="tel"
              class="w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:placeholder:text-[#9da6b9] dark:focus:ring-primary/40"
              placeholder="+7 (XXX) XXX-XX-XX"
              @blur="handleClientPhoneBlur"
            />
            <p v-if="showClientPhoneError" class="text-sm text-red-600 dark:text-red-400">
              {{ clientPhoneError }}
            </p>
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-3">
            <label class="flex flex-col space-y-2">
              <span class="text-base font-semibold text-black dark:text-white">Срок выполнения</span>
              <input
                v-model="dueDate"
                type="date"
                class="w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:placeholder:text-[#9da6b9] dark:focus:ring-primary/40"
              />
            </label>
          </div>

          <div class="space-y-3">
            <label class="flex flex-col space-y-2">
              <span class="text-base font-semibold text-black dark:text-white">Время выполнения</span>
              <input
                v-model="dueTime"
                type="time"
                class="w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:placeholder:text-[#9da6b9] dark:focus:ring-primary/40"
              />
            </label>
          </div>
        </div>

        <div class="space-y-3">
          <label class="flex flex-col space-y-2">
            <span class="text-base font-semibold text-black dark:text-white">Тип оплаты</span>
            <select
              v-model="paymentType"
              class="w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:focus:ring-primary/40"
            >
              <option v-for="option in paymentTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-3">
            <label class="flex flex-col space-y-2">
              <span class="text-base font-semibold text-black dark:text-white">Предоплата (₽)</span>
              <input
                v-model="prepaymentAmount"
                type="text"
                inputmode="decimal"
                class="w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:placeholder:text-[#9da6b9] dark:focus:ring-primary/40"
                placeholder="0"
              />
            </label>
          </div>

          <div class="space-y-3">
            <label class="flex flex-col space-y-2">
              <span class="text-base font-semibold text-black dark:text-white">Общая сумма (₽)</span>
              <input
                v-model="totalAmount"
                type="text"
                inputmode="decimal"
                class="w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:placeholder:text-[#9da6b9] dark:focus:ring-primary/40"
                placeholder="0"
              />
            </label>
          </div>
        </div>

        <div v-if="isEditMode" class="space-y-3">
          <label class="flex flex-col space-y-2">
            <span class="text-base font-semibold text-black dark:text-white">Статус</span>
            <select
              v-model="status"
              class="w-full rounded-2xl border border-black/10 bg-white p-4 text-base text-black focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:focus:ring-primary/40"
            >
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
      </section>

      <p
        v-if="submitError"
        class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
        role="alert"
      >
        {{ submitError }}
      </p>
    </main>

    <footer
      class="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-background-light/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
        :aria-disabled="isSubmitDisabled"
        :disabled="isSubmitDisabled"
        @click="handleSubmit"
      >
        <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
        <span>{{ submitButtonText }}</span>
      </button>
    </footer>
  </div>
</template>
