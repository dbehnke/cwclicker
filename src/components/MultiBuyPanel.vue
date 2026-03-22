<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const props = defineProps({
  multiBuyAvailable: {
    type: Boolean,
    required: true,
  },
  factory: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['buy'])

const store = useGameStore()

const cost1 = computed(() => {
  if (!props.factory) return 0n
  const owned = store.factoryCounts[props.factory.id] || 0
  return store.getFactoryCost(props.factory.id, owned)
})

const cost5 = computed(() => {
  if (!props.factory) return 0n
  return store.getBulkCost(props.factory.id, 5)
})

const cost10 = computed(() => {
  if (!props.factory) return 0n
  return store.getBulkCost(props.factory.id, 10)
})

const canAfford1 = computed(() => store.qsos >= cost1.value)
const canAfford5 = computed(() => store.qsos >= cost5.value)
const canAfford10 = computed(() => store.qsos >= cost10.value)

const handleBuy = count => {
  emit('buy', { factory: props.factory, count })
}

const formatCost = cost => {
  if (typeof cost === 'bigint') {
    return cost.toString()
  }
  return Math.floor(cost).toString()
}
</script>

<template>
  <div
    v-if="multiBuyAvailable && factory"
    class="border-2 border-terminal-green bg-terminal-bg p-3 rounded"
  >
    <div class="text-sm text-gray-400 mb-2">
      Bulk Purchase: <span class="text-terminal-green font-semibold">{{ factory.name }}</span>
    </div>
    <div class="flex gap-2">
      <button
        @click="handleBuy(1)"
        :disabled="!canAfford1"
        class="flex-1 px-2 py-1 rounded text-sm font-bold transition-colors"
        :class="{
          'bg-terminal-green text-terminal-bg hover:bg-green-600': canAfford1,
          'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canAfford1,
        }"
      >
        ×1: {{ formatCost(cost1) }}
      </button>
      <button
        @click="handleBuy(5)"
        :disabled="!canAfford5"
        class="flex-1 px-2 py-1 rounded text-sm font-bold transition-colors"
        :class="{
          'bg-terminal-green text-terminal-bg hover:bg-green-600': canAfford5,
          'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canAfford5,
        }"
      >
        ×5: {{ formatCost(cost5) }}
      </button>
      <button
        @click="handleBuy(10)"
        :disabled="!canAfford10"
        class="flex-1 px-2 py-1 rounded text-sm font-bold transition-colors"
        :class="{
          'bg-terminal-green text-terminal-bg hover:bg-green-600': canAfford10,
          'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canAfford10,
        }"
      >
        ×10: {{ formatCost(cost10) }}
      </button>
    </div>
  </div>
</template>
