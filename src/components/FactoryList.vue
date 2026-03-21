<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { FACTORIES } from '../constants/factories'
import FactoryCard from './FactoryCard.vue'
import MultiBuyPanel from './MultiBuyPanel.vue'

const store = useGameStore()

const availableFactories = computed(() => {
  return FACTORIES.filter(f => f.tier <= store.licenseLevel)
})

const totalFactoryCount = computed(() => {
  return Object.values(store.factoryCounts).reduce((sum, count) => sum + count, 0)
})

const multiBuyAvailable = computed(() => totalFactoryCount.value >= 10)

const totalQSOsPerSecond = computed(() => {
  // Access lottery state to trigger reactivity when bonus/solar storm changes
  const lotteryState = store.lotteryState
  return store.getTotalQSOsPerSecond()
})

const handleBuy = (event) => {
  const { factory, count } = event
  store.buyFactory(factory.id, count)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header with title and QSOs/sec -->
    <div class="flex justify-between items-center px-2">
      <h2 class="text-2xl font-bold text-terminal-green">Factories</h2>
      <span class="text-terminal-green">QSOs/sec: {{ totalQSOsPerSecond }}</span>
    </div>

    <!-- Factory cards or empty state -->
    <div v-if="availableFactories.length > 0" class="space-y-4">
      <FactoryCard
        v-for="factory in availableFactories"
        :key="factory.id"
        :factory="factory"
        @buy="handleBuy"
      />
    </div>
    <div v-else class="border-2 border-terminal-green bg-terminal-bg p-4 rounded text-center">
      <p class="text-gray-400">No factories available</p>
      <p class="text-sm text-gray-500 mt-2">Upgrade your license to unlock factories</p>
    </div>

    <!-- MultiBuyPanel for each factory (shown when 10+ factories owned) -->
    <div v-if="multiBuyAvailable && availableFactories.length > 0" class="space-y-2 mt-4">
      <MultiBuyPanel
        v-for="factory in availableFactories"
        :key="`multibuy-${factory.id}`"
        :factory="factory"
        :multi-buy-available="multiBuyAvailable"
        @buy="handleBuy"
      />
    </div>
  </div>
</template>
