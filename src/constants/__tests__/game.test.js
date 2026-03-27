import { describe, expect, it } from 'vitest'
import {
  calculateUpgradeCost,
  GAME_CONSTANTS,
  getTierMultiplier,
  prestigeThresholdForLevel,
  PRESTIGE_QSOS_PER_LEVEL,
} from '../game'

describe('game constants helpers', () => {
  it('calculates upgrade costs using bigint math', () => {
    const cost = calculateUpgradeCost(500000000, 8)
    const expected =
      500000000n *
      BigInt(GAME_CONSTANTS.UPGRADES.COST_MULTIPLIER_BASE) *
      BigInt(GAME_CONSTANTS.UPGRADES.COST_DOUBLING_BASE) ** 8n

    expect(typeof cost).toBe('bigint')
    expect(cost).toBe(expected)
  })

  it('uses v1.2.0 upgrade thresholds and starting multiplier constants', () => {
    expect(GAME_CONSTANTS.UPGRADES.THRESHOLDS).toEqual([5, 10, 25, 50, 100, 150, 200, 250, 300])
    expect(GAME_CONSTANTS.UPGRADES.MULTIPLIER_START).toBe(5)
  })

  it('keeps license constants aligned with v1.2.0 progression model', () => {
    expect(GAME_CONSTANTS.LICENSE.TECHNICIAN_MAX_TIER).toBe(3)
    expect(GAME_CONSTANTS.LICENSE.GENERAL_MAX_TIER).toBe(6)
    expect(GAME_CONSTANTS.LICENSE.EXTRA_MAX_TIER).toBe(9)
    expect(GAME_CONSTANTS.LICENSE.GENERAL_COST).toBe(50000000)
    expect(GAME_CONSTANTS.LICENSE.EXTRA_COST).toBe(500000000)
  })

  it('supports tier-8/9 scaling in shared helper', () => {
    expect(getTierMultiplier(8)).toBe(1.03)
    expect(getTierMultiplier(9)).toBe(1.03)
  })
})

describe('prestigeThresholdForLevel', () => {
  it('returns 0n for level 0', () => {
    expect(prestigeThresholdForLevel(0n)).toBe(0n)
  })

  it('returns 0n for negative level', () => {
    expect(prestigeThresholdForLevel(-1n)).toBe(0n)
  })

  it('returns PRESTIGE_QSOS_PER_LEVEL for level 1', () => {
    expect(prestigeThresholdForLevel(1n)).toBe(PRESTIGE_QSOS_PER_LEVEL)
  })

  it('returns 8 * PRESTIGE_QSOS_PER_LEVEL for level 2', () => {
    expect(prestigeThresholdForLevel(2n)).toBe(8n * PRESTIGE_QSOS_PER_LEVEL)
  })

  it('returns 27 * PRESTIGE_QSOS_PER_LEVEL for level 3', () => {
    expect(prestigeThresholdForLevel(3n)).toBe(27n * PRESTIGE_QSOS_PER_LEVEL)
  })
})
