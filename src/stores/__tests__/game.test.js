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

  it('exposes prestige eligibility and multiplier from earned QSOs', () => {
    const store = useGameStore()

    expect(store.canPrestigeReset).toBe(false)
    expect(store.prestigeMultiplier).toBe(1)

    store.totalQsosEarned = 27_000_000_000n

    expect(store.canPrestigeReset).toBe(true)
    expect(store.prestigeMultiplier).toBe(1)

    store.prestigeLevel = 3n

    expect(store.canPrestigeReset).toBe(false)
    expect(store.prestigeMultiplier).toBe(1.15)
  })

  it('prestige reset awards only newly earned points and clears run state', () => {
    const store = useGameStore()

    store.totalQsosEarned = 27_000_000_000n
    store.prestigeLevel = 1n
    store.prestigePoints = 4n
    store.qsos = 123n
    store.factoryCounts = { cwkeyer: 2 }
    store.fractionalQSOs = 0.75
    store.licenseLevel = 4
    store.purchasedUpgrades = new Set(['upgrade-1'])
    store.offlineEarnings = { qsos: 10, hours: 1, rate: 2 }

    store.prestigeReset()

    expect(store.prestigeLevel).toBe(3n)
    expect(store.prestigePoints).toBe(6n)
    expect(store.totalQsosEarned).toBe(27_000_000_000n)
    expect(store.qsos).toBe(0n)
    expect(store.factoryCounts).toEqual({})
    expect(store.fractionalQSOs).toBe(0)
    expect(store.licenseLevel).toBe(1)
    expect(store.purchasedUpgrades).toEqual(new Set())
    expect(store.offlineEarnings).toBe(null)
    expect(store.canPrestigeReset).toBe(false)
  })

  it('calculates prestige eligibility exactly for very large totals', () => {
    const store = useGameStore()

    const root = 1_234_567n
    const normalized = root ** 3n - 1n
    store.totalQsosEarned = 1_000_000_000n * normalized

    expect(store.eligiblePrestigeLevel).toBe(root - 1n)
  })
})
