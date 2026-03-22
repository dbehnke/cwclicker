<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { formatNumber } from '../utils/format'

const store = useGameStore()

/**
 * Dismisses the notification.
 */
function dismiss() {
  store.dismissOfflineEarnings()
}

/**
 * Computed property to check if there's offline earnings to display.
 */
const hasOfflineEarnings = computed(() => {
  return store.offlineEarnings !== null && store.offlineEarnings.qsos > 0
})

/**
 * Formats the time display (e.g., "2 hours", "30 minutes").
 */
const timeDisplay = computed(() => {
  if (!store.offlineEarnings) return ''

  const hours = store.offlineEarnings.hours

  if (hours >= 1) {
    return hours === 1 ? '1 hour' : `${hours} hours`
  } else {
    const minutes = Math.round(hours * 60)
    return minutes === 1 ? '1 minute' : `${minutes} minutes`
  }
})
</script>

<template>
  <transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="hasOfflineEarnings"
      class="fixed bottom-4 right-4 max-w-md bg-terminal-bg border-2 border-terminal-amber rounded-lg p-4 shadow-lg z-50"
      role="alert"
      aria-live="polite"
    >
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <div class="text-2xl">⏰</div>

        <!-- Content -->
        <div class="flex-1">
          <h3 class="text-terminal-amber font-bold mb-1">Welcome Back!</h3>

          <p class="text-terminal-green text-sm mb-2">
            While you were away for {{ timeDisplay }}, your stations earned:
          </p>

          <div class="text-2xl font-bold text-terminal-amber mb-1">
            {{ formatNumber(store.offlineEarnings.qsos) }} QSOs
          </div>

          <p class="text-xs text-gray-400">
            (at {{ store.offlineEarnings.rate.toFixed(1) }} QSOs/sec with 50% offline efficiency)
          </p>
        </div>

        <!-- Close button -->
        <button
          @click="dismiss"
          class="text-gray-400 hover:text-terminal-green transition-colors"
          aria-label="Dismiss offline earnings notification"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </transition>
</template>
