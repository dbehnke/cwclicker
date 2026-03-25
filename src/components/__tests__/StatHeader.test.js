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
    // eligiblePrestigeLevel=12 → nextThreshold = 1B * 13^3 = 2.197T → "2.20T"
    useGameStore.mockReturnValue({
      qsos: 123456789012n,
      totalQsosEarned: 2_000_000_000_000n,
      prestigeLevel: 11n,
      prestigePoints: 12n,
      eligiblePrestigeLevel: 12n,
      prestigeMultiplier: 1.6,
    })

    const wrapper = mount(StatHeader)

    expect(wrapper.text()).toContain('Prestige Level 11')
    expect(wrapper.text()).toContain('Eligible for 12')
    expect(wrapper.text()).toContain('+60% bonus')
    expect(wrapper.text()).toContain('Prestige Points: 12')
    expect(wrapper.text()).toContain('Next level: 2.20T QSOs')

    const progress = wrapper.find('[role="progressbar"]')
    expect(progress.exists()).toBe(true)
    expect(progress.attributes('aria-valuemin')).toBe('0')
    expect(progress.attributes('aria-valuemax')).toBe('100')
    // Progress between 1.728T and 2.197T with 2T earned: ~58%
    expect(Number(progress.attributes('aria-valuenow'))).toBeGreaterThan(0)
    expect(Number(progress.attributes('aria-valuenow'))).toBeLessThan(100)
  })

  it('progress bar is not stuck at full when player has far exceeded prestigeLevel threshold but has not reset', () => {
    // Regression: user has 47.8B QSOs, prestigeLevel=0 (no resets), eligiblePrestigeLevel=3
    // currentThreshold(3)=27B, nextThreshold(4)=64B → progress ≈ 56%, NOT 100%
    useGameStore.mockReturnValue({
      qsos: 47_800_000_000n,
      totalQsosEarned: 47_800_000_000n,
      prestigeLevel: 0n,
      prestigePoints: 0n,
      eligiblePrestigeLevel: 3n,
      prestigeMultiplier: 1.0,
    })

    const wrapper = mount(StatHeader)

    const progress = wrapper.find('[role="progressbar"]')
    expect(progress.exists()).toBe(true)
    const valuenow = Number(progress.attributes('aria-valuenow'))
    expect(valuenow).toBeGreaterThan(0)
    expect(valuenow).toBeLessThan(100)
    expect(wrapper.text()).toContain('Next level: 64.0B QSOs')
  })
})
