import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import MultiBuyPanel from '../MultiBuyPanel.vue'
import { useGameStore } from '../../stores/game'
import { FACTORIES } from '../../constants/factories'

// Mock the game store to control the state
vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn()
}))

describe('MultiBuyPanel.vue', () => {
  const elmerFactory = FACTORIES.find(f => f.id === 'elmer')

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows 4 buttons when multiBuyAvailable is true', () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: (id, count) => BigInt(Math.floor(count * 10 * 0.95))
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(4)
  })

  it('hidden when multiBuyAvailable is false', () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: () => 95n
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: false,
        factory: elmerFactory
      }
    })

    expect(wrapper.isVisible()).toBe(false)
  })

  it('shows correct costs for each button', () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: (id, count) => BigInt(Math.floor(count * 10 * 0.95))
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons[0].text()).toContain('10')  // x1
    expect(buttons[1].text()).toContain('95')  // x10 with discount
    expect(buttons[2].text()).toContain('950') // x100 with discount
  })

  it('emits buy event with count 1 on x1 button click', async () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: () => 95n
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory
      }
    })

    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')

    expect(wrapper.emitted('buy')).toBeTruthy()
    expect(wrapper.emitted('buy')[0]).toEqual([{ factory: elmerFactory, count: 1 }])
  })

  it('emits buy event with count 10 on x10 button click', async () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: () => 95n
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory
      }
    })

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(wrapper.emitted('buy')).toBeTruthy()
    expect(wrapper.emitted('buy')[0]).toEqual([{ factory: elmerFactory, count: 10 }])
  })

  it('emits buy event with count 100 on x100 button click', async () => {
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: () => 95n
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory
      }
    })

    const buttons = wrapper.findAll('button')
    await buttons[2].trigger('click')

    expect(wrapper.emitted('buy')).toBeTruthy()
    expect(wrapper.emitted('buy')[0]).toEqual([{ factory: elmerFactory, count: 100 }])
  })

  it('MAX button calculates correctly and emits buy event', async () => {
    // With 1000 QSOs and cost of 10 each with 5% discount, can afford 105
    useGameStore.mockReturnValue({
      qsos: 1000n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: (id, count) => BigInt(Math.floor(count * 10 * 0.95))
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory
      }
    })

    const buttons = wrapper.findAll('button')
    await buttons[3].trigger('click')

    expect(wrapper.emitted('buy')).toBeTruthy()
    expect(wrapper.emitted('buy')[0]).toEqual([{ factory: elmerFactory, count: 105 }])
  })

  it('disables buttons when cannot afford', () => {
    useGameStore.mockReturnValue({
      qsos: 5n, // Can't afford any
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: () => 95n
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory
      }
    })

    const buttons = wrapper.findAll('button')
    buttons.forEach(button => {
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  it('MAX button shows correct max count', () => {
    useGameStore.mockReturnValue({
      qsos: 500n,
      factoryCounts: {},
      getFactoryCost: () => 10n,
      getBulkCost: (id, count) => BigInt(Math.floor(count * 10 * 0.95))
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory
      }
    })

    const buttons = wrapper.findAll('button')
    // With 500 QSOs and cost of 10 each with 5% discount, can afford 52
    expect(buttons[3].text()).toContain('52')
  })

  it('MAX button stops at reasonable limit when cost is invalid', () => {
    // If getFactoryCost returns 0 or negative, loop should stop immediately
    useGameStore.mockReturnValue({
      qsos: 1000000n,
      factoryCounts: {},
      getFactoryCost: () => 0n, // Invalid cost
      getBulkCost: () => 0n
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory
      }
    })

    const buttons = wrapper.findAll('button')
    // Should show MAX: 0 since cost is invalid
    expect(buttons[3].text()).toContain('0')
  })

  it('MAX button stops at reasonable limit when cost is negative', () => {
    // If getFactoryCost returns negative, loop should stop immediately
    useGameStore.mockReturnValue({
      qsos: 1000000n,
      factoryCounts: {},
      getFactoryCost: () => -10n, // Invalid negative cost
      getBulkCost: () => 0n
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory
      }
    })

    const buttons = wrapper.findAll('button')
    // Should show MAX: 0 since cost is invalid
    expect(buttons[3].text()).toContain('0')
  })
})