import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import KeyerArea from '../KeyerArea.vue'
import { useGameStore } from '../../stores/game'

vi.mock('../../services/audio', () => ({
  audioService: {
    playTone: vi.fn(),
    stopTone: vi.fn(),
  },
}))

describe('KeyerArea.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('triggers dit on fast mousedown/mouseup', async () => {
    const wrapper = mount(KeyerArea)
    const store = useGameStore()

    await wrapper.trigger('mousedown')
    await wrapper.trigger('mouseup')

    // Fast click = dit = 1 QSO
    expect(store.qsos).toBe(1n)
  })

  it('triggers dah on slow mousedown/mouseup (>200ms)', async () => {
    const wrapper = mount(KeyerArea)
    const store = useGameStore()

    await wrapper.trigger('mousedown')
    vi.advanceTimersByTime(250)
    await vi.runAllTimersAsync()
    await wrapper.trigger('mouseup')

    // Slow click = dah = 2 QSOs
    expect(store.qsos).toBe(2n)
  })

  it('does not classify on mouseleave event by itself', async () => {
    const wrapper = mount(KeyerArea)
    const store = useGameStore()

    await wrapper.trigger('mousedown')
    await wrapper.trigger('mouseleave')

    // Mouseleave should not finalize a symbol
    expect(store.qsos).toBe(0n)
  })

  it('classifies on window mouseup after drifting outside keyer', async () => {
    const wrapper = mount(KeyerArea)
    const store = useGameStore()

    await wrapper.trigger('mousedown')
    vi.advanceTimersByTime(80)
    await vi.runAllTimersAsync()
    await wrapper.trigger('mouseleave')

    // no symbol finalized yet
    expect(store.qsos).toBe(0n)

    // release outside should still finalize press
    vi.advanceTimersByTime(300)
    await vi.runAllTimersAsync()
    window.dispatchEvent(new MouseEvent('mouseup'))

    expect(store.qsos).toBe(2n)
  })

  it('does not classify on mouseleave before actual release', async () => {
    const wrapper = mount(KeyerArea)
    const store = useGameStore()

    await wrapper.trigger('mousedown')
    vi.advanceTimersByTime(80)
    await vi.runAllTimersAsync()
    await wrapper.trigger('mouseleave')

    // Drifting off the keyer should not finalize a symbol yet
    expect(store.qsos).toBe(0n)

    // Actual release after a long hold should classify as dah
    vi.advanceTimersByTime(300)
    await vi.runAllTimersAsync()
    await wrapper.trigger('mouseup')
    expect(store.qsos).toBe(2n)
  })

  it('handles touchstart/touchend events', async () => {
    const wrapper = mount(KeyerArea)
    const store = useGameStore()

    await wrapper.trigger('touchstart')
    await wrapper.trigger('touchend')

    // Fast touch = dit = 1 QSO
    expect(store.qsos).toBe(1n)
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(KeyerArea)
    const keyerDiv = wrapper.find('div[role="button"]')

    expect(keyerDiv.exists()).toBe(true)
    expect(keyerDiv.attributes('tabindex')).toBe('0')
  })

  it('handles keyboard events (space key)', async () => {
    const wrapper = mount(KeyerArea)
    const store = useGameStore()

    await wrapper.trigger('keydown', { key: ' ' })
    await wrapper.trigger('keyup', { key: ' ' })

    expect(store.qsos).toBe(1n)
  })

  it('handles keyboard events (enter key)', async () => {
    const wrapper = mount(KeyerArea)
    const store = useGameStore()

    await wrapper.trigger('keydown', { key: 'Enter' })
    await wrapper.trigger('keyup', { key: 'Enter' })

    expect(store.qsos).toBe(1n)
  })

  it('ignores other keyboard events', async () => {
    const wrapper = mount(KeyerArea)
    const store = useGameStore()

    await wrapper.trigger('keydown', { key: 'a' })
    await wrapper.trigger('keyup', { key: 'a' })

    expect(store.qsos).toBe(0n)
  })
})
