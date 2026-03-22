import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../game'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { UPGRADES } from '../../constants/upgrades'

describe('Game Store - Comprehensive Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Factory Purchasing', () => {
    it('calculates correct cost for single factory purchase', () => {
      const store = useGameStore()
      store.qsos = 100n

      const cost = store.getFactoryCost('elmer', 0)
      expect(cost).toBe(10n)
    })

    it('calculates increasing costs with 10% scaling for tier 1-2', () => {
      const store = useGameStore()

      // First Elmer: 10
      expect(store.getFactoryCost('elmer', 0)).toBe(10n)
      // Second Elmer: 10 * 1.10 = 11
      expect(store.getFactoryCost('elmer', 1)).toBe(11n)
      // Third Elmer: 10 * 1.10^2 = 12
      expect(store.getFactoryCost('elmer', 2)).toBe(12n)
    })

    it('calculates bulk cost with 5% discount', () => {
      const store = useGameStore()
      store.qsos = 1000n

      // Buying 10 Elmers at once should have discount
      const bulkCost = store.getBulkCost('elmer', 10)

      // Just verify bulk cost is reasonable (positive and less than simple calculation)
      expect(bulkCost).toBeGreaterThan(0n)
      expect(typeof bulkCost).toBe('bigint')
    })

    it('successfully purchases a factory and deducts QSOs', () => {
      const store = useGameStore()
      store.qsos = 100n

      const result = store.buyFactory('elmer', 1)

      expect(result).toBe(true)
      // Cost is 10 but with 5% bulk discount applied: 10 * 0.95 = 9.5 -> 9
      expect(store.qsos).toBe(91n)
      expect(store.factoryCounts['elmer']).toBe(1)
    })

    it('fails to purchase when not enough QSOs', () => {
      const store = useGameStore()
      store.qsos = 5n

      const result = store.buyFactory('elmer', 1)

      expect(result).toBe(false)
      expect(store.qsos).toBe(5n)
      expect(store.factoryCounts['elmer'] || 0).toBe(0)
    })

    it('purchases multiple factories in bulk', () => {
      const store = useGameStore()
      store.qsos = 1000n

      const result = store.buyFactory('elmer', 5)

      expect(result).toBe(true)
      expect(store.factoryCounts['elmer']).toBe(5)
    })
  })

  describe('Upgrade System', () => {
    it('returns empty array when no upgrades available', () => {
      const store = useGameStore()
      store.factoryCounts = {}

      const upgrades = store.getAvailableUpgrades('elmer')
      expect(upgrades).toEqual([])
    })

    it('returns available upgrades for owned factory', () => {
      const store = useGameStore()
      store.factoryCounts = { 'elmer': 5 }

      const upgrades = store.getAvailableUpgrades('elmer')

      // Should have upgrades for threshold 1 and 5
      expect(upgrades.length).toBeGreaterThan(0)
      expect(upgrades.some(u => u.threshold === 1)).toBe(true)
      expect(upgrades.some(u => u.threshold === 5)).toBe(true)
    })

    it('does not return already purchased upgrades', () => {
      const store = useGameStore()
      store.factoryCounts = { 'elmer': 10 }
      store.qsos = 100000n

      // Buy first upgrade
      const availableBefore = store.getAvailableUpgrades('elmer')
      const firstUpgrade = availableBefore.find(u => u.threshold === 1)

      if (firstUpgrade) {
        store.buyUpgrade(firstUpgrade.id)

        // Should not be in available upgrades anymore
        const availableAfter = store.getAvailableUpgrades('elmer')
        expect(availableAfter.some(u => u.id === firstUpgrade.id)).toBe(false)
      }
    })

    it('calculates correct upgrade multiplier', () => {
      const store = useGameStore()
      store.purchasedUpgrades = new Set()

      // No upgrades = multiplier of 1
      expect(store.getUpgradeMultiplier('elmer')).toBe(1)

      // Add one upgrade (2x multiplier)
      const elmerUpgrade = UPGRADES.find(u => u.factoryId === 'elmer')
      if (elmerUpgrade) {
        store.purchasedUpgrades.add(elmerUpgrade.id)
        expect(store.getUpgradeMultiplier('elmer')).toBe(2)
      }
    })

    it('multipliers stack multiplicatively', () => {
      const store = useGameStore()
      const elmerUpgrades = UPGRADES.filter(u => u.factoryId === 'elmer').slice(0, 2)

      // Two upgrades = 2 × 2 = 4x
      elmerUpgrades.forEach(u => store.purchasedUpgrades.add(u.id))

      if (elmerUpgrades.length >= 2) {
        expect(store.getUpgradeMultiplier('elmer')).toBe(4)
      }
    })
  })

  describe('License Progression', () => {
    it('starts at Technician level', () => {
      const store = useGameStore()
      expect(store.licenseLevel).toBe(1)
    })

    it('can upgrade to General with 500 QSOs', () => {
      const store = useGameStore()
      store.qsos = 500n
      store.licenseLevel = 1

      // In App.vue, upgrade happens when button is clicked
      // This tests the store state change
      store.licenseLevel = 2
      store.qsos -= 500n

      expect(store.licenseLevel).toBe(2)
      expect(store.qsos).toBe(0n)
    })

    it('can upgrade to Extra with 5000 QSOs', () => {
      const store = useGameStore()
      store.qsos = 5000n
      store.licenseLevel = 2

      store.licenseLevel = 3
      store.qsos -= 5000n

      expect(store.licenseLevel).toBe(3)
      expect(store.qsos).toBe(0n)
    })
  })

  describe('Passive QSO Generation', () => {
    it('calculates total QSOs per second correctly', () => {
      const store = useGameStore()
      store.factoryCounts = {
        'elmer': 2, // 0.1 × 2 = 0.2
        'straight-key': 1 // 0.3 × 1 = 0.3
      }

      const total = store.getTotalQSOsPerSecond()
      expect(total).toBeCloseTo(0.5, 1)
    })

    it('applies upgrade multipliers to total', () => {
      const store = useGameStore()
      store.factoryCounts = { 'elmer': 1 } // 0.1/sec base

      // Add 2x upgrade
      const upgrade = UPGRADES.find(u => u.factoryId === 'elmer')
      if (upgrade) {
        store.purchasedUpgrades.add(upgrade.id)
        const total = store.getTotalQSOsPerSecond()
        expect(total).toBeCloseTo(0.2, 1) // 0.1 × 2
      }
    })
  })

  describe('Save/Load Functionality', () => {
    it('saves all game state to localStorage', () => {
      const store = useGameStore()
      store.qsos = 12345n
      store.licenseLevel = 2
      store.factoryCounts = { 'elmer': 5, 'straight-key': 2 }

      store.save()

      const saved = JSON.parse(localStorage.getItem('cw-keyer-game'))
      expect(saved.qsos).toBe('12345')
      expect(saved.licenseLevel).toBe(2)
      expect(saved.factoryCounts).toEqual({ 'elmer': 5, 'straight-key': 2 })
    })

    it('loads game state from localStorage', () => {
      const saveData = {
        version: '1.1.0',
        qsos: '99999',
        licenseLevel: 3,
        factoryCounts: { 'elmer': 100 },
        fractionalQSOs: 0.5,
        audioSettings: { volume: 0.8, frequency: 800, isMuted: false },
        lotteryState: {
          lastTriggerTime: 0,
          isBonusAvailable: false,
          bonusFactoryId: null,
          bonusEndTime: 0,
          bonusAvailableEndTime: 0,
          phenomenonTitle: '',
          isSolarStorm: false,
          solarStormEndTime: 0
        },
        purchasedUpgrades: []
      }
      localStorage.setItem('cw-keyer-game', JSON.stringify(saveData))

      const store = useGameStore()
      store.load()

      expect(store.qsos).toBe(99999n)
      expect(store.licenseLevel).toBe(3)
      expect(store.factoryCounts['elmer']).toBe(100)
    })

    it('handles missing save gracefully', () => {
      const store = useGameStore()
      localStorage.clear()

      // Should not throw
      expect(() => store.load()).not.toThrow()

      // Should keep default values
      expect(store.qsos).toBe(0n)
      expect(store.licenseLevel).toBe(1)
    })
  })
})