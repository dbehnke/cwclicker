import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../game'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MORSE_TIMING } from '../../constants/morse'

describe('Morse Challenge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('startMorseChallenge', () => {
    it('sets up an active challenge with a valid character and pattern', () => {
      const store = useGameStore()
      store.startMorseChallenge()

      const state = store.morseChallengeState
      expect(state.isActive).toBe(true)
      expect(state.state).toBe('active')
      expect(state.currentChar).toBeTruthy()
      expect(state.currentPattern).toBeTruthy()
      expect(state.keyedSequence).toEqual([])
    })
  })

  describe('handleMorseKeyTap - correct sequence', () => {
    it('sets success state when the full correct pattern is keyed (single dit: E)', () => {
      const store = useGameStore()
      store.startMorseChallenge()
      store.morseChallengeState.currentChar = 'E'
      store.morseChallengeState.currentPattern = '·'
      store.morseChallengeState.keyedSequence = []

      store.handleMorseKeyTap('dit')

      expect(store.morseChallengeState.state).toBe('success')
    })

    it('awards fractional QSOs when correct pattern is keyed (fallback 0.1 with no factories)', () => {
      const store = useGameStore()
      store.startMorseChallenge()
      store.morseChallengeState.currentChar = 'E'
      store.morseChallengeState.currentPattern = '·'
      store.morseChallengeState.keyedSequence = []

      const beforeFractional = store.fractionalQSOs
      store.handleMorseKeyTap('dit')

      // With no QRQ factories the fallback bonus is 0.1; addPassiveQSOs accumulates it
      expect(store.morseChallengeState.state).toBe('success')
      expect(store.fractionalQSOs).toBeGreaterThan(beforeFractional)
    })

    it('sets success state for a multi-element pattern (A = ·−)', () => {
      const store = useGameStore()
      store.startMorseChallenge()
      store.morseChallengeState.currentChar = 'A'
      store.morseChallengeState.currentPattern = '·−'
      store.morseChallengeState.keyedSequence = []

      store.handleMorseKeyTap('dit')
      // After dit, state is still 'active' (prefix match, waiting for dah)
      expect(store.morseChallengeState.state).toBe('active')

      store.handleMorseKeyTap('dah')
      expect(store.morseChallengeState.state).toBe('success')
    })

    it('advances to next letter after success delay', () => {
      const store = useGameStore()
      store.startMorseChallenge()
      store.morseChallengeState.currentChar = 'E'
      store.morseChallengeState.currentPattern = '·'
      store.morseChallengeState.keyedSequence = []

      store.handleMorseKeyTap('dit')
      expect(store.morseChallengeState.state).toBe('success')

      vi.runAllTimers()

      expect(store.morseChallengeState.state).toBe('active')
      expect(store.morseChallengeState.keyedSequence).toEqual([])
    })
  })

  describe('handleMorseKeyTap - wrong sequence', () => {
    it('sets wrong state immediately when first element is wrong (A expects dit, got dah)', () => {
      const store = useGameStore()
      store.startMorseChallenge()
      store.morseChallengeState.currentChar = 'A'
      store.morseChallengeState.currentPattern = '·−'
      store.morseChallengeState.keyedSequence = []
      store.morseChallengeState.triesRemaining = 1

      store.handleMorseKeyTap('dah')

      expect(store.morseChallengeState.state).toBe('wrong')
    })

    it('sets wrong state when sequence diverges mid-pattern (A: ·−, got ··)', () => {
      const store = useGameStore()
      store.startMorseChallenge()
      store.morseChallengeState.currentChar = 'A'
      store.morseChallengeState.currentPattern = '·−'
      store.morseChallengeState.keyedSequence = []
      store.morseChallengeState.triesRemaining = 1

      store.handleMorseKeyTap('dit') // correct first
      store.handleMorseKeyTap('dit') // wrong second (should be dah)

      expect(store.morseChallengeState.state).toBe('wrong')
    })

    it('advances to next letter after wrong-input delay', () => {
      const store = useGameStore()
      store.startMorseChallenge()
      store.morseChallengeState.currentChar = 'A'
      store.morseChallengeState.currentPattern = '·−'
      store.morseChallengeState.keyedSequence = []
      store.morseChallengeState.triesRemaining = 1

      store.handleMorseKeyTap('dah')
      expect(store.morseChallengeState.state).toBe('wrong')

      vi.runAllTimers()

      expect(store.morseChallengeState.state).toBe('active')
      expect(store.morseChallengeState.keyedSequence).toEqual([])
    })
  })

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

  describe('handleMorseKeyTap - timeout sentinel', () => {
    it('sets timeout state when timeout sentinel is received', () => {
      const store = useGameStore()
      store.startMorseChallenge()

      store.handleMorseKeyTap('timeout')

      expect(store.morseChallengeState.state).toBe('timeout')
    })

    it('advances to next letter after timeout sentinel delay', () => {
      const store = useGameStore()
      store.startMorseChallenge()

      store.handleMorseKeyTap('timeout')
      expect(store.morseChallengeState.state).toBe('timeout')

      vi.runAllTimers()

      expect(store.morseChallengeState.state).toBe('active')
    })

    it('ignores taps when already in timeout or wrong state', () => {
      const store = useGameStore()
      store.startMorseChallenge()

      store.handleMorseKeyTap('timeout')
      expect(store.morseChallengeState.state).toBe('timeout')

      store.handleMorseKeyTap('dit')
      expect(store.morseChallengeState.state).toBe('timeout')
    })
  })

  describe('inter-character gap timer', () => {
    it('advances to next letter when player stops after an incomplete sequence', () => {
      const store = useGameStore()
      store.startMorseChallenge()
      store.morseChallengeState.currentChar = 'A'
      store.morseChallengeState.currentPattern = '·−'
      store.morseChallengeState.keyedSequence = []

      store.handleMorseKeyTap('dit') // correct prefix but not complete
      expect(store.morseChallengeState.state).toBe('active')

      // Advance time past the inter-character gap threshold
      vi.advanceTimersByTime(MORSE_TIMING.INTER_GAP_MIN_MS + 1)

      // Incomplete sequence causes advance to next letter
      expect(store.morseChallengeState.state).toBe('active')
      expect(store.morseChallengeState.keyedSequence).toEqual([])
    })

    it('cancels pending eval timer when a new tap arrives before gap elapses', () => {
      const store = useGameStore()
      store.startMorseChallenge()
      store.morseChallengeState.currentChar = 'A'
      store.morseChallengeState.currentPattern = '·−'
      store.morseChallengeState.keyedSequence = []

      store.handleMorseKeyTap('dit') // first tap, timer scheduled
      // Second tap arrives before gap — timer should be cancelled and new one scheduled
      store.handleMorseKeyTap('dah') // completes ·−

      // Should be success, not triggered by the old timer evaluating partial sequence
      expect(store.morseChallengeState.state).toBe('success')
    })
  })
})
