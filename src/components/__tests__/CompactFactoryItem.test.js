import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import CompactFactoryItem from '../CompactFactoryItem.vue'
import { useGameStore } from '../../stores/game'

vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

describe('CompactFactoryItem.vue', () => {
  const factory = {
    id: 'elmer',
    name: 'Elmer',
    icon: 'elmer.png',
  }

  function mockStore(overrides = {}) {
    const getFactoryCost = vi.fn(() => 250n)

    const store = {
      qsos: 1000n,
      factoryCounts: { elmer: 3 },
      getFactoryCost,
      isFactoryUnlocked: () => true,
      ...overrides,
    }

    useGameStore.mockReturnValue(store)

    return store
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders name, cost, and owned count hooks', () => {
    const store = mockStore()

    const wrapper = mount(CompactFactoryItem, {
      props: { factory },
    })

    expect(wrapper.get('[data-testid="compact-factory-title"]').text()).toContain('Elmer')
    expect(wrapper.get('[data-testid="compact-factory-cost"]').text()).toContain('250')
    expect(wrapper.get('[data-testid="compact-factory-owned"]').text()).toContain('3')
    expect(store.getFactoryCost).toHaveBeenCalledWith(factory.id, 3)
  })

  it('emits buy when affordable and unlocked', async () => {
    mockStore({ qsos: 1000n, isFactoryUnlocked: () => true })

    const wrapper = mount(CompactFactoryItem, {
      props: { factory },
    })

    await wrapper.get('[data-testid="compact-factory-item"]').trigger('click')

    expect(wrapper.emitted('buy')).toBeTruthy()
    expect(wrapper.emitted('buy')[0]).toEqual([{ factory, count: 1 }])
  })

  it('does not emit when not affordable', async () => {
    const store = mockStore({ qsos: 10n })

    const wrapper = mount(CompactFactoryItem, {
      props: { factory },
    })

    const button = wrapper.get('[data-testid="compact-factory-item"]')

    expect(button.attributes('disabled')).toBeDefined()

    await button.trigger('click')

    expect(wrapper.emitted('buy')).toBeFalsy()
    expect(store.getFactoryCost).toHaveBeenCalledWith(factory.id, 3)
  })

  it('does not emit when locked', async () => {
    const store = mockStore({ qsos: 1000n, isFactoryUnlocked: () => false })

    const wrapper = mount(CompactFactoryItem, {
      props: { factory },
    })

    const button = wrapper.get('[data-testid="compact-factory-item"]')

    expect(button.attributes('disabled')).toBeDefined()

    await button.trigger('click')

    expect(wrapper.emitted('buy')).toBeFalsy()
    expect(store.getFactoryCost).toHaveBeenCalledWith(factory.id, 3)
  })
})
