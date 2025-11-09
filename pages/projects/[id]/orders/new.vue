<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import type { ImageAttachment } from '~/components/ImageUploader.vue'
import type { OrderReminderOffset } from '~/data/projects'
import { useOrders } from '~/composables/useOrders'
import { convertOrderToOrderDetail } from '~/data/orders'
import { useProjects } from '~/composables/useProjects'
import { useTelegram } from '~/composables/useTelegram'
import { useOrderDraft } from '~/composables/useOrderDraft'
import { useProjectTeam } from '~/composables/useProjectTeam'
import Checkbox from '~/components/Checkbox.vue'
import Radio from '~/components/Radio.vue'
import RichTextEditor from '~/components/RichTextEditor.vue'
import TextInputWithClear from '~/components/TextInputWithClear.vue'

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

const { getProjectById } = useProjects()
const { fetchOrder, createOrder, updateOrder, isCreating, isUpdating } = useOrders()
const { members, fetchMembers, isLoading: isLoadingMembers } = useProjectTeam(projectId)

const project = computed(() => getProjectById(projectId.value))

const bannerStorageKey = computed(() => `order-settings-banner:${projectId.value}`)
const isBannerVisible = ref(false)

const updateBannerVisibility = () => {
  if (!import.meta.client) {
    return
  }

  const storedValue = window.localStorage.getItem(bannerStorageKey.value)
  isBannerVisible.value = storedValue !== 'dismissed'
}

const dismissBanner = () => {
  if (import.meta.client) {
    window.localStorage.setItem(bannerStorageKey.value, 'dismissed')
  }
  isBannerVisible.value = false
}

const handleGoToProjectSettings = () => {
  dismissBanner()
  if (projectId.value) {
    router.push(`/projects/${projectId.value}/settings`)
  }
}

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
const showTitle = computed(() => orderFieldsSettings.value.title !== false)
const showDescription = computed(() => orderFieldsSettings.value.description !== false)
const showAssignee = computed(() => orderFieldsSettings.value.assignee !== false)
const showAttachments = computed(() => orderFieldsSettings.value.attachments === true)
const showPayment = computed(() => orderFieldsSettings.value.payment === true)
const showDelivery = computed(() => orderFieldsSettings.value.delivery === true)
const showClientName = computed(() => orderFieldsSettings.value.clientName === true)
const showClientPhone = computed(() => orderFieldsSettings.value.clientPhone === true)
const showDueDate = computed(() => orderFieldsSettings.value.dueDate === true)
const showDueTime = computed(() => orderFieldsSettings.value.dueTime === true)
const showReminder = computed(() => orderFieldsSettings.value.reminder === true && showDueTime.value)

// Initialize draft functionality (only for creating new orders, not editing)
const { saveDraft, loadDraft, clearDraft, hasDraft, createDebouncedSave } = useOrderDraft(projectId)
const debouncedSave = createDebouncedSave(500)

const title = ref('')
const description = ref('')
const clientName = ref('')
const clientPhone = ref('')
const deliveryAddressDefault = 'Уточняется'
const deliveryAddress = ref(deliveryAddressDefault)
const deliveryOption = ref<'pickup' | 'delivery' | ''>('pickup')
const dueDate = ref('')
const dueTime = ref('')
const selectedAssigneeId = ref('unassigned')
const customAssignee = ref<{ name: string; avatarUrl: string } | null>(null)
const attachments = ref<ImageAttachment[]>([])
const reminderOffset = ref<OrderReminderOffset | null>(null)
const hasPrepayment = ref(false)
const paymentAmount = ref('')
const prepaymentAmount = ref('')

const titleTouched = ref(false)
const clientNameTouched = ref(false)
const clientPhoneTouched = ref(false)
const deliveryAddressTouched = ref(false)
const submitAttempted = ref(false)
const submitError = ref('')
const isSubmittingLocal = ref(false)

const DEFAULT_ASSIGNEE: AssigneeOption = {
  id: 'unassigned',
  name: 'Не назначен',
  avatarUrl:
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23282e39%22/%3E%3Cpath d=%22M32 34c6.075 0 11-4.925 11-11S38.075 12 32 12s-11 4.925-11 11 4.925 11 11 11Zm0 4c-7.732 0-21 3.882-21 11.5V52a4 4 0 0 0 4 4h34a4 4 0 0 0 4-4v-2.5C53 41.882 39.732 38 32 38Z%22 fill=%22%239da6b9%22/%3E%3C/svg%3E',
}

const assigneeOptions = computed<AssigneeOption[]>(() => {
  const options: AssigneeOption[] = [DEFAULT_ASSIGNEE]
  
  // Add project team members as assignee options
  if (members.value && members.value.length > 0) {
    const teamMemberOptions: AssigneeOption[] = members.value.map((member) => ({
      id: member.id,
      name: member.name,
      avatarUrl: member.avatarUrl || DEFAULT_ASSIGNEE.avatarUrl,
    }))
    options.push(...teamMemberOptions)
  }
  
  return options
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

// Get selected assignee's telegram ID
const selectedAssigneeTelegramId = computed(() => {
  if (selectedAssigneeId.value === 'unassigned' || !selectedAssigneeId.value) {
    return null
  }
  
  // Find the team member by id to get telegram_id
  const member = members.value.find((m) => m.id === selectedAssigneeId.value)
  if (member) {
    // member.id is the telegram_id as string, convert to number
    return parseInt(member.id, 10)
  }
  
  return null
})

const titleError = computed(() => '')

const clientNameError = computed(() => '')

const clientPhoneError = computed(() => {
  if (!showClientPhone.value) {
    return ''
  }

  const digits = clientPhone.value.replace(/\D/g, '')
  if (digits.length === 0) {
    return ''
  }

  if (digits.length >= 10) {
    return ''
  }

  return 'Введите номер телефона'
})

const isDeliverySelected = computed(() => deliveryOption.value === 'delivery')

const deliveryAddressError = computed(() => '')

const showTitleError = computed(() => (titleTouched.value || submitAttempted.value) && Boolean(titleError.value))
const showClientNameError = computed(
  () => showClientName.value && (clientNameTouched.value || submitAttempted.value) && Boolean(clientNameError.value),
)
const showClientPhoneError = computed(
  () => showClientPhone.value && (clientPhoneTouched.value || submitAttempted.value) && Boolean(clientPhoneError.value),
)
const showDeliveryAddressError = computed(
  () =>
    showDelivery.value && isDeliverySelected.value && (deliveryAddressTouched.value || submitAttempted.value) && Boolean(deliveryAddressError.value),
)

const shouldShowDeliveryAddress = computed(() => showDelivery.value && isDeliverySelected.value)

const dueDateLabel = computed(() => {
  if (!dueDate.value) {
    return 'Не задан'
  }

  const dateLabel = new Date(dueDate.value).toLocaleDateString('ru-RU')

  return dateLabel
})

const isFormValid = computed(() => clientPhoneError.value.length === 0)

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

const timeOptions = createTimeOptions(30) // 30-minute intervals (00:00, 00:30, 01:00, 01:30, ...)

const reminderOptions: ReadonlyArray<{ label: string; value: OrderReminderOffset }> = [
  { label: '1 час', value: '1h' },
  { label: '3 часа', value: '3h' },
  { label: '1 день', value: '1d' },
]

const handleToggleReminder = (value: OrderReminderOffset) => {
  reminderOffset.value = reminderOffset.value === value ? null : value
}

// Convert dueDate and dueTime to ISO string for API
const getDueDateISO = (): string | null => {
  if (!dueDate.value) {
    return null
  }

  try {
    if (dueTime.value) {
      // Combine date and time
      const timeParts = dueTime.value.split(':')
      if (timeParts.length === 2) {
        const hours = Number(timeParts[0])
        const minutes = Number(timeParts[1])
        if (!isNaN(hours) && !isNaN(minutes)) {
          const date = new Date(dueDate.value)
          date.setHours(hours, minutes, 0, 0)
          return date.toISOString()
        }
      }
    }

    // Only date, set to start of day
    const date = new Date(dueDate.value)
    date.setHours(0, 0, 0, 0)
    return date.toISOString()
  } catch (error) {
    console.error('Error converting due date to ISO:', error)
    return null
  }
}

// Determine payment_type based on form data
const getPaymentType = (): string | null => {
  if (hasPrepayment.value && prepaymentAmount.value) {
    const prepayment = Number(prepaymentAmount.value)
    const total = Number(paymentAmount.value) || 0
    
    if (!isNaN(prepayment) && !isNaN(total)) {
      if (prepayment > 0 && total > 0 && prepayment < total) {
        return 'prepayment'
      } else if (prepayment > 0 && total > 0 && prepayment >= total) {
        return 'full'
      }
    }
  }
  
  if (deliveryOption.value === 'delivery') {
    return 'on_delivery'
  }
  
  return null
}

const isSubmitDisabled = computed(() => !projectId.value || !isFormValid.value || isSubmittingLocal.value || isCreating.value || isUpdating.value)

// Save form data to draft (only for creating new orders)
const saveFormToDraft = () => {
  if (isEditMode.value) {
    return // Don't save drafts when editing
  }

  // Get attachment URLs (base64 data URLs and existing URLs, but not blob URLs)
  const attachmentUrls = attachments.value
    .filter(att => att.previewUrl && !att.previewUrl.startsWith('blob:'))
    .map(att => att.previewUrl)

  debouncedSave({
    title: title.value,
    description: description.value,
    clientName: clientName.value,
    clientPhone: clientPhone.value,
    deliveryAddress: deliveryAddress.value,
    deliveryOption: deliveryOption.value,
    dueDate: dueDate.value,
    dueTime: dueTime.value,
    selectedAssigneeId: selectedAssigneeId.value,
    customAssignee: customAssignee.value,
    attachmentUrls,
    reminderOffset: reminderOffset.value,
    hasPrepayment: hasPrepayment.value,
    paymentAmount: paymentAmount.value,
    prepaymentAmount: prepaymentAmount.value,
  })
}

// Load draft data into form (only for creating new orders)
const loadDraftToForm = async () => {
  if (isEditMode.value) {
    return // Don't load drafts when editing
  }

  const draft = loadDraft()
  if (!draft) {
    return
  }

  title.value = draft.title || ''
  description.value = draft.description || ''
  clientName.value = draft.clientName || ''
  clientPhone.value = draft.clientPhone || ''
  deliveryAddress.value = draft.deliveryAddress || deliveryAddressDefault
  deliveryOption.value = draft.deliveryOption || 'pickup'
  dueDate.value = draft.dueDate || ''
  dueTime.value = draft.dueTime || ''
  selectedAssigneeId.value = draft.selectedAssigneeId || 'unassigned'
  customAssignee.value = draft.customAssignee || null
  reminderOffset.value = draft.reminderOffset || null
  hasPrepayment.value = draft.hasPrepayment || false
  paymentAmount.value = draft.paymentAmount || ''
  prepaymentAmount.value = draft.prepaymentAmount || ''

  // Load attachment URLs (convert to ImageAttachment format)
  // Convert base64 data URLs back to File objects for upload
  if (draft.attachmentUrls && draft.attachmentUrls.length > 0) {
    attachments.value = await Promise.all(
      draft.attachmentUrls.map(async (url, index) => {
        let file: File = new File([], `image-${index + 1}`)
        
        // If it's a base64 data URL, convert it back to File
        if (url.startsWith('data:')) {
          try {
            const response = await fetch(url)
            const blob = await response.blob()
            // Extract file extension from data URL or use default
            const mimeMatch = url.match(/data:([^;]+);/)
            const extension = mimeMatch 
              ? (mimeMatch[1] === 'image/jpeg' ? 'jpg' : mimeMatch[1] === 'image/png' ? 'png' : 'jpg')
              : 'jpg'
            file = new File([blob], `image-${index + 1}.${extension}`, { type: blob.type })
          } catch (error) {
            console.error('Failed to convert base64 to File:', error)
          }
        }
        
        return {
          id: `draft-${index}`,
          name: `image-${index + 1}`,
          previewUrl: url,
          file,
        }
      })
    )
  }
}

// Handle draft clear
const handleClearDraft = () => {
  clearDraft()
  // Clear form fields
  title.value = ''
  description.value = ''
  clientName.value = ''
  clientPhone.value = ''
  deliveryAddress.value = deliveryAddressDefault
  deliveryOption.value = 'pickup'
  dueDate.value = ''
  dueTime.value = ''
  selectedAssigneeId.value = 'unassigned'
  customAssignee.value = null
  attachments.value = []
  reminderOffset.value = null
  hasPrepayment.value = false
  paymentAmount.value = ''
  prepaymentAmount.value = ''
  
  // Reset touched states
  titleTouched.value = false
  clientNameTouched.value = false
  clientPhoneTouched.value = false
  deliveryAddressTouched.value = false
  submitAttempted.value = false
}

// Load order data for edit mode or draft for new orders
watch(
  () => projectId.value,
  () => {
    updateBannerVisibility()
  },
  { immediate: true },
)

onMounted(async () => {
  updateBannerVisibility()

  // Fetch project team members first
  await fetchMembers()
  
  if (orderId.value) {
    try {
      const orderData = await fetchOrder(orderId.value)
      const projectData = project.value
      const order = convertOrderToOrderDetail(orderData, projectData?.title)
      
      // Fill form with order data
      title.value = order.title || ''
      description.value = order.description || ''
      clientName.value = order.client.name || ''
      clientPhone.value = order.client.phone || ''
      
      // Parse due date from dueDateLabel (format: "26 октября 2024, 18:00")
      if (order.dueDateLabel) {
        const dateMatch = order.dueDateLabel.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/)
        if (dateMatch && dateMatch[1] && dateMatch[2] && dateMatch[3]) {
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
          if (timeMatch && timeMatch[1] && timeMatch[2]) {
            dueTime.value = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
          }
        }
      }
      
      // Load due_time from orderData if available (prefer over parsed time)
      if (orderData.dueTime) {
        dueTime.value = orderData.dueTime
      }
      
      // Set delivery option and address
      if (orderData.deliveryAddress) {
        deliveryOption.value = 'delivery'
        deliveryAddress.value = orderData.deliveryAddress
      } else {
        deliveryOption.value = 'pickup'
        deliveryAddress.value = deliveryAddressDefault
      }
      
      // Load reminder offset
      if (orderData.reminderOffset) {
        reminderOffset.value = orderData.reminderOffset as OrderReminderOffset
      }
      
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
      
      // Load existing images from orderData.imageUrls
      if (orderData.imageUrls && orderData.imageUrls.length > 0) {
        attachments.value = orderData.imageUrls.map((url, index) => ({
          id: `existing-${index}`,
          name: `image-${index + 1}`,
          previewUrl: url,
          file: new File([], `image-${index + 1}`), // Empty file for existing attachments
        }))
      } else if (order.attachments && order.attachments.length > 0) {
        // Fallback to order.attachments if imageUrls is not available
        attachments.value = order.attachments.map((att) => ({
          id: att.id,
          name: att.name || 'image',
          previewUrl: att.previewUrl,
          file: new File([], att.name || 'image'), // Create empty file for existing attachments
        }))
      }
      
      // Set assignee - load from orderData if available
      if (orderData.assigneeTelegramId !== null && orderData.assigneeTelegramId !== undefined) {
        // Try to find the assignee in the project team members
        const assigneeMember = members.value.find((m) => m.id === orderData.assigneeTelegramId!.toString())
        if (assigneeMember) {
          // Assignee is a project team member
          selectedAssigneeId.value = assigneeMember.id
          customAssignee.value = null
        } else if (orderData.assigneeTelegramName && orderData.assigneeTelegramAvatarUrl) {
          // Assignee is not in the project team, use custom assignee
          customAssignee.value = {
            name: orderData.assigneeTelegramName,
            avatarUrl: orderData.assigneeTelegramAvatarUrl,
          }
          selectedAssigneeId.value = 'unassigned'
        } else {
          selectedAssigneeId.value = 'unassigned'
          customAssignee.value = null
        }
      } else if (order.assignee) {
        // Fallback to order.assignee if available
        customAssignee.value = {
          name: order.assignee.name,
          avatarUrl: order.assignee.avatarUrl,
        }
        selectedAssigneeId.value = 'unassigned'
      } else {
        selectedAssigneeId.value = 'unassigned'
        customAssignee.value = null
      }
    } catch (error) {
      console.error('Failed to load order data:', error)
      // If order loading fails, form will remain empty
    }
  } else {
    // Load draft for new order creation
    await loadDraftToForm()
  }
})

const handleImageClick = async (attachment: ImageAttachment) => {
  let imageUrl = attachment.previewUrl

  // If it's a blob URL (local file), convert to data URL for cross-page navigation
  // Base64 data URLs can be used directly
  if (attachment.previewUrl.startsWith('blob:') && attachment.file && attachment.file.size > 0) {
    try {
      // Convert File to data URL (base64)
      const reader = new FileReader()
      imageUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result)
          } else {
            reject(new Error('Failed to convert file to data URL'))
          }
        }
        reader.onerror = () => {
          reject(new Error('Failed to read file'))
        }
        reader.readAsDataURL(attachment.file)
      })
    } catch (error) {
      console.error('Failed to convert file to data URL:', error)
      // Fallback to blob URL if conversion fails
      imageUrl = attachment.previewUrl
    }
  }
  // Base64 data URLs are already in the correct format, use them directly

  router.push({
    path: `/images/${encodeURIComponent(imageUrl)}`,
    query: {
      projectId: projectId.value,
      source: 'order-create',
    },
  })
}

// Upload images to Supabase Storage
const uploadImages = async (): Promise<string[]> => {
  const uploadedUrls: string[] = []
  
  // Filter only new attachments (with actual file data and base64 data URL or blob URL)
  // Base64 URLs (data:) are from draft, blob URLs are newly selected but not yet converted
  const newAttachments = attachments.value.filter(att => 
    att.file && att.file.size > 0 && (att.previewUrl.startsWith('data:') || att.previewUrl.startsWith('blob:'))
  )

  if (newAttachments.length === 0) {
    return uploadedUrls
  }

  const { getInitData } = useTelegram()
  const initData = getInitData()

  const headers: Record<string, string> = {}
  if (initData) {
    headers['x-telegram-init-data'] = initData
  }

  // Upload each new image
  for (const attachment of newAttachments) {
    try {
      const formData = new FormData()
      formData.append('file', attachment.file)

      const response = await fetch('/api/images', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload image' }))
        throw new Error(errorData.message || 'Failed to upload image')
      }

      const data = await response.json()
      if (data.url) {
        uploadedUrls.push(data.url)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error(`Не удалось загрузить изображение ${attachment.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return uploadedUrls
}

const handleSubmit = async () => {
  submitAttempted.value = true
  submitError.value = ''

  if (!isFormValid.value) {
    return
  }

  if (!projectId.value) {
    submitError.value = isEditMode.value 
      ? 'Проект недоступен для редактирования задачи.'
      : 'Проект недоступен для создания задачи.'
    return
  }

  isSubmittingLocal.value = true

  try {
    // Upload new images first (for both new and edit modes)
    let newImageUrls: string[] = []
    if (attachments.value.length > 0) {
      try {
        newImageUrls = await uploadImages()
      } catch (error) {
        submitError.value = error instanceof Error ? error.message : 'Не удалось загрузить изображения. Попробуйте ещё раз.'
        isSubmittingLocal.value = false
        return
      }
    }

    // Get all image URLs (existing URLs that are already uploaded, not base64 or blob)
    // Base64 and blob URLs will be uploaded via uploadImages()
    const existingImageUrls = attachments.value
      .filter(att => 
        att.previewUrl && 
        !att.previewUrl.startsWith('blob:') && 
        !att.previewUrl.startsWith('data:') &&
        att.previewUrl
      )
      .map(att => att.previewUrl)
    
    const allImageUrls = [...existingImageUrls, ...newImageUrls]

    const dueDateISO = getDueDateISO()
    const paymentType = getPaymentType()
    const prepaymentNum = hasPrepayment.value && prepaymentAmount.value ? Number(prepaymentAmount.value) : null
    const totalNum = paymentAmount.value ? Number(paymentAmount.value) : null
    const prepayment = prepaymentNum !== null && !isNaN(prepaymentNum) ? prepaymentNum : null
    const total = totalNum !== null && !isNaN(totalNum) ? totalNum : null

    if (isEditMode.value && orderId.value) {
      // Update existing order
      const updateData: any = {
        title: title.value,
        summary: '', // Summary is not used in the form, but we send empty string to ensure it's updated
        description: description.value,
        client_name: clientName.value,
        client_phone: clientPhone.value,
        due_date: dueDateISO,
        due_time: dueTime.value || null,
        delivery_address: deliveryOption.value === 'delivery' ? deliveryAddress.value || null : null,
        payment_type: paymentType,
        prepayment_amount: prepayment,
        total_amount: total,
        image_urls: allImageUrls,
      }
      
      // Set assignee fields
      if (selectedAssigneeTelegramId.value) {
        // Assignee is selected from project team members
        const selectedMember = members.value.find((m) => m.id === selectedAssigneeId.value)
        updateData.assignee_telegram_id = selectedAssigneeTelegramId.value
        updateData.assignee_telegram_name = selectedMember?.name || null
        updateData.assignee_telegram_avatar_url = selectedMember?.avatarUrl || null
      } else if (customAssignee.value) {
        // Custom assignee (not in project team)
        updateData.assignee_telegram_id = null
        updateData.assignee_telegram_name = customAssignee.value.name
        updateData.assignee_telegram_avatar_url = customAssignee.value.avatarUrl
      } else {
        // No assignee
        updateData.assignee_telegram_id = null
        updateData.assignee_telegram_name = null
        updateData.assignee_telegram_avatar_url = null
      }
      
      // Include reminder_offset (should be TEXT in database, values like "1h", "3h", "1d")
      if (reminderOffset.value !== null && reminderOffset.value !== undefined) {
        updateData.reminder_offset = reminderOffset.value
      } else {
        updateData.reminder_offset = null
      }
      
      await updateOrder(orderId.value, updateData)
      
      await router.back()
    } else {
      // Create new order
      const orderData: any = {
        project_id: projectId.value,
        title: title.value,
        summary: '', // Summary is not used in the form, but we send empty string for consistency
        description: description.value,
        client_name: clientName.value,
        client_phone: clientPhone.value,
        due_date: dueDateISO,
        due_time: dueTime.value || null,
        delivery_address: deliveryOption.value === 'delivery' ? deliveryAddress.value || null : null,
        reminder_offset: reminderOffset.value || null,
        payment_type: paymentType,
        prepayment_amount: prepayment,
        total_amount: total,
        image_urls: allImageUrls,
        status: 'new',
        assignee_telegram_id: selectedAssigneeTelegramId.value,
      }
      
      // Set assignee name and avatar if assignee is selected from project team
      if (selectedAssigneeTelegramId.value) {
        const selectedMember = members.value.find((m) => m.id === selectedAssigneeId.value)
        if (selectedMember) {
          // Send assignee name and avatar explicitly
          orderData.assignee_telegram_name = selectedMember.name
          orderData.assignee_telegram_avatar_url = selectedMember.avatarUrl || null
        }
      }
      
      await createOrder(orderData)
      
      // Re-enable draft saving after successful order creation
      handleClearDraft()
      
      await router.back()
    }
  } catch (error) {
    submitError.value = isEditMode.value
      ? 'Не удалось сохранить изменения. Попробуйте ещё раз.'
      : 'Не удалось создать задачу. Попробуйте ещё раз.'
  } finally {
    isSubmittingLocal.value = false
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

// Auto-save draft when form fields change (only for creating new orders)
watch([title, description, clientName, clientPhone, deliveryAddress, deliveryOption, dueDate, dueTime, selectedAssigneeId, customAssignee, reminderOffset, hasPrepayment, paymentAmount, prepaymentAmount], () => {
  saveFormToDraft()
}, { deep: true })

// Auto-save draft when attachments change (only non-blob URLs)
watch(attachments, () => {
  saveFormToDraft()
}, { deep: true })

// Check if draft exists
const draftExists = computed(() => !isEditMode.value && hasDraft())

const pageTitle = computed(() => isEditMode.value ? 'Редактирование задачи' : 'Новая задача')
const submitButtonLabel = computed(() => {
  if (isSubmittingLocal.value || isCreating.value) return 'Создание…'
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
    <header class="flex items-center justify-between border-b border-white/10 bg-background-dark/80 p-4 pb-3">
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/5"
        aria-label="Закрыть создание задачи"
        @click="router.back()"
      >
        <span class="material-symbols-outlined text-3xl">close</span>
      </button>
      <h1 class="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em]">{{ pageTitle }}</h1>
      <div class="flex w-12 items-center justify-end">
        <button
          v-if="draftExists"
          type="button"
          class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/5 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/5"
          aria-label="Очистить черновик"
          @click="handleClearDraft"
        >
          <span class="material-symbols-outlined text-3xl">refresh</span>
        </button>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 pt-4 pb-12">
      <div v-if="projectId" class="flex flex-col space-y-6">
        <label v-if="showTitle" class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Название задачи</p>
          <TextInputWithClear
            v-model="title"
            placeholder="Введите короткое название задачи"
            :aria-invalid="showTitleError"
            enterkeyhint="done"
            @blur="handleTitleBlur"
          />
          <p v-if="showTitleError" class="pt-1 text-sm text-red-400">{{ titleError }}</p>
        </label>

        <div v-if="showDescription" class="flex flex-col">
          <p class="pb-2 text-base font-medium leading-normal">Описание</p>
          <RichTextEditor
            v-model="description"
            placeholder="Добавьте детали, чек-лист и важные требования"
            :show-list-button="false"
            :show-preview="false"
          />
        </div>

        <div v-if="showAttachments" class="flex flex-col space-y-4">
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

        <div v-if="showPayment" class="flex flex-col space-y-4 rounded-xl border border-[#3b4354] bg-[#1c1f27] p-4">
          <p class="text-base font-medium leading-normal">Оплата</p>
          <label class="flex flex-col">
            <span class="pb-2 text-base font-medium leading-normal">Вся сумма</span>
            <input
              v-model="paymentAmount"
              class="form-input h-14 w-full rounded-xl border-none bg-[#282e39] p-4 text-base font-normal leading-normal text-white placeholder:text-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary"
              type="number"
              inputmode="decimal"
              placeholder="Введите сумму"
              min="0"
            />
          </label>
          <div class="flex flex-col gap-3">
            <label class="flex items-center gap-3 text-base font-medium leading-normal">
              <Checkbox
                v-model="hasPrepayment"
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
        </div>

        <div v-if="showDelivery" class="flex flex-col space-y-4 rounded-xl border border-[#3b4354] bg-[#1c1f27] p-4">
          <p class="text-base font-medium leading-normal">Доставка</p>
          <div class="flex flex-col gap-3">
            <label class="flex items-center gap-3 text-base font-medium leading-normal">
              <Radio
                v-model="deliveryOption"
                value="pickup"
                name="delivery-option"
              />
              <span>Самовывоз</span>
            </label>
            <label class="flex items-center gap-3 text-base font-medium leading-normal">
              <Radio
                v-model="deliveryOption"
                value="delivery"
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

        <label v-if="showClientName" class="flex flex-col">
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

        <label v-if="showClientPhone" class="flex flex-col">
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

        <div v-if="showAssignee || showDueDate || showDueTime" class="flex flex-col divide-y divide-[#3b4354] rounded-lg border border-[#3b4354] bg-[#1c1f27]">
          <!-- Assignee -->
          <div v-if="showAssignee" class="flex min-h-14 items-center justify-between gap-4 p-4">
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
          <div v-if="showDueDate" class="flex min-h-14 items-center justify-between gap-4 p-4">
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
          <div v-if="showDueTime" class="flex min-h-14 items-center justify-between gap-4 p-4">
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

        <div v-if="showReminder && dueTime" class="flex flex-col space-y-3">
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

      <div
        v-if="isBannerVisible && projectId"
        class="relative mt-8 rounded-2xl border border-white/5 bg-[#1f2633] p-5 text-white"
      >
        <button
          type="button"
          class="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Скрыть подсказку"
          @click="dismissBanner"
        >
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
        <div class="pr-10">
          <p class="text-base font-semibold leading-tight">Добавьте дополнительные поля для задач</p>
          <p class="mt-2 text-sm leading-normal text-[#9da6b9]">
            На странице настроек проекта можно включить дополнительные поля и сделать форму задачи удобнее для команды.
          </p>
          <button
            type="button"
            class="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="handleGoToProjectSettings"
          >
            Перейти в настройки
            <span class="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>

    <footer class="w-full bg-background-dark/80 p-4 pb-8">
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
