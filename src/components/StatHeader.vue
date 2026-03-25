<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { prestigeThresholdForLevel } from '../constants/game'
import { formatNumber } from '../utils/format'

/**
 * Header component displaying game title and current QSO count.
 */
const store = useGameStore()

const prestigeBonusPercent = computed(() => `+${Math.round((Number(store.prestigeMultiplier) - 1) * 100)}%`)

const currentPrestigeThreshold = computed(() => {
  return prestigeThresholdForLevel(store.eligiblePrestigeLevel)
})

const nextPrestigeThreshold = computed(() => {
  return prestigeThresholdForLevel(store.eligiblePrestigeLevel + 1n)
})

const prestigeProgress = computed(() => {
  const current = store.totalQsosEarned
  const currentThreshold = currentPrestigeThreshold.value
  const nextThreshold = nextPrestigeThreshold.value

  if (
    typeof current !== 'bigint' ||
    nextThreshold <= currentThreshold ||
    nextThreshold === 0n
  ) {
    return 0
  }

  if (current <= currentThreshold) {
    return 0
  }

  if (current >= nextThreshold) {
    return 1
  }

  const SCALE = 10_000n
  const relative = current - currentThreshold
  const range = nextThreshold - currentThreshold
  const progress = (relative * SCALE) / range

  return Number(progress) / Number(SCALE)
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
        <span v-if="store.eligiblePrestigeLevel > store.prestigeLevel">
          Eligible for {{ store.eligiblePrestigeLevel }}
        </span>
        <span>{{ prestigeBonusPercent }} bonus</span>
        <span>Prestige Points: {{ formatNumber(store.prestigePoints) }}</span>
      </div>
      <div class="space-y-1 text-gray-400">
        <div
          class="h-2 overflow-hidden rounded bg-gray-800"
          role="progressbar"
          aria-label="Prestige progress"
          :aria-valuemin="0"
          :aria-valuemax="100"
          :aria-valuenow="Math.round(prestigeProgress * 100)"
        >
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
