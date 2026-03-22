import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import FactoryCard from '../FactoryCard.vue'
import { useGameStore } from '../../stores/game'
import { FACTORIES } from '../../constants/factories'

// Mock the game store to control the state
vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

describe('FactoryCard.vue', () => {
  const elmerFactory = FACTORIES.find(f => f.id === 'elmer')

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders factory name', () => {
    useGameStore.mockReturnValue({
      qsos: 100,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    expect(wrapper.text()).toContain('Elmer')
  })

  it('shows QSOs per second', () => {
    useGameStore.mockReturnValue({
      qsos: 100,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    expect(wrapper.text()).toContain('0.1/sec')
  })

  it('shows current cost', () => {
    useGameStore.mockReturnValue({
      qsos: 100,
      factoryCounts: {},
      getFactoryCost: () => 15,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    expect(wrapper.text()).toContain('15')
  })

  it('disables buy button when cannot afford', () => {
    useGameStore.mockReturnValue({
      qsos: 5,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    const buyButton = wrapper.find('button')
    expect(buyButton.attributes('disabled')).toBeDefined()
  })

  it('emits buy event on click when affordable', async () => {
    useGameStore.mockReturnValue({
      qsos: 100,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

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
