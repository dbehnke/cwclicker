'use strict'

import { FACTORIES } from '../constants/factories'
import { UPGRADES } from '../constants/upgrades'

function toBigInt(value) {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.max(0, Math.floor(value)))
  }

  return 0n
}

function normalizePurchasedAt(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }

  return 0
}

function buildOrderMap(items) {
  const orderMap = new Map()

  for (let index = 0; index < items.length; index++) {
    orderMap.set(items[index].id, index)
  }

  return orderMap
}

const FACTORY_ORDER = buildOrderMap(FACTORIES)
const UPGRADE_ORDER = buildOrderMap(UPGRADES)

function makeDeterministicComparator() {
  return (a, b) => {
    if (a.baseCost !== b.baseCost) {
      return a.baseCost < b.baseCost ? -1 : 1
    }

    if (a.factoryOrder !== b.factoryOrder) {
      return a.factoryOrder - b.factoryOrder
    }

    if (a.upgradeOrder !== b.upgradeOrder) {
      return a.upgradeOrder - b.upgradeOrder
    }

    return String(a.id).localeCompare(String(b.id))
  }
}

export function buildUpgradeRailModel({
  upgrades = [],
  factories = [],
  qsos = 0n,
  factoryCounts = {},
  purchasedUpgrades = new Set(),
  upgradePurchaseMeta = {},
}) {
  const fallbackFactoryOrder = buildOrderMap(factories)
  const fallbackUpgradeOrder = buildOrderMap(upgrades)

  const getFactoryOrder = factoryId =>
    FACTORY_ORDER.get(factoryId) ?? fallbackFactoryOrder.get(factoryId) ?? Number.MAX_SAFE_INTEGER

  const getUpgradeOrder = upgradeId =>
    UPGRADE_ORDER.get(upgradeId) ?? fallbackUpgradeOrder.get(upgradeId) ?? Number.MAX_SAFE_INTEGER

  const deterministicComparator = makeDeterministicComparator()
  const availableQsos = toBigInt(qsos)

  const normalized = upgrades.map(upgrade => {
    const ownedCount = Number(factoryCounts[upgrade.factoryId] || 0)
    const baseCost = toBigInt(upgrade.baseCost)
    const isPurchased = purchasedUpgrades.has(upgrade.id)
    const isAvailable = ownedCount >= Number(upgrade.threshold || 0)
    const isAffordable = !isPurchased && isAvailable && availableQsos >= baseCost
    const purchasedAt = normalizePurchasedAt(upgradePurchaseMeta?.[upgrade.id]?.purchasedAt)

    return {
      ...upgrade,
      isPurchased,
      isAvailable,
      isAffordable,
      costDelta: baseCost - availableQsos,
      purchasedAt,
      factoryOrder: getFactoryOrder(upgrade.factoryId),
      upgradeOrder: getUpgradeOrder(upgrade.id),
    }
  })

  const readyToBuy = normalized.filter(upgrade => !upgrade.isPurchased && upgrade.isAffordable)
  const almostThere = normalized.filter(
    upgrade => !upgrade.isPurchased && upgrade.isAvailable && !upgrade.isAffordable
  )
  const recentlyPurchased = normalized.filter(upgrade => upgrade.isPurchased)
  const lockedByThreshold = normalized.filter(upgrade => !upgrade.isPurchased && !upgrade.isAvailable)

  readyToBuy.sort(deterministicComparator)
  almostThere.sort((a, b) => {
    if (a.costDelta !== b.costDelta) {
      return a.costDelta < b.costDelta ? -1 : 1
    }

    return deterministicComparator(a, b)
  })
  recentlyPurchased.sort((a, b) => {
    if (a.purchasedAt !== b.purchasedAt) {
      return b.purchasedAt - a.purchasedAt
    }

    return deterministicComparator(a, b)
  })
  lockedByThreshold.sort((a, b) => {
    if (a.threshold !== b.threshold) {
      return Number(a.threshold || 0) - Number(b.threshold || 0)
    }

    return deterministicComparator(a, b)
  })

  const priorityRow = [...readyToBuy, ...almostThere, ...recentlyPurchased].slice(0, 5)

  return {
    readyToBuy,
    almostThere,
    recentlyPurchased,
    lockedByThreshold,
    priorityRow,
    priorityRowIds: priorityRow.map(upgrade => upgrade.id),
  }
}
