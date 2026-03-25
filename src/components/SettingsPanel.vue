<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import { audioService } from '../services/audio'
import { GAME_CONSTANTS } from '../constants/game'

const store = useGameStore()
const showResetConfirm = ref(false)
const showPrestigeResetConfirm = ref(false)
const exportData = ref('')
const importError = ref('')

// Audio settings (sync with store)
const MIN_FREQUENCY = 400
const MAX_FREQUENCY = 1000

/**
 * Handle volume change
 */
function handleVolumeChange(event) {
  const volume = parseFloat(event.target.value)
  audioService.setVolume(volume)
  store.updateAudioSettings({ volume })
}

/**
 * Handle frequency change
 */
function handleFrequencyChange(event) {
  const frequency = parseInt(event.target.value, 10)
  audioService.setFrequency(frequency)
  store.updateAudioSettings({ frequency })
}

/**
 * Toggle mute
 */
function toggleMute() {
  const isMuted = audioService.toggleMute()
  store.updateAudioSettings({ isMuted })
}

/**
 * Reset game with confirmation
 */
function resetGame() {
  // Clear all game state
  store.qsos = 0n
  store.licenseLevel = 1
  store.factoryCounts = {}
  store.fractionalQSOs = 0
  store.tapPrestigeAccumulator = 0n
  store.offlineEarnings = null
  store.migrationInfo = null
  store.purchasedUpgrades = new Set()
  store.lotteryState = {
    lastTriggerTime: 0,
    isBonusAvailable: false,
    bonusFactoryId: null,
    bonusEndTime: 0,
    bonusAvailableEndTime: 0,
    phenomenonTitle: '',
    isSolarStorm: false,
    solarStormEndTime: 0,
  }

  // Save cleared state
  store.save()

  // Hide confirmation
  showResetConfirm.value = false

  // Reload page to ensure clean state
  window.location.reload()
}

function clearConfirmationState() {
  showResetConfirm.value = false
  showPrestigeResetConfirm.value = false
}

/**
 * Reset prestige with confirmation
 */
function resetPrestige() {
  store.prestigeReset()

  // Hide confirmation
  clearConfirmationState()

  // Reload page to ensure clean state
  window.location.reload()
}

/**
 * Export save data
 */
function exportSave() {
  const saveData = localStorage.getItem('cw-keyer-game')
  if (saveData) {
    exportData.value = btoa(saveData) // Base64 encode
  }
}

/**
 * Validate save data structure
 * @param {Object} data - Parsed save data
 * @returns {boolean} True if valid
 */
function isValidSaveData(data) {
  if (!data || typeof data !== 'object') {
    return false
  }

  // Required fields with type checking
  const requiredFields = {
    qsos: v => typeof v === 'string' && /^\d+$/.test(v),
    licenseLevel: v => typeof v === 'number' && v >= 1 && v <= 3,
    factoryCounts: v => typeof v === 'object' && v !== null && !Array.isArray(v),
    fractionalQSOs: v => typeof v === 'number' && v >= 0,
    audioSettings: v => typeof v === 'object' && v !== null,
    lotteryState: v => typeof v === 'object' && v !== null,
  }

  for (const [field, validator] of Object.entries(requiredFields)) {
    if (!(field in data) || !validator(data[field])) {
      console.warn(`Invalid or missing field: ${field}`)
      return false
    }
  }

  // Validate audioSettings sub-fields
  const audio = data.audioSettings
  if (typeof audio.volume !== 'number' || audio.volume < 0 || audio.volume > 1) {
    return false
  }
  if (typeof audio.frequency !== 'number' || audio.frequency < 400 || audio.frequency > 1000) {
    return false
  }
  if (typeof audio.isMuted !== 'boolean') {
    return false
  }

  // Validate lotteryState sub-fields
  const lottery = data.lotteryState
  if (typeof lottery.lastTriggerTime !== 'number') return false
  if (typeof lottery.isBonusAvailable !== 'boolean') return false
  if (lottery.bonusFactoryId !== null && typeof lottery.bonusFactoryId !== 'string') return false
  if (typeof lottery.bonusEndTime !== 'number') return false
  if (typeof lottery.bonusAvailableEndTime !== 'number') return false
  if (typeof lottery.phenomenonTitle !== 'string') return false
  if (typeof lottery.isSolarStorm !== 'boolean') return false
  if (typeof lottery.solarStormEndTime !== 'number') return false

  // Validate factoryCounts - ensure keys are valid factory IDs and values are positive integers
  const validFactoryIds = [
    'qrq-protocol',
    'elmer',
    'straight-key',
    'paddle-key',
    'code-practice-oscillator',
    'dipole-antenna',
  ]
  for (const [key, value] of Object.entries(data.factoryCounts)) {
    if (!validFactoryIds.includes(key)) {
      console.warn(`Invalid factory ID: ${key}`)
      return false
    }
    if (!Number.isInteger(value) || value < 0) {
      console.warn(`Invalid factory count for ${key}: ${value}`)
      return false
    }
  }

  return true
}

/**
 * Sanitize save data to prevent XSS
 * @param {Object} data - Raw parsed data
 * @returns {Object} Sanitized data
 */
function sanitizeSaveData(data) {
  const sanitized = {}

  // Preserve version for migration detection; if missing/blank, leave it unset so game.load() can handle legacy saves
  const rawVersion = typeof data.version === 'string' ? data.version.trim() : ''
  if (rawVersion) {
    sanitized.version = rawVersion
  }

  // Sanitize qsos - ensure it's a valid numeric string, bounded to prevent DoS via huge BigInt parsing
  const MAX_BIGINT_DIGITS = GAME_CONSTANTS.SAVE.MAX_BIGINT_DIGITS
  const qsosStr = String(data.qsos).replace(/[^\d]/g, '')
  sanitized.qsos = (qsosStr && qsosStr.length <= MAX_BIGINT_DIGITS) ? qsosStr : '0'

  // Sanitize prestige fields.
  // If a prestige field is present but invalid, normalize it to "0" instead of omitting it.
  // Truly absent fields are left unset so game.load() can still apply legacy migration/seeding logic.
  const prestigeFields = [
    'totalQsosEarned',
    'prestigeLevel',
    'prestigePoints',
    'tapPrestigeAccumulator',
  ]

  for (const field of prestigeFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      const rawValue = data[field]
      if (typeof rawValue === 'string' && /^\d+$/.test(rawValue) && rawValue.length <= MAX_BIGINT_DIGITS) {
        sanitized[field] = rawValue
      } else {
        // Corrupt or out-of-bounds prestige values are clamped to "0"
        sanitized[field] = '0'
      }
    }
  }

  // Sanitize licenseLevel
  sanitized.licenseLevel = Math.max(1, Math.min(3, Number(data.licenseLevel) || 1))

  // Sanitize factoryCounts
  sanitized.factoryCounts = {}
  for (const [key, value] of Object.entries(data.factoryCounts || {})) {
    // Only allow valid factory IDs
    const validFactoryIds = [
      'qrq-protocol',
      'elmer',
      'straight-key',
      'paddle-key',
      'code-practice-oscillator',
      'dipole-antenna',
    ]
    if (validFactoryIds.includes(key)) {
      sanitized.factoryCounts[key] = Math.max(0, Math.floor(Number(value) || 0))
    }
  }

  // Sanitize fractionalQSOs
  sanitized.fractionalQSOs = Math.max(0, Number(data.fractionalQSOs) || 0)

  // Sanitize purchasedUpgrades
  sanitized.purchasedUpgrades = []
  if (Array.isArray(data.purchasedUpgrades)) {
    for (const upgrade of data.purchasedUpgrades) {
      if (typeof upgrade === 'string' && upgrade.match(/^[a-z0-9-]+$/)) {
        sanitized.purchasedUpgrades.push(upgrade)
      }
    }
  }

  // Sanitize audioSettings
  const audio = data.audioSettings || {}
  sanitized.audioSettings = {
    volume: Math.max(0, Math.min(1, Number(audio.volume) || 0.5)),
    frequency: Math.max(400, Math.min(1000, Number(audio.frequency) || 600)),
    isMuted: Boolean(audio.isMuted),
  }

  // Sanitize lotteryState
  const lottery = data.lotteryState || {}
  sanitized.lotteryState = {
    lastTriggerTime: Math.max(0, Number(lottery.lastTriggerTime) || 0),
    isBonusAvailable: Boolean(lottery.isBonusAvailable),
    bonusFactoryId:
      lottery.bonusFactoryId && typeof lottery.bonusFactoryId === 'string'
        ? lottery.bonusFactoryId.replace(/[^a-z0-9-]/g, '')
        : null,
    bonusEndTime: Math.max(0, Number(lottery.bonusEndTime) || 0),
    bonusAvailableEndTime: Math.max(0, Number(lottery.bonusAvailableEndTime) || 0),
    phenomenonTitle: String(lottery.phenomenonTitle || '').substring(0, 100),
    isSolarStorm: Boolean(lottery.isSolarStorm),
    solarStormEndTime: Math.max(0, Number(lottery.solarStormEndTime) || 0),
  }

  return sanitized
}

/**
 * Import save data with validation and sanitization
 */
function importSave() {
  importError.value = ''

  if (!exportData.value.trim()) {
    importError.value = 'Please paste save data'
    return
  }

  try {
    // Base64 decode with size limit (prevent DoS with huge payloads)
    const trimmed = exportData.value.trim()
    if (trimmed.length > 100000) {
      throw new Error('Save data too large')
    }

    const decoded = atob(trimmed)
    if (decoded.length > 50000) {
      throw new Error('Decoded data too large')
    }

    // Parse JSON
    const parsed = JSON.parse(decoded)

    // Validate structure
    if (!isValidSaveData(parsed)) {
      throw new Error('Invalid save data structure')
    }

    // Sanitize all data
    const sanitized = sanitizeSaveData(parsed)

    // Save sanitized data to localStorage
    localStorage.setItem('cw-keyer-game', JSON.stringify(sanitized))

    // Reload to apply
    window.location.reload()
  } catch (error) {
    console.error('Import error:', error)
    importError.value = `Import failed: ${error.message || 'Invalid save data. Please check and try again.'}`
  }
}

/**
 * Copy save data to clipboard
 */
async function copyToClipboard() {
  if (exportData.value) {
    try {
      await navigator.clipboard.writeText(exportData.value)
      alert('Save data copied to clipboard!')
    } catch (err) {
      alert('Failed to copy. Please select and copy manually.')
    }
  }
}

/**
 * Refresh the page - useful for mobile web apps and fixing stuck audio
 */
function refreshPage() {
  // Save current state before refreshing
  store.save()
  // Reload the page
  window.location.reload()
}

/**
 * Format percentage
 */
function formatPercent(value) {
  return `${Math.round(value * 100)}%`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Audio Settings -->
    <div class="border-2 border-terminal-green bg-terminal-bg p-4 rounded">
      <h3 class="text-lg font-bold text-terminal-green mb-4">Audio Settings</h3>

      <div class="space-y-4">
        <!-- Mute Toggle -->
        <div class="flex items-center justify-between">
          <span class="text-terminal-green">Mute</span>
          <button
            @click="toggleMute"
            class="px-4 py-1 rounded font-bold transition-colors"
            :class="{
              'bg-terminal-amber text-terminal-bg': store.audioSettings.isMuted,
              'bg-terminal-green text-terminal-bg': !store.audioSettings.isMuted,
            }"
          >
            {{ store.audioSettings.isMuted ? 'OFF' : 'ON' }}
          </button>
        </div>

        <!-- Volume Slider -->
        <div class="space-y-2">
          <div class="flex justify-between text-terminal-green">
            <span>Volume</span>
            <span>{{ formatPercent(store.audioSettings.volume) }}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="store.audioSettings.volume"
            @input="handleVolumeChange"
            :disabled="store.audioSettings.isMuted"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            :class="{ 'opacity-50': store.audioSettings.isMuted }"
          />
        </div>

        <!-- Frequency Slider -->
        <div class="space-y-2">
          <div class="flex justify-between text-terminal-green">
            <span>Frequency</span>
            <span>{{ store.audioSettings.frequency }} Hz</span>
          </div>
          <input
            type="range"
            :min="MIN_FREQUENCY"
            :max="MAX_FREQUENCY"
            step="10"
            :value="store.audioSettings.frequency"
            @input="handleFrequencyChange"
            :disabled="store.audioSettings.isMuted"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            :class="{ 'opacity-50': store.audioSettings.isMuted }"
          />
          <div class="flex justify-between text-xs text-gray-500">
            <span>{{ MIN_FREQUENCY }} Hz</span>
            <span>{{ MAX_FREQUENCY }} Hz</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Save/Restore -->
    <div class="border-2 border-terminal-green bg-terminal-bg p-4 rounded">
      <h3 class="text-lg font-bold text-terminal-green mb-4">Save & Restore</h3>

      <div class="space-y-4">
        <!-- Export -->
        <div class="space-y-2">
          <label class="text-terminal-green text-sm">Export Save Data:</label>
          <div class="flex gap-2">
            <button
              @click="exportSave"
              class="px-4 py-2 bg-terminal-green text-terminal-bg font-bold rounded transition-colors touch-manipulation hover:brightness-110 active:brightness-95"
            >
              Generate Save
            </button>
            <button
              v-if="exportData"
              @click="copyToClipboard"
              class="px-4 py-2 bg-terminal-amber text-terminal-bg font-bold rounded transition-colors touch-manipulation hover:brightness-110 active:brightness-95"
            >
              Copy
            </button>
          </div>

          <textarea
            v-if="exportData"
            v-model="exportData"
            readonly
            class="w-full h-20 bg-gray-800 text-terminal-green p-2 rounded text-xs font-mono mt-2"
            placeholder="Save data will appear here..."
          ></textarea>
        </div>

        <!-- Import -->
        <div class="space-y-2">
          <label class="text-terminal-green text-sm">Import Save Data:</label>
          <textarea
            v-model="exportData"
            class="w-full h-20 bg-gray-800 text-terminal-green p-2 rounded text-xs font-mono"
            placeholder="Paste save data here..."
          ></textarea>

          <button
            @click="importSave"
            class="px-4 py-2 bg-terminal-green text-terminal-bg font-bold rounded transition-colors touch-manipulation hover:brightness-110 active:brightness-95"
          >
            Load Save
          </button>

          <p v-if="importError" class="text-red-500 text-sm mt-2">{{ importError }}</p>

          <p class="text-xs text-gray-500 mt-2">
            Note: Loading a save will reload the page. Invalid or corrupted saves will be rejected.
          </p>
        </div>
      </div>
    </div>

    <!-- Troubleshooting -->
    <div class="border-2 border-terminal-amber bg-terminal-bg p-4 rounded">
      <h3 class="text-lg font-bold text-terminal-amber mb-4">Troubleshooting</h3>

      <div class="space-y-4">
        <p class="text-gray-400 text-sm">
          If the game becomes unresponsive or audio stops working on mobile, you can refresh the
          page. Your progress is automatically saved.
        </p>

        <button
          @click="refreshPage"
          class="px-4 py-2 bg-terminal-amber text-terminal-bg font-bold rounded hover:bg-yellow-500 transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Refresh Page</span>
        </button>
      </div>
    </div>

    <!-- Reset Game -->
    <div class="border-2 border-red-600 bg-terminal-bg p-4 rounded">
      <h3 class="text-lg font-bold text-red-500 mb-4">Danger Zone</h3>

      <div class="space-y-4">
        <p class="text-gray-400 text-sm">
          Resetting will permanently delete your QSOs, factories, upgrades,
          and achievements, and will reset your license level to 1 and other current run state.
          Prestige progress (level and points) is preserved. This cannot be undone.
        </p>

        <div v-if="!showResetConfirm && !showPrestigeResetConfirm">
          <button
            @click="showResetConfirm = true; showPrestigeResetConfirm = false"
            class="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
          >
            ⚠️ Reset Game
          </button>
          <button
            @click="showPrestigeResetConfirm = true; showResetConfirm = false"
            :disabled="!store.canPrestigeReset"
            class="ml-3 px-6 py-3 bg-terminal-amber text-terminal-bg font-bold rounded hover:brightness-110 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prestige Reset
          </button>
        </div>

        <div v-else-if="showResetConfirm" class="space-y-4 border-2 border-red-600 p-4 rounded">
          <p class="text-red-500 font-bold">Are you sure? This cannot be undone!</p>

          <div class="flex gap-4">
            <button
              @click="resetGame"
              class="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
            >
              Yes, Reset Everything
            </button>

            <button
              @click="clearConfirmationState"
              class="px-6 py-3 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <div v-else-if="showPrestigeResetConfirm" class="space-y-4 border-2 border-terminal-amber p-4 rounded">
          <p class="text-terminal-amber font-bold">Prestige reset will reset your run but keep prestige progress.</p>

          <div class="flex gap-4">
            <button
              @click="resetPrestige"
              class="px-6 py-3 bg-terminal-amber text-terminal-bg font-bold rounded hover:brightness-110 transition-colors"
            >
              Yes, Prestige Reset
            </button>

            <button
              @click="clearConfirmationState"
              class="px-6 py-3 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type='range'] {
  accent-color: #4af626;
}

input[type='range']:disabled {
  cursor: not-allowed;
}
</style>
