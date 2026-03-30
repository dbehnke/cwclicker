<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { FACTORIES } from '../constants/factories'
import FactoryCard from './FactoryCard.vue'

const store = useGameStore()

const availableFactories = computed(() => {
  return FACTORIES.filter(factory => {
    const owned = store.factoryCounts[factory.id] || 0
    if (owned <= 0) {
      return false
    }

    if (typeof store.isFactoryUnlocked === 'function') {
      return store.isFactoryUnlocked(factory.id)
    }

    return true
  })
})

const totalQSOsPerSecond = computed(() => {
  // Access lottery state to trigger reactivity when bonus/solar storm changes
  const lotteryState = store.lotteryState
  return store.getTotalQSOsPerSecond()
})
</script>

<template>
  <div class="space-y-5 px-2 sm:px-4 lg:px-0">
    <!-- Header with title and QSOs/sec -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-2xl font-bold text-terminal-green">Factories</h2>
      <span class="text-terminal-green">QSOs/sec: {{ totalQSOsPerSecond }}</span>
    </div>

    <!-- Factory cards or empty state -->
    <div
      v-if="availableFactories.length > 0"
      class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <FactoryCard
        v-for="factory in availableFactories"
        :key="factory.id"
        :factory="factory"
        read-only
      />
    </div>
    <div v-else class="border-2 border-terminal-green bg-terminal-bg p-4 rounded text-center">
      <p class="text-gray-400">No factories available</p>
      <p class="text-sm text-gray-500 mt-2">Upgrade your license to unlock factories</p>
    </div>
  </div>
</template>
