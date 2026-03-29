<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { formatNumber, formatRate } from '../utils/format'

/**
 * Props for the FactoryCard component.
 */
const props = defineProps({
  factory: {
    type: Object,
    required: true,
  },
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

const isUnlocked = computed(() => {
  if (typeof store.isFactoryUnlocked !== 'function') {
    return true
  }

  return store.isFactoryUnlocked(props.factory.id)
})

const canBuy = computed(() => canAfford.value && isUnlocked.value)

/**
 * Gets the number of factories currently owned.
 */
const ownedCount = computed(() => {
  return store.factoryCounts[props.factory.id] || 0
})

const runQsos = computed(() => {
  return typeof store.qsosThisRun === 'bigint' ? store.qsosThisRun : 0n
})

const qsosToUnlock = computed(() => {
  const threshold = typeof props.factory.unlockThreshold === 'bigint' ? props.factory.unlockThreshold : 0n
  const remaining = threshold - runQsos.value
  return remaining > 0n ? remaining : 0n
})

const displayName = computed(() => (isUnlocked.value ? props.factory.name : '???'))

const displayDescription = computed(() => {
  if (isUnlocked.value) {
    return props.factory.description
  }

  return `Earn ${formatNumber(qsosToUnlock.value)} more QSOs this run to unlock.`
})

/**
 * Calculates the actual production rate for this factory type.
 * Includes all multipliers: upgrades, prestige, and lottery.
 */
const actualOutput = computed(() => {
  const count = ownedCount.value
  if (count === 0) return 0
  const upgradeMultiplier = store.getUpgradeMultiplier(props.factory.id)
  const prestigeMultiplier = store.prestigeMultiplier
  const lotteryMultiplier = store.getLotteryMultiplier(props.factory.id)
  return (
    props.factory.qsosPerSecond * count * upgradeMultiplier * prestigeMultiplier * lotteryMultiplier
  )
})

/**
 * Calculates the effective per-factory rate including all multipliers.
 */
const effectivePerFactoryRate = computed(() => {
  const upgradeMultiplier = store.getUpgradeMultiplier(props.factory.id)
  const prestigeMultiplier = store.prestigeMultiplier
  const lotteryMultiplier = store.getLotteryMultiplier(props.factory.id)
  return props.factory.qsosPerSecond * upgradeMultiplier * prestigeMultiplier * lotteryMultiplier
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
  if (canBuy.value) {
    emit('buy', { factory: props.factory, count: 1 })
  }
}

</script>

<template>
  <div class="rounded border-2 border-terminal-green bg-terminal-bg p-4" data-testid="factory-card-root">
    <!-- Factory header with icon -->
    <div class="mb-3 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xl">{{ factory.icon }}</span>
          <span
            v-if="ownedCount > 0"
            class="rounded-full border border-terminal-amber/50 px-2 py-0.5 text-xs font-semibold text-terminal-amber"
          >
            Owned {{ ownedCount }}
          </span>
        </div>
        <h3 class="mt-1 text-xl font-bold text-terminal-green">{{ displayName }}</h3>
      </div>
      <span class="text-sm text-terminal-amber">[Tier {{ factory.tier }}]</span>
    </div>

    <p class="text-sm text-gray-400 mb-3">{{ displayDescription }}</p>

    <!-- Production info -->
    <div class="mb-4 space-y-1" data-testid="factory-production">
      <div class="text-terminal-amber font-semibold">{{ formatRate(actualOutput) }}/sec</div>
      <div class="text-sm text-gray-500">
        ({{ formatRate(effectivePerFactoryRate) }}/sec × {{ ownedCount }})
      </div>
    </div>

    <div class="mb-4 flex items-center justify-between gap-3" data-testid="factory-action-row">
      <span class="text-terminal-green">{{ formatNumber(currentCost) }}</span>
      <button
        @click="handleBuy"
        :disabled="!canBuy"
        class="rounded px-4 py-1 font-bold transition-colors touch-manipulation"
        :class="{
          'bg-terminal-green text-terminal-bg hover:brightness-110 active:brightness-95': canBuy,
          'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canBuy,
        }"
      >
        Buy
      </button>
    </div>
  </div>
</template>
