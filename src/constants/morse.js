'use strict'

/**
 * Morse code definitions for A-Z and 0-9 (36 characters)
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
  J: '·−−−',
  K: '−·−',
  L: '·−··',
  M: '−−',
  N: '−·',
  O: '−−−',
  P: '·−−·',
  Q: '−−·−',
  R: '·−·',
  S: '···',
  T: '−',
  U: '··−',
  V: '···−',
  W: '·−−',
  X: '−··−',
  Y: '−·−−',
  Z: '−−··',
  0: '−−−−−',
  1: '·−−−−',
  2: '··−−−',
  3: '···−−',
  4: '····−',
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
  DIT_MAX_MS: 199, // Max duration for a dit
  DAH_MIN_MS: 200, // Min duration for a dah
  INTRA_GAP_MAX_MS: 400, // Max pause within a character
  INTER_GAP_MIN_MS: 400, // Min pause to end a character
}
