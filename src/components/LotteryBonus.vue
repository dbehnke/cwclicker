<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../stores/game';
import { FACTORIES } from '../constants/factories';

/**
 * Emits events from the component.
 */
const emit = defineEmits(['bonus-activated']);

const store = useGameStore();

// Reactive timestamp that updates every second to trigger recomputation
const now = ref(Date.now());
let timerInterval = null;

onMounted(() => {
  // Update timestamp every second to refresh the countdown
  timerInterval = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

/**
 * Whether a bonus button is currently available
 */
const isBonusAvailable = computed(() => {
  return store.lotteryState.isBonusAvailable;
});

/**
 * The factory that will be boosted
 */
const boostedFactory = computed(() => {
  if (!store.lotteryState.bonusFactoryId) {
    return null;
  }
  return FACTORIES.find(f => f.id === store.lotteryState.bonusFactoryId);
});

/**
 * Whether a bonus is currently active
 */
const isBonusActive = computed(() => {
  return now.value < store.lotteryState.bonusEndTime;
});

/**
 * Time remaining on active bonus in seconds
 */
const bonusTimeRemaining = computed(() => {
  if (!isBonusActive.value) {
    return 0;
  }
  const remaining = Math.ceil((store.lotteryState.bonusEndTime - now.value) / 1000);
  return Math.max(0, remaining);
});

/**
 * Formatted time remaining
 */
const formattedTimeRemaining = computed(() => {
  const seconds = bonusTimeRemaining.value;
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
});

/**
 * Handles clicking the bonus button
 */
function handleBonusClick() {
  const success = store.activateLotteryBonus();
  if (success) {
    emit('bonus-activated', boostedFactory.value);
  }
}
</script>

<template>
  <div class="space-y-2">
    <!-- Bonus Button Available -->
    <div
      v-if="isBonusAvailable && boostedFactory"
      class="border-2 border-terminal-amber bg-terminal-bg p-4 rounded animate-pulse"
    >
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-terminal-amber font-bold mb-1">
            LOTTERY BONUS AVAILABLE!
          </p>
          <p class="text-sm text-gray-400">
            Click to boost {{ boostedFactory.name }} output by 7x for 77 seconds!
          </p>
        </div>

        <button
          @click="handleBonusClick"
          class="ml-4 px-6 py-3 bg-terminal-amber text-terminal-bg font-bold rounded hover:bg-yellow-500 transition-colors animate-bounce"
        >
          ACTIVATE!
        </button>
      </div>
    </div>

    <!-- Active Bonus Indicator -->
    <div
      v-if="isBonusActive && boostedFactory"
      class="border-2 border-terminal-green bg-terminal-bg p-3 rounded"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🎰</span>
          <div>
            <p class="text-terminal-green font-bold">
              {{ boostedFactory.name }}: 7x Boost Active!
            </p>
            <p class="text-sm text-gray-400">
              Output increased from {{ boostedFactory.qsosPerSecond }}/sec to {{ (boostedFactory.qsosPerSecond * 7).toFixed(1) }}/sec
            </p>
          </div>
        </div>

        <div class="text-terminal-green font-mono text-xl">
          {{ formattedTimeRemaining }}
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mt-2 w-full bg-gray-700 rounded h-2">
        <div
          class="bg-terminal-green h-2 rounded transition-all duration-1000"
          :style="{ width: (bonusTimeRemaining / 77 * 100) + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>