<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

export interface ImageAttachment {
  id: string
  name: string
  previewUrl: string
  file: File
}

interface Props {
  modelValue?: ImageAttachment[]
  buttonSize?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
  showFileName?: boolean
  clickable?: boolean
  maxFileNameLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  buttonSize: 'md',
  variant: 'dark',
  showFileName: false,
  clickable: false,
  maxFileNameLength: 26,
})

const emit = defineEmits<{
  'update:modelValue': [attachments: ImageAttachment[]]
  'image-click': [attachment: ImageAttachment]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const attachments = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const buttonClasses = computed(() => {
  const sizeClasses = {
    sm: 'h-16 w-16 min-h-16 min-w-16',
    md: 'h-20 w-20 min-h-20 min-w-20',
    lg: 'h-24 w-24 min-h-24 min-w-24',
  }

  const variantClasses = {
    dark: 'border-[#3b4354] bg-[#1c1f27] text-[#9da6b9] hover:border-primary hover:text-primary',
    light:
      'border-black/10 bg-white text-gray-500 hover:border-primary hover:text-primary dark:border-white/15 dark:bg-[#1C2431] dark:text-[#9da6b9] dark:hover:border-primary',
  }

  return `${sizeClasses[props.buttonSize]} ${variantClasses[props.variant]} flex items-center justify-center rounded-lg border-2 border-dashed transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`
})

const imageClasses = computed(() => {
  const sizeClasses = {
    sm: 'h-16 w-16 min-h-16 min-w-16',
    md: 'h-20 w-20 min-h-20 min-w-20',
    lg: 'h-24 w-24 min-h-24 min-w-24',
  }

  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-lg',
    lg: 'rounded-2xl',
  }

  const shadowClasses = props.variant === 'light' ? 'shadow-sm' : ''

  return `${sizeClasses[props.buttonSize]} ${roundedClasses[props.buttonSize]} ${shadowClasses} object-cover`
})

const removeButtonClasses = computed(() => {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  }

  return `${sizeClasses[props.buttonSize]} absolute right-1.5 top-1.5 z-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300`
})

const createAttachmentPreview = (file: File): ImageAttachment => {
  const identifier =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 11)

  const previewUrl = typeof URL !== 'undefined' ? URL.createObjectURL(file) : ''

  return {
    id: identifier,
    name: file.name,
    previewUrl,
    file,
  }
}

const revokePreviewUrl = (url: string) => {
  if (!url || !url.startsWith('blob:')) {
    return
  }

  if (typeof URL !== 'undefined') {
    URL.revokeObjectURL(url)
  }
}

const formatFileName = (name: string) => {
  if (name.length <= props.maxFileNameLength) {
    return name
  }

  const extensionIndex = name.lastIndexOf('.')

  if (extensionIndex <= 0 || extensionIndex === name.length - 1) {
    return `${name.slice(0, Math.max(1, props.maxFileNameLength - 3))}...`
  }

  const extension = name.slice(extensionIndex)
  const baseName = name.slice(0, extensionIndex)
  const available = Math.max(1, props.maxFileNameLength - extension.length - 3)
  const truncated = baseName.slice(0, available)

  return `${truncated}...${extension}`
}

const handleAddAttachments = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  const fileList = target?.files

  if (!fileList?.length) {
    return
  }

  const newAttachments = Array.from(fileList).map(createAttachmentPreview)
  attachments.value = [...attachments.value, ...newAttachments]

  if (target) {
    target.value = ''
  }
}

const handleRemoveAttachment = (attachmentId: string) => {
  const attachment = attachments.value.find((item) => item.id === attachmentId)
  if (!attachment) {
    return
  }

  revokePreviewUrl(attachment.previewUrl)
  attachments.value = attachments.value.filter((item) => item.id !== attachmentId)
}

const handleImageClick = (attachmentId: string) => {
  if (!props.clickable) {
    return
  }

  const attachment = attachments.value.find((item) => item.id === attachmentId)
  if (attachment) {
    emit('image-click', attachment)
  }
}

onBeforeUnmount(() => {
  attachments.value.forEach((attachment) => revokePreviewUrl(attachment.previewUrl))
})
</script>

<template>
  <div class="flex flex-col space-y-4">
    <div class="flex items-center gap-4">
      <button
        type="button"
        :class="buttonClasses"
        aria-label="Добавить фото"
        @click="handleAddAttachments"
      >
        <span class="material-symbols-outlined text-3xl">add_photo_alternate</span>
      </button>

      <ul
        v-if="attachments.length"
        :class="[
          'flex items-center gap-4 overflow-x-auto',
          showFileName ? 'flex-wrap' : '',
        ]"
        role="list"
      >
        <li
          v-for="attachment in attachments"
          :key="attachment.id"
          role="listitem"
          :class="[
            showFileName ? 'group relative flex w-28 flex-col items-center gap-2' : 'relative',
          ]"
        >
          <div
            :class="[
              clickable ? 'cursor-pointer' : '',
              showFileName ? 'relative' : 'relative',
            ]"
            @click="handleImageClick(attachment.id)"
          >
            <img
              v-if="attachment.previewUrl"
              :src="attachment.previewUrl"
              :alt="`Фото ${attachment.name}`"
              :class="imageClasses"
            />
            <div
              v-else
              :class="[
                imageClasses,
                'flex items-center justify-center bg-black/5 text-gray-500 dark:bg-white/10 dark:text-[#9da6b9]',
              ]"
            >
              <span class="material-symbols-outlined text-3xl">image</span>
            </div>

            <button
              type="button"
              :class="[
                removeButtonClasses,
                showFileName
                  ? 'opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 bg-black/70 hover:bg-black/70'
                  : '',
              ]"
              :aria-label="`Удалить фото ${attachment.name}`"
              @click.stop="handleRemoveAttachment(attachment.id)"
            >
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <p
            v-if="showFileName"
            class="text-center text-xs font-medium text-gray-600 dark:text-[#9da6b9]"
            :title="attachment.name"
          >
            {{ formatFileName(attachment.name) }}
          </p>
        </li>
      </ul>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*"
      class="sr-only"
      @change="handleFileChange"
    />
  </div>
</template>

