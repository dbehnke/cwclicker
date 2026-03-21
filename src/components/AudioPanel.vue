<script setup>
import { ref, computed } from 'vue';
import { audioService } from '../services/audio';

/**
 * Emits events from the component.
 */
const emit = defineEmits(['settings-change']);

const isExpanded = ref(false);

const MIN_FREQUENCY = 400;
const MAX_FREQUENCY = 1000;

const volume = ref(audioService.volume);
const frequency = ref(audioService.frequency);
const isMuted = ref(audioService.isMuted);

/**
 * Formatted frequency display
 */
const formattedFrequency = computed(() => {
  return `${frequency.value} Hz`;
});

/**
 * Volume percentage for display
 */
const volumePercent = computed(() => {
  return `${Math.round(volume.value * 100)}%`;
});

/**
 * Toggles the panel expansion
 */
function togglePanel() {
  isExpanded.value = !isExpanded.value;
}

/**
 * Handles volume slider change
 * @param {Event} event
 */
function handleVolumeChange(event) {
  const newVolume = parseFloat(event.target.value);
  volume.value = newVolume;
  audioService.setVolume(newVolume);
  emitSettingsChange();
}

/**
 * Handles frequency slider change
 * @param {Event} event
 */
function handleFrequencyChange(event) {
  const newFreq = parseInt(event.target.value, 10);
  frequency.value = newFreq;
  audioService.setFrequency(newFreq);
  emitSettingsChange();
}

/**
 * Toggles mute state
 */
function toggleMute() {
  isMuted.value = audioService.toggleMute();
  emitSettingsChange();
}

/**
 * Emits settings change event for persistence
 */
function emitSettingsChange() {
  emit('settings-change', {
    volume: volume.value,
    frequency: frequency.value,
    isMuted: isMuted.value,
  });
}

/**
 * Loads settings from saved state
 * @param {Object} settings
 */
function loadSettings(settings) {
  if (settings.volume !== undefined) {
    volume.value = settings.volume;
    audioService.setVolume(settings.volume);
  }
  if (settings.frequency !== undefined) {
    frequency.value = settings.frequency;
    audioService.setFrequency(settings.frequency);
  }
  if (settings.isMuted !== undefined) {
    isMuted.value = settings.isMuted;
    audioService.toggleMute(settings.isMuted);
  }
}

// Expose loadSettings for parent component
defineExpose({
  loadSettings,
});
</script>

<template>
  <div class="border-2 border-terminal-green rounded bg-terminal-bg">
    <!-- Collapsed Header -->
    <button
      @click="togglePanel"
      class="w-full px-4 py-2 flex items-center justify-between text-terminal-green hover:bg-terminal-green hover:text-terminal-bg transition-colors"
      :class="{ 'border-b-2 border-terminal-green': isExpanded }"
    >
      <span class="font-bold flex items-center gap-2">
        <span v-if="isMuted">🔇</span>
        <span v-else>🔊</span>
        Audio
      </span>
      <span class="text-sm">
        {{ isExpanded ? '▼' : '▶' }}
      </span>
    </button>

    <!-- Expanded Panel -->
    <div
      v-show="isExpanded"
      class="p-4 space-y-4"
    >
      <!-- Mute Toggle -->
      <div class="flex items-center justify-between">
        <span class="text-terminal-green">Mute</span>
        <button
          @click="toggleMute"
          class="px-4 py-1 rounded font-bold transition-colors"
          :class="{
            'bg-terminal-amber text-terminal-bg': isMuted,
            'bg-terminal-green text-terminal-bg': !isMuted,
          }"
        >
          {{ isMuted ? 'OFF' : 'ON' }}
        </button>
      </div>

      <!-- Volume Slider -->
      <div class="space-y-2">
        <div class="flex justify-between text-terminal-green">
          <span>Volume</span>
          <span>{{ volumePercent }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="volume"
          @input="handleVolumeChange"
          :disabled="isMuted"
          class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          :class="{ 'opacity-50': isMuted }"
        />
      </div>

      <!-- Frequency Slider -->
      <div class="space-y-2">
        <div class="flex justify-between text-terminal-green">
          <span>Frequency</span>
          <span>{{ formattedFrequency }}</span>
        </div>
        <input
          type="range"
          :min="MIN_FREQUENCY"
          :max="MAX_FREQUENCY"
          step="10"
          :value="frequency"
          @input="handleFrequencyChange"
          :disabled="isMuted"
          class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          :class="{ 'opacity-50': isMuted }"
        />
        <div class="flex justify-between text-xs text-gray-500">
          <span>{{ MIN_FREQUENCY }} Hz</span>
          <span>{{ MAX_FREQUENCY }} Hz</span>
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