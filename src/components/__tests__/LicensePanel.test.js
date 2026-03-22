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
      qsos: 100,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    expect(wrapper.text()).toContain('Technician')
  })

  it('shows progress to next license', () => {
    useGameStore.mockReturnValue({
      qsos: 250,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    expect(wrapper.text()).toContain('Progress to General')
  })

  it('shows correct QSO count and requirement', () => {
    useGameStore.mockReturnValue({
      qsos: 2500,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    expect(wrapper.text()).toContain('2500/10000 QSOs')
  })

  it('shows upgrade button when not maxed', () => {
    useGameStore.mockReturnValue({
      qsos: 100,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    expect(wrapper.text()).toContain('Upgrade to General')
  })

  it('disables upgrade button when cannot afford', () => {
    useGameStore.mockReturnValue({
      qsos: 100,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    const upgradeButton = wrapper.find('button')
    expect(upgradeButton.attributes('disabled')).toBeDefined()
  })

  it('enables upgrade button when can afford', () => {
    useGameStore.mockReturnValue({
      qsos: 10000,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    const upgradeButton = wrapper.find('button')
    expect(upgradeButton.attributes('disabled')).toBeUndefined()
  })

  it('emits upgrade event on button click', async () => {
    useGameStore.mockReturnValue({
      qsos: 10000,
      licenseLevel: 1,
    })

    const wrapper = mount(LicensePanel)

    const upgradeButton = wrapper.find('button')
    await upgradeButton.trigger('click')

    expect(wrapper.emitted('upgrade')).toBeTruthy()
  })

  it('deducts QSOs when upgrading to General', async () => {
    const store = {
      qsos: 10000n,
      licenseLevel: 1,
    }
    useGameStore.mockReturnValue(store)

    const wrapper = mount(LicensePanel)

    const upgradeButton = wrapper.find('button')
    await upgradeButton.trigger('click')

    expect(wrapper.emitted('upgrade')).toBeTruthy()
  })

  it('deducts QSOs when upgrading to Extra', async () => {
    const store = {
      qsos: 100000n,
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
      qsos: 10000,
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
        qsos: 100,
        licenseLevel: level,
      })

      const wrapper = mount(LicensePanel)
      expect(wrapper.text()).toContain(expected)
    })
  })

  it('shows correct requirements for General upgrade', () => {
    useGameStore.mockReturnValue({
      qsos: 25000,
      licenseLevel: 2,
    })

    const wrapper = mount(LicensePanel)

    expect(wrapper.text()).toContain('Progress to Extra')
    expect(wrapper.text()).toContain('25000/100000 QSOs')
  })
})
