import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import MultiBuyPanel from '../MultiBuyPanel.vue'
import { useGameStore } from '../../stores/game'
import { FACTORIES } from '../../constants/factories'

// Mock the game store to control the state
vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

describe('MultiBuyPanel.vue', () => {
  const elmerFactory = FACTORIES.find(f => f.id === 'elmer')

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows 3 buttons when multiBuyAvailable is true', () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: (id, count) => BigInt(Math.floor(count * 10 * 0.95)),
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory,
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(3)
  })

  it('hidden when multiBuyAvailable is false', () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: () => 95n,
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: false,
        factory: elmerFactory,
      },
    })

    expect(wrapper.isVisible()).toBe(false)
  })

  it('shows correct costs for each button', () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: (id, count) => BigInt(Math.floor(count * 10 * 0.95)),
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory,
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons[0].text()).toContain('10') // x1
    expect(buttons[1].text()).toContain('47') // x5 with discount
    expect(buttons[2].text()).toContain('95') // x10 with discount
  })

  it('renders x1 x5 and x10 buttons and keeps them clickable', async () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: (id, count) => BigInt(Math.floor(count * 10 * 0.95)),
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory,
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.map(button => button.text().trim().split(':')[0])).toEqual([
      '×1',
      '×5',
      '×10',
    ])

    for (const button of buttons) {
      expect(button.isVisible()).toBe(true)
      expect(button.attributes('disabled')).toBeUndefined()
      await button.trigger('click')
    }

    expect(wrapper.emitted('buy')).toEqual([
      [{ factory: elmerFactory, count: 1 }],
      [{ factory: elmerFactory, count: 5 }],
      [{ factory: elmerFactory, count: 10 }],
    ])
  })

  it('applies the responsive grid classes for the button row', () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: (id, count) => BigInt(Math.floor(count * 10 * 0.95)),
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory,
      },
    })

    const row = wrapper.get('[data-testid="bulk-buy-row"]')
    expect(row.classes()).toContain('grid')
    expect(row.classes()).toContain('grid-cols-1')
    expect(row.classes()).toContain('sm:grid-cols-3')
  })

  it('emits buy event with count 1 on x1 button click', async () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: () => 95n,
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory,
      },
    })

    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')

    expect(wrapper.emitted('buy')).toBeTruthy()
    expect(wrapper.emitted('buy')[0]).toEqual([{ factory: elmerFactory, count: 1 }])
  })

  it('emits buy event with count 5 on x5 button click', async () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: () => 95n,
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory,
      },
    })

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(wrapper.emitted('buy')).toBeTruthy()
    expect(wrapper.emitted('buy')[0]).toEqual([{ factory: elmerFactory, count: 5 }])
  })

  it('emits buy event with count 10 on x10 button click', async () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: () => 95n,
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory,
      },
    })

    const buttons = wrapper.findAll('button')
    await buttons[2].trigger('click')

    expect(wrapper.emitted('buy')).toBeTruthy()
    expect(wrapper.emitted('buy')[0]).toEqual([{ factory: elmerFactory, count: 10 }])
  })

  it('disables buttons when cannot afford', () => {
    useGameStore.mockReturnValue({
      qsos: 5n, // Can't afford any
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: (id, count) => BigInt(Math.floor(count * 10 * 0.95)),
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory,
      },
    })

    const buttons = wrapper.findAll('button')
    buttons.forEach(button => {
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  it('disables only bulk buttons above available QSO amount', () => {
    useGameStore.mockReturnValue({
      qsos: 50n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: (id, count) => BigInt(Math.floor(count * 10 * 0.95)),
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory,
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('disabled')).toBeUndefined()
    expect(buttons[1].attributes('disabled')).toBeUndefined()
    expect(buttons[2].attributes('disabled')).toBeDefined()
  })
})
