<script setup>
import { useGameStore } from '../stores/game'

/**
 * Header component displaying game title and current QSO count.
 */
const store = useGameStore()
</script>

<template>
  <header class="mb-8 flex justify-between border-b border-terminal-green pb-4">
    <h1 class="text-2xl font-bold">CW KEYER IDLE</h1>
    <div class="text-xl">QSOs: {{ store.qsos }}</div>
  </header>
</template>
