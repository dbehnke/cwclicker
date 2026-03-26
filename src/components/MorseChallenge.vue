<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

const CHALLENGE_DURATION_MS = 20000
const TIMER_UPDATE_INTERVAL_MS = 100

const now = ref(Date.now())
let timerInterval = null

const morseState = computed(() => store.morseChallengeState)

const triesRemaining = computed(() => morseState.value.triesRemaining ?? 3)

const isActive = computed(() => morseState.value.isActive && morseState.value.state === 'active')
const isWrongRetry = computed(() => morseState.value.state === 'wrong-retry')

// Timer should run during active keying AND during wrong-retry (to detect timeout during feedback)
const needsTimer = computed(() => isActive.value || isWrongRetry.value)

const timeRemaining = computed(() => {
  if (!morseState.value.isActive) return 0
  const elapsed = Math.max(0, now.value - morseState.value.challengeStartTime)
  return Math.max(0, CHALLENGE_DURATION_MS - elapsed)
})

const timeRemainingPercent = computed(() => {
  const pct = (timeRemaining.value / CHALLENGE_DURATION_MS) * 100
  return Math.min(100, Math.max(0, pct))
})

const formattedTime = computed(() => {
  const seconds = Math.ceil(timeRemaining.value / 1000)
  return `${seconds}s`
})

const displayText = computed(() => {
  if (!morseState.value.currentChar) return ''
  return `${morseState.value.currentChar} = ${morseState.value.currentPattern}`
})

const keyedDisplay = computed(() => {
  return morseState.value.keyedSequence.map(s => (s === 'dit' ? '·' : '−')).join('')
})

const isSuccess = computed(() => morseState.value.state === 'success')
const isTimeout = computed(() => morseState.value.state === 'timeout')
const isWrong = computed(() => morseState.value.state === 'wrong')

function startTimer() {
  if (timerInterval) return
  timerInterval = setInterval(() => {
    now.value = Date.now()

    // Check for timeout — fire during both active and wrong-retry states
    if ((isActive.value || isWrongRetry.value) && timeRemaining.value <= 0) {
      store.handleMorseKeyTap('timeout')
    }
  }, TIMER_UPDATE_INTERVAL_MS)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

watch(
  needsTimer,
  running => {
    if (running) {
      // Sync now immediately so timeRemainingPercent starts at 100% (not >100%)
      now.value = Date.now()
      startTimer()
    } else {
      stopTimer()
    }
  },
  { immediate: true }
)

onMounted(() => {
  // Start first challenge if not already active
  if (!morseState.value.isActive) {
    store.startMorseChallenge()
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div
    v-if="isActive || isSuccess || isTimeout || isWrong || isWrongRetry"
    class="border-2 rounded p-4 transition-colors min-h-[180px] flex flex-col"
    :class="
      isSuccess
        ? 'border-terminal-green bg-terminal-green/10'
        : isTimeout || isWrong || isWrongRetry
          ? 'border-red-500 bg-red-500/10'
          : 'border-terminal-amber bg-terminal-bg'
    "
  >
    <div class="flex items-center justify-between mb-2">
      <div>
        <p class="text-terminal-amber font-bold text-lg">QRQ MORSE CHALLENGE</p>
        <p class="text-sm text-gray-400">Key the pattern for bonus QSOs!</p>
      </div>
      <div class="text-right">
        <p class="text-xs text-gray-400">Tries</p>
        <p
          class="text-lg font-mono"
          :class="triesRemaining <= 1 ? 'text-red-400' : 'text-terminal-green'"
        >
          {{ triesRemaining }}<span class="text-gray-500">/3</span>
        </p>
        <p
          class="text-2xl font-mono"
          :class="
            isSuccess
              ? 'text-terminal-green'
              : isTimeout || isWrong || isWrongRetry
                ? 'text-red-500'
                : 'text-terminal-amber'
          "
        >
          {{ isTimeout ? 'TIME!' : isWrong || isWrongRetry ? '✗' : formattedTime }}
        </p>
      </div>
    </div>

    <!-- Main display -->
    <div class="bg-terminal-bg border border-terminal-green rounded p-6 mb-3">
      <p class="text-4xl font-mono text-center text-terminal-green tracking-widest">
        {{ displayText }}
      </p>
      <p
        v-if="keyedDisplay"
        class="text-2xl font-mono text-center text-terminal-amber mt-2 tracking-widest"
      >
        {{ keyedDisplay }}
      </p>
    </div>

    <!-- Progress bar -->
    <div class="w-full bg-gray-700 rounded h-2">
      <div
        class="h-2 rounded transition-all duration-100"
        :class="
          isSuccess
            ? 'bg-terminal-green'
            : isTimeout || isWrong
              ? 'bg-red-500'
              : 'bg-terminal-amber'
        "
        :style="{ width: isSuccess || isTimeout || isWrong ? '100%' : timeRemainingPercent + '%' }"
      ></div>
    </div>

    <!-- Success message -->
    <p v-if="isSuccess" class="text-terminal-green text-center mt-2 font-bold">
      ✓ CORRECT! +{{ (morseState.lastBonusAwarded ?? 0).toFixed(1) }} QSOs!
    </p>

    <!-- Timeout message -->
    <p v-if="isTimeout" class="text-red-500 text-center mt-2 font-bold">
      ✗ TIME'S UP! Moving to next letter...
    </p>

    <!-- Wrong input message (exhausted tries) -->
    <p v-if="isWrong" class="text-red-500 text-center mt-2 font-bold">
      ✗ OUT OF TRIES! Moving to next letter...
    </p>

    <!-- Wrong input message (still has tries, retrying same letter) -->
    <p v-if="isWrongRetry" class="text-red-500 text-center mt-2 font-bold">
      ✗ WRONG! Retrying same letter...
    </p>
  </div>
</template>
