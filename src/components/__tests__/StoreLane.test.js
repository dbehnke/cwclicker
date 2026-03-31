import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import StoreLane from '../StoreLane.vue'
import { useGameStore } from '../../stores/game'
import { FACTORIES } from '../../constants/factories'

vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

describe('StoreLane.vue', () => {
  function createStoreMock(overrides = {}) {
    return {
      buyFactory: vi.fn(() => true),
      factoryCounts: {},
      factoryProductionTotals: {},
      getLotteryMultiplier: () => 1,
      getTotalQSOsPerSecond: () => 0,
      getUpgradeMultiplier: () => 1,
      isFactoryUnlocked: () => false,
      prestigeMultiplier: 1,
      save: vi.fn(),
      ...overrides,
    }
  }

  function mountStoreLane(options = {}) {
    const hasBuyPayload = Object.prototype.hasOwnProperty.call(options, 'buyPayload')
    const buyPayload = options.buyPayload

    return mount(StoreLane, {
      global: {
        stubs: {
          UpgradeRail: {
            template: '<div data-testid="upgrade-rail-stub">UpgradeRail</div>',
          },
          CompactFactoryItem: {
            name: 'CompactFactoryItem',
            props: ['factory'],
            emits: ['buy', 'hover-start', 'hover-end'],
            setup(_, { emit }) {
              const emitBuy = factory => {
                if (!hasBuyPayload) {
                  emit('buy', { factory, count: 2 })
                  return
                }

                emit('buy', buyPayload)
              }

              const emitHoverStart = factory => emit('hover-start', factory)
              const emitHoverEnd = () => emit('hover-end')

              return { emitBuy, emitHoverStart, emitHoverEnd }
            },
            template:
              '<button data-testid="compact-factory-item-stub" :data-factory-id="factory.id" @click="emitBuy(factory)" @mouseenter="emitHoverStart(factory)" @mouseleave="emitHoverEnd()">{{ factory.name }}</button>',
          },
        },
      },
    })
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders UpgradeRail and compact items for unlocked factories only', () => {
    const unlockedIds = ['elmer', 'straight-key', 'paddle-key']
    useGameStore.mockReturnValue(
      createStoreMock({
        isFactoryUnlocked: id => unlockedIds.includes(id),
      })
    )

    const wrapper = mountStoreLane()

    expect(wrapper.get('[data-testid="store-lane"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="upgrade-rail-stub"]').exists()).toBe(true)

    const renderedIds = wrapper
      .findAll('[data-testid="compact-factory-item-stub"]')
      .map(node => node.attributes('data-factory-id'))

    const expectedIds = FACTORIES.filter(factory => unlockedIds.includes(factory.id)).map(
      factory => factory.id
    )

    expect(renderedIds).toEqual(expectedIds)
  })

  it('keeps store header sticky while scrolling', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        isFactoryUnlocked: id => id === 'elmer',
      })
    )

    const wrapper = mountStoreLane()

    expect(wrapper.get('[data-testid="store-lane-header"]').classes()).toContain('sticky')
  })

  it('renders zero factory items when store.isFactoryUnlocked is missing', () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        isFactoryUnlocked: undefined,
      })
    )

    const wrapper = mountStoreLane()

    expect(wrapper.findAll('[data-testid="compact-factory-item-stub"]')).toHaveLength(0)
  })

  it('handles buy event from CompactFactoryItem by calling store.buyFactory with id/count', async () => {
    const buyFactory = vi.fn(() => false)
    const save = vi.fn()
    useGameStore.mockReturnValue(
      createStoreMock({
        buyFactory,
        isFactoryUnlocked: id => id === 'elmer',
        save,
      })
    )

    const wrapper = mountStoreLane()

    await wrapper.get('[data-testid="compact-factory-item-stub"]').trigger('click')

    expect(buyFactory).toHaveBeenCalledTimes(1)
    expect(buyFactory).toHaveBeenCalledWith('elmer', 2)
    expect(save).not.toHaveBeenCalled()
  })

  it('calls store.save when buy succeeds', async () => {
    const buyFactory = vi.fn(() => true)
    const save = vi.fn()
    useGameStore.mockReturnValue(
      createStoreMock({
        buyFactory,
        isFactoryUnlocked: id => id === 'elmer',
        save,
      })
    )

    const wrapper = mountStoreLane()

    await wrapper.get('[data-testid="compact-factory-item-stub"]').trigger('click')

    expect(save).toHaveBeenCalledTimes(1)
  })

  it('does not call save when store.save is missing', async () => {
    const buyFactory = vi.fn(() => true)
    useGameStore.mockReturnValue(
      createStoreMock({
        buyFactory,
        isFactoryUnlocked: id => id === 'elmer',
        save: undefined,
      })
    )

    const wrapper = mountStoreLane()

    await expect(
      wrapper.get('[data-testid="compact-factory-item-stub"]').trigger('click')
    ).resolves.toBeUndefined()
  })

  it('does not call save when store.save is not a function', async () => {
    const buyFactory = vi.fn(() => true)
    useGameStore.mockReturnValue(
      createStoreMock({
        buyFactory,
        isFactoryUnlocked: id => id === 'elmer',
        save: true,
      })
    )

    const wrapper = mountStoreLane()

    await expect(
      wrapper.get('[data-testid="compact-factory-item-stub"]').trigger('click')
    ).resolves.toBeUndefined()
  })

  it('ignores malformed buy payload without calling buyFactory or save', async () => {
    const buyFactory = vi.fn(() => true)
    const save = vi.fn()

    useGameStore.mockReturnValue(
      createStoreMock({
        buyFactory,
        isFactoryUnlocked: id => id === 'elmer',
        save,
      })
    )

    const wrapper = mountStoreLane({ buyPayload: undefined })

    await expect(
      wrapper.get('[data-testid="compact-factory-item-stub"]').trigger('click')
    ).resolves.toBeUndefined()

    expect(buyFactory).not.toHaveBeenCalled()
    expect(save).not.toHaveBeenCalled()
  })

  it('tracks hovered factory from compact items', async () => {
    useGameStore.mockReturnValue(
      createStoreMock({
        isFactoryUnlocked: id => id === 'elmer',
      })
    )

    const wrapper = mountStoreLane()
    const item = wrapper.get('[data-testid="compact-factory-item-stub"]')

    await item.trigger('mouseenter')
    expect(wrapper.find('[data-testid="store-hover-details"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="store-hover-details"]').classes()).toContain(
      'pointer-events-none'
    )

    await item.trigger('mouseleave')
    expect(wrapper.find('[data-testid="store-hover-details"]').exists()).toBe(false)
  })
})
