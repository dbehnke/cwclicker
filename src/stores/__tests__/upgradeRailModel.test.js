import { describe, it, expect } from 'vitest'
import { buildUpgradeRailModel } from '../upgradeRailModel'

describe('buildUpgradeRailModel', () => {
  it('puts affordable upgrades first in the priority row', () => {
    const factories = [{ id: 'a' }, { id: 'b' }]
    const upgrades = [
      { id: 'u1', factoryId: 'a', threshold: 1, baseCost: 10n },
      { id: 'u2', factoryId: 'b', threshold: 1, baseCost: 8n },
      { id: 'u3', factoryId: 'a', threshold: 5, baseCost: 1n },
      { id: 'u4', factoryId: 'b', threshold: 1, baseCost: 30n },
      { id: 'u5', factoryId: 'a', threshold: 1, baseCost: 12n },
      { id: 'u6', factoryId: 'b', threshold: 1, baseCost: 11n },
    ]

    const model = buildUpgradeRailModel({
      upgrades,
      factories,
      qsos: 11n,
      factoryCounts: { a: 1, b: 1 },
      purchasedUpgrades: new Set(['u5']),
      upgradePurchaseMeta: {
        u5: 100,
      },
    })

    expect(model.priorityRowIds).toEqual(['u2', 'u1', 'u6', 'u4', 'u5'])
  })

  it('applies deterministic tie-breakers when costs tie', () => {
    const factories = [{ id: 'factory-b' }, { id: 'factory-a' }]
    const upgrades = [
      { id: 'ua', factoryId: 'factory-a', threshold: 1, baseCost: 10n },
      { id: 'ub', factoryId: 'factory-b', threshold: 1, baseCost: 10n },
      { id: 'uc', factoryId: 'factory-a', threshold: 1, baseCost: 10n },
    ]

    const model = buildUpgradeRailModel({
      upgrades,
      factories,
      qsos: 10n,
      factoryCounts: { 'factory-a': 1, 'factory-b': 1 },
      purchasedUpgrades: new Set(),
      upgradePurchaseMeta: {},
    })

    expect(model.readyToBuy.map(upgrade => upgrade.id)).toEqual(['ub', 'ua', 'uc'])
  })

  it('normalizes malformed purchase metadata and stays deterministic', () => {
    const factories = [{ id: 'factory-a' }, { id: 'factory-b' }]
    const upgrades = [
      { id: 'p1', factoryId: 'factory-a', threshold: 1, baseCost: 20n },
      { id: 'p2', factoryId: 'factory-b', threshold: 1, baseCost: 20n },
      { id: 'p3', factoryId: 'factory-a', threshold: 1, baseCost: 20n },
    ]

    const model = buildUpgradeRailModel({
      upgrades,
      factories,
      qsos: 0n,
      factoryCounts: { 'factory-a': 1, 'factory-b': 1 },
      purchasedUpgrades: new Set(['p1', 'p2', 'p3']),
      upgradePurchaseMeta: {
        p1: 500,
        p2: 'broken',
      },
    })

    expect(model.recentlyPurchased.map(upgrade => upgrade.id)).toEqual(['p1', 'p3', 'p2'])
    expect(model.recentlyPurchased.map(upgrade => upgrade.purchasedAt)).toEqual([500, 0, 0])
    expect(model.priorityRowIds).toEqual(['p1', 'p3', 'p2'])
  })

  it('supports legacy nested metadata shape for compatibility', () => {
    const factories = [{ id: 'factory-a' }]
    const upgrades = [{ id: 'p1', factoryId: 'factory-a', threshold: 1, baseCost: 20n }]

    const model = buildUpgradeRailModel({
      upgrades,
      factories,
      qsos: 0n,
      factoryCounts: { 'factory-a': 1 },
      purchasedUpgrades: new Set(['p1']),
      upgradePurchaseMeta: {
        p1: { purchasedAt: 750 },
      },
    })

    expect(model.recentlyPurchased.map(upgrade => upgrade.purchasedAt)).toEqual([750])
  })

  it('treats purchased upgrades as unavailable and scopes cost delta to almost-there', () => {
    const factories = [{ id: 'factory-a' }]
    const upgrades = [
      { id: 'ready', factoryId: 'factory-a', threshold: 1, baseCost: 10n },
      { id: 'almost', factoryId: 'factory-a', threshold: 1, baseCost: 12n },
      { id: 'locked', factoryId: 'factory-a', threshold: 3, baseCost: 20n },
      { id: 'purchased', factoryId: 'factory-a', threshold: 1, baseCost: 15n },
    ]

    const model = buildUpgradeRailModel({
      upgrades,
      factories,
      qsos: 11n,
      factoryCounts: { 'factory-a': 1 },
      purchasedUpgrades: new Set(['purchased']),
      upgradePurchaseMeta: {
        purchased: 100,
      },
    })

    const byId = new Map(model.priorityRow.concat(model.lockedByThreshold).map(upgrade => [upgrade.id, upgrade]))

    expect(byId.get('ready').isAvailable).toBe(true)
    expect(byId.get('ready').costDelta).toBe(0n)

    expect(byId.get('almost').isAvailable).toBe(true)
    expect(byId.get('almost').costDelta).toBe(1n)

    expect(byId.get('locked').isAvailable).toBe(false)
    expect(byId.get('locked').costDelta).toBe(0n)

    expect(byId.get('purchased').isAvailable).toBe(false)
    expect(byId.get('purchased').costDelta).toBe(0n)
  })
})
