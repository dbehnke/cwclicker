import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import FactoryList from '../FactoryList.vue'
import { useGameStore } from '../../stores/game'
import { FACTORIES } from '../../constants/factories'

vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

describe('FactoryList.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders all factories for current license tier', () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      licenseLevel: 2,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getTotalQSOsPerSecond: () => 0,
      getBulkCost: () => 100n,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

    const wrapper = mount(FactoryList)

    // Should show tier 1 and tier 2 factories (6 total)
    const availableFactories = FACTORIES.filter(f => f.tier <= 2)
    expect(availableFactories.length).toBe(6)

    availableFactories.forEach(factory => {
      expect(wrapper.text()).toContain(factory.name)
    })
  })

  it('filters out factories above license tier', () => {
    useGameStore.mockReturnValue({
      qsos: 10000n,
      licenseLevel: 2,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getTotalQSOsPerSecond: () => 0,
      getBulkCost: () => 100n,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

    const wrapper = mount(FactoryList)

    // License level 2 (General) shows tiers 1-6, filters out tier 7+
    expect(wrapper.text()).toContain('Elmer') // tier 1
    expect(wrapper.text()).toContain('Straight Key') // tier 1
    expect(wrapper.text()).toContain('Paddle Key') // tier 2
    expect(wrapper.text()).toContain('Vertical Antenna') // tier 3
    expect(wrapper.text()).toContain('Hamfest') // tier 6 is visible
    expect(wrapper.text()).not.toContain('FT8 Bot') // tier 7 is filtered
  })

  it('shows total QSOs per second', () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      licenseLevel: 1,
      factoryCounts: { elmer: 2, 'straight-key': 1 },
      getFactoryCost: () => 10n,
      getTotalQSOsPerSecond: () => 2.5,
      getBulkCost: () => 100n,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).toContain('QSOs/sec: 2.5')
  })

  it('shows MultiBuyPanel when 10+ total factories owned', () => {
    useGameStore.mockReturnValue({
      qsos: 10000n,
      licenseLevel: 2,
      factoryCounts: { elmer: 5, 'straight-key': 5 },
      getFactoryCost: () => 10n,
      getTotalQSOsPerSecond: () => 4,
      getBulkCost: () => 100n,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).toContain('Bulk Purchase')
    expect(wrapper.text()).toContain('×1')
    expect(wrapper.text()).toContain('×10')
  })

  it('hides MultiBuyPanel when less than 10 factories owned', () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      licenseLevel: 2,
      factoryCounts: { elmer: 3, 'straight-key': 2 },
      getFactoryCost: () => 10n,
      getTotalQSOsPerSecond: () => 2,
      getBulkCost: () => 100n,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).not.toContain('Bulk Purchase')
  })

  it('handles buy event from FactoryCard', async () => {
    const mockBuyFactory = vi.fn()
    useGameStore.mockReturnValue({
      qsos: 1000n,
      licenseLevel: 1,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getTotalQSOsPerSecond: () => 0,
      getBulkCost: () => 100,
      buyFactory: mockBuyFactory,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

    const wrapper = mount(FactoryList)

    // Find and click the first buy button
    const buyButtons = wrapper.findAll('button')
    const firstBuyButton = buyButtons.find(btn => btn.text() === 'Buy')

    expect(firstBuyButton).toBeDefined()
    await firstBuyButton.trigger('click')

    expect(mockBuyFactory).toHaveBeenCalled()
  })

  it('shows factories for invalid license level using fallback tier 3', () => {
    useGameStore.mockReturnValue({
      qsos: 0n,
      licenseLevel: 0, // Invalid level, falls back to tier 3 max
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getTotalQSOsPerSecond: () => 0,
      getBulkCost: () => 100n,
      getUpgradeMultiplier: () => 1,
      getAvailableUpgrades: () => [],
      purchasedUpgrades: new Set(),
      buyUpgrade: () => {},
      save: () => {},
    })

    const wrapper = mount(FactoryList)

    // Fallback shows tiers 1-3, so factories should be visible
    expect(wrapper.text()).toContain('Elmer') // tier 1
    expect(wrapper.text()).toContain('Straight Key') // tier 1
    expect(wrapper.text()).toContain('Vertical Antenna') // tier 3
    // Tier 4+ should be filtered
    expect(wrapper.text()).not.toContain('Tower Installation') // tier 4
  })
})
