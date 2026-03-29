import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../game'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('Game Store - Save/Load', () => {
  const STORAGE_KEY = 'cw-keyer-game'

  beforeEach(() => {
    setActivePinia(createPinia())
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('save()', () => {
    it('persists factory counts to localStorage', () => {
      const store = useGameStore()
      store.qsos = 1000n
      store.buyFactory('elmer', 3)
      store.buyFactory('straight-key', 2)

      store.save()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.factoryCounts).toEqual({
        elmer: 3,
        'straight-key': 2,
      })
    })

    it('persists QSOs to localStorage as string', () => {
      const store = useGameStore()
      store.qsos = 12345n
      store.qsosThisRun = 23456n

      store.save()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      // QSOs are saved as strings for BigInt compatibility
      expect(saved.qsos).toBe('12345')
      expect(saved.qsosThisRun).toBe('23456')
    })

    it('persists license level to localStorage', () => {
      const store = useGameStore()
      store.licenseLevel = 3

      store.save()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.licenseLevel).toBe(3)
    })

    it('persists prestige state to localStorage', () => {
      const store = useGameStore()
      store.prestigeLevel = 7n
      store.prestigePoints = 11n
      store.tapPrestigeAccumulator = 5n

      store.save()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.prestigeLevel).toBe('7')
      expect(saved.prestigePoints).toBe('11')
      // tapPrestigeAccumulator should also be saved as a string for BigInt compatibility
      expect(saved.tapPrestigeAccumulator).toBe('5')

      // Mutate in-memory state, then verify that load() restores the persisted values
      store.prestigeLevel = 0n
      store.prestigePoints = 0n
      store.tapPrestigeAccumulator = 0n

      store.load()

      expect(store.prestigeLevel).toBe(7n)
      expect(store.prestigePoints).toBe(11n)
      expect(store.tapPrestigeAccumulator).toBe(5n)
    })

    it('handles save failure gracefully', () => {
      const store = useGameStore()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock localStorage.setItem to throw
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      store.qsos = 1000n
      store.save() // Should not throw

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save game state:', expect.any(Error))
    })
  })

  describe('load()', () => {
    it('restores factory counts from localStorage', () => {
      const saveData = {
        version: '1.1.0',
        qsos: '5000',
        factoryCounts: { elmer: 5, 'straight-key': 2 },
        licenseLevel: 2,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.factoryCounts['elmer']).toBe(5)
      expect(store.factoryCounts['straight-key']).toBe(2)
    })

    it('restores QSOs from localStorage', () => {
      const saveData = {
        version: '1.1.0',
        qsos: '54321',
        qsosThisRun: '65432',
        factoryCounts: {},
        licenseLevel: 1,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.qsos).toBe(54321n)
      expect(store.qsosThisRun).toBe(65432n)
    })

    it('defaults qsosThisRun to totalQsosEarned for saves without qsosThisRun', () => {
      const saveData = {
        version: '1.1.0',
        qsos: '111',
        totalQsosEarned: '222',
        factoryCounts: {},
        licenseLevel: 1,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.qsos).toBe(111n)
      expect(store.qsosThisRun).toBe(222n)
    })

    it('restores license level from localStorage', () => {
      const saveData = {
        version: '1.1.0',
        qsos: '0',
        factoryCounts: {},
        licenseLevel: 3,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.licenseLevel).toBe(3)
    })

    it('handles missing save gracefully', () => {
      const store = useGameStore()

      // Ensure localStorage is empty
      localStorage.clear()

      store.load() // Should not throw

      // Should keep default values
      expect(store.qsos).toBe(0n)
      expect(store.licenseLevel).toBe(1)
      expect(store.factoryCounts).toEqual({})
    })

    it('handles corrupted save gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorage.setItem(STORAGE_KEY, 'invalid json {{{')

      const store = useGameStore()
      store.load() // Should not throw

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load game state:', expect.any(Error))
      // Should keep default values
      expect(store.qsos).toBe(0n)
      expect(store.licenseLevel).toBe(1)
      expect(store.factoryCounts).toEqual({})
    })

    it('uses default values for missing fields', () => {
      const saveData = {
        version: '1.1.0',
        qsos: '1000',
        // missing factoryCounts and licenseLevel
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.qsos).toBe(1000n)
      expect(store.licenseLevel).toBe(1)
      expect(store.factoryCounts).toEqual({})
    })

    it('seeds prestige from total QSOs on old saves without prestige fields', () => {
      const saveData = {
        version: '1.1.0',
        qsos: '0',
        totalQsosEarned: '27000000000',
        factoryCounts: {},
        licenseLevel: 1,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.prestigeLevel).toBe(3n)
      expect(store.prestigePoints).toBe(3n)
    })

    it('normalizes invalid prestige fields on load', () => {
      const saveData = {
        version: '1.1.0',
        qsos: '0',
        totalQsosEarned: '27000000000',
        prestigeLevel: '-5',
        prestigePoints: '-2',
        factoryCounts: {},
        licenseLevel: 1,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.prestigeLevel).toBe(0n)
      expect(store.prestigePoints).toBe(0n)
    })

    it('clamps negative qsos values on load', () => {
      const saveData = {
        version: '1.1.0',
        qsos: '-42',
        totalQsosEarned: '-99',
        factoryCounts: {},
        licenseLevel: 1,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.qsos).toBe(0n)
      expect(store.totalQsosEarned).toBe(0n)
    })

    describe('lottery storm load behavior', () => {
      const EXPECTED_STORM_DURATION_MS = 77000

      it('reloads active saved storm with full duration from load time', () => {
        vi.useFakeTimers()
        const now = new Date('2026-03-27T12:00:00.000Z')
        vi.setSystemTime(now)

        const saveData = {
          version: '1.1.8',
          qsos: '5000',
          factoryCounts: { elmer: 1 },
          licenseLevel: 1,
          lotteryState: {
            lastTriggerTime: now.getTime() - 2000,
            isBonusAvailable: false,
            bonusFactoryId: null,
            bonusEndTime: 0,
            bonusAvailableEndTime: 0,
            phenomenonTitle: 'Solar storm',
            isSolarStorm: true,
            solarStormEndTime: now.getTime() + 5000,
          },
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
        const store = useGameStore()
        store.load()

        expect(store.lotteryState.isSolarStorm).toBe(true)
        expect(store.lotteryState.solarStormEndTime).toBe(
          now.getTime() + EXPECTED_STORM_DURATION_MS
        )

        vi.useRealTimers()
      })

      it('treats equal boundary now === solarStormEndTime as expired', () => {
        vi.useFakeTimers()
        const now = new Date('2026-03-27T12:00:00.000Z')
        vi.setSystemTime(now)

        const saveData = {
          version: '1.1.8',
          qsos: '1',
          factoryCounts: {},
          licenseLevel: 1,
          lotteryState: {
            isSolarStorm: true,
            solarStormEndTime: now.getTime(),
          },
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
        const store = useGameStore()
        store.load()

        expect(store.lotteryState.isSolarStorm).toBe(false)
        expect(store.lotteryState.solarStormEndTime).toBe(0)

        vi.useRealTimers()
      })

      it('normalizes malformed storm fields to inactive', () => {
        const saveData = {
          version: '1.1.8',
          qsos: '1',
          factoryCounts: {},
          licenseLevel: 1,
          lotteryState: {
            isSolarStorm: 'yes',
            solarStormEndTime: 'invalid-time',
          },
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
        const store = useGameStore()
        store.load()

        expect(store.lotteryState.isSolarStorm).toBe(false)
        expect(store.lotteryState.solarStormEndTime).toBe(0)
      })

      it('keeps expired saved storm inactive on load', () => {
        vi.useFakeTimers()
        const now = new Date('2026-03-27T12:00:00.000Z')
        vi.setSystemTime(now)

        const saveData = {
          version: '1.1.8',
          qsos: '1',
          factoryCounts: {},
          licenseLevel: 1,
          lotteryState: {
            isSolarStorm: true,
            solarStormEndTime: now.getTime() - 1,
          },
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
        const store = useGameStore()
        store.load()

        expect(store.lotteryState.isSolarStorm).toBe(false)
        expect(store.lotteryState.solarStormEndTime).toBe(0)

        vi.useRealTimers()
      })

      it('does not change non-storm lottery state during load', () => {
        const saveData = {
          version: '1.1.8',
          qsos: '1',
          factoryCounts: {},
          licenseLevel: 1,
          lotteryState: {
            lastTriggerTime: 123,
            isBonusAvailable: false,
            bonusFactoryId: null,
            bonusEndTime: 0,
            bonusAvailableEndTime: 0,
            phenomenonTitle: 'No storm',
            isSolarStorm: false,
            solarStormEndTime: 0,
          },
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
        const store = useGameStore()
        store.load()

        expect(store.lotteryState.isSolarStorm).toBe(false)
        expect(store.lotteryState.solarStormEndTime).toBe(0)
        expect(store.lotteryState.phenomenonTitle).toBe('No storm')
      })
    })

    it('preserves current state when no save exists', () => {
      const store = useGameStore()
      store.qsos = 500n
      store.licenseLevel = 2
      store.factoryCounts = { elmer: 1 }

      localStorage.clear()
      store.load()

      // State should remain unchanged
      expect(store.qsos).toBe(500n)
      expect(store.licenseLevel).toBe(2)
      expect(store.factoryCounts).toEqual({ elmer: 1 })
    })

    it('keeps pre-revealed locked-batch factories hidden after load unless owned', () => {
      const saveData = {
        version: '1.2.1',
        qsos: '1000000000',
        qsosThisRun: '1000000000',
        totalQsosEarned: '1000000000',
        licenseLevel: 1,
        factoryCounts: {},
        revealedFactoryIds: ['beam-antenna'],
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.isFactoryUnlocked('beam-antenna')).toBe(false)

      store.factoryCounts['beam-antenna'] = 1
      expect(store.isFactoryUnlocked('beam-antenna')).toBe(true)
    })
  })

  describe('save schema', () => {
    it('uses correct localStorage key', () => {
      const store = useGameStore()
      store.save()

      const keys = Object.keys(localStorage)
      expect(keys).toContain(STORAGE_KEY)
    })

    it('matches expected save schema format', () => {
      const store = useGameStore()
      store.qsos = 12345n
      store.licenseLevel = 2
      store.factoryCounts = { elmer: 5, 'paddle-key': 2 }
      store.prestigeLevel = 4n
      store.prestigePoints = 9n

      store.save()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))

      // Verify schema structure
      expect(saved).toHaveProperty('qsos')
      expect(saved).toHaveProperty('factoryCounts')
      expect(saved).toHaveProperty('licenseLevel')
      expect(saved).toHaveProperty('prestigeLevel')
      expect(saved).toHaveProperty('prestigePoints')
      expect(saved).toHaveProperty('purchasedUpgrades')

      // Verify types (qsos is stored as string for BigInt compatibility)
      expect(typeof saved.qsos).toBe('string')
      expect(typeof saved.factoryCounts).toBe('object')
      expect(typeof saved.licenseLevel).toBe('number')
      expect(typeof saved.prestigeLevel).toBe('string')
      expect(typeof saved.prestigePoints).toBe('string')
      expect(Array.isArray(saved.purchasedUpgrades)).toBe(true)
    })

    it('persists purchased upgrades to localStorage', () => {
      const store = useGameStore()
      store.qsos = 10000n
      store.factoryCounts = { elmer: 10 }
      store.purchasedUpgrades = new Set(['upgrade-elmer-10'])

      store.save()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.purchasedUpgrades).toEqual(['upgrade-elmer-10'])
    })

    it('persists upgrade purchase metadata to localStorage', () => {
      const store = useGameStore()
      store.upgradePurchaseMeta = {
        'upgrade-elmer-5': 1700000000000,
      }

      store.save()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.upgradePurchaseMeta).toEqual({
        'upgrade-elmer-5': 1700000000000,
      })
    })

    it('persists morseChallengeState to localStorage', () => {
      const store = useGameStore()
      store.qsos = 1000n
      store.startMorseChallenge()
      store.morseChallengeState.currentChar = 'K'
      store.morseChallengeState.currentPattern = '−·−'
      store.morseChallengeState.keyedSequence = ['dit', 'dah']
      store.morseChallengeState.challengeStartTime = 1700000000000
      store.morseChallengeState.state = 'active'

      store.save()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.morseChallengeState).toEqual({
        isActive: true,
        currentChar: 'K',
        currentPattern: '−·−',
        keyedSequence: ['dit', 'dah'],
        challengeStartTime: 1700000000000,
        state: 'active',
        triesRemaining: 3,
        lastBonusAwarded: 0,
      })
    })

    it('restores purchased upgrades from localStorage', () => {
      const saveData = {
        version: '1.1.0',
        qsos: '5000',
        factoryCounts: { elmer: 10 },
        licenseLevel: 1,
        purchasedUpgrades: ['upgrade-elmer-10', 'upgrade-elmer-25'],
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.purchasedUpgrades.has('upgrade-elmer-10')).toBe(true)
      expect(store.purchasedUpgrades.has('upgrade-elmer-25')).toBe(true)
      expect(store.purchasedUpgrades.has('upgrade-straight-key-10')).toBe(false)
    })

    it('initializes empty purchasedUpgrades when not in save', () => {
      const saveData = {
        version: '1.1.0',
        qsos: '5000',
        factoryCounts: { elmer: 5 },
        licenseLevel: 1,
        // No purchasedUpgrades field
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.purchasedUpgrades.size).toBe(0)
    })

    it('load handles missing upgrade purchase metadata', () => {
      const saveData = {
        version: '1.2.2',
        qsos: '5000',
        factoryCounts: {},
        licenseLevel: 1,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.upgradePurchaseMeta).toEqual({})
    })

    it('load normalizes malformed upgrade purchase metadata', () => {
      const saveData = {
        version: '1.2.2',
        qsos: '5000',
        factoryCounts: {},
        licenseLevel: 1,
        upgradePurchaseMeta: {
          'upgrade-elmer-5': 'invalid',
          'upgrade-elmer-10': -1,
          'upgrade-elmer-25': 1700000000000,
          'upgrade-elmer-50': null,
        },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.upgradePurchaseMeta).toEqual({
        'upgrade-elmer-5': 0,
        'upgrade-elmer-10': 0,
        'upgrade-elmer-25': 1700000000000,
        'upgrade-elmer-50': 0,
      })
    })

    it('restores morseChallengeState from localStorage', () => {
      const challengeState = {
        isActive: true,
        currentChar: 'K',
        currentPattern: '−·−',
        keyedSequence: ['dit', 'dah'],
        challengeStartTime: 1700000000000,
        state: 'active',
      }
      const saveData = {
        version: '1.1.5',
        qsos: '5000',
        factoryCounts: {},
        licenseLevel: 1,
        morseChallengeState: challengeState,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.morseChallengeState.isActive).toBe(true)
      expect(store.morseChallengeState.currentChar).toBe('K')
      expect(store.morseChallengeState.currentPattern).toBe('−·−')
      expect(store.morseChallengeState.keyedSequence).toEqual(['dit', 'dah'])
      expect(store.morseChallengeState.challengeStartTime).toBe(1700000000000)
      expect(store.morseChallengeState.state).toBe('active')
    })

    it('uses default morseChallengeState when not in save', () => {
      const saveData = {
        version: '1.1.5',
        qsos: '5000',
        factoryCounts: {},
        licenseLevel: 1,
        // No morseChallengeState field
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.morseChallengeState.isActive).toBe(false)
      expect(store.morseChallengeState.currentChar).toBeNull()
      expect(store.morseChallengeState.currentPattern).toBe('')
      expect(store.morseChallengeState.keyedSequence).toEqual([])
      expect(store.morseChallengeState.state).toBe('idle')
    })
  })
})
