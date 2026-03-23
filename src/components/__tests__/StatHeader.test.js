import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import StatHeader from '../StatHeader.vue'
import { useGameStore } from '../../stores/game'

vi.mock('../../stores/game', () => ({
  useGameStore: vi.fn(),
}))

describe('StatHeader.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows prestige level, bonus, points, and progress', () => {
    useGameStore.mockReturnValue({
      qsos: 123456789012n,
      prestigeLevel: 12n,
      prestigePoints: 12n,
      eligiblePrestigeLevel: 12n,
      prestigeMultiplier: 1.6,
    })

    const wrapper = mount(StatHeader)

    expect(wrapper.text()).toContain('Prestige Level 12')
    expect(wrapper.text()).toContain('+60% bonus')
    expect(wrapper.text()).toContain('Prestige Points: 12')
    expect(wrapper.text()).toContain('Next level: 2.20T QSOs')
  })
})
