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
      qsos: 1000,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getBulkCost: (id, count) => count * 10 * 0.95
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
      qsos: 1000,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getBulkCost: () => 95
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
      qsos: 1000,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getBulkCost: (id, count) => count * 10 * 0.95
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
      qsos: 1000,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getBulkCost: () => 95
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
      qsos: 1000,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getBulkCost: () => 95
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
      qsos: 1000,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getBulkCost: () => 95
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
    // With 1000 QSOs and cost of 10 each, can afford 100
    useGameStore.mockReturnValue({
      qsos: 1000,
      factoryCounts: {},
      getFactoryCost: () => 10,
      getBulkCost: () => 950
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
    expect(wrapper.emitted('buy')[0]).toEqual([{ factory: elmerFactory, count: 100 }])
  })

  it('disables buttons when cannot afford', () => {
    useGameStore.mockReturnValue({
      qsos: 5, // Can't afford any
      factoryCounts: {},
      getFactoryCost: () => 10,
      getBulkCost: () => 95
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
      qsos: 500,
      factoryCounts: {},
      getFactoryCost: (id, owned) => 10, // Fixed cost for simplicity
      getBulkCost: () => 950
    })

    const wrapper = mount(MultiBuyPanel, {
      props: {
        multiBuyAvailable: true,
        factory: elmerFactory
      }
    })

    const buttons = wrapper.findAll('button')
    // With 500 QSOs and cost of 10 each, can afford 50
    expect(buttons[3].text()).toContain('50')
  })
})
