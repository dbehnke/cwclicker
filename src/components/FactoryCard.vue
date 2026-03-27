<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { UPGRADES } from '../constants/upgrades'
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

/**
 * Gets the number of factories currently owned.
 */
const ownedCount = computed(() => {
  return store.factoryCounts[props.factory.id] || 0
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
  if (canAfford.value) {
    emit('buy', { factory: props.factory, count: 1 })
  }
}

/**
 * Get next available upgrade (first one that's available but not purchased)
 */
const nextUpgrade = computed(() => {
  const available = store.getAvailableUpgrades(props.factory.id)
  return available.length > 0 ? available[0] : null
})

/**
 * Get all purchased upgrades for this factory (most recent first)
 */
const purchasedUpgrades = computed(() => {
  const purchased = store.purchasedUpgrades
  return UPGRADES.filter(u => u.factoryId === props.factory.id && purchased.has(u.id)).reverse()
})

/**
 * Current multiplier for this factory
 */
const currentMultiplier = computed(() => {
  return store.getUpgradeMultiplier(props.factory.id)
})

const upgradeBadgeLevels = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]

const upgradeProgressSummary = computed(() => {
  const activeLevel = upgradeBadgeLevels.reduce((highest, level) => {
    return currentMultiplier.value >= level ? level : highest
  }, 1)

  const remainingCount = upgradeBadgeLevels.filter(level => level > currentMultiplier.value).length

  if (remainingCount === 0) {
    return `${activeLevel}x active`
  }

  return `${activeLevel}x active • ${remainingCount} more`
})

/**
 * Can afford the next upgrade?
 */
const canAffordUpgrade = computed(() => {
  if (!nextUpgrade.value) return false
  return store.qsos >= nextUpgrade.value.baseCost
})

/**
 * Number of purchased upgrades
 */
const purchasedCount = computed(() => {
  return purchasedUpgrades.value.length
})

/**
 * Show expand/collapse for purchased list
 */
const showPurchasedUpgrades = ref(false)

/**
 * Show expand/collapse for next upgrade teaser
 */
const showUpgradeDetails = ref(false)

/**
 * Handle buying an upgrade
 */
function handleBuyUpgrade() {
  if (nextUpgrade.value && canAffordUpgrade.value) {
    store.buyUpgrade(nextUpgrade.value.id)
    store.save()
  }
}
</script>

<template>
  <div class="rounded border-2 border-terminal-green bg-terminal-bg p-4">
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
        <h3 class="mt-1 text-xl font-bold text-terminal-green">{{ factory.name }}</h3>
      </div>
      <span class="text-sm text-terminal-amber">[Tier {{ factory.tier }}]</span>
    </div>

    <p class="text-sm text-gray-400 mb-3">{{ factory.description }}</p>

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
        :disabled="!canAfford"
        class="rounded px-4 py-1 font-bold transition-colors touch-manipulation"
        :class="{
          'bg-terminal-green text-terminal-bg hover:brightness-110 active:brightness-95': canAfford,
          'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canAfford,
        }"
      >
        Buy
      </button>
    </div>

    <!-- Multiplier badges -->
    <div
      v-if="currentMultiplier > 1 || nextUpgrade"
      class="mb-4 sm:hidden"
      data-testid="upgrade-summary-mobile"
    >
      <div class="text-xs text-gray-500">
        {{ upgradeProgressSummary }}
      </div>
    </div>

    <div
      v-if="currentMultiplier > 1 || nextUpgrade"
      class="mb-4 hidden sm:block"
      data-testid="upgrade-badge-row"
    >
      <div class="flex items-center gap-1 text-sm">
        <span class="text-gray-500">Upgrades:</span>
        <span
          v-for="mult in upgradeBadgeLevels"
          :key="mult"
          class="px-2 py-0.5 rounded text-xs"
          :class="{
            'bg-terminal-green text-terminal-bg': currentMultiplier >= mult,
            'bg-gray-700 text-gray-500': currentMultiplier < mult,
          }"
        >
          {{ mult }}x
        </span>
      </div>
    </div>

    <!-- Next Upgrade Section -->
    <div v-if="nextUpgrade" class="border border-terminal-green/50 rounded p-3 mb-3">
      <div class="mb-2 flex items-start justify-between gap-3">
        <div>
          <div class="text-xs uppercase text-terminal-amber">Next Upgrade</div>
          <div class="mt-1 font-bold text-terminal-green">
            {{ nextUpgrade.icon }} {{ nextUpgrade.name }}
          </div>
        </div>
        <div class="text-right">
          <div class="text-terminal-green">{{ formatNumber(nextUpgrade.baseCost) }}</div>
          <button
            @click="handleBuyUpgrade"
            :disabled="!canAffordUpgrade"
            class="mt-1 rounded px-3 py-1 text-sm font-bold touch-manipulation"
            :class="{
              'bg-terminal-amber text-terminal-bg hover:brightness-110 active:brightness-95':
                canAffordUpgrade,
              'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canAffordUpgrade,
            }"
          >
            BUY
          </button>
        </div>
      </div>

      <p class="text-sm text-gray-400">
        {{ nextUpgrade.description }}
      </p>

      <div class="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
        <span v-if="showUpgradeDetails">Unlocks at {{ nextUpgrade.threshold }} factories.</span>
        <button
          type="button"
          data-testid="upgrade-details-toggle"
          class="uppercase tracking-wide text-terminal-amber touch-manipulation"
          :aria-expanded="showUpgradeDetails"
          @click="showUpgradeDetails = !showUpgradeDetails"
        >
          {{ showUpgradeDetails ? 'Hide details' : 'Show details' }}
        </button>
      </div>
    </div>

    <!-- Latest Purchased Section -->
    <div v-if="purchasedCount > 0">
      <div class="border border-gray-600 rounded p-3">
        <button
          type="button"
          @click="showPurchasedUpgrades = !showPurchasedUpgrades"
          data-testid="purchased-upgrades-toggle"
          :aria-expanded="showPurchasedUpgrades"
          class="flex w-full items-center justify-between text-left"
        >
          <div>
            <span class="text-xs text-gray-400 uppercase">Purchased Upgrades</span>
            <span class="text-xs text-gray-500 ml-2">({{ purchasedCount }})</span>
          </div>
          <span class="text-gray-500">{{ showPurchasedUpgrades ? '▲' : '▼' }}</span>
        </button>

        <!-- All purchased (expandable) -->
        <div v-if="showPurchasedUpgrades" class="mt-2 pl-4 border-l-2 border-gray-600">
          <div
            v-for="upgrade in purchasedUpgrades"
            :key="upgrade.id"
            class="text-terminal-green text-sm py-1"
          >
            • {{ upgrade.icon }} {{ upgrade.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- No upgrades yet -->
    <div
      v-if="ownedCount > 0 && purchasedCount === 0 && !nextUpgrade"
      class="text-xs text-gray-500 italic"
    >
      No upgrades available yet. Buy more factories to unlock upgrades.
    </div>
  </div>
</template>
