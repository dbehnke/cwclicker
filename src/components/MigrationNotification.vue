<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { formatNumber } from '../utils/format'

const store = useGameStore()

/**
 * Whether to show the migration notification.
 */
const showNotification = computed(() => {
  return store.migrationInfo !== null
})

/**
 * Dismisses the notification by clearing migration info.
 */
function dismiss() {
  store.migrationInfo = null
  store.save()
}
</script>

<template>
  <transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="showNotification"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="migration-title"
    >
      <div
        class="bg-terminal-bg border-2 border-terminal-green rounded-lg p-6 max-w-md w-full shadow-2xl"
      >
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="text-4xl mb-2">📡</div>
          <h2 id="migration-title" class="text-2xl font-bold text-terminal-green">Game Updated!</h2>
        </div>

        <!-- Migration Details -->
        <div class="space-y-4 mb-6">
          <p class="text-terminal-green text-center">
            CW Keyer Idle has been updated to <strong>v{{ store.migrationInfo?.toVersion }}</strong>
          </p>

          <div class="bg-terminal-dark border border-terminal-green rounded p-4">
            <p class="text-sm text-gray-400 mb-2">
              Previous Progress (v{{ store.migrationInfo?.fromVersion }}):
            </p>
            <ul class="space-y-1 text-terminal-green">
              <li class="flex justify-between">
                <span>License:</span>
                <span class="font-mono">
                  {{
                    store.migrationInfo?.oldLicense === 1
                      ? 'Technician'
                      : store.migrationInfo?.oldLicense === 2
                        ? 'General'
                        : 'Extra'
                  }}
                </span>
              </li>
              <li class="flex justify-between">
                <span>Total QSOs:</span>
                <span class="font-mono">{{
                  formatNumber(store.migrationInfo?.oldQsos || '0')
                }}</span>
              </li>
              <li class="flex justify-between">
                <span>Factories:</span>
                <span class="font-mono">{{ store.migrationInfo?.oldFactories || 0 }}</span>
              </li>
            </ul>
          </div>

          <div class="border-l-4 border-terminal-amber pl-4 py-2">
            <p class="text-terminal-amber text-sm">
              {{ store.migrationInfo?.reason }}
            </p>
            <p class="text-gray-400 text-xs mt-2">
              The new version includes a major factory system overhaul with 9 tiers and 27
              factories!
            </p>
          </div>
        </div>

        <!-- Action Button -->
        <button
          @click="dismiss"
          class="w-full py-3 px-4 bg-terminal-green text-terminal-bg font-bold rounded hover:bg-green-600 transition-colors"
        >
          Continue to v{{ store.migrationInfo?.toVersion }}
        </button>
      </div>
    </div>
  </transition>
</template>
