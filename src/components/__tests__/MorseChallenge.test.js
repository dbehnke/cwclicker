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
        triesRemaining: 3,
        lastBonusAwarded: 0,
      },
      morseChallengeEnabled: true,
      startMorseChallenge: vi.fn(),
      handleMorseKeyTap: vi.fn(),
      toggleMorseChallenge: vi.fn(),
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

    expect(wrapper.text()).toContain('OUT OF TRIES! Moving to next letter...')
  })

  it('renders success state message with full progress bar', () => {
    const wrapper = mountWithState({ state: 'success' })
    const progressBar = wrapper.find('div.h-2.rounded.transition-all.duration-100')

    expect(wrapper.text()).toContain('CORRECT!')
    expect(wrapper.text()).toContain('QSOs')
    expect(progressBar.attributes('style')).toContain('width: 100%')
  })

  it('sends timeout tap event when timer expires', async () => {
    const fakeNow = Date.now() + 25000
    vi.spyOn(Date, 'now').mockReturnValue(fakeNow)

    mountWithState({
      state: 'active',
      // 21s = CHALLENGE_DURATION_MS (20s) + 1s buffer; ensures timeRemaining <= 0 is reached
      // within the first TIMER_UPDATE_INTERVAL_MS (100ms) tick after mounting
      challengeStartTime: fakeNow - 21000,
    })

    await vi.advanceTimersByTimeAsync(100)

    expect(mockStore.handleMorseKeyTap).toHaveBeenCalledWith('timeout')
    Date.now.mockRestore()
  })

  it('shows disable button when challenge is enabled and active', () => {
    const wrapper = mountWithState({ state: 'active' })

    const disableBtn = wrapper.find('button[aria-label="Disable QRQ Morse Challenge"]')
    expect(disableBtn.exists()).toBe(true)
    expect(disableBtn.text()).toBe('Disable')
  })

  it('calls toggleMorseChallenge when disable button is clicked', async () => {
    const wrapper = mountWithState({ state: 'active' })

    const disableBtn = wrapper.find('button[aria-label="Disable QRQ Morse Challenge"]')
    await disableBtn.trigger('click')

    expect(mockStore.toggleMorseChallenge).toHaveBeenCalledOnce()
  })

  it('shows disabled state card with enable button when challenge is disabled', () => {
    mockStore.morseChallengeEnabled = false
    const wrapper = mount(MorseChallenge)

    expect(wrapper.text()).toContain('QRQ Morse Challenge')
    const enableBtn = wrapper.find('button[aria-label="Enable QRQ Morse Challenge"]')
    expect(enableBtn.exists()).toBe(true)
    expect(enableBtn.text()).toBe('Enable')
  })

  it('calls toggleMorseChallenge when enable button is clicked', async () => {
    mockStore.morseChallengeEnabled = false
    const wrapper = mount(MorseChallenge)

    const enableBtn = wrapper.find('button[aria-label="Enable QRQ Morse Challenge"]')
    await enableBtn.trigger('click')

    expect(mockStore.toggleMorseChallenge).toHaveBeenCalledOnce()
  })

  it('does not show challenge content when disabled', () => {
    mockStore.morseChallengeEnabled = false
    const wrapper = mount(MorseChallenge)

    expect(wrapper.text()).not.toContain('QRQ MORSE CHALLENGE')
    expect(wrapper.text()).not.toContain('Key the pattern for bonus QSOs!')
  })

  it('does not start a new challenge on mount when disabled', () => {
    mockStore.morseChallengeEnabled = false
    mockStore.morseChallengeState = {
      ...mockStore.morseChallengeState,
      isActive: false,
      state: 'idle',
    }
    mount(MorseChallenge)

    expect(mockStore.startMorseChallenge).not.toHaveBeenCalled()
  })

  it('restarts challenge on mount when state is stuck in timeout', () => {
    mockStore.morseChallengeState = {
      ...mockStore.morseChallengeState,
      isActive: true,
      state: 'timeout',
    }
    mount(MorseChallenge)

    expect(mockStore.startMorseChallenge).toHaveBeenCalledOnce()
  })

  it('restarts challenge on mount when state is stuck in wrong', () => {
    mockStore.morseChallengeState = {
      ...mockStore.morseChallengeState,
      isActive: true,
      state: 'wrong',
    }
    mount(MorseChallenge)

    expect(mockStore.startMorseChallenge).toHaveBeenCalledOnce()
  })

  it('restarts challenge on mount when state is stuck in success', () => {
    mockStore.morseChallengeState = {
      ...mockStore.morseChallengeState,
      isActive: true,
      state: 'success',
    }
    mount(MorseChallenge)

    expect(mockStore.startMorseChallenge).toHaveBeenCalledOnce()
  })

  it('does not restart challenge on mount when state is active', () => {
    mockStore.morseChallengeState = {
      ...mockStore.morseChallengeState,
      isActive: true,
      state: 'active',
    }
    mount(MorseChallenge)

    expect(mockStore.startMorseChallenge).not.toHaveBeenCalled()
  })
})
