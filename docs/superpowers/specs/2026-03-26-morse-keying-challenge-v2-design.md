# Morse Keying Challenge Improvements — Design Spec

## Context

The Morse Keying Challenge (PR #25) is a skill-based mini-game where players key Morse patterns for bonus QSOs. Currently it has:

- Single try per letter
- 5 second timer per letter
- Instant advance (300ms) on wrong/timeout

Feedback: The challenge is too stressful for newer players who are still learning Morse patterns. The goal is to make it more forgiving and learning-oriented.

## Changes

### 1. 3 Tries per Letter

Each letter gives the player 3 attempts to key the correct pattern.

**State changes:**

- Add `triesRemaining` field to `morseChallengeState` (starts at 3, resets each new letter)
- On wrong input: decrement `triesRemaining`, reset `keyedSequence`, continue timer
- On `triesRemaining === 0`: transition to 'wrong' state

**Flow:**

```
Letter shown, triesRemaining = 3, timer starts (20s)
→ Player keys
  → Correct: success, advance after 5s pause
  → Wrong: triesRemaining--, reset sequence
    → triesRemaining > 0: keep going, timer still running
    → triesRemaining === 0: wrong state, advance after 5s pause
  → Timeout (20s): timeout state, advance after 5s pause
```

### 2. 20 Second Timer per Letter

The timer is now 20 seconds per letter (not per try). This gives players adequate time to think, make mistakes, and retry.

- `CHALLENGE_DURATION_MS` changes from `5000` to `20000` in `MorseChallenge.vue`
- Timer keeps running across retries — only resets when advancing to a new letter

### 3. 5 Second Display Pause after Result

After success, wrong (exhausted tries), or timeout — display the result state for 5 seconds before advancing to the next letter.

- `MORSE_CHALLENGE_ADVANCE_DELAY_MS` in `game.js` changes from `300` to `5000`

### 4. WPM Setting (5-30 WPM)

A new global setting that controls Morse timing. Affects both the game's Morse keying audio and the challenge.

**Where to set/store:**

- Add `morseWpm` field to `audioSettings` in `game.js` (default: 5)
- Add UI control in Settings component to adjust 5-30 WPM slider

**WPM to timing conversion:**

Morse timing is based on the "unit" (1 dit duration). Standard PARIS = 50 units.

| WPM | Dit duration (ms) | Intra-character gap | Inter-character gap |
| --- | ----------------- | ------------------- | ------------------- |
| 5   | 240               | 240                 | 720                 |
| 10  | 120               | 120                 | 360                 |
| 15  | 80                | 80                  | 240                 |
| 20  | 60                | 60                  | 180                 |
| 25  | 48                | 48                  | 144                 |
| 30  | 40                | 40                  | 120                 |

Formula: `DIT_MS = 1200 / WPM` (1200ms = 60sec / 50 units per word)

**How WPM affects the challenge:**

- Higher WPM = tighter intra-character gap tolerance
- The challenge's 20s timer is independent of WPM (it's about pattern recognition, not timing)
- Audio playback of Morse (in game) uses WPM setting

**Implementation:**

- Add `MORSE_WPM_DEFAULT = 5` and `MORSE_WPM_MIN = 5`, `MORSE_WPM_MAX = 30` constants
- Add `morseWpm` to `audioSettings` ref with default `MORSE_WPM_DEFAULT`
- Update `MORSE_TIMING` to be computed from `morseWpm` (or keep as base and scale)
- Add WPM slider to Settings UI
- Persist `morseWpm` in save/load

### 5. Fixed-Size Challenge Box

The challenge UI box should not resize when content changes (e.g., success message vs. timeout message).

**Changes to `MorseChallenge.vue`:**

- Set explicit `min-height` on the container div
- All inner states (active, success, timeout, wrong) should use the same layout space
- Success message shows QSOs earned: "✓ CORRECT! +X QSOs!"

### 6. Show QSOs Earned on Success

On success, display the bonus QSOs awarded.

**Changes:**

- `grantMorseBonus()` already calculates `bonus = getQRQOutput()`
- Store `lastBonusAwarded` in `morseChallengeState` so the component can display it
- Display: "✓ CORRECT! +X QSOs!" in the success message area

## Files to Modify

1. **`src/stores/game.js`**
   - Change `MORSE_CHALLENGE_ADVANCE_DELAY_MS` from `300` to `5000`
   - Add `morseWpm` to `audioSettings` (default 5, range 5-30)
   - Update timing functions to use `morseWpm`
   - Add `lastBonusAwarded` to `morseChallengeState`
   - Update `grantMorseBonus()` to store bonus awarded
   - Update tests in `morse.test.js` for new 3-try behavior

2. **`src/components/MorseChallenge.vue`**
   - Change `CHALLENGE_DURATION_MS` from `5000` to `20000`
   - Set explicit `min-height` on container
   - Add tries remaining display
   - Show QSOs earned on success
   - Handle wrong state with tries remaining logic

3. **`src/components/KeyerArea.vue`** (if needed)
   - If WPM setting affects keyer audio timing

4. **`src/components/Settings.vue`** (or wherever settings are)
   - Add WPM slider control

5. **`src/constants/morse.js`**
   - Add WPM-related constants if helpful

6. **Tests**
   - Update `src/stores/__tests__/morse.test.js` — update timeout/wrong test cases for 3-try logic
   - Update `src/components/__tests__/MorseChallenge.test.js` as needed

## State Changes

### `morseChallengeState` (game.js)

```javascript
const morseChallengeState = ref({
  isActive: false,
  currentChar: null,
  currentPattern: '',
  keyedSequence: [],
  challengeStartTime: 0,
  state: 'idle', // 'idle' | 'active' | 'success' | 'wrong' | 'timeout'
  triesRemaining: 3, // NEW: 3 tries per letter
  lastBonusAwarded: 0, // NEW: for display on success
})
```

### `audioSettings` (game.js)

```javascript
const audioSettings = ref({
  volume: 0.5,
  morseWpm: 5, // NEW: 5-30 WPM
  // ... other fields
})
```

## Migration

- Version bump: v1.1.5 → v1.1.6
- Save data: `triesRemaining` defaults to 3, `lastBonusAwarded` defaults to 0 on load
- Existing saves continue to work (new fields get defaults)
