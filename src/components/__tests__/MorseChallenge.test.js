import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MorseChallenge from '../MorseChallenge.vue'
import { useGameStore } from '../../stores/game'

vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

describe('MorseChallenge', () => {
  let mockStore

  const mountWithState = stateOverrides => {
    mockStore.morseChallengeState = {
      ...mockStore.morseChallengeState,
      ...stateOverrides,
    }

    return mount(MorseChallenge)
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockStore = {
      morseChallengeState: {
        isActive: true,
        currentChar: 'A',
        currentPattern: '·−',
        keyedSequence: [],
        challengeStartTime: Date.now(),
        state: 'active',
      },
      startMorseChallenge: vi.fn(),
      handleMorseKeyTap: vi.fn(),
    }
    useGameStore.mockReturnValue(mockStore)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders when active', () => {
    const wrapper = mountWithState({ state: 'active' })

    expect(wrapper.find('.text-terminal-amber').text()).toContain('QRQ MORSE CHALLENGE')
  })

  it('renders timeout state and message', () => {
    const wrapper = mountWithState({ state: 'timeout' })

    expect(wrapper.text()).toContain('TIME!')
    expect(wrapper.text()).toContain("TIME'S UP! Moving to next letter...")
  })

  it('renders wrong state message', () => {
    const wrapper = mountWithState({ state: 'wrong' })

    expect(wrapper.text()).toContain('WRONG! Moving to next letter...')
  })

  it('renders success state message with full progress bar', () => {
    const wrapper = mountWithState({ state: 'success' })
    const progressBar = wrapper.find('div.h-2.rounded.transition-all.duration-100')

    expect(wrapper.text()).toContain('CORRECT! Bonus QSOs awarded!')
    expect(progressBar.attributes('style')).toContain('width: 100%')
  })

  it('sends timeout tap event when timer expires', async () => {
    mountWithState({
      state: 'active',
      challengeStartTime: Date.now() - 5000,
    })

    await vi.advanceTimersByTimeAsync(100)

    expect(mockStore.handleMorseKeyTap).toHaveBeenCalledWith('timeout')
  })
})
