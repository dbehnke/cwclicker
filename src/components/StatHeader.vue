<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { formatNumber } from '../utils/format'

/**
 * Header component displaying game title and current QSO count.
 */
const store = useGameStore()

const prestigeBonusPercent = computed(() => `+${Math.round((Number(store.prestigeMultiplier) - 1) * 100)}%`)

const nextPrestigeThreshold = computed(() => {
  const nextLevel = store.prestigeLevel + 1n
  return 1_000_000_000n * nextLevel * nextLevel * nextLevel
})

const prestigeProgress = computed(() => {
  const current = Number(store.totalQsosEarned)
  const next = Number(nextPrestigeThreshold.value)
  if (!next || !Number.isFinite(current)) {
    return 0
  }

  return Math.min(1, Math.max(0, current / next))
})
</script>

<template>
  <header class="mb-8 border-b border-terminal-green pb-4 space-y-2">
    <div class="flex justify-between gap-4">
      <h1 class="text-2xl font-bold">CW CLICKER</h1>
      <div class="text-xl">QSOs: {{ formatNumber(store.qsos) }}</div>
    </div>
    <div class="rounded border border-terminal-green/60 bg-terminal-bg/60 px-3 py-2 text-sm space-y-1">
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-terminal-green">
        <span>Prestige Level {{ store.prestigeLevel }}</span>
        <span>{{ prestigeBonusPercent }} bonus</span>
        <span>Prestige Points: {{ store.prestigePoints }}</span>
      </div>
      <div class="space-y-1 text-gray-400">
        <div class="h-2 overflow-hidden rounded bg-gray-800">
          <div
            class="h-full bg-terminal-green transition-all"
            :style="{ width: `${prestigeProgress * 100}%` }"
          />
        </div>
        <div>Next level: {{ formatNumber(nextPrestigeThreshold) }} QSOs</div>
      </div>
    </div>
  </header>
</template>
