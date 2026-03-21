<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '../stores/game';
import { FACTORIES } from '../constants/factories';

/**
 * Emits events from the component.
 */
const emit = defineEmits(['lottery-activated', 'solar-storm-started']);

const store = useGameStore();

// Reactive timestamp that updates every second to trigger recomputation
const now = ref(Date.now());
let timerInterval = null;

/**
 * Check if timer should be running (any active bonus or bonus available)
 */
const shouldTimerRun = computed(() => {
  const hasBonusAvailable = store.lotteryState.isBonusAvailable;
  const hasActiveBonus = now.value < store.lotteryState.bonusEndTime;
  const hasActiveStorm = store.lotteryState.isSolarStorm && now.value < store.lotteryState.solarStormEndTime;
  return hasBonusAvailable || hasActiveBonus || hasActiveStorm;
});

/**
 * Start or stop timer based on whether bonuses are active
 */
function updateTimer() {
  const needsTimer = shouldTimerRun.value;

  if (needsTimer && !timerInterval) {
    // Start timer
    timerInterval = setInterval(() => {
      now.value = Date.now();
    }, 1000);
  } else if (!needsTimer && timerInterval) {
    // Stop timer
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

onMounted(() => {
  updateTimer();
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

// Watch for changes that might require starting/stopping the timer
watch(shouldTimerRun, () => {
  updateTimer();
}, { immediate: true });

/**
 * Watch for bonus expiration and clean up state
 * This replaces the side effect that was in the computed property
 */
watch(now, (currentTime) => {
  const bonusExpired = currentTime >= store.lotteryState.bonusEndTime;
  const hasActiveBonus = store.lotteryState.bonusFactoryId && store.lotteryState.bonusEndTime > 0;
  
  if (bonusExpired && hasActiveBonus) {
    // Call store action to clear expired bonus
    store.clearExpiredBonus();
  }
}, { immediate: true });

/**
 * Whether a bonus button is currently available
 */
const isBonusAvailable = computed(() => {
  return store.lotteryState.isBonusAvailable;
});

/**
 * The phenomenon title to display
 */
const phenomenonTitle = computed(() => {
  return store.lotteryState.phenomenonTitle || 'Rare DX';
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
 * Number of boosted factories owned
 */
const boostedFactoryCount = computed(() => {
  if (!store.lotteryState.bonusFactoryId) {
    return 0;
  }
  return store.factoryCounts[store.lotteryState.bonusFactoryId] || 0;
});

/**
 * Base output of the boosted factory (rate × count)
 */
const baseOutput = computed(() => {
  if (!boostedFactory.value) {
    return 0;
  }
  return boostedFactory.value.qsosPerSecond * boostedFactoryCount.value;
});

/**
 * Boosted output (base × 7)
 */
const boostedOutput = computed(() => {
  return baseOutput.value * 7;
});

/**
 * Whether a positive bonus is currently active
 * Pure computed - no side effects
 */
const isBonusActive = computed(() => {
  return now.value < store.lotteryState.bonusEndTime;
});

/**
 * Whether Solar Storm is currently active
 */
const isSolarStormActive = computed(() => {
  return store.lotteryState.isSolarStorm && now.value < store.lotteryState.solarStormEndTime;
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
 * Time remaining on Solar Storm in seconds
 */
const solarStormTimeRemaining = computed(() => {
  if (!isSolarStormActive.value) {
    return 0;
  }
  const remaining = Math.ceil((store.lotteryState.solarStormEndTime - now.value) / 1000);
  return Math.max(0, remaining);
});

/**
 * Formatted time remaining
 */
const formattedTimeRemaining = computed(() => {
  const seconds = bonusTimeRemaining.value || solarStormTimeRemaining.value;
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
  const result = store.activateLotteryBonus();
  if (result.success) {
    if (result.isSolarStorm) {
      emit('solar-storm-started');
    } else {
      emit('lottery-activated', boostedFactory.value);
    }
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
            {{ phenomenonTitle.toUpperCase() }}!
          </p>
          <p class="text-sm text-gray-400">
            Propagation opening on {{ boostedFactory.name }}! 7x boost for 77 seconds!
          </p>
          <p class="text-xs text-red-400 mt-1">
            ⚠️ 15% chance of Solar Storm (50% output reduction)
          </p>
        </div>

        <button
          @click="handleBonusClick"
          class="ml-4 px-6 py-3 bg-terminal-amber text-terminal-bg font-bold rounded hover:bg-yellow-500 transition-colors animate-bounce"
        >
          WORK IT!
        </button>
      </div>
    </div>

    <!-- Active Positive Bonus Indicator -->
    <div
      v-if="isBonusActive && boostedFactory"
      class="border-2 border-terminal-green bg-terminal-bg p-3 rounded"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">📡</span>
          <div>
            <p class="text-terminal-green font-bold">
              {{ phenomenonTitle }}: {{ boostedFactory.name }} 7x Boost!
            </p>
            <p class="text-sm text-gray-400">
              Output increased from {{ baseOutput.toFixed(1) }}/sec to {{ boostedOutput.toFixed(1) }}/sec ({{ boostedFactoryCount }} × {{ boostedFactory.qsosPerSecond }}/sec)
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

    <!-- Solar Storm Indicator -->
    <div
      v-if="isSolarStormActive"
      class="border-2 border-red-600 bg-terminal-bg p-3 rounded"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🌩️</span>
          <div>
            <p class="text-red-500 font-bold">
              SOLAR STORM IN PROGRESS!
            </p>
            <p class="text-sm text-gray-400">
              All factory output reduced by 50%
            </p>
          </div>
        </div>

        <div class="text-red-500 font-mono text-xl">
          {{ formattedTimeRemaining }}
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mt-2 w-full bg-gray-700 rounded h-2">
        <div
          class="bg-red-600 h-2 rounded transition-all duration-1000"
          :style="{ width: (solarStormTimeRemaining / 77 * 100) + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>