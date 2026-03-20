<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

/**
 * Props for the FactoryCard component.
 */
const props = defineProps({
  factory: {
    type: Object,
    required: true
  }
})

/**
 * Emits events from the component.
 */
const emit = defineEmits(['buy'])

const store = useGameStore()

/**
 * Calculates the current cost of this factory.
 */
const currentCost = computed(() => {
  const owned = store.factoryCounts[props.factory.id] || 0
  return store.getFactoryCost(props.factory.id, owned)
})

/**
 * Determines if the user can afford this factory.
 */
const canAfford = computed(() => {
  return store.qsos >= currentCost.value
})

/**
 * Gets the number of factories currently owned.
 */
const ownedCount = computed(() => {
  return store.factoryCounts[props.factory.id] || 0
})

/**
 * Calculates the actual production rate for this factory type.
 */
const actualOutput = computed(() => {
  const count = ownedCount.value
  if (count === 0) return 0
  const upgradeMultiplier = store.getUpgradeMultiplier(props.factory.id)
  return props.factory.qsosPerSecond * count * upgradeMultiplier
})

/**
 * Calculates the effective per-factory rate including upgrades.
 */
const effectivePerFactoryRate = computed(() => {
  const upgradeMultiplier = store.getUpgradeMultiplier(props.factory.id)
  return props.factory.qsosPerSecond * upgradeMultiplier
})

/**
 * Calculates how many more QSOs are needed to afford this factory.
 */
const qsosNeeded = computed(() => {
  if (canAfford.value) return 0n
  return currentCost.value - store.qsos
})

/**
 * Handles the buy button click.
 */
const handleBuy = () => {
  if (canAfford.value) {
    emit('buy', { factory: props.factory, count: 1 })
  }
}
</script>

<template>
  <div class="border-2 border-terminal-green bg-terminal-bg p-4 rounded">
    <div class="flex justify-between items-start mb-2">
      <h3 class="text-xl font-bold text-terminal-green">{{ factory.name }}</h3>
      <span class="text-sm text-terminal-amber">[Tier {{ factory.tier }}]</span>
    </div>
    
    <p class="text-sm text-gray-400 mb-3">{{ factory.description }}</p>
    
    <div class="flex justify-between items-center">
      <div class="text-terminal-green">
        <span v-if="ownedCount > 0" class="text-terminal-amber font-semibold mr-4">
          {{ actualOutput.toFixed(1) }}/sec
        </span>
        <span class="text-sm text-gray-500">
          ({{ effectivePerFactoryRate.toFixed(1) }}/sec each
          <span v-if="effectivePerFactoryRate > factory.qsosPerSecond" class="text-terminal-amber ml-1">
            ×{{ (effectivePerFactoryRate / factory.qsosPerSecond).toFixed(0) }}
          </span>
          )
        </span>
      </div>
      
      <div class="flex items-center gap-3">
        <span class="text-terminal-green">Cost: {{ currentCost.toString() }}</span>
        <span v-if="ownedCount > 0" class="text-terminal-amber text-sm">
          Owned: {{ ownedCount }}
        </span>
        <button
          @click="handleBuy"
          :disabled="!canAfford"
          :aria-describedby="!canAfford ? `reason-${factory.id}` : undefined"
          class="px-4 py-1 rounded font-bold transition-colors"
          :class="{
            'bg-terminal-green text-terminal-bg hover:bg-green-600': canAfford,
            'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canAfford
          }"
        >
          Buy
        </button>
        <span
          v-if="!canAfford"
          :id="`reason-${factory.id}`"
          class="sr-only"
        >
          Cannot afford. Need {{ qsosNeeded.toString() }} more QSOs.
        </span>
      </div>
    </div>
  </div>
</template>
