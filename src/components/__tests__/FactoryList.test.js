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
    const unlockedIds = ['elmer', 'straight-key']
    useGameStore.mockReturnValue(
      createStoreMock({
        factoryCounts: { elmer: 2, 'straight-key': 1, 'beam-antenna': 1 },
        isFactoryUnlocked: id => unlockedIds.includes(id),
      })
    )

    const wrapper = mount(FactoryList)

    FACTORIES.filter(factory => unlockedIds.includes(factory.id)).forEach(factory => {
      expect(wrapper.text()).toContain(factory.name)
    })
    expect(wrapper.text()).not.toContain('Beam Antenna')
    expect(wrapper.text()).not.toContain('Paddle Key')
  })

  it('hides unlocked factories that are not owned', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        factoryCounts: { elmer: 1 },
        isFactoryUnlocked: id => ['elmer', 'qrq-protocol', 'straight-key'].includes(id),
      })
    )

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).toContain('Elmer')
    expect(wrapper.text()).not.toContain('QRQ Protocol')
    expect(wrapper.text()).not.toContain('Straight Key')
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

  it('does not render MultiBuyPanel in read-only list, even at 10+ owned', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        factoryCounts: { elmer: 5, 'straight-key': 5 },
        getTotalQSOsPerSecond: () => 4,
        isFactoryUnlocked: id => ['elmer', 'straight-key'].includes(id),
      })
    )

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).not.toContain('Bulk Purchase')
    expect(wrapper.text()).not.toContain('×1')
    expect(wrapper.text()).not.toContain('×10')
  })

  it('renders FactoryCard in readOnly mode (no buy actions shown)', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        factoryCounts: { elmer: 3, 'straight-key': 2 },
        getTotalQSOsPerSecond: () => 2,
        isFactoryUnlocked: id => ['elmer', 'straight-key'].includes(id),
      })
    )

    const wrapper = mount(FactoryList)

    expect(wrapper.findAll('[data-testid="factory-action-row"]')).toHaveLength(0)
    expect(wrapper.findAll('button').filter(button => button.text() === 'Buy')).toHaveLength(0)
  })

  it('shows empty state when no owned factories are available', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        factoryCounts: {},
        isFactoryUnlocked: () => true,
      })
    )

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).toContain('No factories available')
  })

  it('shows owned factories even when unlock predicate is missing', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        factoryCounts: { 'beam-antenna': 1 },
        isFactoryUnlocked: undefined,
      })
    )

    const wrapper = mount(FactoryList)

    expect(wrapper.text()).toContain('Beam Antenna')
  })
})
