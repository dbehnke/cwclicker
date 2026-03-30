<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { UPGRADES } from '../constants/upgrades'
import { formatNumber, formatRate } from '../utils/format'
import IconRenderer from './IconRenderer.vue'

/**
 * Props for the FactoryCard component.
 */
const props = defineProps({
  factory: {
    type: Object,
    required: true,
  },
  isMystery: {
    type: Boolean,
    default: false,
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
  const threshold =
    typeof props.factory.unlockThreshold === 'bigint' ? props.factory.unlockThreshold : 0n
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

const upgradeProgressText = computed(() => {
  const purchased =
    store.purchasedUpgrades instanceof Set
      ? store.purchasedUpgrades
      : new Set(store.purchasedUpgrades || [])

  const factoryUpgrades = UPGRADES.filter(upgrade => upgrade.factoryId === props.factory.id)
  const purchasedUpgrades = factoryUpgrades.filter(upgrade => purchased.has(upgrade.id))

  if (purchasedUpgrades.length === 0) {
    return ''
  }

  const currentUpgrade = purchasedUpgrades[purchasedUpgrades.length - 1]
  const currentIndex = factoryUpgrades.findIndex(upgrade => upgrade.id === currentUpgrade.id)
  const nextUpgrade = factoryUpgrades[currentIndex + 1]

  if (!nextUpgrade) {
    return `x${currentUpgrade.multiplier} - ${currentUpgrade.name} - maxed`
  }

  return `x${currentUpgrade.multiplier} - ${currentUpgrade.name} - next at ${nextUpgrade.threshold}`
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
  <div
    class="group relative flex flex-col items-center overflow-hidden rounded border-2 border-terminal-green bg-terminal-bg p-4 transition-all hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
    :class="{ 'opacity-50 grayscale': isMystery }"
    data-testid="factory-card-root"
  >
    <!-- Tier Label (Top Right) -->
    <span class="absolute right-2 top-2 text-[10px] uppercase tracking-wider text-terminal-amber/60">
      Tier {{ factory.tier }}
    </span>

    <!-- Large Centered Icon -->
    <div class="mb-4 mt-2 flex h-24 w-24 items-center justify-center">
      <IconRenderer
        :icon="factory.icon"
        type="factory"
        fallback="Radio"
        size="80"
        class="transition-transform group-hover:scale-110"
      />
    </div>

    <!-- Factory Info -->
    <div class="mb-4 flex flex-col items-center text-center">
      <h3 class="text-lg font-bold text-terminal-green">{{ displayName }}</h3>
      <div v-if="ownedCount > 0" class="mt-1 text-xs font-semibold text-terminal-amber">
        Owned {{ ownedCount }}
      </div>
    </div>

    <!-- Production Overlay (Desktop Hover) -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center justify-center bg-terminal-bg/90 p-4 text-center opacity-0 transition-opacity duration-300 lg:group-hover:opacity-100"
      data-testid="factory-production"
    >
      <p class="mb-2 text-xs leading-tight text-gray-400">{{ displayDescription }}</p>
      <div class="font-bold text-terminal-amber">{{ formatRate(actualOutput) }}/sec</div>
      <div v-if="ownedCount > 0" class="text-[10px] text-gray-500">
        ({{ formatRate(effectivePerFactoryRate) }}/sec × {{ ownedCount }})
      </div>
      <div v-if="upgradeProgressText" class="mt-2 text-[10px] text-terminal-amber">
        {{ upgradeProgressText }}
      </div>
    </div>

    <!-- Spacer to push action row to bottom -->
    <div class="flex-grow"></div>

    <!-- Action Row (Bottom) -->
    <div
      class="mt-auto flex w-full flex-col items-center gap-2 pt-4 border-t border-terminal-green/20"
      data-testid="factory-action-row"
    >
      <span class="text-sm font-bold text-terminal-green">{{ formatNumber(currentCost) }}</span>
      <button
        @click="handleBuy"
        :disabled="!canBuy || isMystery"
        class="w-full rounded px-4 py-2 text-sm font-bold transition-all touch-manipulation"
        :class="{
          'bg-terminal-green text-terminal-bg hover:brightness-110 active:scale-95':
            canBuy && !isMystery,
          'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canBuy || isMystery,
        }"
      >
        Buy
      </button>
    </div>
  </div>
</template>
