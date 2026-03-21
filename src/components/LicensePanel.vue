<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

/**
 * Emits events from the component.
 */
const emit = defineEmits(['upgrade'])

const store = useGameStore()

/**
 * License names by level.
 */
const LICENSE_NAMES = {
  1: 'Technician',
  2: 'General',
  3: 'Extra'
}

/**
 * QSO requirements for each license upgrade.
 */
const LICENSE_COSTS = {
  1: 500n,
  2: 5000n
}

/**
 * The name of the current license.
 */
const currentLicenseName = computed(() => {
  return LICENSE_NAMES[store.licenseLevel]
})

/**
 * The name of the next license (null if maxed).
 */
const nextLicense = computed(() => {
  if (store.licenseLevel >= 3) {
    return null
  }
  return LICENSE_NAMES[store.licenseLevel + 1]
})

/**
 * The QSO cost to upgrade to the next license.
 */
const nextLicenseCost = computed(() => {
  return LICENSE_COSTS[store.licenseLevel]
})

/**
 * Progress percentage toward the next license.
 */
const progressPercentage = computed(() => {
  if (!nextLicenseCost.value) {
    return 100
  }
  // Convert BigInt to Number for percentage calculation (safe for reasonable values)
  const qsosNum = Number(store.qsos)
  const costNum = Number(nextLicenseCost.value)
  return Math.min((qsosNum / costNum) * 100, 100)
})

/**
 * Whether the user can afford the upgrade.
 */
const canUpgrade = computed(() => {
  if (!nextLicenseCost.value) {
    return false
  }
  return store.qsos >= nextLicenseCost.value
})

/**
 * Handles the upgrade button click.
 */
const handleUpgrade = () => {
  if (canUpgrade.value) {
    emit('upgrade')
  }
}
</script>

<template>
  <div class="border-2 border-terminal-green bg-terminal-bg p-4 rounded">
    <div class="flex justify-between items-start mb-2">
      <h3 class="text-xl font-bold text-terminal-green">{{ currentLicenseName }}</h3>
      <button
        v-if="nextLicense"
        @click="handleUpgrade"
        :disabled="!canUpgrade"
        class="px-4 py-1 rounded font-bold transition-colors"
        :class="{
          'bg-terminal-green text-terminal-bg hover:bg-green-600': canUpgrade,
          'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canUpgrade
        }"
      >
        Upgrade to {{ nextLicense }}
      </button>
    </div>
    
    <div v-if="nextLicense" class="mt-3">
      <p class="text-sm text-gray-400 mb-2">Progress to {{ nextLicense }}</p>
      <div class="w-full bg-gray-700 rounded h-4 mb-2">
        <div
          class="bg-terminal-green h-4 rounded transition-all duration-300"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
      <p class="text-sm text-terminal-green">{{ store.qsos }}/{{ nextLicenseCost }} QSOs</p>
    </div>
  </div>
</template>
