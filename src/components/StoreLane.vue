<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { FACTORIES } from '../constants/factories'
import { UPGRADES } from '../constants/upgrades'
import { formatNumber, formatRate } from '../utils/format'
import UpgradeRail from './UpgradeRail.vue'
import CompactFactoryItem from './CompactFactoryItem.vue'

const store = useGameStore()
const hoveredFactory = ref(null)

const unlockedFactories = computed(() => {
  if (typeof store.isFactoryUnlocked === 'function') {
    return FACTORIES.filter(factory => store.isFactoryUnlocked(factory.id))
  }

  return []
})

function handleBuy(event) {
  if (!event || typeof event !== 'object') {
    return
  }

  const { factory, count } = event

  if (!factory || typeof factory !== 'object' || typeof factory.id !== 'string') {
    return
  }

  if (typeof store.buyFactory !== 'function') {
    return
  }

  const success = store.buyFactory(factory.id, count)

  if (success && typeof store.save === 'function') {
    store.save()
  }
}

function handleHoverStart(factory) {
  hoveredFactory.value = factory
}

function handleHoverEnd() {
  hoveredFactory.value = null
}

const hoveredOwned = computed(() => {
  if (!hoveredFactory.value) {
    return 0
  }
  return store.factoryCounts[hoveredFactory.value.id] || 0
})

const hoveredPerFactoryRate = computed(() => {
  if (!hoveredFactory.value) {
    return 0
  }
  const upgradeMultiplier = store.getUpgradeMultiplier(hoveredFactory.value.id)
  const prestigeMultiplier = store.prestigeMultiplier
  const lotteryMultiplier = store.getLotteryMultiplier(hoveredFactory.value.id)
  return (
    hoveredFactory.value.qsosPerSecond * upgradeMultiplier * prestigeMultiplier * lotteryMultiplier
  )
})

const hoveredTotalRate = computed(() => {
  if (!hoveredFactory.value) {
    return 0
  }
  return hoveredPerFactoryRate.value * hoveredOwned.value
})

const hoveredSharePercent = computed(() => {
  const total = store.getTotalQSOsPerSecond()
  if (!hoveredFactory.value || total <= 0) {
    return 0
  }
  return (hoveredTotalRate.value / total) * 100
})

const hoveredProducedTotal = computed(() => {
  if (!hoveredFactory.value || !store.factoryProductionTotals) {
    return 0n
  }
  return store.factoryProductionTotals[hoveredFactory.value.id] || 0n
})
</script>

<template>
  <section
    class="flex h-full flex-col gap-4 overflow-y-auto px-3 py-3 sm:px-4"
    data-testid="store-lane"
  >
    <div
      data-testid="store-lane-header"
      class="sticky top-0 z-20 bg-terminal-bg/95 backdrop-blur-sm py-2"
    >
      <h2 class="text-2xl font-bold text-terminal-green">Store</h2>
    </div>

    <aside
      v-if="hoveredFactory"
      data-testid="store-hover-details"
      class="pointer-events-none hidden lg:block rounded border border-terminal-green/70 bg-terminal-bg/95 p-3 text-sm"
    >
      <h3 class="text-lg font-bold text-terminal-green">{{ hoveredFactory.name }}</h3>
      <p class="mt-1 text-xs text-terminal-amber">Owned: {{ hoveredOwned }}</p>
      <p class="mt-2 text-gray-400 italic">"{{ hoveredFactory.description }}"</p>

      <ul class="mt-3 space-y-1 text-gray-300">
        <li>• Each produces {{ formatRate(hoveredPerFactoryRate) }} QSOs/sec</li>
        <li>
          • {{ hoveredOwned }} producing {{ formatRate(hoveredTotalRate) }} QSOs/sec ({{
            hoveredSharePercent.toFixed(1)
          }}% of total)
        </li>
        <li>• {{ formatNumber(hoveredProducedTotal) }} QSOs produced so far</li>
      </ul>
    </aside>

    <div class="shrink-0" data-testid="store-lane-upgrades">
      <UpgradeRail :upgrades="UPGRADES" :factories="FACTORIES" />
    </div>

    <div class="flex min-h-0 flex-1 flex-col gap-3" data-testid="store-lane-factories">
      <CompactFactoryItem
        v-for="factory in unlockedFactories"
        :key="factory.id"
        :factory="factory"
        @buy="handleBuy"
        @hover-start="handleHoverStart"
        @hover-end="handleHoverEnd"
      />
    </div>
  </section>
</template>
