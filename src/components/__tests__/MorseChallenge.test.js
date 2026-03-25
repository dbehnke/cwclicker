import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MorseChallenge from '../MorseChallenge.vue'
import { useGameStore } from '../../stores/game'

vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

describe('MorseChallenge', () => {
  let mockStore

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
        lastKeyTime: 0,
        challengeStartTime: Date.now(),
        state: 'active',
      },
      startMorseChallenge: vi.fn(),
      handleMorseKeyTap: vi.fn(),
    }
    useGameStore.mockReturnValue(mockStore)
  })

  it('renders when active', () => {
    const wrapper = mount(MorseChallenge, {
      global: {
        stubs: {
          useGameStore: () => mockStore,
        },
      },
    })

    expect(wrapper.find('.text-terminal-amber').text()).toContain('QRQ MORSE CHALLENGE')
  })
})
