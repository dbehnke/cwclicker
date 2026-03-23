import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import FactoryCard from '../FactoryCard.vue'
import { useGameStore } from '../../stores/game'
import { FACTORIES } from '../../constants/factories'
import { UPGRADES } from '../../constants/upgrades'

// Mock the game store to control the state
vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

describe('FactoryCard.vue', () => {
  const elmerFactory = FACTORIES.find(f => f.id === 'elmer')
  const elmerUpgrade = UPGRADES.find(u => u.factoryId === 'elmer')

  function mockStore(overrides = {}) {
    useGameStore.mockReturnValue({
      qsos: 100,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
      ...overrides,
    })
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders factory name', () => {
    mockStore()

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    expect(wrapper.text()).toContain('Elmer')
  })

  it('shows QSOs per second', () => {
    mockStore()

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    expect(wrapper.text()).toContain('0.1/sec')
  })

  it('shows current cost', () => {
    mockStore({ getFactoryCost: () => 15 })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    expect(wrapper.text()).toContain('15')
  })

  it('keeps cost and buy together in one action row', () => {
    mockStore({ getFactoryCost: () => 15 })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    const actionRow = wrapper.find('[data-testid="factory-action-row"]')
    expect(actionRow.exists()).toBe(true)
    expect(actionRow.text()).toContain('15')
    expect(actionRow.text()).toContain('Buy')
  })

  it('shows final rate above the breakdown line', () => {
    mockStore({
      factoryCounts: { elmer: 50 },
      getFactoryCost: () => 15,
      getUpgradeMultiplier: () => 2,
    })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    const output = wrapper.find('[data-testid="factory-production"]')
    expect(output.text()).toContain('10.0/sec')
    expect(output.text()).toContain('(0.2/sec × 2 × 50)')
    expect(output.text().indexOf('10.0/sec')).toBeLessThan(output.text().indexOf('(0.2/sec × 2 × 50)'))
  })

  it('sources the upgrade teaser text from upgrade description', () => {
    mockStore({
      factoryCounts: { elmer: 1 },
      getAvailableUpgrades: () => [elmerUpgrade],
      getUpgradeMultiplier: () => 1,
    })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    expect(wrapper.text()).toContain(elmerUpgrade.description)
  })

  it('starts purchased upgrades collapsed by default', async () => {
    mockStore({
      factoryCounts: { elmer: 1 },
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(['elmer-upgrade-0', 'elmer-upgrade-1']),
    })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    expect(wrapper.text()).toContain('Latest Purchased')
    expect(wrapper.text()).not.toContain('Rusty Soldering Iron')
    expect(wrapper.text()).not.toContain('Coffee-Stained Logbook')

    await wrapper.get('[data-testid="purchased-upgrades-toggle"]').trigger('click')
    expect(wrapper.text()).toContain('Rusty Soldering Iron')
    expect(wrapper.text()).toContain('Coffee-Stained Logbook')
  })

  it('hides the upgrade badge row below 640px', () => {
    mockStore({
      factoryCounts: { elmer: 1 },
      getUpgradeMultiplier: () => 2,
      getAvailableUpgrades: () => [elmerUpgrade],
    })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    expect(wrapper.get('[data-testid="upgrade-badge-row"]').classes()).toContain('hidden')
    expect(wrapper.get('[data-testid="upgrade-badge-row"]').classes()).toContain('sm:block')
  })

  it('shows a compact upgrade summary on mobile', () => {
    mockStore({
      factoryCounts: { elmer: 1 },
      getUpgradeMultiplier: () => 4,
      getAvailableUpgrades: () => [elmerUpgrade],
    })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    const summary = wrapper.get('[data-testid="upgrade-summary-mobile"]')
    expect(summary.classes()).toContain('sm:hidden')
    expect(summary.text()).toContain('4x active')
    expect(summary.text()).toContain('7 more')
  })

  it('disables buy button when cannot afford', () => {
    mockStore({ qsos: 5 })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    const buyButton = wrapper.find('button')
    expect(buyButton.attributes('disabled')).toBeDefined()
  })

  it('emits buy event on click when affordable', async () => {
    mockStore()

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    const buyButton = wrapper.find('button')
    await buyButton.trigger('click')

    expect(wrapper.emitted('buy')).toBeTruthy()
    expect(wrapper.emitted('buy')[0]).toEqual([{ factory: elmerFactory, count: 1 }])
  })
})
