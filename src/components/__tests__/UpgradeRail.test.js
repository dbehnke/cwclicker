import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import UpgradeRail from '../UpgradeRail.vue'

vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

import { useGameStore } from '../../stores/game'

const FACTORIES = [{ id: 'f1' }, { id: 'f2' }]

function makeUpgrade({
  id,
  factoryId = 'f1',
  threshold = 1,
  baseCost,
  multiplier = 2,
  icon = '⚡',
  name,
  description,
}) {
  return {
    id,
    factoryId,
    threshold,
    baseCost,
    multiplier,
    icon,
    name: name || id,
    description: description || `${id} description`,
  }
}

function makeStore(overrides = {}) {
  return {
    qsos: 600n,
    factoryCounts: { f1: 1, f2: 1 },
    purchasedUpgrades: new Set(),
    upgradePurchaseMeta: {},
    buyUpgrade: vi.fn(() => true),
    save: vi.fn(),
    ...overrides,
  }
}

function mountRail(options = {}) {
  const {
    storeOverrides = {},
    upgrades = [],
    factories = FACTORIES,
  } = options

  const store = makeStore(storeOverrides)
  useGameStore.mockReturnValue(store)

  const wrapper = mount(UpgradeRail, {
    attachTo: document.body,
    props: {
      upgrades,
      factories,
    },
  })

  return { wrapper, store }
}

describe('UpgradeRail', () => {
  const wrappers = []

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  function mountTracked(options) {
    const mounted = mountRail(options)
    wrappers.push(mounted.wrapper)
    return mounted
  }

  afterEach(() => {
    while (wrappers.length > 0) {
      const wrapper = wrappers.pop()
      wrapper.unmount()
    }
  })

  it('renders max 5 icon tiles in top priority row', () => {
    const upgrades = [
      makeUpgrade({ id: 'u1', baseCost: 100n }),
      makeUpgrade({ id: 'u2', baseCost: 200n }),
      makeUpgrade({ id: 'u3', baseCost: 300n }),
      makeUpgrade({ id: 'u4', baseCost: 400n }),
      makeUpgrade({ id: 'u5', baseCost: 500n }),
      makeUpgrade({ id: 'u6', baseCost: 600n }),
    ]

    const { wrapper } = mountTracked({ upgrades })

    const topTiles = wrapper.findAll('[data-testid="upgrade-rail-top-tile"]')
    expect(topTiles).toHaveLength(5)
  })

  it('renders grouped section order: ready, almost, recent, locked', async () => {
    const upgrades = [
      makeUpgrade({ id: 'ready', baseCost: 100n }),
      makeUpgrade({ id: 'almost', baseCost: 700n }),
      makeUpgrade({ id: 'recent', baseCost: 50n }),
      makeUpgrade({ id: 'locked', baseCost: 900n, threshold: 5 }),
    ]

    const { wrapper } = mountTracked({
      upgrades,
      storeOverrides: {
        qsos: 150n,
        purchasedUpgrades: new Set(['recent']),
        upgradePurchaseMeta: { recent: 100 },
      },
    })

    await wrapper.get('[data-testid="upgrade-rail-expand-toggle"]').trigger('click')

    const labels = wrapper.findAll('[data-testid="upgrade-rail-group-title"]').map(node => node.text())
    expect(labels).toEqual([
      'Ready to Buy',
      'Almost There',
      'Recently Purchased',
      'Locked by Factory Count',
    ])
  })

  it('keeps locked group collapsed by default', async () => {
    const upgrades = [makeUpgrade({ id: 'locked', baseCost: 900n, threshold: 5 })]
    const { wrapper } = mountTracked({ upgrades })

    await wrapper.get('[data-testid="upgrade-rail-expand-toggle"]').trigger('click')

    const lockedToggle = wrapper.get('[data-testid="upgrade-rail-locked-toggle"]')
    expect(lockedToggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[data-testid="upgrade-rail-locked-items"]').exists()).toBe(false)
  })

  it('hides locked group when empty', async () => {
    const upgrades = [makeUpgrade({ id: 'ready', baseCost: 100n, threshold: 1 })]
    const { wrapper } = mountTracked({ upgrades })

    await wrapper.get('[data-testid="upgrade-rail-expand-toggle"]').trigger('click')

    expect(wrapper.find('[data-testid="upgrade-rail-locked-group"]').exists()).toBe(false)
  })

  it('shows tooltip content with threshold, multiplier, and formatted cost', () => {
    const upgrades = [
      makeUpgrade({
        id: 'tooltip-upgrade',
        baseCost: 1_010_000n,
        multiplier: 32,
        threshold: 1,
        name: 'Tooltip Upgrade',
        description: 'Flavor line',
      }),
    ]

    const { wrapper } = mountTracked({ upgrades })

    const tooltip = wrapper.get('[data-testid="upgrade-tooltip-tooltip-upgrade"]')
    expect(tooltip.text()).toContain('Tooltip Upgrade')
    expect(tooltip.text()).toContain('Flavor line')
    expect(tooltip.text()).toContain('32x')
    expect(tooltip.text()).toContain('1')
    expect(tooltip.text()).toContain('1.01M')
  })

  it('opens details sheet on tile click and closes via Escape', async () => {
    const upgrades = [makeUpgrade({ id: 'u1', baseCost: 100n })]
    const { wrapper } = mountTracked({ upgrades })

    await wrapper.get('[data-upgrade-id="u1"]').trigger('click')
    expect(wrapper.get('[data-testid="upgrade-rail-details-sheet"]').exists()).toBe(true)

    await wrapper.get('[data-testid="upgrade-rail-details-sheet"]').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[data-testid="upgrade-rail-details-sheet"]').exists()).toBe(false)
  })

  it('shows stale failure message and keeps CTA state tied to current affordability', async () => {
    const upgrades = [makeUpgrade({ id: 'u1', baseCost: 100n })]
    const buyUpgrade = vi.fn(() => false)
    const { wrapper } = mountTracked({
      upgrades,
      storeOverrides: {
        buyUpgrade,
      },
    })

    await wrapper.get('[data-upgrade-id="u1"]').trigger('click')
    await wrapper.get('[data-testid="upgrade-rail-buy-cta"]').trigger('click')

    expect(wrapper.text()).toContain('Could not purchase upgrade. Your QSOs changed.')
    expect(wrapper.get('[data-testid="upgrade-rail-buy-cta"]').element.disabled).toBe(false)
  })

  it('includes upgrade name, affordability status, and formatted cost in tile aria-label', () => {
    const upgrades = [
      makeUpgrade({
        id: 'ready-upgrade',
        baseCost: 1_010_000n,
        name: 'Ready Upgrade',
      }),
    ]

    const { wrapper } = mountTracked({
      upgrades,
      storeOverrides: {
        qsos: 2_000_000n,
      },
    })

    const tile = wrapper.get('[data-upgrade-id="ready-upgrade"]')
    const label = tile.attributes('aria-label')

    expect(label).toContain('Ready Upgrade')
    expect(label).toContain('Affordable')
    expect(label).toContain('1.01M')
  })

  it('maintains expand toggle aria-controls and aria-expanded contract', async () => {
    const upgrades = [makeUpgrade({ id: 'u1', baseCost: 100n })]
    const { wrapper } = mountTracked({ upgrades })

    const toggle = wrapper.get('[data-testid="upgrade-rail-expand-toggle"]')
    expect(toggle.attributes('aria-controls')).toBe('upgrade-rail-groups')
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('#upgrade-rail-groups').exists()).toBe(true)
  })

  it('renders ready/almost/recent groups only when non-empty', async () => {
    const upgrades = [makeUpgrade({ id: 'ready-only', baseCost: 100n })]
    const { wrapper } = mountTracked({ upgrades })

    await wrapper.get('[data-testid="upgrade-rail-expand-toggle"]').trigger('click')

    expect(wrapper.find('[data-testid="upgrade-rail-ready-group"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="upgrade-rail-almost-group"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="upgrade-rail-recent-group"]').exists()).toBe(false)
  })

  it('refocuses clicked tile on successful buy', async () => {
    const upgrades = [makeUpgrade({ id: 'u1', baseCost: 100n })]
    const { wrapper, store } = mountTracked({ upgrades })

    const tile = wrapper.get('[data-upgrade-id="u1"]')
    await tile.trigger('click')
    await wrapper.get('[data-testid="upgrade-rail-buy-cta"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(store.save).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="upgrade-rail-details-sheet"]').exists()).toBe(false)
    expect(document.activeElement).toBe(tile.element)
  })

  it('renders deterministic data-upgrade-id order in ready group', async () => {
    const upgrades = [
      makeUpgrade({ id: 'z-upgrade', factoryId: 'f1', baseCost: 100n }),
      makeUpgrade({ id: 'a-upgrade', factoryId: 'f1', baseCost: 100n }),
      makeUpgrade({ id: 'm-upgrade', factoryId: 'f1', baseCost: 100n }),
    ]

    const { wrapper } = mountTracked({ upgrades })
    await wrapper.get('[data-testid="upgrade-rail-expand-toggle"]').trigger('click')

    const ids = wrapper
      .findAll('[data-testid="upgrade-rail-ready-items"] [data-upgrade-id]')
      .map(node => node.attributes('data-upgrade-id'))

    expect(ids).toEqual(['z-upgrade', 'a-upgrade', 'm-upgrade'])
  })

  it('uses overflow-y-auto on expanded groups container', async () => {
    const upgrades = [makeUpgrade({ id: 'u1', baseCost: 100n })]
    const { wrapper } = mountTracked({ upgrades })

    await wrapper.get('[data-testid="upgrade-rail-expand-toggle"]').trigger('click')

    expect(wrapper.get('[data-testid="upgrade-rail-groups-container"]').classes()).toContain(
      'overflow-y-auto'
    )
  })

  it('formats compact values in details sheet and tooltip', async () => {
    const upgrades = [
      makeUpgrade({
        id: 'u1',
        baseCost: 1_010_000n,
      }),
    ]
    const { wrapper } = mountTracked({
      upgrades,
      storeOverrides: {
        qsos: 10_000n,
      },
    })

    expect(wrapper.get('[data-testid="upgrade-tooltip-u1"]').text()).toContain('1.01M')

    await wrapper.get('[data-upgrade-id="u1"]').trigger('click')
    const sheetText = wrapper.get('[data-testid="upgrade-rail-details-sheet"]').text()
    expect(sheetText).toContain('1.01M')
    expect(sheetText).toContain('1.00M')
  })
})
