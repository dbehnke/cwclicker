<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

let lastTime = 0
let saveTimer = 0
let animationFrameId = null

function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000
  lastTime = currentTime
  
  const qsosPerSecond = store.getTotalQSOsPerSecond()
  const qsosToAdd = qsosPerSecond * deltaTime
  
  if (qsosToAdd > 0) {
    store.addPassiveQSOs(qsosToAdd)
  }
  
  saveTimer += deltaTime
  if (saveTimer >= 30) {
    store.save()
    saveTimer = 0
  }
  
  animationFrameId = requestAnimationFrame(gameLoop)
}

onMounted(() => {
  lastTime = performance.now()
  animationFrameId = requestAnimationFrame(gameLoop)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
})
</script>

<template>
  <!-- This is a logic-only component, no template needed -->
</template>
