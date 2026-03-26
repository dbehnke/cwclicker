# Morse Keying Challenge v2 — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the Morse Keying Challenge with 3 tries, 20s timer, 5s pause, WPM setting (5-30), fixed-size UI box, and QSOs-earned display.

**Architecture:**

- Changes are concentrated in `game.js` (store logic) and `MorseChallenge.vue` (UI), with a new WPM slider in `SettingsPanel.vue`
- WPM setting stored in `audioSettings` (already persisted), new fields added to `morseChallengeState`
- No structural changes — existing patterns followed throughout

**Tech Stack:** Vue 3 (Composition API), Pinia, Vitest

---

## Chunk 1: Constants and State — game.js

**Files:**

- Modify: `src/stores/game.js` — lines 16-17, 99-103, 143-150, 622-636, 699-743
- Modify: `src/constants/morse.js` — add WPM-related constants

### Task 1: Update constants in game.js

- [ ] **Step 1: Change MORSE_CHALLENGE_ADVANCE_DELAY_MS from 300 to 5000**

```javascript
// Line 17
const MORSE_CHALLENGE_ADVANCE_DELAY_MS = 5000 // was 300
```

### Task 2: Add WPM constants to morse.js

- [ ] **Step 1: Add WPM constants**

```javascript
// Add at end of morse.js
export const MORSE_WPM = {
  DEFAULT: 5,
  MIN: 5,
  MAX: 30,
}

export function ditDurationMs(wpm) {
  return Math.round(1200 / wpm)
}
```

### Task 3: Add morseWpm to audioSettings

- [ ] **Step 1: Add morseWpm to audioSettings ref (line ~99)**

```javascript
const audioSettings = ref({
  volume: 0.5,
  frequency: 600,
  isMuted: false,
  morseWpm: 5, // NEW
})
```

### Task 4: Add triesRemaining and lastBonusAwarded to morseChallengeState

- [ ] **Step 1: Add new fields to morseChallengeState ref (line ~143)**

```javascript
const morseChallengeState = ref({
  isActive: false,
  currentChar: null,
  currentPattern: '',
  keyedSequence: [],
  challengeStartTime: 0,
  state: 'idle', // 'idle' | 'active' | 'success' | 'timeout' | 'wrong'
  triesRemaining: 3, // NEW
  lastBonusAwarded: 0, // NEW
})
```

### Task 5: Update save() to persist morseWpm and new morseChallengeState fields

- [ ] **Step 1: Verify audioSettings includes morseWpm in save (line ~630)**

```javascript
// Line 630 — already correct if audioSettings ref includes morseWpm
audioSettings: audioSettings.value,
```

- [ ] **Step 2: Verify morseChallengeState includes new fields in save (line ~635)**

```javascript
// Line 635 — already correct if morseChallengeState ref includes new fields
morseChallengeState: morseChallengeState.value,
```

### Task 6: Update load() to handle new fields and morseWpm

- [ ] **Step 1: Update audioSettings load to include morseWpm (line ~700)**

```javascript
audioSettings.value = {
  volume: state.audioSettings.volume ?? 0.5,
  frequency: state.audioSettings.frequency ?? 600,
  isMuted: state.audioSettings.isMuted ?? false,
  morseWpm: state.audioSettings.morseWpm ?? 5, // NEW
}
```

- [ ] **Step 2: Update morseChallengeState load to include new fields (line ~736)**

```javascript
morseChallengeState.value = {
  isActive: state.morseChallengeState.isActive || false,
  currentChar: state.morseChallengeState.currentChar || null,
  currentPattern: state.morseChallengeState.currentPattern || '',
  keyedSequence: state.morseChallengeState.keyedSequence || [],
  challengeStartTime: state.morseChallengeState.challengeStartTime || 0,
  state: state.morseChallengeState.state || 'idle',
  triesRemaining: state.morseChallengeState.triesRemaining ?? 3, // NEW
  lastBonusAwarded: state.morseChallengeState.lastBonusAwarded ?? 0, // NEW
}
```

### Task 7: Update grantMorseBonus() to store lastBonusAwarded

- [ ] **Step 1: Update grantMorseBonus() to store bonus awarded**

```javascript
function grantMorseBonus() {
  const bonus = getQRQOutput()
  if (bonus > 0) {
    addPassiveQSOs(bonus)
  }
  morseChallengeState.value.state = 'success'
  morseChallengeState.value.lastBonusAwarded = bonus // NEW
  setTimeout(() => {
    advanceMorseLetter()
  }, MORSE_CHALLENGE_ADVANCE_DELAY_MS)
}
```

### Task 8: Update startMorseChallenge() to reset triesRemaining

- [ ] **Step 1: Add triesRemaining to startMorseChallenge() (line ~906)**

```javascript
morseChallengeState.value = {
  isActive: true,
  currentChar: char,
  currentPattern: pattern,
  keyedSequence: [],
  challengeStartTime: Date.now(),
  state: 'active',
  triesRemaining: 3, // NEW
  lastBonusAwarded: 0, // NEW
}
```

---

## Chunk 2: Challenge Logic — handleMorseKeyTap, evaluateMorsePattern, advanceMorseLetter

**Files:**

- Modify: `src/stores/game.js` — lines 922-1017

### Task 9: Rewrite handleMorseKeyTap for 3-try logic

- [ ] **Step 1: Write failing test first**

See Task 10 below — write tests before implementing.

- [ ] **Step 2: Implement new handleMorseKeyTap logic**

The new logic:

- On 'timeout': set state to 'timeout', advance after 5s delay
- On wrong input (pattern diverges):
  - If `triesRemaining > 1`: decrement `triesRemaining`, reset `keyedSequence`, stay in 'active' state (timer keeps running)
  - If `triesRemaining === 1`: set state to 'wrong', advance after 5s delay
- On correct exact match: `grantMorseBonus()`
- On correct prefix so far: schedule inter-character gap timer (no try consumed)

```javascript
function handleMorseKeyTap(type) {
  const state = morseChallengeState.value
  if (state.state !== 'active') {
    return
  }

  // Cancel any pending inter-character gap evaluation timer
  if (pendingEvalTimer) {
    clearTimeout(pendingEvalTimer)
    pendingEvalTimer = null
  }

  // Handle timeout sentinel from the UI timer
  if (type === 'timeout') {
    morseChallengeState.value.state = 'timeout'
    setTimeout(() => {
      advanceMorseLetter()
    }, MORSE_CHALLENGE_ADVANCE_DELAY_MS)
    return
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
    if (state.triesRemaining > 1) {
      // Retry with same letter
      morseChallengeState.value.triesRemaining = state.triesRemaining - 1
      morseChallengeState.value.keyedSequence = []
      // Timer keeps running — player continues with same letter
    } else {
      // Last try exhausted — fail
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
```

- [ ] **Step 3: Run tests to verify it passes**

Run: `npx vitest run src/stores/__tests__/morse.test.js`
Expected: All tests pass

### Task 10: Update tests in morse.test.js for 3-try behavior

- [ ] **Step 1: Write failing tests for new 3-try wrong-input behavior**

Add new test cases for wrong-input with retries:

```javascript
describe('handleMorseKeyTap - wrong sequence with 3 tries', () => {
  it('decrements triesRemaining on wrong input and resets sequence', () => {
    const store = useGameStore()
    store.startMorseChallenge()
    store.morseChallengeState.currentChar = 'A'
    store.morseChallengeState.currentPattern = '·−'
    store.morseChallengeState.keyedSequence = []
    store.morseChallengeState.triesRemaining = 3

    store.handleMorseKeyTap('dah') // wrong first element

    expect(store.morseChallengeState.state).toBe('active') // not 'wrong'
    expect(store.morseChallengeState.triesRemaining).toBe(2)
    expect(store.morseChallengeState.keyedSequence).toEqual([])
  })

  it('sets wrong state when triesRemaining reaches 0', () => {
    const store = useGameStore()
    store.startMorseChallenge()
    store.morseChallengeState.currentChar = 'A'
    store.morseChallengeState.currentPattern = '·−'
    store.morseChallengeState.keyedSequence = []
    store.morseChallengeState.triesRemaining = 1

    store.handleMorseKeyTap('dah') // wrong — was last try

    expect(store.morseChallengeState.state).toBe('wrong')
  })

  it('allows successful retry after wrong first attempt', () => {
    const store = useGameStore()
    store.startMorseChallenge()
    store.morseChallengeState.currentChar = 'A'
    store.morseChallengeState.currentPattern = '·−'
    store.morseChallengeState.keyedSequence = []
    store.morseChallengeState.triesRemaining = 2

    store.handleMorseKeyTap('dah') // wrong
    expect(store.morseChallengeState.state).toBe('active')
    expect(store.morseChallengeState.triesRemaining).toBe(1)

    store.handleMorseKeyTap('dit') // correct first
    store.handleMorseKeyTap('dah') // completes ·−

    expect(store.morseChallengeState.state).toBe('success')
  })
})
```

- [ ] **Step 2: Update existing wrong-input tests for new 1-try exhaustion behavior**

Existing tests at line 91-130 currently expect immediate 'wrong' state. Update them to reflect that a single wrong input now only consumes 1 try, and 'wrong' state only occurs when tries are exhausted.

Old tests (lines 91-130) assume wrong → immediate failure. Update:

- `test: 'sets wrong state immediately when first element is wrong'` → now tests that a single wrong input decrements tries but stays active when tries > 1
- Add a new test for the "last try exhausted" case

Also update timeout tests: timeout should still immediately set 'timeout' state (20s timer handles urgency, not wrong-input logic).

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/morse.test.js`
Expected: All tests pass (including new 3-try tests)

### Task 11: Update advanceMorseLetter() cleanup

- [ ] **Step 1: Ensure advanceMorseLetter() clears pendingEvalTimer and resets keyedSequence**

```javascript
function advanceMorseLetter() {
  if (pendingEvalTimer) {
    clearTimeout(pendingEvalTimer)
    pendingEvalTimer = null
  }
  startMorseChallenge() // already resets keyedSequence and triesRemaining
}
```

Verify this is already the case (line ~1011). It should already call `startMorseChallenge()` which resets everything.

---

## Chunk 3: UI — MorseChallenge.vue

**Files:**

- Modify: `src/components/MorseChallenge.vue` — timer, display, fixed-size box

### Task 12: Update timer from 5s to 20s

- [ ] **Step 1: Change CHALLENGE_DURATION_MS from 5000 to 20000**

```javascript
// Line 7
const CHALLENGE_DURATION_MS = 20000 // was 5000
```

### Task 13: Add tries remaining display

- [ ] **Step 1: Add computed for tries remaining**

```javascript
const triesRemaining = computed(() => morseState.value.triesRemaining ?? 3)
```

- [ ] **Step 2: Add tries display in template (below the timer)**

In the header area, add a tries indicator next to the timer:

```html
<div class="text-right">
  <p class="text-xs text-gray-400">Tries</p>
  <p class="text-lg font-mono text-terminal-green">
    {{ morseState.triesRemaining ?? 3 }}<span class="text-gray-500">/3</span>
  </p>
</div>
```

### Task 14: Update success message to show QSOs earned

- [ ] **Step 1: Update success message**

```html
<!-- Success message -->
<p v-if="isSuccess" class="text-terminal-green text-center mt-2 font-bold">
  ✓ CORRECT! +{{ morseState.lastBonusAwarded.toFixed(1) }} QSOs!
</p>
```

### Task 15: Set fixed-size box (no layout shift)

- [ ] **Step 1: Add explicit min-height and consistent structure**

Add `min-height` to the outer div and ensure all states use the same layout space. Use a fixed `min-height` on the main display area so success/timeout/wrong messages don't shift the box size.

```html
<!-- Outer container -->
<div
  v-if="isActive || isSuccess || isTimeout || isWrong"
  class="border-2 rounded p-4 transition-colors min-h-[180px] flex flex-col"
  ...
></div>
```

Ensure the inner "main display" area always renders the same elements regardless of state (use `v-show` or keep elements present but hidden).

### Task 16: Update wrong/timeout messages to be more informative

- [ ] **Step 1: Update timeout message**

```html
<!-- Timeout message -->
<p v-if="isTimeout" class="text-red-500 text-center mt-2 font-bold">
  ✗ TIME'S UP! Moving to next letter...
</p>

<!-- Wrong input message (exhausted tries) -->
<p v-if="isWrong" class="text-red-500 text-center mt-2 font-bold">
  ✗ OUT OF TRIES! Moving to next letter...
</p>
```

Note: For wrong state, we now only show this when tries are exhausted. The "wrong but retry available" case stays in 'active' state with the keyed display showing the attempt.

---

## Chunk 4: Settings UI — SettingsPanel.vue + WPM

**Files:**

- Modify: `src/components/SettingsPanel.vue` — add WPM slider

### Task 17: Add WPM slider to Audio Settings section

- [ ] **Step 1: Add WPM constants**

```javascript
const MIN_MORSE_WPM = 5
const MAX_MORSE_WPM = 30
```

- [ ] **Step 2: Add WPM handler function**

```javascript
function handleMorseWpmChange(event) {
  const wpm = parseInt(event.target.value, 10)
  store.updateAudioSettings({ morseWpm: wpm })
}
```

- [ ] **Step 3: Add WPM slider to Audio Settings section (after Frequency slider)**

```html
<!-- WPM Slider -->
<div class="space-y-2">
  <div class="flex justify-between text-terminal-green">
    <span>Morse WPM</span>
    <span>{{ store.audioSettings.morseWpm }} WPM</span>
  </div>
  <input
    type="range"
    :min="MIN_MORSE_WPM"
    :max="MAX_MORSE_WPM"
    step="5"
    :value="store.audioSettings.morseWpm"
    @input="handleMorseWpmChange"
    class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
  />
  <div class="flex justify-between text-xs text-gray-500">
    <span>{{ MIN_MORSE_WPM }} WPM (Slow)</span>
    <span>{{ MAX_MORSE_WPM }} WPM (Fast)</span>
  </div>
</div>
```

- [ ] **Step 4: Update SettingsPanel.test.js**

Add `morseWpm: 5` to the `audioSettings` mock in tests.

### Task 18: Update isValidSaveData in SettingsPanel.vue to validate morseWpm

- [ ] **Step 1: Add morseWpm to audioSettings validation**

```javascript
// In isValidSaveData, after isMuted validation:
if (typeof audio.morseWpm !== 'number' || audio.morseWpm < 5 || audio.morseWpm > 30) {
  return false
}
```

- [ ] **Step 2: Add morseWpm to sanitizeSaveData**

```javascript
sanitized.audioSettings = {
  volume: Math.max(0, Math.min(1, Number(audio.volume) || 0.5)),
  frequency: Math.max(400, Math.min(1000, Number(audio.frequency) || 600)),
  isMuted: Boolean(audio.isMuted),
  morseWpm: Math.max(5, Math.min(30, Number(audio.morseWpm) || 5)), // NEW
}
```

---

## Chunk 5: End-to-End Tests + Final Verification

**Files:**

- Modify: `src/components/__tests__/MorseChallenge.test.js`

### Task 19: Update MorseChallenge component tests

- [ ] **Step 1: Update tests for new timer duration (20s) and tries display**

Update timer/display tests to reflect 20000ms instead of 5000ms.

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

### Task 20: Run production build

Run: `npm run build`
Expected: Build succeeds, bundle ~158 kB gzip

### Task 21: Bump version if not already done

Verify `VERSION` and `GAME_VERSION` in game.js are both `1.1.6`.

---

## File Summary

| File                                              | Changes                                                                                                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VERSION`                                         | Already bumped to 1.1.6                                                                                                                                                                     |
| `src/stores/game.js`                              | Constants (delay 300→5000), audioSettings (+morseWpm), morseChallengeState (+triesRemaining, +lastBonusAwarded), handleMorseKeyTap (3-try logic), grantMorseBonus (stores bonus), load/save |
| `src/constants/morse.js`                          | +MORSE_WPM constants, +ditDurationMs()                                                                                                                                                      |
| `src/components/MorseChallenge.vue`               | Timer 5s→20s, tries display, success shows QSOs, fixed-size box                                                                                                                             |
| `src/components/SettingsPanel.vue`                | +WPM slider, validate/sanitize morseWpm                                                                                                                                                     |
| `src/stores/__tests__/morse.test.js`              | +3-try wrong-input tests, update existing tests                                                                                                                                             |
| `src/components/__tests__/MorseChallenge.test.js` | Timer duration updates                                                                                                                                                                      |
