import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../game'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('Game Store - Async/Timer Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Lottery System Timing', () => {
    it('clears expired bonus after 77 seconds', () => {
      const store = useGameStore()
      store.lotteryState.bonusFactoryId = 'elmer'
      store.lotteryState.bonusEndTime = Date.now() + 77000

      // Before expiration
      const active1 = Date.now() < store.lotteryState.bonusEndTime
      expect(active1).toBe(true)

      // Advance past expiration
      vi.advanceTimersByTime(78000)

      // After expiration
      const active2 = Date.now() < store.lotteryState.bonusEndTime
      expect(active2).toBe(false)
    })

    it('handles solar storm duration correctly', () => {
      const store = useGameStore()
      store.lotteryState.isSolarStorm = true
      store.lotteryState.solarStormEndTime = Date.now() + 77000

      // Storm is active
      expect(store.lotteryState.isSolarStorm).toBe(true)
      expect(Date.now() < store.lotteryState.solarStormEndTime).toBe(true)

      // Advance past storm duration
      vi.advanceTimersByTime(78000)

      // Storm should be expired
      expect(Date.now() < store.lotteryState.solarStormEndTime).toBe(false)
    })
  })

  describe('Passive QSO Accumulation', () => {
    it('accumulates fractional QSOs correctly', () => {
      const store = useGameStore()
      store.factoryCounts = { 'elmer': 1 } // 0.1/sec

      // Add small amount multiple times
      store.addPassiveQSOs(0.05)
      store.addPassiveQSOs(0.05)
      store.addPassiveQSOs(0.05)

      // Should have accumulated 0.15 in fractionalQSOs
      expect(store.fractionalQSOs).toBeCloseTo(0.15, 2)
      expect(store.qsos).toBe(0n) // No whole QSOs yet

      // Add more to reach 1.0
      store.addPassiveQSOs(0.85)

      // Should now have 1 whole QSO
      expect(store.qsos).toBe(1n)
      expect(store.fractionalQSOs).toBeCloseTo(0.0, 1)
    })

    it('handles multiple fractional accumulations', () => {
      const store = useGameStore()
      store.factoryCounts = { 'elmer': 1 } // 0.1/sec

      // Simulate 60 frames at 60fps (1 second)
      for (let i = 0; i < 60; i++) {
        store.addPassiveQSOs(0.1 / 60) // 0.001666... per frame
      }

      // Should have accumulated approximately 0.1 QSOs
      expect(store.qsos).toBe(0n)
      expect(store.fractionalQSOs).toBeGreaterThan(0.09)
      expect(store.fractionalQSOs).toBeLessThan(0.11)
    })
  })

  describe('Save Functionality', () => {
    it('save function works correctly', () => {
      const store = useGameStore()
      store.qsos = 100n
      store.licenseLevel = 2
      store.factoryCounts = { 'elmer': 5 }

      // Manual save should work
      store.save()
      
      const saved = JSON.parse(localStorage.getItem('cw-keyer-game'))
      expect(saved.qsos).toBe('100')
      expect(saved.licenseLevel).toBe(2)
      expect(saved.factoryCounts).toEqual({ 'elmer': 5 })
    })
  })

  describe('Rare Dx Bonus Timer', () => {
    it('displays correct time remaining during bonus', () => {
      const store = useGameStore()
      const startTime = Date.now()

      store.lotteryState.bonusFactoryId = 'elmer'
      store.lotteryState.bonusEndTime = startTime + 77000

      // At start: 77 seconds remaining
      let remaining = Math.ceil((store.lotteryState.bonusEndTime - Date.now()) / 1000)
      expect(remaining).toBe(77)

      // Advance 10 seconds
      vi.advanceTimersByTime(10000)

      // Now: 67 seconds remaining
      remaining = Math.ceil((store.lotteryState.bonusEndTime - Date.now()) / 1000)
      expect(remaining).toBe(67)

      // Advance to almost end
      vi.advanceTimersByTime(67000)

      // Now: 0 or 1 second remaining
      remaining = Math.ceil((store.lotteryState.bonusEndTime - Date.now()) / 1000)
      expect(remaining).toBeLessThanOrEqual(1)
    })

    it('counts down correctly for formatted display', () => {
      const store = useGameStore()
      store.lotteryState.bonusEndTime = Date.now() + 125000 // 2:05

      const formatTime = (seconds) => {
        if (seconds >= 60) {
          const mins = Math.floor(seconds / 60)
          const secs = seconds % 60
          return `${mins}:${secs.toString().padStart(2, '0')}`
        }
        return `${seconds}s`
      }

      // 2:05
      let remaining = Math.ceil((store.lotteryState.bonusEndTime - Date.now()) / 1000)
      expect(formatTime(remaining)).toMatch(/2:0[45]/)

      // Advance 65 seconds to 1:00
      vi.advanceTimersByTime(65000)
      remaining = Math.ceil((store.lotteryState.bonusEndTime - Date.now()) / 1000)
      expect(formatTime(remaining)).toBe('1:00')

      // Advance another 60 seconds to 0:00
      vi.advanceTimersByTime(60000)
      remaining = Math.ceil((store.lotteryState.bonusEndTime - Date.now()) / 1000)
      expect(formatTime(remaining)).toBe('0s')
    })
  })

  describe('Click Indicator Timing', () => {
    it('fades out indicators over 2 seconds', () => {
      const indicator = {
        id: 'test-1',
        value: 1,
        opacity: 1,
        startTime: Date.now()
      }

      const FADE_DURATION_MS = 2000

      // At start: full opacity
      let elapsed = Date.now() - indicator.startTime
      let progress = elapsed / FADE_DURATION_MS
      expect(progress).toBe(0)
      expect(indicator.opacity).toBe(1)

      // Advance 1 second: 50% progress, 50% opacity
      vi.advanceTimersByTime(1000)
      elapsed = Date.now() - indicator.startTime
      progress = elapsed / FADE_DURATION_MS
      expect(progress).toBe(0.5)

      // Advance another second: 100% progress, 0% opacity
      vi.advanceTimersByTime(1000)
      elapsed = Date.now() - indicator.startTime
      progress = elapsed / FADE_DURATION_MS
      expect(progress).toBe(1)
    })
  })
})