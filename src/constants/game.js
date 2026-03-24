/**
 * Game constants for CW Clicker
 * Centralizes all magic numbers for easier maintenance
 */

export const GAME_CONSTANTS = {
  // Audio settings
  AUDIO: {
    MIN_FREQUENCY: 400,
    MAX_FREQUENCY: 1000,
    DEFAULT_FREQUENCY: 600,
    DEFAULT_VOLUME: 0.5,
    MAX_GAIN: 0.3, // Prevent clipping
    FADE_TIME: 0.01 // seconds
  },

  // Keyer settings
  KEYER: {
    DIT_DAH_THRESHOLD_MS: 200,
    DIT_VALUE: 1,
    DAH_VALUE: 2
  },

  // Lottery/Rare DX system
  LOTTERY: {
    COOLDOWN_MS: 90000, // 90 seconds
    CHANCE: 0.05, // 5%
    BOOST_MULTIPLIER: 7, // 7x
    BOOST_DURATION_MS: 77000, // 77 seconds
    BUTTON_DURATION_MS: 10000, // 10 seconds to click
    SOLAR_STORM_CHANCE: 0.15, // 15%
    SOLAR_STORM_MULTIPLIER: 0.5, // 50% reduction
    SOLAR_STORM_DURATION_MS: 77000 // 77 seconds
  },

  // Upgrade system (Cookie Clicker style)
  UPGRADES: {
    THRESHOLDS: [1, 5, 25, 50, 100, 150, 200, 250, 300],
    MULTIPLIER: 2, // Each upgrade doubles output
    COST_MULTIPLIER_BASE: 10 // Cost = baseCost × 10^(tier)
  },

  // Factory purchase
  PURCHASE: {
    BULK_DISCOUNT: 0.95, // 5% discount
    MULTI_BUY_UNLOCK_COUNT: 10,
    MAX_BULK_ITERATIONS: 100000,
    MAX_BULK_BINARY_SEARCH: 100000
  },

  // License progression
  LICENSE: {
    TECHNICIAN_MAX_TIER: 2,
    GENERAL_MAX_TIER: 5,
    EXTRA_MAX_TIER: 7,
    GENERAL_COST: 500,
    EXTRA_COST: 5000
  },

  // Cost scaling by tier
  COST_SCALING: {
    TIER_1_2: 1.10, // 10%
    TIER_3_5: 1.07, // 7%
    TIER_6_7: 1.05 // 5%
  },

  // Game loop
  GAME_LOOP: {
    SAVE_INTERVAL_SECONDS: 30
  },

  // UI
  UI: {
    MAX_INDICATORS: 5,
    FADE_DURATION_MS: 2000,
    INDICATOR_ANIMATION_MS: 100
  },

  // Save/Import
  SAVE: {
    STORAGE_KEY: 'cw-keyer-game',
    MAX_BASE64_LENGTH: 100000, // 100KB
    MAX_DECODED_LENGTH: 50000, // 50KB
    MAX_BIGINT_DIGITS: 50 // Maximum digit length for BigInt fields to prevent DoS
  }
}

export const PRESTIGE_QSOS_PER_LEVEL = 1_000_000_000n

/**
 * Factory tiers mapped to cost scaling multipliers
 */
export function getTierMultiplier(tier) {
  if (tier >= 1 && tier <= 2) {
    return GAME_CONSTANTS.COST_SCALING.TIER_1_2
  } else if (tier >= 3 && tier <= 5) {
    return GAME_CONSTANTS.COST_SCALING.TIER_3_5
  } else if (tier >= 6 && tier <= 7) {
    return GAME_CONSTANTS.COST_SCALING.TIER_6_7
  }
  return GAME_CONSTANTS.COST_SCALING.TIER_1_2
}

/**
 * Get upgrade threshold at specific index
 */
export function getUpgradeThreshold(index) {
  return GAME_CONSTANTS.UPGRADES.THRESHOLDS[index] || null
}

/**
 * Calculate upgrade cost for a factory
 */
export function calculateUpgradeCost(factoryBaseCost, tier) {
  return BigInt(factoryBaseCost) * BigInt(GAME_CONSTANTS.UPGRADES.COST_MULTIPLIER_BASE) ** BigInt(tier + 1)
}

/**
 * Calculate the total QSOs required for a given prestige level.
 */
export function prestigeThresholdForLevel(level) {
  if (level <= 0n) {
    return 0n
  }

  return PRESTIGE_QSOS_PER_LEVEL * level * level * level
}
