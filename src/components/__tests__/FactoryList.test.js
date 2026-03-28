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
  const createStoreMock = overrides => ({
    qsos: 1000n,
    licenseLevel: 1,
    factoryCounts: {},
    getFactoryCost: () => 10n,
    getTotalQSOsPerSecond: () => 0,
    getBulkCost: () => 100n,
    getUpgradeMultiplier: () => 1,
    getLotteryMultiplier: () => 1,
    prestigeMultiplier: 1,
    getAvailableUpgrades: () => [],
    purchasedUpgrades: new Set(),
    buyUpgrade: () => {},
    buyFactory: vi.fn(),
    save: () => {},
    isFactoryUnlocked: () => false,
    ...overrides,
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders only factories that store marks as unlocked', () => {
    const unlockedIds = ['elmer', 'qrq-protocol', 'straight-key']
    useGameStore.mockReturnValue(
      createStoreMock({
        isFactoryUnlocked: id => unlockedIds.includes(id),
      })
    )

    const wrapper = mount(FactoryList)

    FACTORIES.filter(factory => unlockedIds.includes(factory.id)).forEach(factory => {
      expect(wrapper.text()).toContain(factory.name)
    })
    expect(wrapper.text()).not.toContain('Beam Antenna')
    expect(wrapper.text()).not.toContain('FT8 Bot')
  })

  it('hides locked factories instead of rendering ??? placeholders', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        qsos: 1n,
        isFactoryUnlocked: id => ['elmer', 'qrq-protocol', 'straight-key'].includes(id),
      })
    )

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).toContain('Elmer')
    expect(wrapper.text()).toContain('QRQ Protocol')
    expect(wrapper.text()).toContain('Straight Key')
    expect(wrapper.text()).not.toContain('Paddle Key')
    expect(wrapper.text()).not.toContain('Code Practice Oscillator')
    expect(wrapper.text()).not.toContain('Dipole Antenna')
    expect(wrapper.text()).not.toContain('???')
  })

  it('shows total QSOs per second', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        factoryCounts: { elmer: 2, 'straight-key': 1 },
        getTotalQSOsPerSecond: () => 2.5,
        isFactoryUnlocked: id => ['elmer', 'straight-key'].includes(id),
      })
    )

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).toContain('QSOs/sec: 2.5')
  })

  it('shows MultiBuyPanel when 10+ total factories owned', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        qsos: 10000n,
        licenseLevel: 2,
        factoryCounts: { elmer: 5, 'straight-key': 5 },
        getTotalQSOsPerSecond: () => 4,
        isFactoryUnlocked: id => ['elmer', 'straight-key'].includes(id),
      })
    )

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).toContain('Bulk Purchase')
    expect(wrapper.text()).toContain('×1')
    expect(wrapper.text()).toContain('×10')
  })

  it('hides MultiBuyPanel when less than 10 factories owned', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        licenseLevel: 2,
        factoryCounts: { elmer: 3, 'straight-key': 2 },
        getTotalQSOsPerSecond: () => 2,
        isFactoryUnlocked: id => ['elmer', 'straight-key'].includes(id),
      })
    )

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).not.toContain('Bulk Purchase')
  })

  it('handles buy event from FactoryCard', async () => {
    const mockBuyFactory = vi.fn()
    useGameStore.mockReturnValue(
      createStoreMock({
        getBulkCost: () => 100,
        buyFactory: mockBuyFactory,
        isFactoryUnlocked: id => id === 'elmer',
      })
    )

    const wrapper = mount(FactoryList)

    // Find and click the first buy button
    const buyButtons = wrapper.findAll('button')
    const firstBuyButton = buyButtons.find(btn => btn.text() === 'Buy')

    expect(firstBuyButton).toBeDefined()
    await firstBuyButton.trigger('click')

    expect(mockBuyFactory).toHaveBeenCalled()
  })

  it('does not render revealed locked-batch ids unless store predicate allows them', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        isFactoryUnlocked: id => id === 'elmer',
      })
    )

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).toContain('Elmer')
    expect(wrapper.text()).not.toContain('Beam Antenna')
  })

  it('keeps owned factories visible when store predicate returns true', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        licenseLevel: 1,
        factoryCounts: { 'beam-antenna': 1 },
        isFactoryUnlocked: id => id === 'beam-antenna',
      })
    )

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).toContain('Beam Antenna')
  })
})
