<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { audioService } from '../services/audio'

const store = useGameStore()
const startTime = ref(0)
const isDown = ref(false)

/**
 * Handles the keyer down event (mousedown/touchstart).
 */
const handleDown = () => {
  if (isDown.value) return
  isDown.value = true
  startTime.value = Date.now()
  audioService.playTone()
}

/**
 * Handles the keyer up event (mouseup/touchend).
 */
/**
 * Emits events from the component.
 */
const emit = defineEmits(['tap'])

const handleUp = () => {
  if (!isDown.value) return
  isDown.value = false
  audioService.stopTone()

  const duration = Date.now() - startTime.value
  const type = store.classifyMorseTapDuration(duration)
  const qsoValue = type === 'dit' ? 1 : 2

  store.tapKeyer(type)
  store.handleMorseKeyTap(type)
  emit('tap', qsoValue)
}

/**
 * Handles keyboard events for accessibility.
 * @param {KeyboardEvent} event
 */
const handleKeydown = event => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    handleDown()
  }
}

/**
 * Handles keyboard up events for accessibility.
 * @param {KeyboardEvent} event
 */
const handleKeyup = event => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    handleUp()
  }
}

function handleWindowMouseUp() {
  handleUp()
}

onMounted(() => {
  window.addEventListener('mouseup', handleWindowMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', handleWindowMouseUp)
})
</script>

<template>
  <div
    class="w-full h-48 border-2 border-terminal-green rounded flex items-center justify-center cursor-pointer select-none"
    role="button"
    tabindex="0"
    aria-label="Morse code keyer. Press for dah, quick press for dit"
    @mousedown="handleDown"
    @mouseup="handleUp"
    @touchstart.prevent="handleDown"
    @touchend.prevent="handleUp"
    @keydown="handleKeydown"
    @keyup="handleKeyup"
  >
    <span class="text-2xl font-bold uppercase tracking-widest"> [ CW KEYER ] </span>
  </div>
</template>
