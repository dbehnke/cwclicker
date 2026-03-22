import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import LicensePanel from '../LicensePanel.vue'
import { useGameStore } from '../../stores/game'

vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

describe('LicensePanel.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows current license name', () => {
    useGameStore.mockReturnValue({
      qsos: 100n,
      totalQsosEarned: 100n,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    expect(wrapper.text()).toContain('Technician')
  })

  it('shows progress to next license', () => {
    useGameStore.mockReturnValue({
      qsos: 250n,
      totalQsosEarned: 250n,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    expect(wrapper.text()).toContain('Progress to General')
  })

  it('shows correct QSO count and requirement', () => {
    useGameStore.mockReturnValue({
      qsos: 2500000n,
      totalQsosEarned: 2500000n,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    expect(wrapper.text()).toContain('2.50M/50.0M QSOs')
  })

  it('shows upgrade button when not maxed', () => {
    useGameStore.mockReturnValue({
      qsos: 100n,
      totalQsosEarned: 100n,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    expect(wrapper.text()).toContain('Upgrade to General')
  })

  it('disables upgrade button when cannot afford', () => {
    useGameStore.mockReturnValue({
      qsos: 100n,
      totalQsosEarned: 100n,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    const upgradeButton = wrapper.find('button')
    expect(upgradeButton.attributes('disabled')).toBeDefined()
  })

  it('enables upgrade button when total earned meets requirement', () => {
    useGameStore.mockReturnValue({
      qsos: 0n, // Spent all QSOs on factories
      totalQsosEarned: 50000000n, // But earned enough lifetime
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    const upgradeButton = wrapper.find('button')
    expect(upgradeButton.attributes('disabled')).toBeUndefined()
  })

  it('emits upgrade event on button click', async () => {
    useGameStore.mockReturnValue({
      qsos: 0n,
      totalQsosEarned: 50000000n,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    const upgradeButton = wrapper.find('button')
    await upgradeButton.trigger('click')

    expect(wrapper.emitted('upgrade')).toBeTruthy()
  })

  it('allows upgrade to General with sufficient total QSOs earned', async () => {
    const store = {
      qsos: 1000000n, // Current balance
      totalQsosEarned: 50000000n, // Lifetime earned (meets requirement)
      licenseLevel: 1,
    }
    useGameStore.mockReturnValue(store)

    const wrapper = mount(LicensePanel)

    const upgradeButton = wrapper.find('button')
    await upgradeButton.trigger('click')

    expect(wrapper.emitted('upgrade')).toBeTruthy()
  })

  it('allows upgrade to Extra with sufficient total QSOs earned', async () => {
    const store = {
      qsos: 10000000n,
      totalQsosEarned: 500000000n,
      licenseLevel: 2,
    }
    useGameStore.mockReturnValue(store)

    const wrapper = mount(LicensePanel)

    const upgradeButton = wrapper.find('button')
    await upgradeButton.trigger('click')

    expect(wrapper.emitted('upgrade')).toBeTruthy()
  })

  it('does not show upgrade button when Extra (maxed)', () => {
    useGameStore.mockReturnValue({
      qsos: 10000n,
      totalQsosEarned: 1000000000n,
      licenseLevel: 3,
    })

    const wrapper = mount(LicensePanel)

    const upgradeButton = wrapper.find('button')
    expect(upgradeButton.exists()).toBe(false)
  })

  it('shows correct license names for all levels', () => {
    const testCases = [
      { level: 1, expected: 'Technician' },
      { level: 2, expected: 'General' },
      { level: 3, expected: 'Extra' },
    ]

    testCases.forEach(({ level, expected }) => {
      useGameStore.mockReturnValue({
        qsos: 100n,
        totalQsosEarned: 100n,
        licenseLevel: level,
      })

      const wrapper = mount(LicensePanel)
      expect(wrapper.text()).toContain(expected)
    })
  })

  it('shows correct requirements for Extra upgrade', () => {
    useGameStore.mockReturnValue({
      qsos: 10000000n,
      totalQsosEarned: 250000000n,
      licenseLevel: 2,
    })

    const wrapper = mount(LicensePanel)

    expect(wrapper.text()).toContain('Progress to Extra')
    expect(wrapper.text()).toContain('250M/500M QSOs')
  })
})
