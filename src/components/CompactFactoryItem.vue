<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { formatNumber } from '../utils/format'
import IconRenderer from './IconRenderer.vue'

const props = defineProps({
  factory: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['buy', 'toggle-details'])

const store = useGameStore()

const ownedCount = computed(() => {
  return store.factoryCounts[props.factory.id] || 0
})

const currentCost = computed(() => {
  return store.getFactoryCost(props.factory.id, ownedCount.value)
})

const canAfford = computed(() => {
  return store.qsos >= currentCost.value
})

const isUnlocked = computed(() => {
  if (typeof store.isFactoryUnlocked !== 'function') {
    return true
  }

  return store.isFactoryUnlocked(props.factory.id)
})

const canBuy = computed(() => {
  return canAfford.value && isUnlocked.value
})

function handleClick() {
  if (!canBuy.value) {
    return
  }

  emit('buy', { factory: props.factory, count: 1 })
}

function handleToggleDetails() {
  emit('toggle-details', props.factory)
}
</script>

<template>
  <div data-testid="compact-factory-row" class="flex w-full items-center gap-2">
    <button
      type="button"
      class="flex min-w-0 flex-1 items-center gap-3 rounded border border-terminal-green/40 bg-terminal-bg px-3 py-2 text-left transition-all"
      :class="{
        'cursor-pointer hover:border-terminal-green hover:bg-terminal-green/10': canBuy,
        'cursor-not-allowed opacity-50 grayscale': !canBuy,
      }"
      :disabled="!canBuy"
      data-testid="compact-factory-item"
      @click="handleClick"
    >
      <div class="flex h-12 w-12 shrink-0 items-center justify-center">
        <IconRenderer :icon="factory.icon" type="factory" fallback="Radio" :size="40" />
      </div>

      <div class="min-w-0 flex-1">
        <div
          class="truncate text-base font-bold text-terminal-green"
          data-testid="compact-factory-title"
        >
          {{ factory.name }}
        </div>
        <div class="text-sm text-terminal-amber" data-testid="compact-factory-cost">
          {{ formatNumber(currentCost) }}
        </div>
      </div>

      <div
        class="text-right text-xl font-bold text-terminal-green"
        data-testid="compact-factory-owned"
      >
        {{ ownedCount }}
      </div>
    </button>

    <button
      type="button"
      class="rounded border border-terminal-green/40 px-3 py-2 text-xs font-bold uppercase tracking-wide text-terminal-amber transition-all hover:border-terminal-green hover:bg-terminal-green/10"
      data-testid="compact-factory-details-toggle"
      @click="handleToggleDetails"
    >
      Details
    </button>
  </div>
</template>
