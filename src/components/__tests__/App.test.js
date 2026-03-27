import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../App.vue'
import { useGameStore } from '../../stores/game'

vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(() => ({
    audioSettings: { volume: 0.5, frequency: 600, isMuted: false },
    factoryCounts: {},
    getTotalQSOsPerSecond: () => 0,
    licenseLevel: 1,
    load: vi.fn(),
    qsos: 0n,
    save: vi.fn(),
    totalQsosEarned: 0n,
  })),
}))

vi.mock('../../services/audio', () => ({
  audioService: {
    setFrequency: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
  },
}))

describe('App.vue responsive shell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders responsive shell classes on the outer layout', () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          ClickIndicator: true,
          ErrorBoundary: { template: '<div><slot /></div>' },
          KeepAlive: { template: '<slot />' },
          FactoryCard: true,
          GameLoop: true,
          KeyerArea: true,
          LicensePanel: true,
          MigrationNotification: true,
          MultiBuyPanel: true,
          OfflineProgressNotification: true,
          RareDxBonus: true,
          SettingsPanel: true,
          StatHeader: true,
        },
      },
    })

    expect(wrapper.get('.min-h-screen').classes()).toContain('px-4')
    expect(wrapper.get('.min-h-screen').classes()).toContain('max-w-4xl')
    expect(wrapper.get('main').classes()).toContain('space-y-6')
    expect(wrapper.get('main + footer').exists()).toBe(true)
  })

  it('shows exactly one mystery card in Store and not in Bulk Buy', async () => {
    useGameStore.mockReturnValue({
      audioSettings: { volume: 0.5, frequency: 600, isMuted: false },
      buyFactory: vi.fn(),
      factoryCounts: {},
      getFactoryCost: factoryId => {
        const costs = {
          elmer: 15n,
          'qrq-protocol': 25n,
          'straight-key': 75n,
          'paddle-key': 1000n,
        }
        return costs[factoryId] || 999999n
      },
      getTotalQSOsPerSecond: () => 0,
      getBulkCost: () => 0n,
      getUpgradeMultiplier: () => 1,
      getLotteryMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      isFactoryUnlocked: id => ['elmer', 'qrq-protocol', 'straight-key'].includes(id),
      licenseLevel: 3,
      load: vi.fn(),
      prestigeMultiplier: 1,
      purchasedUpgrades: new Set(),
      qsos: 500n,
      save: vi.fn(),
      totalQsosEarned: 0n,
    })

    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          ClickIndicator: true,
          ErrorBoundary: { template: '<div><slot /></div>' },
          FactoryCard: {
            props: ['factory'],
            template: '<div class="factory-card-stub">{{ factory.name }}</div>',
          },
          GameLoop: true,
          KeyerArea: true,
          LicensePanel: true,
          MigrationNotification: true,
          MultiBuyPanel: true,
          MorseChallenge: true,
          OfflineProgressNotification: true,
          RareDxBonus: true,
          SettingsPanel: true,
          StatHeader: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Elmer')
    expect(wrapper.text()).toContain('QRQ Protocol')
    expect(wrapper.text()).toContain('Straight Key')
    expect(wrapper.text()).toContain('???')
    expect(wrapper.text()).not.toContain('Paddle Key')

    await wrapper.get('#tab-bulk').trigger('click')
    expect(wrapper.text()).not.toContain('???')
  })
})
