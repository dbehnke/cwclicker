import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import SettingsPanel from '../SettingsPanel.vue'
import { useGameStore } from '../../stores/game'
import { audioService } from '../../services/audio'

vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

vi.mock('../../services/audio', () => ({
  audioService: {
    setFrequency: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
  },
}))

describe('SettingsPanel.vue', () => {
  let reloadMock
  let originalLocation

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    originalLocation = window.location
    reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadMock },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  function mockStore(overrides = {}) {
    useGameStore.mockReturnValue({
      audioSettings: { volume: 0.5, frequency: 600, isMuted: false, morseWpm: 5 },
      canPrestigeReset: false,
      prestigeReset: vi.fn(),
      qsos: 0n,
      licenseLevel: 1,
      factoryCounts: {},
      fractionalQSOs: 0,
      tapPrestigeAccumulator: 0n,
      purchasedUpgrades: new Set(),
      lotteryState: {
        lastTriggerTime: 0,
        isBonusAvailable: false,
        bonusFactoryId: null,
        bonusEndTime: 0,
        bonusAvailableEndTime: 0,
        phenomenonTitle: '',
        isSolarStorm: false,
        solarStormEndTime: 0,
      },
      save: vi.fn(),
      ...overrides,
    })
  }

  it('shows a disabled prestige reset control until available', () => {
    mockStore()

    const wrapper = mount(SettingsPanel)

    const resetButtons = wrapper
      .findAll('button')
      .filter(button => button.text().includes('Prestige Reset'))

    expect(resetButtons).toHaveLength(1)
    expect(resetButtons[0].attributes('disabled')).toBeDefined()
  })

  it('allows prestige reset when available', async () => {
    const prestigeReset = vi.fn()
    mockStore({ canPrestigeReset: true, prestigeReset })

    const wrapper = mount(SettingsPanel)

    const prestigeButtons = wrapper
      .findAll('button')
      .filter(button => button.text().includes('Prestige Reset'))

    expect(prestigeButtons[0].attributes('disabled')).toBeUndefined()

    await prestigeButtons[0].trigger('click')
    const confirmButtons = wrapper
      .findAll('button')
      .filter(button => button.text().includes('Yes, Prestige Reset'))
    await confirmButtons[0].trigger('click')

    expect(prestigeReset).toHaveBeenCalled()
    expect(wrapper.text()).not.toContain(
      'Prestige reset will reset your run but keep prestige progress.'
    )
  })

  it('prestige and reset confirmations are mutually exclusive', async () => {
    const resetGame = vi.fn()
    mockStore({ canPrestigeReset: true, resetGame })

    const wrapper = mount(SettingsPanel)

    const resetBtn = wrapper.findAll('button').find(b => b.text().includes('⚠️ Reset Game'))

    await resetBtn.trigger('click')
    expect(wrapper.text()).toContain('Are you sure? This cannot be undone!')
    expect(wrapper.text()).not.toContain('Prestige reset will reset your run')

    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn.trigger('click')

    const prestigeBtn = wrapper.findAll('button').find(b => b.text().includes('Prestige Reset'))
    await prestigeBtn.trigger('click')
    expect(wrapper.text()).not.toContain('Are you sure? This cannot be undone!')
    expect(wrapper.text()).toContain('Prestige reset will reset your run')
  })

  it('clears tap prestige remainder on reset', async () => {
    mockStore({ canPrestigeReset: true, tapPrestigeAccumulator: 42n })

    const wrapper = mount(SettingsPanel)

    const resetBtn = wrapper.findAll('button').filter(b => b.text().includes('⚠️ Reset Game'))[0]
    await resetBtn.trigger('click')

    const confirmBtn = wrapper
      .findAll('button')
      .filter(b => b.text().includes('Yes, Reset Everything'))[0]
    await confirmBtn.trigger('click')

    expect(useGameStore().tapPrestigeAccumulator).toBe(0n)
  })
})
