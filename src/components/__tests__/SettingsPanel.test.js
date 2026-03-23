import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
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
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function mockStore(overrides = {}) {
    useGameStore.mockReturnValue({
      audioSettings: { volume: 0.5, frequency: 600, isMuted: false },
      canPrestigeReset: false,
      prestigeReset: vi.fn(),
      qsos: 0n,
      licenseLevel: 1,
      factoryCounts: {},
      fractionalQSOs: 0,
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

    const resetButtons = wrapper.findAll('button').filter(button =>
      button.text().includes('Prestige Reset'),
    )

    expect(resetButtons).toHaveLength(1)
    expect(resetButtons[0].attributes('disabled')).toBeDefined()
  })

  it('allows prestige reset when available', async () => {
    const prestigeReset = vi.fn()
    mockStore({ canPrestigeReset: true, prestigeReset })

    const wrapper = mount(SettingsPanel)

    const prestigeButtons = wrapper.findAll('button').filter(button =>
      button.text().includes('Prestige Reset'),
    )

    expect(prestigeButtons[0].attributes('disabled')).toBeUndefined()

    await prestigeButtons[0].trigger('click')
    const confirmButtons = wrapper.findAll('button').filter(button =>
      button.text().includes('Yes, Prestige Reset'),
    )
    await confirmButtons[0].trigger('click')

    expect(prestigeReset).toHaveBeenCalled()
  })
})
