import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GameLoop from '../GameLoop.vue'
import { useGameStore } from '../../stores/game'

vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn()
}))

describe('GameLoop.vue', () => {
  let mockStore
  let requestAnimationFrameSpy
  let cancelAnimationFrameSpy
  let performanceNowSpy

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Mock performance.now()
    let now = 0
    performanceNowSpy = vi.spyOn(performance, 'now').mockImplementation(() => {
      return now
    })

    // Mock requestAnimationFrame
    let rafId = 0
    const rafCallbacks = new Map()
    requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = ++rafId
      rafCallbacks.set(id, callback)
      return id
    })

    // Mock cancelAnimationFrame
    cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      rafCallbacks.delete(id)
    })

    // Helper to trigger RAF callbacks
    window.__triggerRAF = (time) => {
      now = time
      const callbacks = Array.from(rafCallbacks.entries())
      rafCallbacks.clear()
      callbacks.forEach(([id, cb]) => cb(time))
    }

    mockStore = {
      qsos: 0n,
      getTotalQSOsPerSecond: vi.fn().mockReturnValue(0),
      addPassiveQSOs: vi.fn(),
      save: vi.fn()
    }
    useGameStore.mockReturnValue(mockStore)
  })

  afterEach(() => {
    vi.useRealTimers()
    requestAnimationFrameSpy.mockRestore()
    cancelAnimationFrameSpy.mockRestore()
    performanceNowSpy.mockRestore()
  })

  it('starts game loop on mount', () => {
    mount(GameLoop)
    
    expect(requestAnimationFrameSpy).toHaveBeenCalled()
  })

  it('calls addPassiveQSOs with correct amount based on delta time', () => {
    mockStore.getTotalQSOsPerSecond.mockReturnValue(10) // 10 QSOs per second
    
    mount(GameLoop)
    
    // Simulate 100ms passing (0.1 seconds)
    window.__triggerRAF(100)
    
    // Should call addPassiveQSOs with 10 QSOs/sec * 0.1 sec = 1 QSO
    expect(mockStore.addPassiveQSOs).toHaveBeenCalledWith(1)
  })

  it('accumulates QSOs over multiple frames', () => {
    mockStore.getTotalQSOsPerSecond.mockReturnValue(10)
    
    mount(GameLoop)
    
    // First frame: 50ms
    window.__triggerRAF(50)
    expect(mockStore.addPassiveQSOs).toHaveBeenCalledWith(0.5)
    
    // Second frame: 150ms (100ms delta)
    window.__triggerRAF(150)
    expect(mockStore.addPassiveQSOs).toHaveBeenLastCalledWith(1)
    
    // Should have been called twice
    expect(mockStore.addPassiveQSOs).toHaveBeenCalledTimes(2)
  })

  it('auto-saves every 30 seconds', () => {
    mockStore.getTotalQSOsPerSecond.mockReturnValue(1)
    
    mount(GameLoop)
    
    // Simulate time passing without triggering save
    window.__triggerRAF(1000) // 1 second
    expect(mockStore.save).not.toHaveBeenCalled()
    
    window.__triggerRAF(15000) // 15 seconds total
    expect(mockStore.save).not.toHaveBeenCalled()
    
    window.__triggerRAF(30000) // 30 seconds - should trigger save
    expect(mockStore.save).toHaveBeenCalledTimes(1)
    
    window.__triggerRAF(60000) // 60 seconds - should trigger another save
    expect(mockStore.save).toHaveBeenCalledTimes(2)
  })

  it('cleans up animation frame on unmount', () => {
    const wrapper = mount(GameLoop)
    
    const rafId = requestAnimationFrameSpy.mock.results[0].value
    
    wrapper.unmount()
    
    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(rafId)
  })

  it('calculates delta time correctly between frames', () => {
    mockStore.getTotalQSOsPerSecond.mockReturnValue(60) // 60 QSOs per second = 1 QSO per frame at 60fps
    
    mount(GameLoop)
    
    // Simulate 16.67ms (roughly one frame at 60fps)
    window.__triggerRAF(16.67)
    
    // 60 QSOs/sec * 0.01667 sec = 1 QSO
    expect(mockStore.addPassiveQSOs).toHaveBeenCalledWith(expect.closeTo(1, 0))
  })

  it('does not call addPassiveQSOs when factory production is zero', () => {
    mockStore.getTotalQSOsPerSecond.mockReturnValue(0)
    
    mount(GameLoop)
    
    window.__triggerRAF(1000)
    
    expect(mockStore.addPassiveQSOs).not.toHaveBeenCalled()
  })

  it('handles variable frame rates correctly', () => {
    mockStore.getTotalQSOsPerSecond.mockReturnValue(100) // 100 QSOs per second
    
    mount(GameLoop)
    
    // Slow frame (33.33ms - 30fps)
    window.__triggerRAF(33.33)
    // 100 * 0.03333 = 3.333 QSOs
    expect(mockStore.addPassiveQSOs).toHaveBeenLastCalledWith(expect.closeTo(3.333, 1))
    
    // Fast frame (16.67ms later - 60fps)
    window.__triggerRAF(50)
    // Delta: 16.67ms, 100 * 0.01667 = 1.667 QSOs
    expect(mockStore.addPassiveQSOs).toHaveBeenLastCalledWith(expect.closeTo(1.667, 1))
    
    expect(mockStore.addPassiveQSOs).toHaveBeenCalledTimes(2)
  })
})
