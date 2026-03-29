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

  function mockStore(overrides = {}) {
    useGameStore.mockReturnValue({
      qsos: 100n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      isFactoryUnlocked: () => true,
      getUpgradeMultiplier: () => 1,
      getLotteryMultiplier: () => 1,
      prestigeMultiplier: 1,
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

  it('includes a stable root test hook', () => {
    mockStore()

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    expect(wrapper.get('[data-testid="factory-card-root"]').exists()).toBe(true)
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
    mockStore({ getFactoryCost: () => 15n })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    expect(wrapper.text()).toContain('15')
  })

  it('keeps cost and buy together in one action row', () => {
    mockStore({ getFactoryCost: () => 15n })

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
      getFactoryCost: () => 15n,
      getUpgradeMultiplier: () => 2,
    })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    const output = wrapper.find('[data-testid="factory-production"]')
    expect(output.text()).toContain('10.0/sec')
    expect(output.text()).toContain('(0.2/sec × 50)')
    expect(output.text().indexOf('10.0/sec')).toBeLessThan(output.text().indexOf('(0.2/sec × 50)'))
  })

  it('handles non-finite rates without throwing', () => {
    mockStore({
      factoryCounts: { elmer: 1 },
      getUpgradeMultiplier: () => Number.POSITIVE_INFINITY,
    })

    expect(() =>
      mount(FactoryCard, {
        props: {
          factory: elmerFactory,
        },
      })
    ).not.toThrow()
  })

  it('displays infinity and NaN rate fallbacks explicitly', () => {
    mockStore({
      factoryCounts: { elmer: 1 },
      getUpgradeMultiplier: () => Number.POSITIVE_INFINITY,
    })

    const infWrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })
    expect(infWrapper.get('[data-testid="factory-production"]').text()).toContain('∞/sec')

    mockStore({
      factoryCounts: { elmer: 1 },
      getUpgradeMultiplier: () => Number.NaN,
    })

    const nanWrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })
    expect(nanWrapper.get('[data-testid="factory-production"]').text()).toContain('—/sec')
  })

  it('disables buy button when cannot afford', () => {
    mockStore({ qsos: 5n })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    const buyButton = wrapper.find('button')
    expect(buyButton.attributes('disabled')).toBeDefined()
  })

  it('disables buy button when factory is locked even if affordable', async () => {
    mockStore({
      qsos: 100n,
      isFactoryUnlocked: () => false,
    })

    const wrapper = mount(FactoryCard, {
      props: {
        factory: elmerFactory,
      },
    })

    const buyButton = wrapper.find('button')
    expect(buyButton.attributes('disabled')).toBeDefined()

    await buyButton.trigger('click')
    expect(wrapper.emitted('buy')).toBeFalsy()
  })

  it('masks locked factory name and shows unlock progress message', () => {
    mockStore({
      qsos: 100n,
      qsosThisRun: 60n,
      isFactoryUnlocked: () => false,
    })

    const lockedFactory = {
      ...elmerFactory,
      unlockThreshold: 100n,
    }

    const wrapper = mount(FactoryCard, {
      props: {
        factory: lockedFactory,
      },
    })

    expect(wrapper.text()).toContain('???')
    expect(wrapper.text()).toContain('Earn 40 more QSOs this run to unlock.')
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
