import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../game'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Game Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with 0 QSOs', () => {
    const store = useGameStore()
    expect(store.qsos).toBe(0n)
  })

  it('adds QSOs when keyer is tapped (dit = 1)', () => {
    const store = useGameStore()
    store.tapKeyer('dit')
    expect(store.qsos).toBe(1n)
  })

  it('adds QSOs when keyer is tapped (dah = 2)', () => {
    const store = useGameStore()
    store.tapKeyer('dah')
    expect(store.qsos).toBe(2n)
  })

  it('warns on invalid keyer tap type and does not add QSOs', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const store = useGameStore()
    
    store.tapKeyer('dot')
    
    expect(consoleSpy).toHaveBeenCalledWith('Invalid keyer tap type: dot')
    expect(store.qsos).toBe(0n)
    
    consoleSpy.mockRestore()
  })
})