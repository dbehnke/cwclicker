<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { UPGRADES } from '../constants/upgrades'
import { formatNumber } from '../utils/format'

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

/**
 * Can afford the next upgrade?
 */
const canAffordUpgrade = computed(() => {
  if (!nextUpgrade.value) return false
  return store.qsos >= BigInt(nextUpgrade.value.baseCost)
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
const showAllPurchased = ref(false)

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
  <div class="border-2 border-terminal-green bg-terminal-bg p-4 rounded">
    <!-- Factory header with icon -->
    <div class="flex justify-between items-start mb-2">
      <h3 class="text-xl font-bold text-terminal-green">{{ factory.icon }} {{ factory.name }}</h3>
      <span class="text-sm text-terminal-amber">[Tier {{ factory.tier }}]</span>
    </div>

    <p class="text-sm text-gray-400 mb-3">{{ factory.description }}</p>

    <!-- Production info -->
    <div class="flex justify-between items-center mb-4">
      <div class="text-terminal-green">
        <span v-if="ownedCount > 0" class="text-terminal-amber font-semibold mr-4">
          {{ actualOutput.toFixed(1) }}/sec
        </span>
        <span class="text-sm text-gray-500">
          ({{ effectivePerFactoryRate.toFixed(1) }}/sec each
          <span
            v-if="effectivePerFactoryRate > factory.qsosPerSecond"
            class="text-terminal-amber ml-1"
          >
            ×{{ (effectivePerFactoryRate / factory.qsosPerSecond).toFixed(0) }}
          </span>
          )
        </span>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-terminal-green">{{ formatNumber(currentCost) }}</span>
        <span v-if="ownedCount > 0" class="text-terminal-amber text-sm">
          Owned: {{ ownedCount }}
        </span>
        <button
          @click="handleBuy"
          :disabled="!canAfford"
          class="px-4 py-1 rounded font-bold transition-colors"
          :class="{
            'bg-terminal-green text-terminal-bg hover:bg-green-600': canAfford,
            'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canAfford,
          }"
        >
          Buy
        </button>
      </div>
    </div>

    <!-- Multiplier badges -->
    <div v-if="currentMultiplier > 1 || nextUpgrade" class="mb-4">
      <div class="flex items-center gap-1 text-sm">
        <span class="text-gray-500">Upgrades:</span>
        <span
          v-for="mult in [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]"
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
      <div class="text-xs text-terminal-amber uppercase mb-1">Next Upgrade</div>
      <div class="flex justify-between items-center">
        <div>
          <span class="text-terminal-green font-bold"
            >{{ nextUpgrade.icon }} {{ nextUpgrade.name }}</span
          >
          <span class="text-sm text-gray-400 ml-2">
            {{ formatNumber(currentMultiplier) }}x → {{ formatNumber(currentMultiplier * 2) }}x
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-terminal-green">{{ formatNumber(nextUpgrade.baseCost) }}</span>
          <button
            @click="handleBuyUpgrade"
            :disabled="!canAffordUpgrade"
            class="px-3 py-1 rounded font-bold text-sm"
            :class="{
              'bg-terminal-amber text-terminal-bg hover:bg-amber-600': canAffordUpgrade,
              'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canAffordUpgrade,
            }"
          >
            BUY
          </button>
        </div>
      </div>
    </div>

    <!-- Latest Purchased Section -->
    <div v-if="purchasedCount > 0">
      <div class="border border-gray-600 rounded p-3">
        <div
          @click="showAllPurchased = !showAllPurchased"
          class="flex justify-between items-center cursor-pointer"
        >
          <div>
            <span class="text-xs text-gray-400 uppercase">Latest Purchased</span>
            <span class="text-xs text-gray-500 ml-2">({{ purchasedCount }})</span>
          </div>
          <span class="text-gray-500">{{ showAllPurchased ? '▲' : '▼' }}</span>
        </div>

        <!-- Latest (always visible) -->
        <div class="mt-2 text-terminal-green">
          ✓ {{ purchasedUpgrades[0].icon }} {{ purchasedUpgrades[0].name }}
          <span class="text-gray-400">
            {{ formatNumber(currentMultiplier / 2) }}x → {{ formatNumber(currentMultiplier) }}x
          </span>
        </div>

        <!-- All purchased (expandable) -->
        <div
          v-if="showAllPurchased && purchasedCount > 1"
          class="mt-2 pl-4 border-l-2 border-gray-600"
        >
          <div
            v-for="(upgrade, index) in purchasedUpgrades.slice(1)"
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
