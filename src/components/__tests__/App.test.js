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
          UpgradeRail: true,
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
          UpgradeRail: true,
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

  it('renders store header, upgrade rail, and factory cards in order with totals visible', () => {
    useGameStore.mockReturnValue({
      audioSettings: { volume: 0.5, frequency: 600, isMuted: false },
      buyFactory: vi.fn(),
      factoryCounts: { elmer: 1 },
      getFactoryCost: () => 10n,
      getTotalQSOsPerSecond: () => 12.5,
      getBulkCost: () => 0n,
      getUpgradeMultiplier: () => 1,
      getLotteryMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      isFactoryUnlocked: id => id === 'elmer',
      licenseLevel: 1,
      load: vi.fn(),
      prestigeMultiplier: 1,
      purchasedUpgrades: new Set(),
      qsos: 345n,
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
            template: '<div data-testid="factory-card-root">{{ factory.name }}</div>',
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
          UpgradeRail: {
            template: '<div data-testid="upgrade-rail-root">Upgrade Rail</div>',
          },
        },
      },
    })

    const html = wrapper.html()
    const storeHeaderPos = html.indexOf('data-testid="store-header"')
    const upgradeRailPos = html.indexOf('data-testid="upgrade-rail-root"')
    const firstFactoryCardPos = html.indexOf('data-testid="factory-card-root"')

    expect(storeHeaderPos).toBeGreaterThan(-1)
    expect(upgradeRailPos).toBeGreaterThan(storeHeaderPos)
    expect(firstFactoryCardPos).toBeGreaterThan(upgradeRailPos)

    const header = wrapper.get('[data-testid="store-header"]')
    expect(header.text()).toContain('Producing:')
    expect(header.text()).toContain('QSOs/sec')
    expect(header.text()).toContain('QSOs')
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
          FactoryCard: true,
          GameLoop: true,
          KeyerArea: true,
          LicensePanel: {
            template:
              '<button data-testid="license-upgrade" @click="$emit(\'upgrade\')">Upgrade</button>',
          },
          MigrationNotification: true,
          MultiBuyPanel: true,
          MorseChallenge: true,
          OfflineProgressNotification: true,
          RareDxBonus: true,
          SettingsPanel: true,
          StatHeader: true,
          UpgradeRail: true,
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
          FactoryCard: true,
          GameLoop: true,
          KeyerArea: true,
          LicensePanel: {
            template:
              '<button data-testid="license-upgrade" @click="$emit(\'upgrade\')">Upgrade</button>',
          },
          MigrationNotification: true,
          MultiBuyPanel: true,
          MorseChallenge: true,
          OfflineProgressNotification: true,
          RareDxBonus: true,
          SettingsPanel: true,
          StatHeader: true,
          UpgradeRail: true,
        },
      },
    })

    await wrapper.get('[data-testid="license-upgrade"]').trigger('click')

    expect(revealAffordableFactories).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledTimes(1)
  })
})
