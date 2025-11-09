<template>
  <div
    class="pull-to-refresh"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div
      v-if="isPulling"
      class="pull-indicator"
      :style="{
        opacity: pullOpacity,
        transform: `translate(-50%, calc(-100% + ${pullVerticalOffset}px)) rotate(${pullRotation}deg)`,
      }"
    >
      <span class="material-symbols-outlined pull-indicator__icon text-primary">
        refresh
      </span>
    </div>

    <slot />

    <div v-if="isReloading" class="reload-overlay">
      <div class="reload-overlay__panel">
        <span class="material-symbols-outlined reload-overlay__spinner text-primary">
          progress_activity
        </span>
        <p class="reload-overlay__text">
          {{ reloadText }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';

interface TouchPosition {
  x: number;
  y: number;
}

// Animation and behavior constants
const ANIMATION_CONFIG = {
  // Opacity animation
  OPACITY_MAX_DISTANCE: 500,
  OPACITY_THRESHOLD: 50, // Opacity starts appearing earlier

  // Rotation animation
  ROTATION_MAX_DEGREES: 100, // 360 / 100 for slower rotation
  ROTATION_MAX_DISTANCE: 150,

  // Movement animation
  MOVE_MULTIPLIER: 0.5, // How much icon moves relative to swipe distance (increased for better visibility)
  MAX_MOVE_DISTANCE: 100, // Maximum pixels icon can move down (increased)

  // Timing
  RELOAD_DELAY: 500, // Delay before actual reload
} as const;

const props = defineProps({
  reloadText: {
    type: String,
    default: 'Обновление...',
  },
  swipeThreshold: {
    type: Number,
    default: 320, // Minimum vertical distance in pixels for swipe (ещё больше для меньшей чувствительности)
  },
  maxStartPosition: {
    type: Number,
    default: Number.POSITIVE_INFINITY, // Maximum Y position where swipe can start (defaults to full screen)
  },
  minVerticalRatio: {
    type: Number,
    default: 2, // Minimum ratio of vertical to horizontal movement
  },
});

const isReloading = ref(false);
const isPulling = ref(false);
const pullDistance = ref(0);
const touchStart = reactive<TouchPosition>({ x: 0, y: 0 });
const touchCurrent = reactive<TouchPosition>({ x: 0, y: 0 });
const touchStartTime = ref(0);
const isSwiping = ref(false);

const pageHasScroll = () => {
  const root = document.querySelector('#q-app');

  if (!root) {
    return false;
  }

  const scrollOffset = Math.max(window.scrollY ?? 0, window.pageYOffset ?? 0, root.scrollTop ?? 0);

  return scrollOffset > 0;
};

// Computed properties for pull indicator animation
const pullOpacity = computed(() => {
  const opacity = Math.min(
    (pullDistance.value - ANIMATION_CONFIG.OPACITY_THRESHOLD) /
      (ANIMATION_CONFIG.OPACITY_MAX_DISTANCE - ANIMATION_CONFIG.OPACITY_THRESHOLD),
    1,
  );
  return Math.max(0, opacity);
});

const pullRotation = computed(() => {
  return (
    (pullDistance.value / ANIMATION_CONFIG.ROTATION_MAX_DISTANCE) *
    ANIMATION_CONFIG.ROTATION_MAX_DEGREES
  );
});

const pullVerticalOffset = computed(() => {
  return Math.min(
    pullDistance.value * ANIMATION_CONFIG.MOVE_MULTIPLIER,
    ANIMATION_CONFIG.MAX_MOVE_DISTANCE,
  );
});

const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length !== 1 || isReloading.value) return;
  if (pageHasScroll()) {
    isSwiping.value = false;
    isPulling.value = false;
    pullDistance.value = 0;
    return;
  }

  const touch = event.touches[0];
  touchStart.x = touch.clientX;
  touchStart.y = touch.clientY;
  touchCurrent.x = touch.clientX;
  touchCurrent.y = touch.clientY;
  touchStartTime.value = Date.now();
  isSwiping.value = true;

  // Reset pull state
  isPulling.value = false;
  pullDistance.value = 0;
};

const handleTouchMove = (event: TouchEvent) => {
  if (!isSwiping.value || event.touches.length !== 1 || isReloading.value) return;
  if (pageHasScroll()) {
    isSwiping.value = false;
    isPulling.value = false;
    pullDistance.value = 0;
    return;
  }

  const touch = event.touches[0];
  touchCurrent.x = touch.clientX;
  touchCurrent.y = touch.clientY;

  const deltaX = touchCurrent.x - touchStart.x;
  const deltaY = touchCurrent.y - touchStart.y;

  // Check if swipe started near the top of the screen
  const startedFromTop = touchStart.y <= props.maxStartPosition;

  // Check if it's a downward swipe
  const isDownwardSwipe = deltaY > 0;
  const verticalDistance = Math.abs(deltaY);
  const horizontalDistance = Math.abs(deltaX);

  // Check if it's vertical enough
  const isVerticalEnough =
    horizontalDistance === 0 || verticalDistance / horizontalDistance >= props.minVerticalRatio;

  // Show pull indicator if conditions are met
  if (startedFromTop && isDownwardSwipe && isVerticalEnough) {
    isPulling.value = true;
    pullDistance.value = verticalDistance;
  } else {
    isPulling.value = false;
    pullDistance.value = 0;
  }
};

const handleTouchEnd = () => {
  if (!isSwiping.value) return;
  if (pageHasScroll()) {
    isSwiping.value = false;
    isPulling.value = false;
    pullDistance.value = 0;
    touchCurrent.x = touchStart.x;
    touchCurrent.y = touchStart.y;
    return;
  }

  isSwiping.value = false;

  const deltaX = touchCurrent.x - touchStart.x;
  const deltaY = touchCurrent.y - touchStart.y;

  // Check if swipe started near the top of the screen
  const startedFromTop = touchStart.y <= props.maxStartPosition;

  // Check if it's a downward swipe with sufficient vertical distance
  const isDownwardSwipe = deltaY > 0;
  const verticalDistance = Math.abs(deltaY);
  const horizontalDistance = Math.abs(deltaX);

  // More strict vertical ratio check
  const isVerticalEnough =
    horizontalDistance === 0 || verticalDistance / horizontalDistance >= props.minVerticalRatio;

  // Check minimum vertical distance
  const hasMinimalVerticalDistance = verticalDistance >= props.swipeThreshold;

  // Combine all conditions for a valid pull-to-refresh gesture
  const isValidPullToRefresh =
    startedFromTop && isDownwardSwipe && isVerticalEnough && hasMinimalVerticalDistance;

  if (isValidPullToRefresh) {
    triggerReload();
  } else {
    // Reset pull state
    isPulling.value = false;
    pullDistance.value = 0;
  }

  // Sync current touch position with start to avoid stale deltas on next tap
  touchCurrent.x = touchStart.x;
  touchCurrent.y = touchStart.y;
};

const triggerReload = () => {
  isPulling.value = false;
  pullDistance.value = 0;
  isReloading.value = true;

  // Add a small delay to show the spinner before reload
  setTimeout(() => {
    // Perform hard reload
    window.location.reload();
  }, ANIMATION_CONFIG.RELOAD_DELAY);
};
</script>

<style scoped>
.pull-to-refresh {
  position: relative;
  width: 100%;
  touch-action: pan-y;
}

.pull-indicator {
  position: fixed;
  top: 0;
  left: 50%;
  display: flex;
  height: 3.25rem;
  width: 3.25rem;
  align-items: center;
  justify-content: center;
  padding: 8px;
  pointer-events: none;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(14px);
  transform-origin: center;
  z-index: 60;
  transition: opacity 0.12s ease-out;
}

.pull-indicator__icon {
  font-size: 32px;
  line-height: 1;
}

:global(.dark) .pull-indicator {
  background: rgba(24, 24, 27, 0.85);
  border-color: rgba(96, 165, 250, 0.26);
  box-shadow: 0 12px 32px rgba(2, 6, 23, 0.45);
}

.reload-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(18px);
}

:global(.dark) .reload-overlay {
  background: rgba(3, 7, 18, 0.35);
}

.reload-overlay__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.32);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(18px);
}

:global(.dark) .reload-overlay__panel {
  background: rgba(24, 24, 27, 0.88);
  border-color: rgba(82, 82, 91, 0.45);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.6);
}

.reload-overlay__spinner {
  font-size: 1.875rem;
  line-height: 1;
}

.reload-overlay__text {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: center;
  color: rgba(63, 63, 70, 1);
}

:global(.dark) .reload-overlay__text {
  color: rgba(228, 228, 231, 1);
}
</style>