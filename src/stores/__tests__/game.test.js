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
    expect(store.prestigeMultiplier).toBeCloseTo(1.15)
  })

  it('does not recompute prestige eligibility until earned QSOs cross the next threshold', () => {
    const store = useGameStore()

    store.totalQsosEarned = 27_000_000_000n
    store.prestigeLevel = 3n

    const initialEligible = store.eligiblePrestigeLevel
    store.tapKeyer('dit')

    expect(store.eligiblePrestigeLevel).toBe(initialEligible)
    expect(store.canPrestigeReset).toBe(false)
  })

  it('applies prestige multiplier to keyer taps with remainder accumulation', () => {
    const store = useGameStore()

    store.totalQsosEarned = 27_000_000_000n
    store.prestigeLevel = 3n

    store.tapKeyer('dit')
    expect(store.qsos).toBe(1n)
    expect(store.totalQsosEarned).toBe(27_000_000_001n)

    store.tapKeyer('dah')
    expect(store.qsos).toBe(3n)
    expect(store.totalQsosEarned).toBe(27_000_000_003n)
  })

  it('accumulates tap prestige bonus across repeated small taps', () => {
    const store = useGameStore()

    store.totalQsosEarned = 27_000_000_000n
    store.prestigeLevel = 3n

    for (let i = 0; i < 20; i++) {
      store.tapKeyer('dit')
    }

    expect(store.qsos).toBeGreaterThan(20n)
    expect(store.totalQsosEarned).toBeGreaterThan(27_000_000_020n)
    expect(store.qsos).toBe(store.totalQsosEarned - 27_000_000_000n)
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
    store.morseChallengeState = {
      isActive: true,
      currentChar: 'K',
      currentPattern: '−·−',
      keyedSequence: ['dit', 'dah'],
      challengeStartTime: 1700000000000,
      state: 'active',
    }

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
    expect(store.morseChallengeState.isActive).toBe(false)
    expect(store.morseChallengeState.state).toBe('idle')
    expect(store.canPrestigeReset).toBe(false)
  })

  it('calculates prestige eligibility exactly for very large totals', () => {
    const store = useGameStore()

    const root = 1_234_567n
    const normalized = root ** 3n - 1n
    store.totalQsosEarned = 1_000_000_000n * normalized

    expect(store.eligiblePrestigeLevel).toBe(root - 1n)
  })

  it('clamps non-finite passive output to zero', () => {
    const store = useGameStore()

    store.factoryCounts = { elmer: Number.MAX_SAFE_INTEGER }
    store.prestigeLevel = 9007199254740991n

    expect(store.getTotalQSOsPerSecond()).toBe(0)
  })

  it('applies solar storm multiplier after load-time reset', () => {
    const EXPECTED_STORM_MULTIPLIER = 0.5
    const EXPECTED_STORM_DURATION_MS = 77000
    vi.useFakeTimers()
    const now = new Date('2026-03-27T12:00:00.000Z')
    vi.setSystemTime(now)

    const saveData = {
      version: '1.1.8',
      qsos: '10',
      factoryCounts: { elmer: 1 },
      licenseLevel: 1,
      lotteryState: {
        isSolarStorm: true,
        solarStormEndTime: now.getTime() + 1000,
      },
    }
    localStorage.setItem('cw-keyer-game', JSON.stringify(saveData))

    const store = useGameStore()
    store.load()

    expect(store.getLotteryMultiplier('elmer')).toBe(EXPECTED_STORM_MULTIPLIER)
    expect(store.lotteryState.solarStormEndTime).toBe(now.getTime() + EXPECTED_STORM_DURATION_MS)

    vi.useRealTimers()
  })
})
