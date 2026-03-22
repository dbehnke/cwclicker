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

      store.save()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      // QSOs are saved as strings for BigInt compatibility
      expect(saved.qsos).toBe('12345')
    })

    it('persists license level to localStorage', () => {
      const store = useGameStore()
      store.licenseLevel = 3

      store.save()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.licenseLevel).toBe(3)
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
        factoryCounts: {},
        licenseLevel: 1,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.qsos).toBe(54321n)
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

      store.save()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))

      // Verify schema structure
      expect(saved).toHaveProperty('qsos')
      expect(saved).toHaveProperty('factoryCounts')
      expect(saved).toHaveProperty('licenseLevel')
      expect(saved).toHaveProperty('purchasedUpgrades')

      // Verify types (qsos is stored as string for BigInt compatibility)
      expect(typeof saved.qsos).toBe('string')
      expect(typeof saved.factoryCounts).toBe('object')
      expect(typeof saved.licenseLevel).toBe('number')
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
  })
})
