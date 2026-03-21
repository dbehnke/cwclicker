<script setup>
import { ref, onUnmounted } from 'vue';

/**
 * Emits events from the component.
 */
const emit = defineEmits(['indicator-complete']);

/**
 * Track the last 5 click indicators with fade state
 * @typedef {Object} ClickIndicator
 * @property {string} id - Unique identifier
 * @property {number} value - QSO value (+1 or +2)
 * @property {number} opacity - Current opacity (0-1)
 */
const indicators = ref([]);

const MAX_INDICATORS = 5;
const FADE_DURATION_MS = 2000;

// Track active animation frame IDs to prevent memory leaks
const animationFrames = new Map();

/**
 * Generate a unique ID for each indicator
 * @returns {string} Unique identifier
 */
function generateId() {
  return `indicator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a new click indicator
 * @param {number} value - The QSO value to display (+1 or +2)
 */
function addIndicator(value) {
  const id = generateId();
  const indicator = {
    id,
    value,
    opacity: 1,
  };
  
  // Add to beginning (newest first)
  indicators.value.unshift(indicator);
  
  // Keep only last MAX_INDICATORS
  if (indicators.value.length > MAX_INDICATORS) {
    indicators.value = indicators.value.slice(0, MAX_INDICATORS);
  }
  
  // Start fade animation
  fadeIndicator(id);
}

/**
 * Fade out an indicator over time
 * @param {string} id - The indicator ID to fade
 */
function fadeIndicator(id) {
  const startTime = Date.now();

  const fadeStep = () => {
    // Check if this indicator's animation has been cancelled
    if (!animationFrames.has(id)) {
      return;
    }

    const elapsed = Date.now() - startTime;
    const progress = elapsed / FADE_DURATION_MS;

    if (progress >= 1) {
      // Remove fully faded indicator
      indicators.value = indicators.value.filter(ind => ind.id !== id);
      animationFrames.delete(id);
      emit('indicator-complete', id);
      return;
    }

    // Update opacity
    const indicator = indicators.value.find(ind => ind.id === id);
    if (indicator) {
      indicator.opacity = 1 - progress;
    }

    const frameId = requestAnimationFrame(fadeStep);
    animationFrames.set(id, frameId);
  };

  const frameId = requestAnimationFrame(fadeStep);
  animationFrames.set(id, frameId);
}

/**
 * Cancel animation for a specific indicator
 * @param {string} id - The indicator ID
 */
function cancelAnimation(id) {
  const frameId = animationFrames.get(id);
  if (frameId) {
    cancelAnimationFrame(frameId);
    animationFrames.delete(id);
  }
}

/**
 * Cleanup all animations when component unmounts
 */
onUnmounted(() => {
  // Cancel all pending animation frames to prevent memory leaks
  for (const frameId of animationFrames.values()) {
    cancelAnimationFrame(frameId);
  }
  animationFrames.clear();
  indicators.value = [];
});

/**
 * Get the display value with sign
 * @param {number} value - The QSO value
 * @returns {string} Formatted value like "+1" or "+2"
 */
function formatValue(value) {
  return `+${value}`;
}

// Expose addIndicator method to parent
defineExpose({
  addIndicator,
});
</script>

<template>
  <div
    class="flex flex-col items-end justify-center h-full gap-1 min-w-[60px]"
    aria-live="polite"
    aria-atomic="false"
    aria-relevant="additions"
  >
    <!-- Screen reader announcements for each click -->
    <div class="sr-only" role="status">
      <span v-for="indicator in indicators" :key="`sr-${indicator.id}`">
        Added {{ indicator.value }} QSOs
      </span>
    </div>

    <!-- Visual indicators -->
    <TransitionGroup name="indicator">
      <div
        v-for="indicator in indicators"
        :key="indicator.id"
        class="text-terminal-green font-bold text-lg transition-all duration-100"
        :style="{ opacity: indicator.opacity }"
        aria-hidden="true"
      >
        {{ formatValue(indicator.value) }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.indicator-enter-active,
.indicator-leave-active {
  transition: all 0.3s ease;
}

.indicator-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.indicator-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>