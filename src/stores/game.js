import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { FACTORIES } from '../constants/factories'
import { UPGRADES } from '../constants/upgrades'

/**
 * Current game version for save data migration
 * @type {string}
 */
const GAME_VERSION = '1.1.2'
const MAX_BULK_PURCHASE_COUNT = 10
const OVERFLOW_FACTORY_COST = 10n ** 100n

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

  /**
   * @returns {bigint} QSO value as BigInt
   */
  const qsos = ref(0n)
  const totalQsosEarned = ref(0n) // Total QSOs earned for prestige system
  const licenseLevel = ref(1)
  const factoryCounts = ref({})
  const fractionalQSOs = ref(0) // Accumulate fractional QSOs between frames
  const purchasedUpgrades = ref(new Set()) // Set of upgrade IDs that have been purchased

  // Migration tracking
  const migrationInfo = ref(null) // Stores info about migration for UI display

  // Audio settings
  const audioSettings = ref({
    volume: 0.5,
    frequency: 600,
    isMuted: false,
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
      totalQsosEarned.value += BigInt(wholeQsos)
      fractionalQSOs.value -= wholeQsos
    }
  }

  /**
   * Adds QSOs from keyer taps.
   * @param {bigint} amount - The amount of QSOs to add.
   */
  function addQSOs(amount) {
    qsos.value += amount
    totalQsosEarned.value += amount
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
    if (!factory) return []

    return UPGRADES.filter(upgrade => {
      // Must be for this factory
      if (upgrade.factoryId !== factoryId) return false
      // Must meet threshold
      if (upgrade.threshold > ownedCount) return false
      // Must not already be purchased
      if (purchasedUpgrades.value.has(upgrade.id)) return false
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

    const cost = BigInt(upgrade.baseCost)

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
        totalQsosEarned: totalQsosEarned.value.toString(),
        licenseLevel: licenseLevel.value,
        factoryCounts: factoryCounts.value,
        fractionalQSOs: fractionalQSOs.value,
        audioSettings: audioSettings.value,
        lotteryState: lotteryState.value,
        purchasedUpgrades: Array.from(purchasedUpgrades.value),
        lastSaveTime: Date.now(),
        offlineEarnings: offlineEarnings.value,
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
          console.log('Detected v1.0.0 save data - migrating to v1.1.0 with clean slate')

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

        qsos.value = BigInt(state.qsos || '0')
        totalQsosEarned.value = BigInt(state.totalQsosEarned || state.qsos || '0')
        licenseLevel.value = state.licenseLevel || 1
        factoryCounts.value = state.factoryCounts || {}
        fractionalQSOs.value = state.fractionalQSOs || 0

        if (state.audioSettings) {
          audioSettings.value = {
            volume: state.audioSettings.volume ?? 0.5,
            frequency: state.audioSettings.frequency ?? 600,
            isMuted: state.audioSettings.isMuted ?? false,
          }
        }

        // Restore lottery state (check if bonus/storm has expired)
        if (state.lotteryState) {
          const now = Date.now()
          lotteryState.value = {
            lastTriggerTime: state.lotteryState.lastTriggerTime || 0,
            isBonusAvailable:
              state.lotteryState.isBonusAvailable && now < state.lotteryState.bonusAvailableEndTime,
            bonusFactoryId: state.lotteryState.bonusFactoryId || null,
            bonusEndTime: state.lotteryState.bonusEndTime || 0,
            bonusAvailableEndTime: state.lotteryState.bonusAvailableEndTime || 0,
            phenomenonTitle: state.lotteryState.phenomenonTitle || '',
            isSolarStorm:
              state.lotteryState.isSolarStorm && now < state.lotteryState.solarStormEndTime,
            solarStormEndTime: state.lotteryState.solarStormEndTime || 0,
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
        total += factory.qsosPerSecond * count * lotteryMultiplier * upgradeMultiplier
      }
    }

    return total
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

  return {
    qsos,
    totalQsosEarned,
    licenseLevel,
    factoryCounts,
    fractionalQSOs,
    audioSettings,
    lotteryState,
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
    clearExpiredBonus,
    offlineEarnings,
    calculateOfflineProgress,
    dismissOfflineEarnings,
    save,
    load,
  }
})
