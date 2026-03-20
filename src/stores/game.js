import { defineStore } from 'pinia'
import { ref } from 'vue'
import { FACTORIES } from '../constants/factories'

/**
 * Manages the game's core state and progression.
 */
export const useGameStore = defineStore('game', () => {
  /**
   * @returns {bigint} QSO value as BigInt
   */
  const qsos = ref(0n)
  const licenseLevel = ref(1)
  const factoryCounts = ref({})
  const fractionalQSOs = ref(0) // Accumulate fractional QSOs between frames
  
  // Audio settings
  const audioSettings = ref({
    volume: 0.5,
    frequency: 600,
    isMuted: false
  })

  // Lottery system
  const LOTTERY_COOLDOWN_MS = 90000 // 90 seconds
  const LOTTERY_CHANCE = 0.05 // 5%
  const LOTTERY_BOOST_MULTIPLIER = 7 // 7x
  const LOTTERY_BOOST_DURATION_MS = 77000 // 77 seconds
  const LOTTERY_BUTTON_DURATION_MS = 10000 // 10 seconds to click

  const lotteryState = ref({
    lastTriggerTime: 0,
    isBonusAvailable: false,
    bonusFactoryId: null,
    bonusEndTime: 0,
    bonusAvailableEndTime: 0
  })

  /**
   * Processes a keyer tap to add QSOs.
   * @param {('dit'|'dah')} type - The type of keyer tap.
   */
  function tapKeyer(type) {
    if (type === 'dit') {
      qsos.value += 1n
    } else if (type === 'dah') {
      qsos.value += 2n
    } else {
      console.warn(`Invalid keyer tap type: ${type}`)
    }

    // Check for lottery trigger
    checkLotteryTrigger()
  }

  /**
   * Checks if lottery should trigger on this click.
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

    // Roll for lottery
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

    lotteryState.value = {
      lastTriggerTime: now,
      isBonusAvailable: true,
      bonusFactoryId: randomFactoryId,
      bonusEndTime: 0,
      bonusAvailableEndTime: now + LOTTERY_BUTTON_DURATION_MS
    }
  }

  /**
   * Activates the lottery bonus (called when user clicks the bonus button).
   * @returns {boolean} True if activation succeeded.
   */
  function activateLotteryBonus() {
    if (!lotteryState.value.isBonusAvailable) {
      return false
    }

    const now = Date.now()

    // Check if button is still available
    if (now > lotteryState.value.bonusAvailableEndTime) {
      lotteryState.value.isBonusAvailable = false
      return false
    }

    // Activate the bonus
    lotteryState.value.isBonusAvailable = false
    lotteryState.value.bonusEndTime = now + LOTTERY_BOOST_DURATION_MS

    return true
  }

  /**
   * Gets the current lottery bonus multiplier for a factory.
   * @param {string} factoryId - The factory ID.
   * @returns {number} The multiplier (1 if no bonus, 7 if bonus active).
   */
  function getLotteryMultiplier(factoryId) {
    const now = Date.now()

    // Check if bonus has expired
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
      fractionalQSOs.value -= wholeQsos
    }
  }

  /**
   * Gets the tier multiplier for cost calculation.
   * @param {number} tier - The factory tier (1-7).
   * @returns {number} The multiplier for cost calculation.
   */
  function getTierMultiplier(tier) {
    if (tier >= 1 && tier <= 2) {
      return 1.10
    } else if (tier >= 3 && tier <= 5) {
      return 1.07
    } else if (tier >= 6 && tier <= 7) {
      return 1.05
    }
    return 1.10
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
    return BigInt(Math.floor(factory.baseCost * Math.pow(multiplier, owned)))
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
    
    const currentOwned = factoryCounts.value[factoryId] || 0
    let totalCost = 0n
    
    for (let i = 0; i < count; i++) {
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
    
    const cost = getBulkCost(factoryId, count)
    
    if (qsos.value < cost) {
      return false
    }
    
    qsos.value -= cost
    factoryCounts.value[factoryId] = (factoryCounts.value[factoryId] || 0) + count
    
    return true
  }

  /**
   * Saves the current game state to localStorage.
   */
  function save() {
    try {
      const state = {
        qsos: qsos.value.toString(),
        licenseLevel: licenseLevel.value,
        factoryCounts: factoryCounts.value,
        fractionalQSOs: fractionalQSOs.value,
        audioSettings: audioSettings.value,
        lotteryState: lotteryState.value
      }
      localStorage.setItem('cw-keyer-game', JSON.stringify(state))
    } catch (e) {
      console.warn('Failed to save game state:', e)
    }
  }

  /**
   * Loads the game state from localStorage.
   */
  function load() {
    try {
      const saved = localStorage.getItem('cw-keyer-game')
      if (saved) {
        const state = JSON.parse(saved)
        qsos.value = BigInt(state.qsos || '0')
        licenseLevel.value = state.licenseLevel || 1
        factoryCounts.value = state.factoryCounts || {}
        fractionalQSOs.value = state.fractionalQSOs || 0
        
        if (state.audioSettings) {
          audioSettings.value = {
            volume: state.audioSettings.volume ?? 0.5,
            frequency: state.audioSettings.frequency ?? 600,
            isMuted: state.audioSettings.isMuted ?? false
          }
        }

        // Restore lottery state (check if bonus has expired)
        if (state.lotteryState) {
          const now = Date.now()
          lotteryState.value = {
            lastTriggerTime: state.lotteryState.lastTriggerTime || 0,
            isBonusAvailable: state.lotteryState.isBonusAvailable && now < state.lotteryState.bonusAvailableEndTime,
            bonusFactoryId: state.lotteryState.bonusFactoryId || null,
            bonusEndTime: state.lotteryState.bonusEndTime || 0,
            bonusAvailableEndTime: state.lotteryState.bonusAvailableEndTime || 0
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load game state:', e)
    }
  }

  /**
   * Calculates the total QSOs per second from all owned factories.
   * Applies lottery bonus multipliers.
   * @returns {number} The total QSOs per second.
   */
  function getTotalQSOsPerSecond() {
    let total = 0

    for (const [factoryId, count] of Object.entries(factoryCounts.value)) {
      const factory = FACTORIES.find(f => f.id === factoryId)
      if (factory) {
        const multiplier = getLotteryMultiplier(factoryId)
        total += factory.qsosPerSecond * count * multiplier
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

  return {
    qsos,
    licenseLevel,
    factoryCounts,
    fractionalQSOs,
    audioSettings,
    lotteryState,
    tapKeyer,
    addPassiveQSOs,
    getFactoryCost,
    getBulkCost,
    buyFactory,
    getTotalQSOsPerSecond,
    updateAudioSettings,
    activateLotteryBonus,
    getLotteryMultiplier,
    save,
    load
  }
})