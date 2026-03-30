<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { FACTORIES } from '../constants/factories'
import { UPGRADES } from '../constants/upgrades'
import UpgradeRail from './UpgradeRail.vue'
import CompactFactoryItem from './CompactFactoryItem.vue'

const store = useGameStore()

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
</script>

<template>
  <section
    class="flex h-full flex-col gap-4 overflow-y-auto px-3 py-3 sm:px-4"
    data-testid="store-lane"
  >
    <div class="shrink-0" data-testid="store-lane-upgrades">
      <UpgradeRail :upgrades="UPGRADES" :factories="FACTORIES" />
    </div>

    <div class="flex min-h-0 flex-1 flex-col gap-3" data-testid="store-lane-factories">
      <CompactFactoryItem
        v-for="factory in unlockedFactories"
        :key="factory.id"
        :factory="factory"
        @buy="handleBuy"
      />
    </div>
  </section>
</template>
