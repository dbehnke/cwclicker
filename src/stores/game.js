import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { FACTORIES } from '../constants/factories'
import { UPGRADES } from '../constants/upgrades'
import {
  PRESTIGE_QSOS_PER_LEVEL,
  prestigeThresholdForLevel,
  GAME_CONSTANTS,
} from '../constants/game'
import {
  MORSE_CHARS,
  MORSE_CHAR_LIST,
  MORSE_TIMING,
  MORSE_CHALLENGE_WRONG_RETRY_DELAY_MS,
} from '../constants/morse'

/**
 * Current game version for save data migration
 * @type {string}
 */
const GAME_VERSION = '1.2.0'
const MORSE_CHALLENGE_ADVANCE_DELAY_MS = 5000
const MORSE_CHALLENGE_TERMINAL_STATES = ['timeout', 'wrong', 'success']
const MAX_BULK_PURCHASE_COUNT = 10
const OVERFLOW_FACTORY_COST = 10n ** 100n
const MAX_PRESTIGE_LEVEL_FOR_MULTIPLIER = BigInt(Number.MAX_SAFE_INTEGER)
const MORSE_MIN_PRESS_MS = 30
const MORSE_PROFILE_WINDOW = 16
const MORSE_INITIAL_DIT_BASE_MS = MORSE_TIMING.DAH_MIN_MS / 2

/**
 * Manages the game's core state and progression.
 */
export const useGameStore = defineStore('game', () => {
  function normalizePurchaseCount(count) {
    if (!Number.isFinite(count)) {
      return 0
    }

    return Math.max(0, Math.min(MAX_BULK_PURCHASE_COUNT, Math.floor(count)))
  }

  function cubeRootFloor(value) {
    if (value < 0n) {
      return 0n
    }

    let low = 0n
    let high = 1n

    while (high * high * high <= value) {
      high *= 2n
    }

    while (low + 1n < high) {
      const mid = (low + high) / 2n
      const midCubed = mid * mid * mid

      if (midCubed === value) {
        return mid
      }

      if (midCubed < value) {
        low = mid
      } else {
        high = mid
      }
    }

    return low
  }

  // Maximum number of digits accepted for BigInt fields to prevent DoS via large-number parsing.
  const MAX_BIGINT_DIGITS = GAME_CONSTANTS.SAVE.MAX_BIGINT_DIGITS

  function parseNonNegativeBigInt(value) {
    try {
      const str = String(value ?? '0')
      if (str.length > MAX_BIGINT_DIGITS) {
        return 0n
      }
      const parsed = BigInt(str)
      return parsed < 0n ? 0n : parsed
    } catch {
      return 0n
    }
  }

  /**
   * @returns {bigint} QSO value as BigInt
   */
  const qsos = ref(0n)
  const qsosThisRun = ref(0n) // Run-scoped earned QSOs; progressive unlock logic consumes this in v1.2.0 follow-up slices
  const totalQsosEarned = ref(0n) // Total QSOs earned for prestige system
  const prestigeLevel = ref(0n)
  const prestigePoints = ref(0n)
  const licenseLevel = ref(1)
  const factoryCounts = ref({})
  const fractionalQSOs = ref(0) // Accumulate fractional QSOs between frames
  const tapPrestigeAccumulator = ref(0n) // Accumulates tap prestige bonus in percentage units (scale of 100; 1 = 1%)
  const purchasedUpgrades = ref(new Set()) // Set of upgrade IDs that have been purchased
  let cachedEligiblePrestigeLevel = 0n
  let cachedEligiblePrestigeThreshold = PRESTIGE_QSOS_PER_LEVEL

  // Migration tracking
  const migrationInfo = ref(null) // Stores info about migration for UI display

  // Audio settings
  const audioSettings = ref({
    volume: 0.5,
    frequency: 600,
    isMuted: false,
    morseWpm: 5,
  })

  // Lottery system
  const LOTTERY_COOLDOWN_MS = 90000 // 90 seconds
  const LOTTERY_CHANCE = 0.05 // 5%
  const LOTTERY_BOOST_MULTIPLIER = 7 // 7x
  const LOTTERY_BOOST_DURATION_MS = 77000 // 77 seconds
  const LOTTERY_BUTTON_DURATION_MS = 10000 // 10 seconds to click
  const SOLAR_STORM_CHANCE = 0.15 // 15% chance of negative event
  const SOLAR_STORM_MULTIPLIER = 0.5 // 50% output reduction
  const SOLAR_STORM_DURATION_MS = 77000 // 77 seconds

  // Offline progress constants
  const MIN_OFFLINE_MINUTES = 1 // Minimum time offline to trigger calculation
  const MAX_OFFLINE_HOURS = 24 // Maximum hours for offline earnings
  const OFFLINE_EFFICIENCY = 0.5 // 50% efficiency for offline earnings

  // Random phenomena titles
  const PHENOMENA_TITLES = [
    'Rare DX',
    'Tropospheric Ducting',
    'Meteor Shower',
    '6m Band Opening',
    'QSO Party!',
    'POTA POTA POTA!',
    'FT8 Protocol',
  ]

  const lotteryState = ref({
    lastTriggerTime: 0,
    isBonusAvailable: false,
    bonusFactoryId: null,
    bonusEndTime: 0,
    bonusAvailableEndTime: 0,
    phenomenonTitle: '',
    isSolarStorm: false,
    solarStormEndTime: 0,
  })

  // Morse Keying Challenge state
  const morseChallengeState = ref({
    isActive: false, // Whether challenge is currently showing
    currentChar: null, // Current character to key (e.g., 'A')
    currentPattern: '', // Morse pattern (e.g., '·−')
    keyedSequence: [], // Array of 'dit' or 'dah' keyed so far
    challengeStartTime: 0, // When current challenge started
    state: 'idle', // 'idle' | 'active' | 'success' | 'timeout' | 'wrong' | 'wrong-retry'
    triesRemaining: 3,
    lastBonusAwarded: 0,
  })

  // Whether the Morse Keying Challenge is enabled (user preference)
  const morseChallengeEnabled = ref(true)
  const morseInputDurations = ref([])

  // Timer for evaluating morse pattern after inter-character gap
  let pendingEvalTimer = null
  // Timer for the 2-second wrong-retry feedback delay (retry same letter)
  let pendingRetryTimer = null

  // Offline progress tracking
  const offlineEarnings = ref(null)

  /**
   * Processes a keyer tap to add QSOs.
   * @param {('dit'|'dah')} type - The type of keyer tap.
   */
  function tapKeyer(type) {
    if (type === 'dit') {
      addQSOs(1n)
    } else if (type === 'dah') {
      addQSOs(2n)
    } else {
      console.warn(`Invalid keyer tap type: ${type}`)
    }

    // Check for Rare DX trigger
    checkLotteryTrigger()
  }

  /**
   * Checks if Rare DX should trigger on this click.
   */
  function checkLotteryTrigger() {
    const now = Date.now()

    // Check if cooldown has passed and no bonus is currently available
    if (lotteryState.value.isBonusAvailable) {
      return
    }

    if (now - lotteryState.value.lastTriggerTime < LOTTERY_COOLDOWN_MS) {
      return
    }

    // Check if user has any factories
    const totalFactories = Object.values(factoryCounts.value).reduce((sum, count) => sum + count, 0)
    if (totalFactories === 0) {
      return
    }

    // Roll for rareDx
    if (Math.random() < LOTTERY_CHANCE) {
      triggerLottery()
    }
  }

  /**
   * Triggers the lottery bonus.
   */
  function triggerLottery() {
    const now = Date.now()
    const ownedFactoryIds = Object.entries(factoryCounts.value)
      .filter(([_, count]) => count > 0)
      .map(([id, _]) => id)

    if (ownedFactoryIds.length === 0) {
      return
    }

    // Pick random factory
    const randomFactoryId = ownedFactoryIds[Math.floor(Math.random() * ownedFactoryIds.length)]

    // Pick random phenomenon title
    const randomTitle = PHENOMENA_TITLES[Math.floor(Math.random() * PHENOMENA_TITLES.length)]

    lotteryState.value = {
      lastTriggerTime: now,
      isBonusAvailable: true,
      bonusFactoryId: randomFactoryId,
      bonusEndTime: 0,
      bonusAvailableEndTime: now + LOTTERY_BUTTON_DURATION_MS,
      phenomenonTitle: randomTitle,
      isSolarStorm: false,
      solarStormEndTime: 0,
    }
  }

  /**
   * Activates the lottery bonus (called when user clicks the bonus button).
   * Has a chance to trigger Solar Storm (negative event) instead.
   * @returns {Object} Object with success boolean and isSolarStorm flag.
   */
  function activateLotteryBonus() {
    if (!lotteryState.value.isBonusAvailable) {
      return { success: false, isSolarStorm: false }
    }

    const now = Date.now()

    // Check if button is still available
    if (now > lotteryState.value.bonusAvailableEndTime) {
      lotteryState.value.isBonusAvailable = false
      return { success: false, isSolarStorm: false }
    }

    // Check for Solar Storm (negative event)
    const isSolarStorm = Math.random() < SOLAR_STORM_CHANCE

    // Activate the bonus
    lotteryState.value.isBonusAvailable = false

    if (isSolarStorm) {
      lotteryState.value.isSolarStorm = true
      lotteryState.value.solarStormEndTime = now + SOLAR_STORM_DURATION_MS
    } else {
      lotteryState.value.bonusEndTime = now + LOTTERY_BOOST_DURATION_MS
    }

    return { success: true, isSolarStorm }
  }

  /**
   * Gets the current lottery multiplier for a factory.
   * Handles both positive bonuses (7x for one factory) and Solar Storm (0.5x for all).
   * @param {string} factoryId - The factory ID.
   * @returns {number} The multiplier (1 if no effect, 7 if positive bonus, 0.5 if solar storm).
   */
  function getLotteryMultiplier(factoryId) {
    const now = Date.now()

    // Check for Solar Storm (affects all factories negatively)
    if (lotteryState.value.isSolarStorm && now < lotteryState.value.solarStormEndTime) {
      return SOLAR_STORM_MULTIPLIER
    }

    // Check if positive bonus has expired
    if (now > lotteryState.value.bonusEndTime) {
      return 1
    }

    // Check if this is the boosted factory
    if (lotteryState.value.bonusFactoryId === factoryId) {
      return LOTTERY_BOOST_MULTIPLIER
    }

    return 1
  }

  /**
   * Adds passive QSOs from factories to the total.
   * Accumulates fractional QSOs and only adds whole numbers.
   * @param {number} amount - The amount of QSOs to add (can be fractional).
   */
  function addPassiveQSOs(amount) {
    fractionalQSOs.value += amount
    const wholeQsos = Math.floor(fractionalQSOs.value)
    if (wholeQsos > 0) {
      qsos.value = qsos.value + BigInt(wholeQsos)
      qsosThisRun.value += BigInt(wholeQsos)
      totalQsosEarned.value += BigInt(wholeQsos)
      fractionalQSOs.value -= wholeQsos
    }
  }

  /**
   * Adds QSOs from keyer taps, applying the prestige multiplier.
   * @param {bigint} amount - The base tap value before the prestige multiplier is applied.
   *   The actual QSOs credited are floor(amount * percentMultiplier / 100) over time,
   *   with any remainder carried in tapPrestigeAccumulator.
   */
  function addQSOs(amount) {
    const clampedPrestigeLevel =
      prestigeLevel.value > MAX_PRESTIGE_LEVEL_FOR_MULTIPLIER
        ? MAX_PRESTIGE_LEVEL_FOR_MULTIPLIER
        : prestigeLevel.value
    const percentMultiplier = 100n + 5n * clampedPrestigeLevel
    tapPrestigeAccumulator.value += amount * percentMultiplier
    const bonus = tapPrestigeAccumulator.value / 100n
    tapPrestigeAccumulator.value %= 100n
    qsos.value += bonus
    qsosThisRun.value += bonus
    totalQsosEarned.value += bonus
  }

  function classifyMorseTapDuration(durationMs) {
    const safeDuration = Math.max(MORSE_MIN_PRESS_MS, Math.floor(durationMs || 0))

    // Preserve classic keyer behavior: clearly long presses are always dah.
    // This prevents adaptive drift from ever requiring extra-long holds.
    if (safeDuration >= MORSE_TIMING.DAH_MIN_MS) {
      return 'dah'
    }

    const durations = [...morseInputDurations.value, safeDuration]
    const windowedDurations = durations.slice(-MORSE_PROFILE_WINDOW)
    morseInputDurations.value = windowedDurations

    if (windowedDurations.length < 4) {
      return safeDuration < MORSE_TIMING.DAH_MIN_MS ? 'dit' : 'dah'
    }

    const sorted = [...windowedDurations].sort((a, b) => a - b)
    // Use a lower-quantile estimator for dit pace so occasional dah presses
    // do not drift the dit baseline upward and delay dah recognition.
    const ditQuantileIndex = Math.floor((sorted.length - 1) * 0.35)
    const quantileDit = sorted[ditQuantileIndex] || MORSE_INITIAL_DIT_BASE_MS
    const ditBase = Math.max(MORSE_MIN_PRESS_MS, Math.min(quantileDit, MORSE_TIMING.DAH_MIN_MS * 2))

    const ditCeiling = ditBase * 1.9
    const dahFloor = ditBase * 2.1

    if (safeDuration <= ditCeiling) {
      return 'dit'
    }

    if (safeDuration >= dahFloor) {
      return 'dah'
    }

    const ditTarget = ditBase
    const dahTarget = ditBase * 3
    return Math.abs(safeDuration - ditTarget) <= Math.abs(safeDuration - dahTarget) ? 'dit' : 'dah'
  }

  const eligiblePrestigeLevel = computed(() => {
    const earned = totalQsosEarned.value

    if (earned < PRESTIGE_QSOS_PER_LEVEL) {
      cachedEligiblePrestigeLevel = 0n
      cachedEligiblePrestigeThreshold = PRESTIGE_QSOS_PER_LEVEL
      return 0n
    }

    if (earned < cachedEligiblePrestigeThreshold) {
      return cachedEligiblePrestigeLevel
    }

    // Threshold crossed: compute the exact new level directly instead of incrementing level-by-level.
    cachedEligiblePrestigeLevel = cubeRootFloor(earned / PRESTIGE_QSOS_PER_LEVEL)
    cachedEligiblePrestigeThreshold = prestigeThresholdForLevel(cachedEligiblePrestigeLevel + 1n)

    return cachedEligiblePrestigeLevel
  })

  const canPrestigeReset = computed(() => eligiblePrestigeLevel.value > prestigeLevel.value)

  const prestigeMultiplier = computed(() => {
    const safePrestigeLevel =
      prestigeLevel.value > MAX_PRESTIGE_LEVEL_FOR_MULTIPLIER
        ? MAX_PRESTIGE_LEVEL_FOR_MULTIPLIER
        : prestigeLevel.value

    return 1 + Number(safePrestigeLevel) * 0.05
  })

  function prestigeReset() {
    const eligibleLevel = eligiblePrestigeLevel.value
    const newPoints = eligibleLevel > prestigeLevel.value ? eligibleLevel - prestigeLevel.value : 0n

    prestigePoints.value += newPoints
    prestigeLevel.value = eligibleLevel > prestigeLevel.value ? eligibleLevel : prestigeLevel.value

    qsos.value = 0n
    qsosThisRun.value = 0n
    factoryCounts.value = {}
    fractionalQSOs.value = 0
    tapPrestigeAccumulator.value = 0n
    purchasedUpgrades.value = new Set()
    licenseLevel.value = 1
    offlineEarnings.value = null
    lotteryState.value = {
      lastTriggerTime: 0,
      isBonusAvailable: false,
      bonusFactoryId: null,
      bonusEndTime: 0,
      bonusAvailableEndTime: 0,
      phenomenonTitle: '',
      isSolarStorm: false,
      solarStormEndTime: 0,
    }
    migrationInfo.value = null
    morseChallengeState.value = {
      isActive: false,
      currentChar: null,
      currentPattern: '',
      keyedSequence: [],
      challengeStartTime: 0,
      state: 'idle',
    }
    if (pendingEvalTimer) {
      clearTimeout(pendingEvalTimer)
      pendingEvalTimer = null
    }
    morseInputDurations.value = []
    save()
  }

  function setTotalQsosEarned(value) {
    totalQsosEarned.value = value
    cachedEligiblePrestigeLevel = 0n
    cachedEligiblePrestigeThreshold = PRESTIGE_QSOS_PER_LEVEL
  }

  function normalizePrestigeState() {
    const eligibleLevel = eligiblePrestigeLevel.value

    if (prestigeLevel.value === 0n && prestigePoints.value === 0n && eligibleLevel > 0n) {
      prestigeLevel.value = eligibleLevel
      prestigePoints.value = eligibleLevel
    }
  }

  /**
   * Gets the tier multiplier for cost calculation.
   * @param {number} tier - The factory tier (1-7).
   * @returns {number} The multiplier for cost calculation.
   */
  function getTierMultiplier(tier) {
    if (tier >= 1 && tier <= 2) {
      return 1.1
    } else if (tier >= 3 && tier <= 5) {
      return 1.07
    } else if (tier >= 6 && tier <= 7) {
      return 1.05
    } else if (tier >= 8 && tier <= 9) {
      return 1.03
    }
    return 1.1
  }

  /**
   * Calculates the cost of a factory based on owned count.
   * @param {string} factoryId - The factory ID.
   * @param {number} owned - The number of factories currently owned.
   * @returns {bigint} The cost of the next factory.
   */
  function getFactoryCost(factoryId, owned) {
    const factory = FACTORIES.find(f => f.id === factoryId)
    if (!factory) {
      console.warn(`Factory not found: ${factoryId}`)
      return 0n
    }

    const multiplier = getTierMultiplier(factory.tier)
    const cost = factory.baseCost * Math.pow(multiplier, owned)
    if (!Number.isFinite(cost)) {
      return OVERFLOW_FACTORY_COST
    }

    return BigInt(Math.floor(cost))
  }

  /**
   * Calculates the bulk cost for buying multiple factories.
   * @param {string} factoryId - The factory ID.
   * @param {number} count - The number of factories to buy.
   * @returns {bigint} The total cost with 5% discount.
   */
  function getBulkCost(factoryId, count) {
    const factory = FACTORIES.find(f => f.id === factoryId)
    if (!factory) {
      console.warn(`Factory not found: ${factoryId}`)
      return 0n
    }

    const purchaseCount = normalizePurchaseCount(count)
    const currentOwned = factoryCounts.value[factoryId] || 0
    let totalCost = 0n

    for (let i = 0; i < purchaseCount; i++) {
      totalCost += getFactoryCost(factoryId, currentOwned + i)
    }

    // Apply 5% discount: totalCost * 95 / 100
    return (totalCost * 95n) / 100n
  }

  /**
   * Buys factories and deducts QSOs.
   * @param {string} factoryId - The factory ID.
   * @param {number} count - The number of factories to buy (default 1).
   * @returns {boolean} True if purchase succeeded, false otherwise.
   */
  function buyFactory(factoryId, count = 1) {
    const factory = FACTORIES.find(f => f.id === factoryId)
    if (!factory) {
      console.warn(`Factory not found: ${factoryId}`)
      return false
    }

    const purchaseCount = normalizePurchaseCount(count)
    if (purchaseCount <= 0) {
      return false
    }

    const cost = getBulkCost(factoryId, purchaseCount)

    if (qsos.value < cost) {
      return false
    }

    qsos.value -= cost
    factoryCounts.value[factoryId] = (factoryCounts.value[factoryId] || 0) + purchaseCount

    return true
  }

  /**
   * Gets available upgrades for a factory that haven't been purchased yet.
   * @param {string} factoryId - The factory ID.
   * @returns {Array} Array of available upgrades with their costs.
   */
  function getAvailableUpgrades(factoryId) {
    const ownedCount = factoryCounts.value[factoryId] || 0
    const factory = FACTORIES.find(f => f.id === factoryId)
    if (!factory) {
      return []
    }

    return UPGRADES.filter(upgrade => {
      // Must be for this factory
      if (upgrade.factoryId !== factoryId) {
        return false
      }
      // Must meet threshold
      if (upgrade.threshold > ownedCount) {
        return false
      }
      // Must not already be purchased
      if (purchasedUpgrades.value.has(upgrade.id)) {
        return false
      }
      return true
    })
  }

  /**
   * Buys an upgrade and deducts QSOs.
   * @param {string} upgradeId - The upgrade ID.
   * @returns {boolean} True if purchase succeeded, false otherwise.
   */
  function buyUpgrade(upgradeId) {
    const upgrade = UPGRADES.find(u => u.id === upgradeId)
    if (!upgrade) {
      console.warn(`Upgrade not found: ${upgradeId}`)
      return false
    }

    // Check if already purchased
    if (purchasedUpgrades.value.has(upgradeId)) {
      return false
    }

    // Check if factory is owned
    const ownedCount = factoryCounts.value[upgrade.factoryId] || 0
    if (ownedCount < upgrade.threshold) {
      return false
    }

    const cost = upgrade.baseCost

    if (qsos.value < cost) {
      return false
    }

    qsos.value -= cost
    purchasedUpgrades.value.add(upgradeId)

    return true
  }

  /**
   * Pre-computed upgrade multipliers for all factories.
   * This is a computed property that only recalculates when purchasedUpgrades changes.
   * Much more efficient than scanning all upgrades on every call.
   */
  const upgradeMultipliers = computed(() => {
    const multipliers = {}

    // Initialize all factories with multiplier of 1
    for (const factory of FACTORIES) {
      multipliers[factory.id] = 1
    }

    // Apply purchased upgrades
    for (const upgradeId of purchasedUpgrades.value) {
      const upgrade = UPGRADES.find(u => u.id === upgradeId)
      if (upgrade) {
        multipliers[upgrade.factoryId] = (multipliers[upgrade.factoryId] || 1) * upgrade.multiplier
      }
    }

    return multipliers
  })

  /**
   * Gets the total upgrade multiplier for a factory.
   * Uses cached computed property for O(1) lookup instead of O(n) scan.
   * @param {string} factoryId - The factory ID.
   * @returns {number} The multiplier (1.0 if no upgrades, 2.0, 4.0, 8.0, etc. with upgrades).
   */
  function getUpgradeMultiplier(factoryId) {
    return upgradeMultipliers.value[factoryId] || 1
  }

  /**
   * Clears expired bonus state when a bonus ends.
   * Called by RareDxBonus component when timer detects expiration.
   */
  function clearExpiredBonus() {
    lotteryState.value.bonusFactoryId = null
    lotteryState.value.bonusEndTime = 0
    save()
  }

  /**
   * Saves the current game state to localStorage.
   */
  function save() {
    try {
      const state = {
        version: GAME_VERSION,
        qsos: qsos.value.toString(),
        qsosThisRun: qsosThisRun.value.toString(),
        totalQsosEarned: totalQsosEarned.value.toString(),
        prestigeLevel: prestigeLevel.value.toString(),
        prestigePoints: prestigePoints.value.toString(),
        licenseLevel: licenseLevel.value,
        factoryCounts: factoryCounts.value,
        fractionalQSOs: fractionalQSOs.value,
        tapPrestigeAccumulator: tapPrestigeAccumulator.value.toString(),
        audioSettings: audioSettings.value,
        lotteryState: lotteryState.value,
        purchasedUpgrades: Array.from(purchasedUpgrades.value),
        lastSaveTime: Date.now(),
        offlineEarnings: offlineEarnings.value,
        morseChallengeState: morseChallengeState.value,
        morseChallengeEnabled: morseChallengeEnabled.value,
      }
      localStorage.setItem('cw-keyer-game', JSON.stringify(state))
    } catch (e) {
      console.warn('Failed to save game state:', e)
    }
  }

  /**
   * Loads the game state from localStorage.
   * Handles migration from older versions.
   */
  function load() {
    try {
      const saved = localStorage.getItem('cw-keyer-game')
      if (saved) {
        const state = JSON.parse(saved)

        // Check for old save data (v1.0.0 or earlier - no version field)
        if (!state.version) {
          console.warn('Detected v1.0.0 save data - migrating to v1.1.0 with clean slate')

          // Store migration info for UI to display
          migrationInfo.value = {
            fromVersion: '1.0.0',
            toVersion: GAME_VERSION,
            reason: 'Major update requires fresh start',
            oldFactories: Object.values(state.factoryCounts || {}).reduce((a, b) => a + b, 0),
            oldQsos: state.qsos || '0',
            oldLicense: state.licenseLevel || 1,
          }

          // Clear the old save - start fresh
          localStorage.removeItem('cw-keyer-game')

          // Don't load old data - return with defaults
          return
        }

        qsos.value = parseNonNegativeBigInt(state.qsos || '0')
        qsosThisRun.value = parseNonNegativeBigInt(state.qsosThisRun ?? state.qsos ?? '0')
        setTotalQsosEarned(parseNonNegativeBigInt(state.totalQsosEarned || state.qsos || '0'))
        const hasPrestigeLevelField = 'prestigeLevel' in state
        const hasPrestigePointsField = 'prestigePoints' in state
        const hasBothPrestigeFields = hasPrestigeLevelField && hasPrestigePointsField

        if (hasBothPrestigeFields) {
          prestigeLevel.value = parseNonNegativeBigInt(state.prestigeLevel)
          prestigePoints.value = parseNonNegativeBigInt(state.prestigePoints)

          // Guard against inconsistent prestige data from sanitized/corrupt saves:
          // normalizePrestigeState() only acts when both fields are 0n, so when
          // prestigeLevel>0 but prestigePoints=0 we repair directly.
          if (prestigeLevel.value > 0n && prestigePoints.value === 0n) {
            prestigePoints.value = prestigeLevel.value
          }
        } else {
          // If either prestige field is missing, derive a consistent prestige state
          normalizePrestigeState()
        }
        licenseLevel.value = state.licenseLevel || 1
        factoryCounts.value = state.factoryCounts || {}
        fractionalQSOs.value = state.fractionalQSOs || 0
        tapPrestigeAccumulator.value = parseNonNegativeBigInt(state.tapPrestigeAccumulator)

        if (state.audioSettings) {
          audioSettings.value = {
            volume: state.audioSettings.volume ?? 0.5,
            frequency: state.audioSettings.frequency ?? 600,
            isMuted: state.audioSettings.isMuted ?? false,
            morseWpm: state.audioSettings.morseWpm ?? 5,
          }
        }

        // Restore lottery state (check if bonus/storm has expired)
        if (state.lotteryState) {
          const now = Date.now()
          const savedSolarStormEndTime = Number(state.lotteryState.solarStormEndTime)
          const normalizedSolarStormEndTime = Number.isFinite(savedSolarStormEndTime)
            ? savedSolarStormEndTime
            : 0
          const savedIsSolarStorm = state.lotteryState.isSolarStorm === true
          const hadActiveStormAtLoad = savedIsSolarStorm && now < normalizedSolarStormEndTime

          lotteryState.value = {
            lastTriggerTime: state.lotteryState.lastTriggerTime || 0,
            isBonusAvailable:
              state.lotteryState.isBonusAvailable && now < state.lotteryState.bonusAvailableEndTime,
            bonusFactoryId: state.lotteryState.bonusFactoryId || null,
            bonusEndTime: state.lotteryState.bonusEndTime || 0,
            bonusAvailableEndTime: state.lotteryState.bonusAvailableEndTime || 0,
            phenomenonTitle: state.lotteryState.phenomenonTitle || '',
            isSolarStorm: hadActiveStormAtLoad,
            solarStormEndTime: hadActiveStormAtLoad ? now + SOLAR_STORM_DURATION_MS : 0,
          }
        }

        // Restore purchased upgrades
        if (state.purchasedUpgrades) {
          purchasedUpgrades.value = new Set(state.purchasedUpgrades)
        }

        // Restore offline earnings notification if present and user hasn't dismissed it
        if (state.offlineEarnings && state.offlineEarnings.qsos > 0) {
          offlineEarnings.value = state.offlineEarnings
        }

        // Restore morse challenge enabled preference
        morseChallengeEnabled.value = state.morseChallengeEnabled ?? true

        // Restore morse challenge state
        if (state.morseChallengeState) {
          morseChallengeState.value = {
            isActive: state.morseChallengeState.isActive || false,
            currentChar: state.morseChallengeState.currentChar || null,
            currentPattern: state.morseChallengeState.currentPattern || '',
            keyedSequence: state.morseChallengeState.keyedSequence || [],
            challengeStartTime: state.morseChallengeState.challengeStartTime || 0,
            state: state.morseChallengeState.state || 'idle',
            triesRemaining: state.morseChallengeState.triesRemaining ?? 3,
            lastBonusAwarded: state.morseChallengeState.lastBonusAwarded ?? 0,
          }
          // Clear any pending inter-character gap timer from before save
          // The component will re-evaluate on mount
          if (pendingEvalTimer) {
            clearTimeout(pendingEvalTimer)
            pendingEvalTimer = null
          }
          // If restored in a terminal state (success/timeout/wrong) and challenge is
          // enabled, restart immediately — the advance setTimeout was lost on reload
          if (
            MORSE_CHALLENGE_TERMINAL_STATES.includes(morseChallengeState.value.state) &&
            morseChallengeEnabled.value
          ) {
            startMorseChallenge()
          }
        }

        // Calculate offline progress
        if (state.lastSaveTime) {
          const now = Date.now()
          const offlineMs = now - state.lastSaveTime

          // Validate: must be positive (not a clock rollback) and not excessive
          const MAX_REASONABLE_OFFLINE_MS = MAX_OFFLINE_HOURS * 60 * 60 * 1000 // 24 hours in ms
          if (offlineMs > 0 && offlineMs <= MAX_REASONABLE_OFFLINE_MS) {
            const offlineMinutes = offlineMs / (1000 * 60)
            const offlineHours = offlineMs / (1000 * 60 * 60)

            // Only calculate if offline for more than minimum threshold
            if (offlineMinutes >= MIN_OFFLINE_MINUTES) {
              const productionRate = getTotalQSOsPerSecond()
              const offlineQsos = calculateOfflineProgress(offlineHours, productionRate)

              if (offlineQsos > 0 && Number.isSafeInteger(offlineQsos)) {
                qsos.value = qsos.value + BigInt(offlineQsos)
                qsosThisRun.value += BigInt(offlineQsos)
                totalQsosEarned.value += BigInt(offlineQsos)

                // Store offline earnings info for UI display
                const roundedHours = Math.min(Math.ceil(offlineHours), MAX_OFFLINE_HOURS)
                offlineEarnings.value = {
                  qsos: offlineQsos,
                  hours: roundedHours,
                  rate: productionRate,
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load game state:', e)
    }
  }

  /**
   * Calculates the total QSOs per second from all owned factories.
   * Applies upgrade multipliers and lottery bonuses.
   * @returns {number} The total QSOs per second.
   */
  function getTotalQSOsPerSecond() {
    let total = 0

    for (const [factoryId, count] of Object.entries(factoryCounts.value)) {
      const factory = FACTORIES.find(f => f.id === factoryId)
      if (factory) {
        const lotteryMultiplier = getLotteryMultiplier(factoryId)
        const upgradeMultiplier = getUpgradeMultiplier(factoryId)
        const contribution =
          factory.qsosPerSecond *
          count *
          lotteryMultiplier *
          upgradeMultiplier *
          prestigeMultiplier.value

        if (
          !Number.isFinite(contribution) ||
          contribution < 0 ||
          contribution > Number.MAX_SAFE_INTEGER
        ) {
          continue
        }

        total += contribution
        if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER) {
          return 0
        }
      }
    }

    return Number.isFinite(total) && total > 0 && total <= Number.MAX_SAFE_INTEGER ? total : 0
  }

  /**
   * Updates audio settings and saves state.
   * @param {Object} settings - The new audio settings
   */
  function updateAudioSettings(settings) {
    audioSettings.value = { ...audioSettings.value, ...settings }
    save()
  }

  /**
   * Calculates QSOs earned while offline.
   * Formula: rate × hours × 0.5, capped at 24 hours
   * @param {number} hours - Hours offline
   * @param {number} rate - QSOs per second production rate
   * @returns {number} QSOs earned (integer)
   */
  function calculateOfflineProgress(hours, rate) {
    // Validate inputs
    if (!hours || hours <= 0 || !rate || rate <= 0) {
      return 0
    }

    // Cap at maximum hours
    const cappedHours = Math.min(hours, MAX_OFFLINE_HOURS)

    // Calculate: rate × hours × 3600 seconds/hour × efficiency
    // 50% efficiency means players earn half while offline (encourages active play)
    const qsosEarned = rate * cappedHours * 3600 * OFFLINE_EFFICIENCY

    return Math.floor(qsosEarned)
  }

  /**
   * Dismisses the offline earnings notification.
   */
  function dismissOfflineEarnings() {
    offlineEarnings.value = null
  }

  /**
   * Gets the QRQ Protocol factory's current output per second
   * Includes all multipliers: upgrades, prestige, lottery
   * @returns {number} QSOs per second
   */
  function getQRQOutput() {
    const factory = FACTORIES.find(f => f.id === 'qrq-protocol')
    if (!factory) {
      return 0.1
    }

    const count = factoryCounts.value['qrq-protocol'] || 0
    if (count === 0) {
      return 0.1
    }

    const baseOutput = factory.qsosPerSecond * count
    const upgradeMult = getUpgradeMultiplier('qrq-protocol')
    const prestigeMult = prestigeMultiplier.value
    const lotteryMult = getLotteryMultiplier('qrq-protocol')

    const output = baseOutput * upgradeMult * prestigeMult * lotteryMult

    if (!Number.isFinite(output) || output <= 0) {
      return 0
    }
    if (output > Number.MAX_SAFE_INTEGER) {
      return Number.MAX_SAFE_INTEGER
    }

    return output
  }

  /**
   * Starts a new morse challenge with a random character
   */
  function startMorseChallenge() {
    const char = MORSE_CHAR_LIST[Math.floor(Math.random() * MORSE_CHAR_LIST.length)]
    const pattern = MORSE_CHARS[char] || ''

    morseChallengeState.value = {
      isActive: true,
      currentChar: char,
      currentPattern: pattern,
      keyedSequence: [],
      challengeStartTime: Date.now(),
      state: 'active',
      triesRemaining: 3,
      lastBonusAwarded: 0,
    }
  }

  /**
   * Enters the 'wrong-retry' state: shows 2-second feedback, then resets the sequence
   * and returns to 'active' for another attempt at the same letter.
   */
  function startWrongRetry(triesRemaining) {
    morseChallengeState.value.state = 'wrong-retry'
    morseChallengeState.value.triesRemaining = triesRemaining
    pendingRetryTimer = setTimeout(() => {
      pendingRetryTimer = null
      if (morseChallengeState.value.state === 'wrong-retry') {
        morseChallengeState.value.keyedSequence = []
        morseChallengeState.value.state = 'active'
      }
    }, MORSE_CHALLENGE_WRONG_RETRY_DELAY_MS)
  }

  /**
   * Handles a classified key event during morse challenge.
   * The caller (e.g. KeyerArea) is responsible for determining whether a tap is a dit or dah.
   * After each correct-prefix tap, schedules an inter-character gap timer to auto-evaluate.
   * @param {'dit'|'dah'|'timeout'} type - Tap classification; 'timeout' indicates an inactivity timeout.
   */
  function handleMorseKeyTap(type) {
    const state = morseChallengeState.value

    // Handle timeout sentinel — valid from both 'active' and 'wrong-retry' states
    if (type === 'timeout') {
      if (state.state !== 'active' && state.state !== 'wrong-retry') {
        return
      }
      if (pendingRetryTimer) {
        clearTimeout(pendingRetryTimer)
        pendingRetryTimer = null
      }
      if (pendingEvalTimer) {
        clearTimeout(pendingEvalTimer)
        pendingEvalTimer = null
      }
      morseChallengeState.value.state = 'timeout'
      setTimeout(() => {
        advanceMorseLetter()
      }, MORSE_CHALLENGE_ADVANCE_DELAY_MS)
      return
    }

    // All other tap types require 'active' state
    if (state.state !== 'active') {
      return
    }

    // Cancel any pending inter-character gap evaluation timer
    if (pendingEvalTimer) {
      clearTimeout(pendingEvalTimer)
      pendingEvalTimer = null
    }

    // Add tap to sequence
    state.keyedSequence.push(type)

    // Map keyed sequence to symbols for comparison
    const pattern = state.currentPattern.split('')
    const keyed = state.keyedSequence.map(s => (s === 'dit' ? '·' : '−'))

    // Check for exact match — success
    if (keyed.length === pattern.length && keyed.every((v, i) => v === pattern[i])) {
      grantMorseBonus()
      return
    }

    // Check if keyed sequence diverges from the pattern prefix
    if (!pattern.slice(0, keyed.length).every((v, i) => v === keyed[i])) {
      // Wrong input — consume a try
      // triesRemaining > 1: at least 2 tries remain — show 2-second feedback then retry same letter
      // triesRemaining === 1: this is the final try; exhausting it fails immediately
      if (state.triesRemaining > 1) {
        startWrongRetry(state.triesRemaining - 1)
      } else {
        // Last try exhausted (triesRemaining was 1) — fail
        morseChallengeState.value.state = 'wrong'
        setTimeout(() => {
          advanceMorseLetter()
        }, MORSE_CHALLENGE_ADVANCE_DELAY_MS)
      }
      return
    }

    // Correct prefix so far — schedule evaluation after the inter-character gap elapses
    pendingEvalTimer = setTimeout(() => {
      pendingEvalTimer = null
      evaluateMorsePattern()
    }, MORSE_TIMING.INTER_GAP_MIN_MS)
  }

  /**
   * Evaluates the current keyed sequence against the target pattern.
   * Called by the inter-character gap timer after a pause in keying.
   * Applies the tries mechanism — retries same letter if tries remain.
   */
  function evaluateMorsePattern() {
    const state = morseChallengeState.value
    if (!state.isActive || state.state !== 'active') {
      return
    }

    const pattern = state.currentPattern.split('')
    const keyed = state.keyedSequence.map(s => (s === 'dit' ? '·' : '−'))

    if (keyed.length === pattern.length && keyed.every((v, i) => v === pattern[i])) {
      grantMorseBonus()
    } else if (state.triesRemaining > 1) {
      // Incomplete or wrong — still has tries: show 2-second feedback then retry same letter
      startWrongRetry(state.triesRemaining - 1)
    } else {
      // Last try exhausted — fail and advance to next letter
      morseChallengeState.value.state = 'wrong'
      setTimeout(() => {
        advanceMorseLetter()
      }, MORSE_CHALLENGE_ADVANCE_DELAY_MS)
    }
  }

  /**
   * Grants the QRQ bonus for correct keying
   */
  function grantMorseBonus() {
    const bonus = getQRQOutput()
    if (bonus > 0) {
      addPassiveQSOs(bonus)
    }
    morseChallengeState.value.state = 'success'
    morseChallengeState.value.lastBonusAwarded = bonus
    setTimeout(() => {
      advanceMorseLetter()
    }, MORSE_CHALLENGE_ADVANCE_DELAY_MS)
  }

  /**
   * Advances to the next letter after success, timeout, or exhausted tries
   */
  function advanceMorseLetter() {
    if (pendingEvalTimer) {
      clearTimeout(pendingEvalTimer)
      pendingEvalTimer = null
    }
    if (pendingRetryTimer) {
      clearTimeout(pendingRetryTimer)
      pendingRetryTimer = null
    }
    startMorseChallenge()
  }

  /**
   * Toggles the Morse Challenge on or off.
   * Disabling cancels any pending timers and resets the challenge to idle.
   * Enabling starts a fresh challenge immediately.
   */
  function toggleMorseChallenge() {
    if (morseChallengeEnabled.value) {
      if (pendingEvalTimer) {
        clearTimeout(pendingEvalTimer)
        pendingEvalTimer = null
      }
      if (pendingRetryTimer) {
        clearTimeout(pendingRetryTimer)
        pendingRetryTimer = null
      }
      morseChallengeEnabled.value = false
      morseChallengeState.value = {
        isActive: false,
        currentChar: null,
        currentPattern: '',
        keyedSequence: [],
        challengeStartTime: 0,
        state: 'idle',
        triesRemaining: 3,
        lastBonusAwarded: 0,
      }
    } else {
      morseChallengeEnabled.value = true
      startMorseChallenge()
    }
    save()
  }

  return {
    qsos,
    qsosThisRun,
    totalQsosEarned,
    prestigeLevel,
    prestigePoints,
    licenseLevel,
    factoryCounts,
    fractionalQSOs,
    tapPrestigeAccumulator,
    audioSettings,
    lotteryState,
    morseChallengeState,
    purchasedUpgrades,
    migrationInfo, // For UI to display migration message
    tapKeyer,
    addPassiveQSOs,
    addQSOs,
    getFactoryCost,
    getBulkCost,
    buyFactory,
    getTotalQSOsPerSecond,
    updateAudioSettings,
    activateLotteryBonus,
    getLotteryMultiplier,
    getAvailableUpgrades,
    buyUpgrade,
    getUpgradeMultiplier,
    eligiblePrestigeLevel,
    canPrestigeReset,
    prestigeMultiplier,
    prestigeReset,
    normalizePrestigeState,
    clearExpiredBonus,
    offlineEarnings,
    calculateOfflineProgress,
    dismissOfflineEarnings,
    getQRQOutput,
    startMorseChallenge,
    handleMorseKeyTap,
    classifyMorseTapDuration,
    morseChallengeEnabled,
    toggleMorseChallenge,
    save,
    load,
  }
})
