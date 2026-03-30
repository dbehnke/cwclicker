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
    revealAffordableFactories: vi.fn(),
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

  it('renders mobile tabs with keyer/grid/store ids only', () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          ClickIndicator: true,
          ErrorBoundary: { template: '<div><slot /></div>' },
          FactoryList: true,
          GameLoop: true,
          KeyerArea: true,
          LicensePanel: true,
          MigrationNotification: true,
          MorseChallenge: true,
          OfflineProgressNotification: true,
          RareDxBonus: true,
          SettingsPanel: true,
          StoreLane: true,
          StatHeader: true,
        },
      },
    })

    const tabButtons = wrapper.findAll('[role="tab"]')
    const tabIds = tabButtons.map(tab => tab.attributes('id'))

    expect(tabIds).toEqual(['tab-keyer', 'tab-grid', 'tab-store'])
    expect(wrapper.find('#tab-bulk').exists()).toBe(false)
    expect(wrapper.find('#tab-settings').exists()).toBe(false)
  })

  it('renders desktop shell with three lane wrappers', () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          ClickIndicator: true,
          ErrorBoundary: { template: '<div><slot /></div>' },
          FactoryList: true,
          GameLoop: true,
          KeyerArea: true,
          LicensePanel: true,
          MigrationNotification: true,
          MorseChallenge: true,
          OfflineProgressNotification: true,
          RareDxBonus: true,
          SettingsPanel: true,
          StoreLane: true,
          StatHeader: true,
        },
      },
    })

    expect(wrapper.find('[data-testid="desktop-lane-keyer"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="desktop-lane-grid"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="desktop-lane-store"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="keyer-lane-header"]').classes()).toContain('sticky')
  })

  it('keeps settings collapsed by default and expands on toggle', async () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          ClickIndicator: true,
          ErrorBoundary: { template: '<div><slot /></div>' },
          FactoryList: true,
          GameLoop: true,
          KeyerArea: true,
          LicensePanel: true,
          MigrationNotification: true,
          MorseChallenge: true,
          OfflineProgressNotification: true,
          RareDxBonus: true,
          SettingsPanel: { template: '<div data-testid="settings-panel-stub" />' },
          StoreLane: true,
          StatHeader: true,
        },
      },
    })

    expect(wrapper.find('[data-testid="settings-panel-stub"]').exists()).toBe(false)

    await wrapper.get('[data-testid="settings-toggle"]').trigger('click')

    expect(wrapper.find('[data-testid="settings-panel-stub"]').exists()).toBe(true)
  })

  it('shows only the active mobile tab panel', async () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          ClickIndicator: { template: '<div data-testid="click-indicator-stub" />' },
          ErrorBoundary: { template: '<div><slot /></div>' },
          FactoryList: { template: '<div data-testid="factory-list-stub" />' },
          GameLoop: true,
          KeyerArea: { template: '<div data-testid="keyer-area-stub" />' },
          LicensePanel: true,
          MigrationNotification: true,
          MorseChallenge: { template: '<div data-testid="morse-challenge-stub" />' },
          OfflineProgressNotification: true,
          RareDxBonus: { template: '<div data-testid="rare-dx-stub" />' },
          SettingsPanel: true,
          StoreLane: { template: '<div data-testid="store-lane-stub" />' },
          StatHeader: true,
        },
      },
    })

    expect(wrapper.find('#panel-keyer').exists()).toBe(true)
    expect(wrapper.find('#panel-grid').exists()).toBe(false)
    expect(wrapper.find('#panel-store').exists()).toBe(false)

    await wrapper.get('#tab-grid').trigger('click')
    expect(wrapper.find('#panel-keyer').exists()).toBe(false)
    expect(wrapper.find('#panel-grid').exists()).toBe(true)
    expect(wrapper.find('#panel-store').exists()).toBe(false)

    await wrapper.get('#tab-store').trigger('click')
    expect(wrapper.find('#panel-keyer').exists()).toBe(false)
    expect(wrapper.find('#panel-grid').exists()).toBe(false)
    expect(wrapper.find('#panel-store').exists()).toBe(true)
  })

  it('triggers reveal progression after upgrading to General', async () => {
    const revealAffordableFactories = vi.fn()
    const save = vi.fn()

    useGameStore.mockReturnValue({
      audioSettings: { volume: 0.5, frequency: 600, isMuted: false },
      buyFactory: vi.fn(),
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getTotalQSOsPerSecond: () => 0,
      getBulkCost: () => 0n,
      getUpgradeMultiplier: () => 1,
      getLotteryMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      isFactoryUnlocked: () => false,
      licenseLevel: 1,
      load: vi.fn(),
      prestigeMultiplier: 1,
      purchasedUpgrades: new Set(),
      qsos: 0n,
      revealAffordableFactories,
      save,
      totalQsosEarned: 50_000_000n,
    })

    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          ClickIndicator: true,
          ErrorBoundary: { template: '<div><slot /></div>' },
          FactoryList: true,
          GameLoop: true,
          KeyerArea: true,
          LicensePanel: {
            template:
              '<button data-testid="license-upgrade" @click="$emit(\'upgrade\')">Upgrade</button>',
          },
          MigrationNotification: true,
          MorseChallenge: true,
          OfflineProgressNotification: true,
          RareDxBonus: true,
          SettingsPanel: true,
          StatHeader: true,
          StoreLane: true,
        },
      },
    })

    await wrapper.get('[data-testid="license-upgrade"]').trigger('click')

    expect(revealAffordableFactories).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('triggers reveal progression after upgrading to Extra', async () => {
    const revealAffordableFactories = vi.fn()
    const save = vi.fn()

    useGameStore.mockReturnValue({
      audioSettings: { volume: 0.5, frequency: 600, isMuted: false },
      buyFactory: vi.fn(),
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getTotalQSOsPerSecond: () => 0,
      getBulkCost: () => 0n,
      getUpgradeMultiplier: () => 1,
      getLotteryMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      isFactoryUnlocked: () => false,
      licenseLevel: 2,
      load: vi.fn(),
      prestigeMultiplier: 1,
      purchasedUpgrades: new Set(),
      qsos: 0n,
      revealAffordableFactories,
      save,
      totalQsosEarned: 500_000_000n,
    })

    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          ClickIndicator: true,
          ErrorBoundary: { template: '<div><slot /></div>' },
          FactoryList: true,
          GameLoop: true,
          KeyerArea: true,
          LicensePanel: {
            template:
              '<button data-testid="license-upgrade" @click="$emit(\'upgrade\')">Upgrade</button>',
          },
          MigrationNotification: true,
          MorseChallenge: true,
          OfflineProgressNotification: true,
          RareDxBonus: true,
          SettingsPanel: true,
          StatHeader: true,
          StoreLane: true,
        },
      },
    })

    await wrapper.get('[data-testid="license-upgrade"]').trigger('click')

    expect(revealAffordableFactories).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledTimes(1)
  })
})
