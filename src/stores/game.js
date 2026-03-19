import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Manages the game's core state and progression.
 */
export const useGameStore = defineStore('game', () => {
  const qsos = ref(0)
  
  /**
   * Processes a keyer tap to add QSOs.
   * @param {('dit'|'dah')} type - The type of keyer tap.
   */
  function tapKeyer(type) {
    if (type === 'dit') {
      qsos.value += 1
    } else if (type === 'dah') {
      qsos.value += 2
    } else {
      console.warn(`Invalid keyer tap type: ${type}`)
    }
  }

  return {
    qsos,
    tapKeyer
  }
})