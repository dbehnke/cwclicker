import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../game'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FACTORIES, TIER_UNLOCK_THRESHOLDS } from '../../constants/factories'
import { UPGRADES } from '../../constants/upgrades'

describe('Game Store - Factory Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

      expect(elmer.baseCost).toBe(15)
      expect(store.getFactoryCost('elmer', 0)).toBe(15n)
      expect(store.getFactoryCost('elmer', 1)).toBe(16n)
      expect(store.getFactoryCost('elmer', 5)).toBe(24n)
    })

    it('calculates cost for tier 3-5 with 7% scaling (vertical-antenna)', () => {
      const store = useGameStore()

      expect(store.getFactoryCost('vertical-antenna', 0)).toBe(10000n)
      expect(store.getFactoryCost('vertical-antenna', 1)).toBe(10700n)
      expect(store.getFactoryCost('vertical-antenna', 5)).toBe(14025n)
    })

    it('calculates cost for tier 6-7 with 5% scaling (ft8-bot)', () => {
      const store = useGameStore()

      expect(store.getFactoryCost('ft8-bot', 0)).toBe(40000000n)
      expect(store.getFactoryCost('ft8-bot', 1)).toBe(42000000n)
      expect(store.getFactoryCost('ft8-bot', 5)).toBe(51051262n)
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
      // Single purchase uses getBulkCost which applies 5% discount: 15 * 95 / 100 = 14
      expect(store.qsos).toBe(86n)
    })

    it('returns false when not enough QSOs', () => {
      const store = useGameStore()
      store.qsos = 5n

      const result = store.buyFactory('elmer', 1)

      expect(result).toBe(false)
      expect(store.factoryCounts['elmer']).toBeUndefined()
      expect(store.qsos).toBe(5n)
    })

    it('returns false when the next factory is not yet affordable', () => {
      const store = useGameStore()
      store.qsos = 999n

      const result = store.buyFactory('paddle-key', 1)

      expect(result).toBe(false)
      expect(store.factoryCounts['paddle-key']).toBeUndefined()
    })

    it('allows buying a factory once affordability reveals it', () => {
      const store = useGameStore()
      store.qsos = 1000n

      const result = store.buyFactory('paddle-key', 1)

      expect(result).toBe(true)
      expect(store.factoryCounts['paddle-key']).toBe(1)
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
      // Cost 0: 15
      // Cost 1: floor(15 * 1.10) = 16
      // Sum: 31
      // Discounted: 31 * 95 / 100 = 29 (integer division)
      const bulkCost = store.getBulkCost('elmer', 2)
      expect(bulkCost).toBe(29n)
    })

    it('applies 5% discount to larger purchases', () => {
      const store = useGameStore()

      // Manual sum of 5 elmer factories
      // 15 + 16 + 18 + 19 + 21 = 89 (floored values)
      // With 5% discount: 89 * 95 / 100 = 84
      const bulkCost = store.getBulkCost('elmer', 5)
      expect(bulkCost).toBe(84n)
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

  describe('upgrade coverage', () => {
    it('gives every factory a full 9-step upgrade chain', () => {
      const expectedThresholds = [5, 10, 25, 50, 100, 150, 200, 250, 300]

      for (const factory of FACTORIES) {
        const upgrades = UPGRADES.filter(upgrade => upgrade.factoryId === factory.id)

        expect(upgrades.length, `Expected exactly 9 upgrades for factory ${factory.id}`).toBe(9)
        expect(upgrades.map(upgrade => upgrade.threshold)).toEqual(expectedThresholds)
        expect(upgrades[0].multiplier).toBe(2)

        for (let i = 1; i < upgrades.length; i++) {
          expect(upgrades[i].multiplier).toBe(upgrades[i - 1].multiplier * 2)
          expect(upgrades[i].baseCost).toBe(upgrades[i - 1].baseCost * 2n)
        }
      }
    })

    it('exposes the first bug-catcher upgrade at the threshold', () => {
      const store = useGameStore()
      store.factoryCounts['bug-catcher'] = 5

      const upgrades = store.getAvailableUpgrades('bug-catcher')

      expect(upgrades[0]).toMatchObject({
        factoryId: 'bug-catcher',
        threshold: 5,
      })
      expect(upgrades[0].multiplier).toBe(2)
      expect(upgrades[0].name).toBeDefined()
      expect(upgrades[0].baseCost).toBeGreaterThan(0n)
    })

    it('uses highest purchased upgrade multiplier for stacked tiers', () => {
      const store = useGameStore()
      const elmerUpgradeIds = UPGRADES.filter(upgrade => upgrade.factoryId === 'elmer')
        .slice(0, 3)
        .map(upgrade => upgrade.id)

      store.purchasedUpgrades = new Set(elmerUpgradeIds)

      expect(store.getUpgradeMultiplier('elmer')).toBe(8)
    })

    it('records timestamp when buyUpgrade succeeds', () => {
      const store = useGameStore()
      const targetUpgrade = UPGRADES.find(
        upgrade => upgrade.factoryId === 'elmer' && upgrade.threshold === 5
      )
      const timestamp = 1700000000000

      store.factoryCounts['elmer'] = 5
      store.qsos = targetUpgrade.baseCost
      vi.spyOn(Date, 'now').mockReturnValue(timestamp)

      const result = store.buyUpgrade(targetUpgrade.id)

      expect(result).toBe(true)
      expect(store.upgradePurchaseMeta[targetUpgrade.id]).toBe(timestamp)
    })

    it('does not write metadata when buyUpgrade fails', () => {
      const store = useGameStore()
      const targetUpgrade = UPGRADES.find(
        upgrade => upgrade.factoryId === 'elmer' && upgrade.threshold === 5
      )

      store.factoryCounts['elmer'] = 5
      store.qsos = 0n

      const result = store.buyUpgrade(targetUpgrade.id)

      expect(result).toBe(false)
      expect(store.upgradePurchaseMeta[targetUpgrade.id]).toBeUndefined()
    })
  })

  describe('affordability-based reveal progression', () => {
    it('keeps factories hidden until affordable', () => {
      const store = useGameStore()
      store.qsos = 0n
      store.revealAffordableFactories()

      expect(store.isFactoryUnlocked('elmer')).toBe(false)
      expect(store.isFactoryUnlocked('qrq-protocol')).toBe(false)
      expect(store.isFactoryUnlocked('straight-key')).toBe(false)
    })

    it('reveals only the next affordable factory chain in order', () => {
      const store = useGameStore()
      store.qsos = 25n
      store.revealAffordableFactories()

      expect(store.isFactoryUnlocked('elmer')).toBe(true)
      expect(store.isFactoryUnlocked('qrq-protocol')).toBe(true)
      expect(store.isFactoryUnlocked('straight-key')).toBe(false)
      expect(store.isFactoryUnlocked('paddle-key')).toBe(false)
    })

    it('reveals higher factories once enough QSOs are available', () => {
      const store = useGameStore()
      store.qsos = 1000n
      store.revealAffordableFactories()

      expect(store.isFactoryUnlocked('paddle-key')).toBe(true)
    })

    it('keeps general and extra batches hidden at license level 1 even with very high QSOs', () => {
      const store = useGameStore()
      store.licenseLevel = 1
      store.qsos = 10_000_000_000n

      store.revealAffordableFactories()

      expect(store.isFactoryUnlocked('beam-antenna')).toBe(false)
      expect(store.isFactoryUnlocked('ft8-bot')).toBe(false)
    })

    it('keeps tier-7 locked at license 2 and unlocks it after upgrading to license 3', () => {
      const store = useGameStore()
      store.licenseLevel = 2
      store.qsos = 10_000_000_000n

      store.revealAffordableFactories()
      expect(store.isFactoryUnlocked('ft8-bot')).toBe(false)

      store.licenseLevel = 3
      store.revealAffordableFactories()
      expect(store.isFactoryUnlocked('ft8-bot')).toBe(true)
    })

    it('reveals newly unlocked general batch sequentially and affordability-gated after upgrade', () => {
      const store = useGameStore()
      const firstGeneral = FACTORIES.find(factory => factory.id === 'beam-antenna')
      const blockedGeneral = FACTORIES.find(factory => factory.id === 'tower-installation')

      expect(firstGeneral).toBeDefined()
      expect(blockedGeneral).toBeDefined()

      const firstGeneralCost = store.getFactoryCost(firstGeneral.id, 0)
      const blockedGeneralCost = store.getFactoryCost(blockedGeneral.id, 0)

      expect(blockedGeneralCost).toBeGreaterThan(firstGeneralCost)

      store.licenseLevel = 1
      store.qsos = blockedGeneralCost - 1n

      store.revealAffordableFactories()
      expect(store.isFactoryUnlocked(firstGeneral.id)).toBe(false)

      store.licenseLevel = 2
      store.revealAffordableFactories()

      expect(store.isFactoryUnlocked(firstGeneral.id)).toBe(true)
      expect(store.isFactoryUnlocked(blockedGeneral.id)).toBe(false)
    })

    it('reveals newly unlocked extra batch sequentially and affordability-gated after upgrade', () => {
      const store = useGameStore()
      const firstExtra = FACTORIES.find(factory => factory.id === 'ft8-bot')
      const blockedExtra = FACTORIES.find(factory => factory.id === 'eme-moonbounce')

      expect(firstExtra).toBeDefined()
      expect(blockedExtra).toBeDefined()

      const firstExtraCost = store.getFactoryCost(firstExtra.id, 0)
      const blockedExtraCost = store.getFactoryCost(blockedExtra.id, 0)

      expect(blockedExtraCost).toBeGreaterThan(firstExtraCost)

      store.licenseLevel = 2
      store.qsos = blockedExtraCost - 1n

      store.revealAffordableFactories()
      expect(store.isFactoryUnlocked(firstExtra.id)).toBe(false)

      store.licenseLevel = 3
      store.revealAffordableFactories()

      expect(store.isFactoryUnlocked(firstExtra.id)).toBe(true)
      expect(store.isFactoryUnlocked(blockedExtra.id)).toBe(false)
    })

    it('keeps already-owned factories unlocked', () => {
      const store = useGameStore()
      store.qsosThisRun = 0n
      store.factoryCounts['paddle-key'] = 1

      expect(store.isFactoryUnlocked('paddle-key')).toBe(true)
    })

    it('keeps already-owned factories unlocked even below license tier visibility', () => {
      const store = useGameStore()
      store.licenseLevel = 1
      store.factoryCounts['beam-antenna'] = 1
      store.qsosThisRun = 0n

      expect(store.isFactoryUnlocked('beam-antenna')).toBe(true)
    })

    it('adds unlockThreshold metadata for every factory', () => {
      expect(FACTORIES.every(factory => typeof factory.unlockThreshold === 'bigint')).toBe(true)
      expect(
        FACTORIES.filter(factory => factory.tier === 1).every(f => f.unlockThreshold === 0n)
      ).toBe(true)
    })

    it('uses the expected unlockThreshold progression by tier', () => {
      const expectedThresholdByTier = {
        1: 0n,
        2: 100n,
        3: 1000n,
        4: 10000n,
        5: 100000n,
        6: 1000000n,
        7: 10000000n,
        8: 100000000n,
        9: 1000000000n,
      }

      for (const factory of FACTORIES) {
        expect(factory.unlockThreshold).toBe(expectedThresholdByTier[factory.tier])
      }
    })

    it('defaults unknown tier unlock threshold to 0', () => {
      const unknownTier = 99
      const threshold = TIER_UNLOCK_THRESHOLDS[unknownTier] ?? 0n

      expect(threshold).toBe(0n)
    })
  })
})
