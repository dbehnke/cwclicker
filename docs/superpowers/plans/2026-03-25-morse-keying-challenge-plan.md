# Morse Keying Challenge Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a skill-based mini-game where players key Morse code patterns for bonus QSOs equal to the QRQ Protocol factory's output per second.

**Architecture:** New MorseChallenge component displays a random letter with its Morse pattern. Player keys the pattern using the existing keyer. Correct keying within 5 seconds grants bonus QSOs. Wrong or timeout just advances to next letter.

**Tech Stack:** Vue 3 Composition API, Pinia store, Vitest, Tailwind CSS

---

## Chunk 1: Morse Code Constants

**Files:**

- Create: `src/constants/morse.js` - Morse code definitions

- [ ] **Step 1: Create morse.js with letter/number definitions**

```javascript
/**
 * Morse code definitions for A-Z and 0-9
 * Format: '·' for dit, '−' for dah
 */
export const MORSE_CHARS = {
  A: '·−',
  B: '−···',
  C: '−·−·',
  D: '−··',
  E: '·',
  F: '··−·',
  G: '−−·',
  H: '····',
  I: '··',
  J: '·---',
  K: '−·−',
  L: '·−··',
  M: '−−',
  N: '−·',
  O: '---',
  P: '·--·',
  Q: '−−·−',
  R: '·−·',
  S: '···',
  T: '−',
  U: '··−',
  V: '···−',
  W: '·--',
  X: '−··−',
  Y: '−·--',
  Z: '−−··',
  0: '-----',
  1: '·----',
  2: '··---',
  3: '···--',
  4: '····-',
  5: '·····',
  6: '−····',
  7: '−−···',
  8: '−−−··',
  9: '−−−−·',
}

/**
 * All characters available for challenges
 * @type {string[]}
 */
export const MORSE_CHAR_LIST = Object.keys(MORSE_CHARS)

/**
 * Timing constants for keying detection
 */
export const MORSE_TIMING = {
  DIT_MAX_MS: 200, // Max duration for a dit
  DAH_MIN_MS: 200, // Min duration for a dah
  INTRA_GAP_MAX_MS: 400, // Max pause within a character
  INTER_GAP_MIN_MS: 400, // Min pause to end a character
}
```

- [ ] **Step 2: Run test to verify syntax**

Run: `node --check src/constants/morse.js`
Expected: No output (success)

- [ ] **Step 3: Commit**

```bash
git add src/constants/morse.js
git commit -m "feat: add Morse code constants for keying challenge"
```

---

## Chunk 2: Store Integration - State Management

**Files:**

- Modify: `src/stores/game.js` - Add morse challenge state and functions

- [ ] **Step 1: Add morse challenge state to game.js**

Find the lottery state around line 123, add morse state after it:

```javascript
// Morse Keying Challenge state
const morseChallengeState = ref({
  isActive: false, // Whether challenge is currently showing
  currentChar: null, // Current character to key (e.g., 'A')
  currentPattern: '', // Morse pattern (e.g., '·−')
  keyedSequence: [], // Array of 'dit' or 'dah' keyed so far
  lastKeyTime: 0, // Timestamp of last key tap
  challengeStartTime: 0, // When current challenge started
  state: 'idle', // 'idle' | 'active' | 'success' | 'timeout'
})
```

- [ ] **Step 2: Add helper functions to game.js**

Add these functions before the `return {` statement at line 796:

```javascript
/**
 * Gets the QRQ Protocol factory's current output per second
 * Includes all multipliers: upgrades, prestige, lottery
 * @returns {number} QSOs per second
 */
function getQRQOutput() {
  const factory = FACTORIES.find(f => f.id === 'qrq-protocol')
  if (!factory) return 0.1

  const count = factoryCounts.value['qrq-protocol'] || 0
  if (count === 0) return 0.1

  const baseOutput = factory.qsosPerSecond * count
  const upgradeMult = getUpgradeMultiplier('qrq-protocol')
  const prestigeMult = prestigeMultiplier.value
  const lotteryMult = getLotteryMultiplier('qrq-protocol')

  return baseOutput * upgradeMult * prestigeMult * lotteryMult
}

/**
 * Starts a new morse challenge with a random character
 */
function startMorseChallenge() {
  const charList = MORSE_CHARS
    ? Object.keys(MORSE_CHARS).filter(k => k.length === 1)
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')
  const char = charList[Math.floor(Math.random() * charList.length)]
  const pattern = char.length === 1 ? getMorsePattern(char) : ''

  morseChallengeState.value = {
    isActive: true,
    currentChar: char,
    currentPattern: pattern,
    keyedSequence: [],
    lastKeyTime: 0,
    challengeStartTime: Date.now(),
    state: 'active',
  }
}

/**
 * Gets the morse pattern for a character
 * @param {string} char - Single character
 * @returns {string} Morse pattern
 */
function getMorsePattern(char) {
  // Fallback patterns if morse.js not imported
  const patterns = {
    A: '·−',
    B: '−···',
    C: '−·−·',
    D: '−··',
    E: '·',
    F: '··−·',
    G: '−−·',
    H: '····',
    I: '··',
    J: '·---',
    K: '−·−',
    L: '·−··',
    M: '−−',
    N: '−·',
    O: '---',
    P: '·--·',
    Q: '−−·−',
    R: '·−·',
    S: '···',
    T: '−',
    U: '··−',
    V: '···−',
    W: '·--',
    X: '−··−',
    Y: '−·--',
    Z: '−−··',
    0: '-----',
    1: '·----',
    2: '··---',
    3: '···--',
    4: '····-',
    5: '·····',
    6: '−····',
    7: '−−···',
    8: '−−−··',
    9: '−−−−·',
  }
  return patterns[char] || ''
}

/**
 * Handles a key tap during morse challenge
 * Evaluates dit/dah based on timing
 * @param {'dit'|'dah'} type - The type of tap
 */
function handleMorseKeyTap(type) {
  const state = morseChallengeState.value
  if (!state.isActive || state.state !== 'active') return

  const now = Date.now()
  const timeSinceLastKey = state.lastKeyTime ? now - state.lastKeyTime : Infinity

  // Check for inter-character gap (if we have a sequence and enough time has passed)
  if (state.keyedSequence.length > 0 && timeSinceLastKey >= MORSE_TIMING.INTER_GAP_MIN_MS) {
    // Evaluate what we have so far
    evaluateMorsePattern()
    return
  }

  // Add to sequence
  state.keyedSequence.push(type)
  state.lastKeyTime = now

  // Check if sequence matches pattern (partial or full)
  const pattern = state.currentPattern.split('')
  const keyed = state.keyedSequence.map(s => (s === 'dit' ? '·' : '−'))

  // Check for exact match
  if (keyed.length === pattern.length && keyed.every((v, i) => v === pattern[i])) {
    // Success!
    grantMorseBonus()
    return
  }

  // Check if already wrong (keyed doesn't match prefix of pattern)
  if (!pattern.slice(0, keyed.length).every((v, i) => v === keyed[i])) {
    // Wrong - just reset the sequence but don't penalize
    state.keyedSequence = [type]
    state.lastKeyTime = now
  }
}

/**
 * Evaluates the current keyed sequence against the target pattern
 */
function evaluateMorsePattern() {
  const state = morseChallengeState.value
  if (!state.isActive) return

  const pattern = state.currentPattern.split('')
  const keyed = state.keyedSequence.map(s => (s === 'dit' ? '·' : '−'))

  if (keyed.length === pattern.length && keyed.every((v, i) => v === pattern[i])) {
    grantMorseBonus()
  } else {
    // Timeout or incomplete - just advance
    advanceMorseLetter()
  }
}

/**
 * Grants the QRQ bonus for correct keying
 */
function grantMorseBonus() {
  const bonus = getQRQOutput()
  if (bonus > 0) {
    addQSOs(BigInt(Math.floor(bonus)))
  }
  morseChallengeState.value.state = 'success'
  // Auto advance after brief delay
  setTimeout(() => {
    advanceMorseLetter()
  }, 300)
}

/**
 * Advances to the next letter after success or timeout
 */
function advanceMorseLetter() {
  startMorseChallenge()
}
```

Note: Add `MORSE_TIMING` constant near the top of the file, and import `FACTORIES` at line 3.

- [ ] **Step 3: Add morse challenge to store exports**

Find the return statement around line 796, add to the returned object:

```javascript
morseChallengeState,
startMorseChallenge,
handleMorseKeyTap,
getQRQOutput,
```

- [ ] **Step 4: Run tests to verify syntax**

Run: `npm run build 2>&1 | head -30`
Expected: No syntax errors in game.js

- [ ] **Step 5: Commit**

```bash
git add src/stores/game.js
git commit -m "feat: add morse challenge state and logic to game store"
```

---

## Chunk 3: MorseChallenge Component

**Files:**

- Create: `src/components/MorseChallenge.vue` - UI component
- Create: `src/components/__tests__/MorseChallenge.test.js` - Tests

- [ ] **Step 1: Create the MorseChallenge.vue component**

```vue
<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'
import { formatNumber } from '../utils/format'

const store = useGameStore()

const CHALLENGE_DURATION_MS = 5000
const TIMER_UPDATE_INTERVAL_MS = 100

const now = ref(Date.now())
let timerInterval = null

const morseState = computed(() => store.morseChallengeState)

const isActive = computed(() => morseState.value.isActive && morseState.value.state === 'active')

const timeRemaining = computed(() => {
  if (!morseState.value.isActive) return 0
  const elapsed = now.value - morseState.value.challengeStartTime
  return Math.max(0, CHALLENGE_DURATION_MS - elapsed)
})

const timeRemainingPercent = computed(() => {
  return (timeRemaining.value / CHALLENGE_DURATION_MS) * 100
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

function startTimer() {
  if (timerInterval) return
  timerInterval = setInterval(() => {
    now.value = Date.now()

    // Check for timeout
    if (isActive.value && timeRemaining.value <= 0) {
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
  isActive,
  active => {
    if (active) {
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
    v-if="isActive || isSuccess"
    class="border-2 rounded p-4 transition-colors"
    :class="
      isSuccess
        ? 'border-terminal-green bg-terminal-green/10'
        : 'border-terminal-amber bg-terminal-bg'
    "
  >
    <div class="flex items-center justify-between mb-2">
      <div>
        <p class="text-terminal-amber font-bold text-lg">QRQ MORSE CHALLENGE</p>
        <p class="text-sm text-gray-400">Key the pattern for bonus QSOs!</p>
      </div>
      <div class="text-right">
        <p
          class="text-2xl font-mono"
          :class="isSuccess ? 'text-terminal-green' : 'text-terminal-amber'"
        >
          {{ formattedTime }}
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
        :class="isSuccess ? 'bg-terminal-green' : 'bg-terminal-amber'"
        :style="{ width: isSuccess ? '100%' : timeRemainingPercent + '%' }"
      ></div>
    </div>

    <!-- Success message -->
    <p v-if="isSuccess" class="text-terminal-green text-center mt-2 font-bold">
      ✓ CORRECT! Bonus QSOs awarded!
    </p>
  </div>
</template>
```

- [ ] **Step 2: Create basic test file**

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MorseChallenge from '../MorseChallenge.vue'
import { useGameStore } from '../../stores/game'

describe('MorseChallenge', () => {
  it('renders when active', () => {
    const store = useGameStore()
    store.startMorseChallenge()

    const wrapper = mount(MorseChallenge, {
      global: {
        stubs: {
          useGameStore: () => store,
        },
      },
    })

    expect(wrapper.find('.text-terminal-amber').text()).toContain('QRQ MORSE CHALLENGE')
  })
})
```

- [ ] **Step 3: Run build to verify**

Run: `npm run build 2>&1 | head -40`
Expected: Successful build

- [ ] **Step 4: Commit**

```bash
git add src/components/MorseChallenge.vue src/components/__tests__/MorseChallenge.test.js
git commit -m "feat: add MorseChallenge component"
```

---

## Chunk 4: App Integration

**Files:**

- Modify: `src/App.vue` - Add MorseChallenge to layout

- [ ] **Step 1: Import and add MorseChallenge to App.vue**

Add import at line 10:

```javascript
import MorseChallenge from './components/MorseChallenge.vue'
```

Add component in template after RareDxBonus (around line 148):

```vue
<MorseChallenge />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 3: Commit**

```bash
git add src/App.vue
git commit -m "feat: integrate MorseChallenge into main app layout"
```

---

## Chunk 5: Integration with KeyerArea

**Files:**

- Modify: `src/components/KeyerArea.vue` - Forward keyer taps to morse challenge
- Modify: `src/stores/game.js` - Handle morse key evaluation

- [ ] **Step 1: Update KeyerArea to forward taps to morse challenge**

Read the current KeyerArea.vue, find the `handleTap` function, and add:

```javascript
// Forward to morse challenge if active
store.handleMorseKeyTap(type)
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 3: Commit**

```bash
git add src/components/KeyerArea.vue src/stores/game.js
git commit -m "feat: connect keyer taps to morse challenge"
```

---

## Chunk 6: Final Testing and Cleanup

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 2: Manual verification**

- Open the app in dev mode
- Verify MorseChallenge appears above the keyer
- Tap the keyer and verify the keyed sequence builds up
- Wait for timeout and verify new letter appears
- After correct keying, verify bonus QSOs are added

- [ ] **Step 3: Final commit if all working**

```bash
git add -A
git commit -m "feat: complete Morse Keying Challenge feature"
```
