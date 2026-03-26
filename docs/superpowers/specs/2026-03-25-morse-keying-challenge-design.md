# Morse Keying Challenge - Design

**Date:** 2026-03-25
**Feature:** Morse Keying Challenge (QRQ Bonus)

## Overview

Add a skill-based mini-game where players key Morse code patterns for bonus QSOs. This ties into the ham radio theme and rewards active play beyond passive factory income.

## UI Placement

- New `MorseChallenge.vue` component placed near the KeyerArea
- Shows current letter + Morse pattern (e.g., "A = ·−")
- 5-second countdown timer bar
- Visual feedback: green flash on correct, red flash on timeout, then auto-advance to next letter

## Morse Code Set

Letters A-Z and numbers 0-9 (36 characters total).

Display format: `A = ·−` (letter, equals sign, pattern with · for dit and − for dah).

Morse code reference (using `·` for dit and `−` for dah):

```
A: ·−      J: ·−−−    S: ···     1: ·−−−−
B: −···    K: −·−     T: −       2: ··−−−
C: −·−·    L: ·−··    U: ··−     3: ···−−
D: −··     M: −−      V: ···−    4: ····−
E: ·       N: −·      W: ·−−     5: ·····
F: ··−·    O: −−−     X: −··−    6: −····
G: −−·     P: ·−−·    Y: −·−−    7: −−···
H: ····    Q: −−·−    Z: −−··    8: −−−··
I: ··      R: ·−·                9: −−−−·
                                  0: −−−−−
```

## Keying Detection

**Timing Thresholds:**

- Dit: key down < 200ms
- Dah: key down >= 200ms
- Intra-character gap: < 400ms pause = still same letter
- Inter-character gap: >= 400ms pause = letter complete, evaluate

**Sequence Accumulation:**

- Use existing `tapKeyer(type)` from the store
- Accumulate keyed sequence as player taps
- Compare accumulated pattern against target pattern
- On inter-character gap or timeout, evaluate

**Pattern Comparison:**

- `·−` matched against keyed `dit,pause,dah`
- Must match exactly for success

## Bonus Calculation

On correct keying:

```
qrqFactory = find factory with id 'qrq-protocol'
bonus = qrqFactory.qsosPerSecond * upgradeMultiplier * prestigeMultiplier * lotteryMultiplier
```

Apply as passive QSOs bonus via `addPassiveQSOs()` (can be fractional and accrue over time, avoids reapplying prestige multiplier).

If player owns no QRQ Protocol factories, use 0.1 (base rate).

## Letter Selection

Uniform random selection from A-Z, 0-9 each round.

## Challenge States

1. **Idle** - No challenge active (component not visible or disabled)
2. **Active** - Showing pattern, accepting keying, countdown running
3. **Success** - Brief green flash (300ms), then auto-advance to next letter
4. **Timeout** - Brief red flash (300ms), then auto-advance to next letter (timer ran out)
5. **Wrong** - Brief red flash (300ms), then auto-advance to next letter (wrong input keyed)

## Component Interface

`MorseChallenge.vue` is store-driven — it takes no props and emits no events.
It reads all state from `useGameStore().morseChallengeState` and calls store actions directly:

```js
// State shape (morseChallengeState ref)
{
  isActive: boolean,          // Whether a challenge is currently showing
  currentChar: string | null, // Letter being challenged (e.g. 'A')
  currentPattern: string,     // Morse pattern to key (e.g. '·−')
  keyedSequence: string[],    // Accumulated taps: ['dit', 'dah', ...]
  challengeStartTime: number, // Date.now() when challenge started
  state: string,              // 'idle' | 'active' | 'success' | 'timeout' | 'wrong'
}

// Actions used by the component
store.startMorseChallenge()          // Start a new challenge
store.handleMorseKeyTap(type)        // type: 'dit' | 'dah' | 'timeout'
```

## Store Integration

The following were added to `game.js`:

- `morseChallengeState`: reactive ref containing the full challenge state shape above
- `startMorseChallenge()`: picks a random letter, resets state, begins challenge
- `handleMorseKeyTap(type)`: records a tap, evaluates prefix/match, handles timeout sentinel
- `evaluateMorsePattern()`: called after inter-character gap; compares full keyed sequence to pattern
- `advanceMorseLetter()`: auto-advance — calls `startMorseChallenge()` to pick the next letter
- `grantMorseBonus()`: calls `addPassiveQSOs(bonus)` and sets state to `'success'`
- `getQRQOutput()`: returns QRQ factory output with upgrade/prestige/lottery multipliers (capped at MAX_SAFE_INTEGER)

## Files to Create/Modify

1. **New:** `src/components/MorseChallenge.vue` - UI component
2. **New:** `src/constants/morse.js` - Morse code definitions
3. **Modify:** `src/stores/game.js` - Add challenge state and logic
4. **Modify:** `src/App.vue` - Add MorseChallenge to layout
