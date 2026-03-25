import { describe, expect, it } from 'vitest'
import { calculateUpgradeCost, GAME_CONSTANTS, prestigeThresholdForLevel, PRESTIGE_QSOS_PER_LEVEL } from '../game'

describe('game constants helpers', () => {
  it('calculates upgrade costs using bigint math', () => {
    const cost = calculateUpgradeCost(500000000, 8)
    const expected = 500000000n * BigInt(GAME_CONSTANTS.UPGRADES.COST_MULTIPLIER_BASE) ** 9n

    expect(typeof cost).toBe('bigint')
    expect(cost).toBe(expected)
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
