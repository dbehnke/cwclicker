<script setup>
import { ref } from 'vue';
import { useGameStore } from '../stores/game';
import { audioService } from '../services/audio';

const store = useGameStore();
const showResetConfirm = ref(false);
const exportData = ref('');
const importError = ref('');

// Audio settings (sync with store)
const MIN_FREQUENCY = 400;
const MAX_FREQUENCY = 1000;

/**
 * Handle volume change
 */
function handleVolumeChange(event) {
  const volume = parseFloat(event.target.value);
  audioService.setVolume(volume);
  store.updateAudioSettings({ volume });
}

/**
 * Handle frequency change
 */
function handleFrequencyChange(event) {
  const frequency = parseInt(event.target.value, 10);
  audioService.setFrequency(frequency);
  store.updateAudioSettings({ frequency });
}

/**
 * Toggle mute
 */
function toggleMute() {
  const isMuted = audioService.toggleMute();
  store.updateAudioSettings({ isMuted });
}

/**
 * Reset game with confirmation
 */
function resetGame() {
  // Clear all game state
  store.qsos = 0n;
  store.licenseLevel = 1;
  store.factoryCounts = {};
  store.fractionalQSOs = 0;
  store.purchasedUpgrades = new Set();
  store.lotteryState = {
    lastTriggerTime: 0,
    isBonusAvailable: false,
    bonusFactoryId: null,
    bonusEndTime: 0,
    bonusAvailableEndTime: 0,
    phenomenonTitle: '',
    isSolarStorm: false,
    solarStormEndTime: 0
  };
  
  // Save cleared state
  store.save();
  
  // Hide confirmation
  showResetConfirm.value = false;
  
  // Reload page to ensure clean state
  window.location.reload();
}

/**
 * Export save data
 */
function exportSave() {
  const saveData = localStorage.getItem('cw-keyer-game');
  if (saveData) {
    exportData.value = btoa(saveData); // Base64 encode
  }
}

/**
 * Import save data
 */
function importSave() {
  importError.value = '';
  
  if (!exportData.value.trim()) {
    importError.value = 'Please paste save data';
    return;
  }
  
  try {
    // Base64 decode
    const decoded = atob(exportData.value.trim());
    const parsed = JSON.parse(decoded);
    
    // Validate minimum required fields
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid save data format');
    }
    
    // Save to localStorage
    localStorage.setItem('cw-keyer-game', decoded);
    
    // Reload to apply
    window.location.reload();
  } catch (error) {
    importError.value = 'Invalid save data. Please check and try again.';
  }
}

/**
 * Copy save data to clipboard
 */
async function copyToClipboard() {
  if (exportData.value) {
    try {
      await navigator.clipboard.writeText(exportData.value);
      alert('Save data copied to clipboard!');
    } catch (err) {
      alert('Failed to copy. Please select and copy manually.');
    }
  }
}

/**
 * Format percentage
 */
function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
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
              class="px-4 py-2 bg-terminal-green text-terminal-bg font-bold rounded hover:bg-green-600 transition-colors"
            >
              Generate Save
            </button>
            <button
              v-if="exportData"
              @click="copyToClipboard"
              class="px-4 py-2 bg-terminal-amber text-terminal-bg font-bold rounded hover:bg-yellow-500 transition-colors"
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
            class="px-4 py-2 bg-terminal-green text-terminal-bg font-bold rounded hover:bg-green-600 transition-colors"
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
    
    <!-- Reset Game -->
    <div class="border-2 border-red-600 bg-terminal-bg p-4 rounded">
      <h3 class="text-lg font-bold text-red-500 mb-4">Danger Zone</h3>
      
      <div class="space-y-4">
        <p class="text-gray-400 text-sm">
          Resetting will permanently delete all your progress including QSOs, factories, upgrades, and achievements. This cannot be undone.
        </p>

        <div v-if="!showResetConfirm">
          <button
            @click="showResetConfirm = true"
            class="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
          >
            ⚠️ Reset Game
          </button>
        </div>

        <div v-else class="space-y-4 border-2 border-red-600 p-4 rounded">
          <p class="text-red-500 font-bold">Are you sure? This cannot be undone!</p>
          
          <div class="flex gap-4">
            <button
              @click="resetGame"
              class="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
            >
              Yes, Reset Everything
            </button>
            
            <button
              @click="showResetConfirm = false"
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
input[type="range"] {
  accent-color: #4af626;
}

input[type="range"]:disabled {
  cursor: not-allowed;
}
</style>