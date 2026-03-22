import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../game'
import { describe, it, expect, beforeEach } from 'vitest'
import { FACTORIES } from '../../constants/factories'

describe('Game Store - Factory Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('licenseLevel', () => {
    it('initializes at level 1 (Technician)', () => {
      const store = useGameStore()
      expect(store.licenseLevel).toBe(1)
    })
  })

  describe('factoryCounts', () => {
    it('initializes as empty object', () => {
      const store = useGameStore()
      expect(store.factoryCounts).toEqual({})
    })
  })

  describe('addPassiveQSOs', () => {
    it('adds QSOs to the store', () => {
      const store = useGameStore()

      store.addPassiveQSOs(5)

      expect(store.qsos).toBe(5n)
    })

    it('accumulates QSOs over multiple calls', () => {
      const store = useGameStore()

      store.addPassiveQSOs(3)
      store.addPassiveQSOs(7)

      expect(store.qsos).toBe(10n)
    })

    it('floors decimal amounts', () => {
      const store = useGameStore()

      store.addPassiveQSOs(5.7)

      expect(store.qsos).toBe(5n)
    })

    it('handles zero correctly', () => {
      const store = useGameStore()

      store.addPassiveQSOs(0)

      expect(store.qsos).toBe(0n)
    })

    it('handles very large numbers', () => {
      const store = useGameStore()

      store.addPassiveQSOs(1e15)

      expect(store.qsos).toBe(1000000000000000n)
    })
  })

  describe('getFactoryCost', () => {
    it('calculates cost for tier 1-2 with 10% scaling (elmer)', () => {
      const store = useGameStore()
      const elmer = FACTORIES.find(f => f.id === 'elmer')

      expect(store.getFactoryCost('elmer', 0)).toBe(10n)
      expect(store.getFactoryCost('elmer', 1)).toBe(11n)
      expect(store.getFactoryCost('elmer', 5)).toBe(16n)
    })

    it('calculates cost for tier 3-5 with 7% scaling (vertical-antenna)', () => {
      const store = useGameStore()

      expect(store.getFactoryCost('vertical-antenna', 0)).toBe(5000n)
      expect(store.getFactoryCost('vertical-antenna', 1)).toBe(5350n)
      expect(store.getFactoryCost('vertical-antenna', 5)).toBe(7012n)
    })

    it('calculates cost for tier 6-7 with 5% scaling (ft8-bot)', () => {
      const store = useGameStore()

      expect(store.getFactoryCost('ft8-bot', 0)).toBe(5000000n)
      expect(store.getFactoryCost('ft8-bot', 1)).toBe(5250000n)
      expect(store.getFactoryCost('ft8-bot', 5)).toBe(6381407n)
    })

    it('returns a prohibitively high cost when growth overflows Number range', () => {
      const store = useGameStore()
      expect(store.getFactoryCost('elmer', 10000)).toBe(10n ** 100n)
    })
  })

  describe('buyFactory', () => {
    it('increases factory ownership and deducts QSOs', () => {
      const store = useGameStore()
      store.qsos = 100n

      const result = store.buyFactory('elmer', 1)

      expect(result).toBe(true)
      expect(store.factoryCounts['elmer']).toBe(1)
      // Single purchase uses getBulkCost which applies 5% discount: 10 * 95 / 100 = 9
      expect(store.qsos).toBe(91n)
    })

    it('returns false when not enough QSOs', () => {
      const store = useGameStore()
      store.qsos = 5n

      const result = store.buyFactory('elmer', 1)

      expect(result).toBe(false)
      expect(store.factoryCounts['elmer']).toBeUndefined()
      expect(store.qsos).toBe(5n)
    })

    it('buys multiple factories at once', () => {
      const store = useGameStore()
      store.qsos = 100n

      const result = store.buyFactory('elmer', 2)

      expect(result).toBe(true)
      expect(store.factoryCounts['elmer']).toBe(2)
    })
  })

  describe('getTotalQSOsPerSecond', () => {
    it('returns 0 when no factories owned', () => {
      const store = useGameStore()
      expect(store.getTotalQSOsPerSecond()).toBe(0)
    })

    it('sums production from all owned factories', () => {
      const store = useGameStore()
      store.qsos = 10000n
      store.buyFactory('elmer', 2) // 0.1 * 2 = 0.2
      store.buyFactory('straight-key', 1) // 0.3 * 1 = 0.3

      expect(store.getTotalQSOsPerSecond()).toBeCloseTo(0.5, 2)
    })
  })

  describe('getBulkCost', () => {
    it('calculates bulk cost with 5% discount', () => {
      const store = useGameStore()

      // Buying 2 elmer factories
      // Cost 0: 10
      // Cost 1: 10 * 1.10 = 11
      // Sum: 21
      // Discounted: 21 * 95 / 100 = 19 (integer division)
      const bulkCost = store.getBulkCost('elmer', 2)
      expect(bulkCost).toBe(19n)
    })

    it('applies 5% discount to larger purchases', () => {
      const store = useGameStore()

      // Manual sum of 5 elmer factories
      // 10 + 11 + 12 + 13 + 14 = 60 (floored values)
      // With 5% discount: 60 * 95 / 100 = 57
      const bulkCost = store.getBulkCost('elmer', 5)
      expect(bulkCost).toBe(57n)
    })

    it('caps excessively large bulk counts at 10', () => {
      const store = useGameStore()
      const cappedCost = store.getBulkCost('elmer', 10)
      const largeCost = store.getBulkCost('elmer', 5000)
      expect(largeCost).toBe(cappedCost)
    })

    it('caps purchase count at 10 when buying factories', () => {
      const store = useGameStore()
      store.qsos = 100000n

      const result = store.buyFactory('elmer', 5000)

      expect(result).toBe(true)
      expect(store.factoryCounts['elmer']).toBe(10)
    })
  })
})
