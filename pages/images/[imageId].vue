<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { getOrderDetailMock } from '~/data/orders'

const route = useRoute()
const router = useRouter()

// Image data
const imageId = computed(() => {
  const raw = route.params.imageId
  return Array.isArray(raw) ? raw[0] ?? '' : raw?.toString() ?? ''
})

const source = computed(() => (route.query.source as string) || '')
const orderId = computed(() => route.query.orderId as string)
const projectId = computed(() => route.query.projectId as string)

// Zoom state
const scale = ref(1.0)
const MIN_SCALE = 1.0
const MAX_SCALE = 5.0
const ZOOM_STEP = 0.5

// Pan state
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const lastTranslateX = ref(0)
const lastTranslateY = ref(0)

// Pinch to zoom state
const pinchStartDistance = ref(0)
const pinchStartScale = ref(1)
const isPinching = ref(false)

// Touch state for panning
const lastTouchX = ref(0)
const lastTouchY = ref(0)

// UI state
const isLoading = ref(true)
const loadError = ref(false)
const scaleIndicatorVisible = ref(false)
const scaleIndicatorTimer = ref<NodeJS.Timeout | null>(null)

// Image element ref
const imageRef = ref<HTMLImageElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

// Get image URL based on source
const imageUrl = computed(() => {
  if (source.value === 'order-details' && orderId.value) {
    const order = getOrderDetailMock(orderId.value)
    const attachment = order.attachments.find((att) => att.id === imageId.value)
    if (attachment) {
      return attachment.previewUrl
    }
  }

  if (source.value === 'task-create') {
    // For blob URLs, return the imageId as URL
    // This will be handled by the page that navigates here
    return imageId.value
  }

  return ''
})

// Scale indicator
const scaleLabel = computed(() => `${Math.round(scale.value * 100)}%`)

const showScaleIndicator = () => {
  scaleIndicatorVisible.value = true

  if (scaleIndicatorTimer.value) {
    clearTimeout(scaleIndicatorTimer.value)
  }

  scaleIndicatorTimer.value = setTimeout(() => {
    scaleIndicatorVisible.value = false
  }, 2000)
}

// Zoom functions
const zoomIn = () => {
  const newScale = Math.min(scale.value + ZOOM_STEP, MAX_SCALE)
  scale.value = newScale
  showScaleIndicator()

  // Constrain position after zoom
  nextTick(() => {
    constrainPosition()
  })
}

const zoomOut = () => {
  const newScale = Math.max(scale.value - ZOOM_STEP, MIN_SCALE)
  scale.value = newScale

  if (newScale === MIN_SCALE) {
    resetPosition()
  } else {
    showScaleIndicator()
    nextTick(() => {
      constrainPosition()
    })
  }
}

const resetZoom = () => {
  scale.value = MIN_SCALE
  resetPosition()
  showScaleIndicator()
}

const resetPosition = () => {
  translateX.value = 0
  translateY.value = 0
  lastTranslateX.value = 0
  lastTranslateY.value = 0
}

// Constrain position to keep image within bounds
// This ensures the zoomed image doesn't drift too far off-screen
const constrainPosition = () => {
  if (!imageRef.value || !containerRef.value) return

  const imageRect = imageRef.value.getBoundingClientRect()
  const containerRect = containerRef.value.getBoundingClientRect()

  // Calculate maximum allowed translation based on image and container dimensions
  // When image is larger than container, user can pan within the difference
  const maxX = Math.max(0, (imageRect.width - containerRect.width) / 2)
  const maxY = Math.max(0, (imageRect.height - containerRect.height) / 2)

  // Clamp translation values to keep image within bounds
  translateX.value = Math.max(-maxX, Math.min(maxX, translateX.value))
  translateY.value = Math.max(-maxY, Math.min(maxY, translateY.value))

  // Update last position for smooth dragging
  lastTranslateX.value = translateX.value
  lastTranslateY.value = translateY.value
}

// Mouse wheel zoom
const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  if (event.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

// Mouse drag
const handleMouseDown = (event: MouseEvent) => {
  if (scale.value === MIN_SCALE) return

  isDragging.value = true
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || scale.value === MIN_SCALE) return

  const deltaX = event.clientX - dragStartX.value
  const deltaY = event.clientY - dragStartY.value

  translateX.value = lastTranslateX.value + deltaX
  translateY.value = lastTranslateY.value + deltaY

  constrainPosition()
}

const handleMouseUp = () => {
  isDragging.value = false
}

// Touch handlers for pinch-to-zoom
// Calculate Euclidean distance between two touch points
const getDistance = (touch1: Touch, touch2: Touch) => {
  const dx = touch2.clientX - touch1.clientX
  const dy = touch2.clientY - touch1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 2) {
    // Pinch gesture
    event.preventDefault()
    isPinching.value = true
    pinchStartDistance.value = getDistance(event.touches[0], event.touches[1])
    pinchStartScale.value = scale.value
  } else if (event.touches.length === 1 && scale.value > MIN_SCALE) {
    // Single touch pan
    lastTouchX.value = event.touches[0].clientX
    lastTouchY.value = event.touches[0].clientY
    isDragging.value = true
  }
}

const handleTouchMove = (event: TouchEvent) => {
  if (event.touches.length === 2 && isPinching.value) {
    // Pinch gesture for zooming
    event.preventDefault()
    const distance = getDistance(event.touches[0], event.touches[1])
    // Calculate scale ratio based on change in distance
    const scaleRatio = distance / pinchStartDistance.value
    scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchStartScale.value * scaleRatio))
    showScaleIndicator()
  } else if (event.touches.length === 1 && isDragging.value && scale.value > MIN_SCALE) {
    // Single touch pan
    event.preventDefault()
    const deltaX = event.touches[0].clientX - lastTouchX.value
    const deltaY = event.touches[0].clientY - lastTouchY.value

    translateX.value += deltaX
    translateY.value += deltaY

    lastTouchX.value = event.touches[0].clientX
    lastTouchY.value = event.touches[0].clientY

    constrainPosition()
  }
}

const handleTouchEnd = () => {
  isPinching.value = false
  isDragging.value = false

  if (scale.value === MIN_SCALE) {
    resetPosition()
  }
}

// Image transform style
const imageTransform = computed(() => {
  return `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`
})

// Button states
const canZoomIn = computed(() => scale.value < MAX_SCALE)
const canZoomOut = computed(() => scale.value > MIN_SCALE)
const canReset = computed(() => scale.value !== MIN_SCALE || translateX.value !== 0 || translateY.value !== 0)

// Handle image load
const handleImageLoad = () => {
  isLoading.value = false
  loadError.value = false
}

const handleImageError = () => {
  isLoading.value = false
  loadError.value = true

  // Log error in development mode for debugging
  if (import.meta.dev) {
    console.error('Failed to load image:', {
      imageId: imageId.value,
      imageUrl: imageUrl.value,
      source: source.value,
      orderId: orderId.value,
      projectId: projectId.value,
    })
  }
}

const handleRetry = () => {
  loadError.value = false
  isLoading.value = true
  if (imageRef.value) {
    imageRef.value.src = imageUrl.value
  }
}

// Cleanup
onUnmounted(() => {
  if (scaleIndicatorTimer.value) {
    clearTimeout(scaleIndicatorTimer.value)
  }
})

// Setup
onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('wheel', handleWheel, { passive: false })
    containerRef.value.addEventListener('mousemove', handleMouseMove)
    containerRef.value.addEventListener('mouseup', handleMouseUp)
    containerRef.value.addEventListener('mouseleave', handleMouseUp)
  }
})

useHead({
  title: 'Просмотр изображения',
  htmlAttrs: {
    lang: 'ru',
    class: 'dark',
  },
  bodyAttrs: {
    class: 'bg-background-light dark:bg-background-dark font-display',
    style: 'min-height: 100dvh; overflow: hidden;',
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
    ref="containerRef"
    class="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background-light dark:bg-background-dark"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Header with back button -->
    <header
      class="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 bg-background-light/80 px-4 py-3 backdrop-blur dark:bg-background-dark/80"
    >
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        aria-label="Вернуться назад"
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>
    </header>

    <!-- Image container -->
    <div class="absolute inset-0 flex items-center justify-center">
      <!-- Loading skeleton -->
      <div v-if="isLoading && !loadError" class="flex flex-col items-center gap-4">
        <div
          class="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
          role="status"
          aria-label="Загрузка изображения"
        ></div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Загрузка...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="flex flex-col items-center gap-4 p-6 text-center">
        <span class="material-symbols-outlined text-5xl text-red-400">image_not_supported</span>
        <p class="text-base font-medium text-gray-700 dark:text-gray-300">Не удалось загрузить изображение</p>
        <button
          type="button"
          class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="handleRetry"
        >
          Повторить
        </button>
      </div>

      <!-- Image -->
      <img
        v-if="imageUrl && !loadError"
        ref="imageRef"
        :src="imageUrl"
        alt="Просмотр изображения"
        class="h-auto w-auto max-h-full max-w-full object-contain transition-transform duration-200"
        :style="{ transform: imageTransform, cursor: scale.value > MIN_SCALE ? (isDragging ? 'grabbing' : 'grab') : 'default' }"
        @load="handleImageLoad"
        @error="handleImageError"
      />
    </div>

    <!-- Scale indicator -->
    <div
      v-if="scaleIndicatorVisible"
      class="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-opacity dark:bg-white/20"
    >
      {{ scaleLabel }}
    </div>

    <!-- Zoom controls -->
    <div
      class="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-2 py-2 backdrop-blur dark:bg-white/20"
    >
      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-full transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
        :aria-label="`Увеличить (${scaleLabel})`"
        :disabled="!canZoomIn"
        @click="zoomIn"
      >
        <span class="material-symbols-outlined text-2xl text-white">zoom_in</span>
      </button>

      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-full transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
        :aria-label="`Уменьшить (${scaleLabel})`"
        :disabled="!canZoomOut"
        @click="zoomOut"
      >
        <span class="material-symbols-outlined text-2xl text-white">zoom_out</span>
      </button>

      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-full transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Сбросить масштаб"
        :disabled="!canReset"
        @click="resetZoom"
      >
        <span class="material-symbols-outlined text-2xl text-white">fit_screen</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
img {
  will-change: transform;
}
</style>

