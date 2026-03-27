'use strict'

import { describe, it, expect } from 'vitest'
import { UPGRADES } from '../upgrades'
import { FACTORIES } from '../factories'

describe('UPGRADES', () => {
  it('uses first upgrade threshold of 5 and first multiplier of 5', () => {
    const elmerUpgrades = UPGRADES.filter(u => u.factoryId === 'elmer')

    expect(elmerUpgrades[0].threshold).toBe(5)
    expect(elmerUpgrades[0].multiplier).toBe(5)
  })

  it('keeps multipliers and costs doubling by tier', () => {
    const elmerUpgrades = UPGRADES.filter(u => u.factoryId === 'elmer')

    for (let i = 1; i < elmerUpgrades.length; i++) {
      expect(elmerUpgrades[i].multiplier).toBe(elmerUpgrades[i - 1].multiplier * 2)
      expect(elmerUpgrades[i].baseCost).toBe(elmerUpgrades[i - 1].baseCost * 2n)
    }
  })

  it('keeps every factory on the same 9-tier threshold chain', () => {
    const expectedThresholds = [5, 10, 25, 50, 100, 150, 200, 250, 300]

    for (const factory of FACTORIES) {
      const upgrades = UPGRADES.filter(u => u.factoryId === factory.id)
      expect(upgrades).toHaveLength(9)
      expect(upgrades.map(u => u.threshold)).toEqual(expectedThresholds)
    }
  })

  it('derives first upgrade cost from current factory baseCost', () => {
    for (const factory of FACTORIES) {
      const firstUpgrade = UPGRADES.find(u => u.factoryId === factory.id && u.id.endsWith('-upgrade-0'))

      expect(firstUpgrade).toBeDefined()
      expect(firstUpgrade.baseCost).toBe(BigInt(factory.baseCost) * 50n)
    }
  })

  it('keeps late-game upgrade costs exact as bigint values under new formula', () => {
    const upgrade = UPGRADES.find(u => u.id === 'alternate-dimension-dxcc-upgrade-8')

    expect(upgrade).toBeDefined()
    expect(typeof upgrade.baseCost).toBe('bigint')
    expect(upgrade.baseCost).toBe(64000000000000n)
  })
})
