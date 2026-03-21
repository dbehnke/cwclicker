<script setup>
import { computed } from 'vue';
import { useGameStore } from '../stores/game';

const store = useGameStore();

/**
 * Get all available upgrades across all owned factories
 */
const availableUpgrades = computed(() => {
  const upgrades = [];
  
  for (const [factoryId, count] of Object.entries(store.factoryCounts)) {
    if (count > 0) {
      const factoryUpgrades = store.getAvailableUpgrades(factoryId);
      upgrades.push(...factoryUpgrades);
    }
  }
  
  // Sort by threshold (lowest first, so easier upgrades appear first)
  return upgrades.sort((a, b) => a.threshold - b.threshold);
});

/**
 * Check if user can afford an upgrade
 */
function canAffordUpgrade(upgrade) {
  return store.qsos >= BigInt(upgrade.baseCost);
}

/**
 * Handle buying an upgrade
 */
function handleBuyUpgrade(upgrade) {
  if (canAffordUpgrade(upgrade)) {
    store.buyUpgrade(upgrade.id);
  }
}

/**
 * Format cost for display
 */
function formatCost(cost) {
  return cost.toLocaleString();
}
</script>

<template>
  <div v-if="availableUpgrades.length > 0" class="space-y-3">
    <div class="text-lg font-bold text-terminal-green border-b border-terminal-green pb-2 mb-3">
      Upgrades Available ({{ availableUpgrades.length }})
    </div>
    
    <div class="grid gap-3">
      <div
        v-for="upgrade in availableUpgrades"
        :key="upgrade.id"
        class="border-2 bg-terminal-bg p-3 rounded transition-all"
        :class="{
          'border-terminal-green': canAffordUpgrade(upgrade),
          'border-gray-600 opacity-75': !canAffordUpgrade(upgrade)
        }"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-terminal-amber font-bold">{{ upgrade.name }}</span>
              <span class="text-xs text-gray-500">(for {{ upgrade.factoryId }})</span>
            </div>
            
            <p class="text-sm text-gray-400 mb-2">{{ upgrade.description }}</p>
            
            <div class="flex items-center gap-4 text-sm">
              <span class="text-terminal-green">
                Cost: {{ formatCost(upgrade.baseCost) }} QSOs
              </span>
              <span class="text-terminal-amber">
                Effect: {{ upgrade.multiplier }}× output
              </span>
              <span class="text-gray-500">
                Requires: {{ upgrade.threshold }} owned
              </span>
            </div>
          </div>

          <button
            @click="handleBuyUpgrade(upgrade)"
            :disabled="!canAffordUpgrade(upgrade)"
            class="ml-4 px-4 py-2 rounded font-bold transition-colors"
            :class="{
              'bg-terminal-green text-terminal-bg hover:bg-green-600': canAffordUpgrade(upgrade),
              'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canAffordUpgrade(upgrade)
            }"
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  </div>
</template>