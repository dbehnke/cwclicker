# Progressive Unlock & Upgrade Rework Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Cookie Clicker-style progressive factory unlock, factory cost rebalance, and upgrade system rework (upgrades start at 5x, unlock at 5 factories).

**Architecture:** Three parallel systems:

1. **Progressive Unlock**: Factories unlock within license tier based on total QSOs earned (not affordability)
2. **Cost Rebalance**: Early factories cost 1.5-2x more, late factories cost 3-5x more to create Cookie Clicker difficulty curve
3. **Upgrade Rework**: First upgrade unlocks at 5 factories, multipliers start at 5x and double (5, 10, 20, 40...)

**Tech Stack:** Vue 3, Pinia, Vitest

---

## Context

### Cookie Clicker Research Findings

**Upgrade System:**

- Building upgrades unlock based on **total cookies baked** (lifetime), not current cookies
- First upgrade cost = `building.basePrice × 10`
- Each subsequent tier costs `5×` more: `10, 50, 250, 1250...`
- Each upgrade **doubles** efficiency (×2 multiplier)
- Formula: `cost = basePrice × 10 × 5^(tier-1)`
- Example with Grandma (basePrice=100):
  - Tier 1: 1,000 cookies
  - Tier 2: 5,000 cookies
  - Tier 3: 25,000 cookies
  - Tier 4: 125,000 cookies

**Factory Unlock:**

- All factories visible but show "???" until you can afford the first one
- Unlock is based purely on **affordability** (current cookies >= price)

**Cost Scaling:**

- Cookie Clicker uses flat 15% per building: `price = basePrice × 1.15^owned`
- CW Clicker currently uses tiered scaling: 10%, 7%, 5%, 3%
- Cookie Clicker has MUCH steeper cost escalation in late game (20,000:1 cost-to-CPS ratio vs CW Clicker's 1,000:1)

### CW Clicker Current State

**Upgrade Thresholds:**

```javascript
const UPGRADE_THRESHOLDS = [1, 5, 25, 50, 100, 150, 200, 250, 300]
```

- First upgrade at 1 factory (user wants 5)

**Upgrade Multiplier:**

```javascript
multiplier: 2 // Always doubles
```

- First upgrade gives ×2 (user wants ×5 to start)

**Upgrade Cost Formula:**

```javascript
const cost = BigInt(factoryBaseCost) * 10n ** BigInt(index + 1)
// Tier 1: baseCost × 10
// Tier 2: baseCost × 100
// Tier 3: baseCost × 1000
```

---

## File Structure

```
src/
├── stores/game.js                    # Add totalLifetimeQSOs, factory unlock tracking
├── components/FactoryCard.vue         # Add "???" locked state for factories
├── components/FactoryList.vue       # Filter factories by progressive unlock
├── constants/factories.js            # Add unlockThreshold to each factory, update baseCosts
├── constants/upgrades.js             # New thresholds [5, 10, 25, 50...], new multiplier formula
└── constants/game.js                 # Add new cost scaling constants if needed
```

---

## Chunk 1: Version Bump

**Files:**

- Modify: `VERSION`

- [ ] **Step 1: Update version to v1.2.0**

```bash
echo "1.2.0" > VERSION
```

- [ ] **Step 2: Commit**

```bash
git add VERSION
git commit -m "chore: bump version to v1.2.0"
```

---

## Chunk 2: Add totalLifetimeQSOs Tracking

**Files:**

- Modify: `src/stores/game.js`

The progressive unlock system needs to track total QSOs earned (lifetime), separate from current balance. This mirrors Cookie Clicker's "cookies baked all time" approach.

- [ ] **Step 1: Add test for totalLifetimeQSOs tracking**

```javascript
// In src/stores/__tests__/game.test.js
describe('totalLifetimeQSOs tracking', () => {
  it('tracks total QSOs earned separately from current balance', () => {
    const store = useGameStore()
    store.qsos = 100
    store.totalLifetimeQSOs = 1000

    // Spending QSOs doesn't affect total earned
    store.qsos -= 50
    expect(store.qsos).toBe(50)
    expect(store.totalLifetimeQSOs).toBe(1000)

    // Earning QSOs increases total
    store.qsos += 100
    expect(store.qsos).toBe(150)
    expect(store.totalLifetimeQSOs).toBe(1100)
  })

  it('initializes totalLifetimeQSOs from save data', () => {
    // When loading a save, totalLifetimeQSOs should be preserved
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="game.test.js" -v`
Expected: FAIL - totalLifetimeQSOs not defined

- [ ] **Step 3: Add totalLifetimeQSOs to game state**

In `src/stores/game.js`, add:

```javascript
// In the store state
totalLifetimeQSOs: 0n,

// In loadState() - migrate from old saves
if (typeof state.totalLifetimeQSOs === 'undefined') {
  // Legacy save - use qsos as the lifetime total
  state.totalLifetimeQSOs = BigInt(state.qsos || 0)
}

// In saveState() - ensure totalLifetimeQSOs is saved
state.totalLifetimeQSOs = store.totalLifetimeQSOs
```

- [ ] **Step 4: Ensure totalLifetimeQSOs updates on QSO gain**

In `tick()` or wherever QSOs are earned:

```javascript
// After adding QSOs to current balance
store.totalLifetimeQSOs += earnedQSOs
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="game.test.js" -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/stores/game.js src/stores/__tests__/game.test.js
git commit -m "feat: track totalLifetimeQSOs for progressive unlock"
```

---

## Chunk 3: Add unlockThreshold to Factories

**Files:**

- Modify: `src/constants/factories.js`

Each factory needs an `unlockThreshold` - the total QSOs required to unlock it. This is based on the factory's base cost.

**New base costs (proposed):**

| Tier | Factory                 | Current Cost | New Cost      | Ratio |
| ---- | ----------------------- | ------------ | ------------- | ----- |
| 1    | Elmer                   | 10           | 15            | 1.5x  |
| 1    | QRQ Protocol            | 15           | 25            | 1.67x |
| 1    | Straight Key            | 50           | 75            | 1.5x  |
| 2    | Paddle Key              | 500          | 1,000         | 2x    |
| 2    | CPO                     | 1,000        | 2,000         | 2x    |
| 2    | Dipole                  | 2,000        | 4,000         | 2x    |
| 3    | Bug Catcher             | 3,500        | 7,000         | 2x    |
| 3    | Vertical                | 5,000        | 10,000        | 2x    |
| 3    | Linear Amp              | 10,000       | 20,000        | 2x    |
| 4    | Beam                    | 25,000       | 75,000        | 3x    |
| 4    | Ragchew Net             | 35,000       | 100,000       | 2.86x |
| 4    | Tower                   | 50,000       | 150,000       | 3x    |
| 5    | Contest                 | 100,000      | 400,000       | 4x    |
| 5    | Paper Logbook           | 175,000      | 700,000       | 4x    |
| 5    | DX Cluster              | 250,000      | 1,000,000     | 4x    |
| 6    | Hamfest                 | 500,000      | 3,000,000     | 6x    |
| 6    | QSL Printer             | 1,000,000    | 6,000,000     | 6x    |
| 6    | Remote Station          | 2,500,000    | 15,000,000    | 6x    |
| 7    | FT8 Bot                 | 5,000,000    | 40,000,000    | 8x    |
| 7    | Digital Interface       | 7,500,000    | 60,000,000    | 8x    |
| 7    | Cluster Network         | 10,000,000   | 80,000,000    | 8x    |
| 8    | EME                     | 25,000,000   | 200,000,000   | 8x    |
| 8    | Lunar Repeater          | 37,500,000   | 300,000,000   | 8x    |
| 8    | Satellite Constellation | 50,000,000   | 400,000,000   | 8x    |
| 9    | Ionospheric Mod         | 100,000,000  | 1,000,000,000 | 10x   |
| 9    | Time Travel DX          | 250,000,000  | 2,500,000,000 | 10x   |
| 9    | Alternate Dimension     | 500,000,000  | 5,000,000,000 | 10x   |

**Unlock thresholds** (based on tier):

- Tier 1: 0 QSOs (always unlocked)
- Tier 2: 100 QSOs
- Tier 3: 1,000 QSOs
- Tier 4: 10,000 QSOs
- Tier 5: 100,000 QSOs
- Tier 6: 1,000,000 QSOs
- Tier 7: 10,000,000 QSOs
- Tier 8: 100,000,000 QSOs
- Tier 9: 1,000,000,000 QSOs

- [ ] **Step 1: Create updated factory definitions with unlock thresholds**

In `src/constants/factories.js`:

```javascript
/**
 * Tier unlock thresholds (total QSOs earned to unlock)
 * Maps tier number to minimum total QSOs required
 */
export const TIER_UNLOCK_THRESHOLDS = {
  1: 0n, // Always available
  2: 100n, // After 100 QSOs
  3: 1_000n, // After 1,000 QSOs
  4: 10_000n, // After 10K QSOs
  5: 100_000n, // After 100K QSOs
  6: 1_000_000n, // After 1M QSOs
  7: 10_000_000n, // After 10M QSOs
  8: 100_000_000n, // After 100M QSOs
  9: 1_000_000_000n, // After 1B QSOs
}

/**
 * Factory base costs (rebalanced for Cookie Clicker difficulty curve)
 * Higher tiers increase more aggressively
 */
const REBALANCED_COSTS = {
  // Tier 1: 1.5-1.67x increase
  elmer: 15,
  'qrq-protocol': 25,
  'straight-key': 75,
  // Tier 2: 2x increase
  'paddle-key': 1_000,
  'code-practice-oscillator': 2_000,
  'dipole-antenna': 4_000,
  // Tier 3: 2x increase
  'bug-catcher': 7_000,
  'vertical-antenna': 10_000,
  'linear-amplifier': 20_000,
  // Tier 4: 2.86-3x increase
  'beam-antenna': 75_000,
  'ragchew-net': 100_000,
  'tower-installation': 150_000,
  // Tier 5: 4x increase
  'contest-station': 400_000,
  'paper-logbook': 700_000,
  'dx-cluster': 1_000_000,
  // Tier 6: 6x increase
  hamfest: 3_000_000,
  'qsl-card-printer': 6_000_000,
  'remote-station': 15_000_000,
  // Tier 7: 8x increase
  'ft8-bot': 40_000_000,
  'digital-interface': 60_000_000,
  'cluster-spotting-network': 80_000_000,
  // Tier 8: 8x increase
  'eme-moonbounce': 200_000_000,
  'lunar-repeater': 300_000_000,
  'satellite-constellation': 400_000_000,
  // Tier 9: 10x increase
  'ionospheric-modification': 1_000_000_000,
  'time-travel-dx': 2_500_000_000,
  'alternate-dimension-dxcc': 5_000_000_000,
}
```

- [ ] **Step 2: Update factory definitions to include unlockThreshold**

For each factory, add `unlockThreshold: TIER_UNLOCK_THRESHOLDS[tier]`:

```javascript
{
  id: 'elmer',
  name: 'Elmer',
  icon: '👨‍🏫',
  baseCost: 15,  // Rebalanced from 10
  qsosPerSecond: 0.1,
  tier: 1,
  unlockThreshold: TIER_UNLOCK_THRESHOLDS[1],  // 0
  description: "Old timers who help you get on the air...",
},
```

- [ ] **Step 3: Write test for factory unlock thresholds**

```javascript
// In src/constants/__tests__/factories.test.js
describe('factory unlock thresholds', () => {
  it('all factories have unlockThreshold', () => {
    FACTORIES.forEach(factory => {
      expect(factory).toHaveProperty('unlockThreshold')
      expect(typeof factory.unlockThreshold).toBe('bigint')
    })
  })

  it('tier 1 factories unlock at 0', () => {
    const tier1 = FACTORIES.filter(f => f.tier === 1)
    tier1.forEach(factory => {
      expect(factory.unlockThreshold).toBe(0n)
    })
  })

  it('higher tiers require more QSOs to unlock', () => {
    for (let tier = 2; tier <= 9; tier++) {
      const factories = FACTORIES.filter(f => f.tier === tier)
      const prevThreshold = TIER_UNLOCK_THRESHOLDS[tier - 1]
      factories.forEach(factory => {
        expect(factory.unlockThreshold).toBeGreaterThan(prevThreshold)
      })
    }
  })

  it('unlock thresholds match TIER_UNLOCK_THRESHOLDS', () => {
    for (let tier = 1; tier <= 9; tier++) {
      const factories = FACTORIES.filter(f => f.tier === tier)
      factories.forEach(factory => {
        expect(factory.unlockThreshold).toBe(TIER_UNLOCK_THRESHOLDS[tier])
      })
    }
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="factories.test.js" -v`
Expected: FAIL - unlockThreshold not defined

- [ ] **Step 5: Update all factory definitions with unlockThreshold and new baseCost**

This is the bulk of the work. Update each factory in `src/constants/factories.js`:

1. Change `baseCost` to new rebalanced cost
2. Add `unlockThreshold: TIER_UNLOCK_THRESHOLDS[tier]`

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="factories.test.js" -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/constants/factories.js src/constants/__tests__/factories.test.js
git commit -m "feat: add unlock thresholds and rebalance factory costs

- Add unlockThreshold to each factory based on tier
- Rebalance costs: 1.5x-10x increases by tier
- Tier 1: 15-75 (was 10-50)
- Tier 2: 1K-4K (was 500-2K)
- Tier 3: 7K-20K (was 3.5K-10K)
- Tier 4: 75K-150K (was 25K-50K)
- Tier 5: 400K-1M (was 100K-250K)
- Tier 6: 3M-15M (was 500K-2.5M)
- Tier 7: 40M-80M (was 5M-10M)
- Tier 8: 200M-400M (was 25M-50M)
- Tier 9: 1B-5B (was 100M-500M)"
```

---

## Chunk 4: Progressive Unlock Logic in Store

**Files:**

- Modify: `src/stores/game.js`

The store needs to:

1. Track which factories have been unlocked (based on totalLifetimeQSOs)
2. Provide a method to check if a factory is unlocked
3. Handle unlocking factories when threshold is reached

- [ ] **Step 1: Write test for progressive unlock logic**

```javascript
// In src/stores/__tests__/game.test.js
describe('progressive factory unlock', () => {
  it('factory is locked when totalLifetimeQSOs < unlockThreshold', () => {
    const store = useGameStore()
    store.totalLifetimeQSOs = 50n
    const dipole = FACTORIES.find(f => f.id === 'dipole-antenna')
    expect(dipole.unlockThreshold).toBe(100n)
    expect(store.isFactoryUnlocked('dipole-antenna')).toBe(false)
  })

  it('factory unlocks when totalLifetimeQSOs >= unlockThreshold', () => {
    const store = useGameStore()
    store.totalLifetimeQSOs = 150n
    expect(store.isFactoryUnlocked('dipole-antenna')).toBe(true)
  })

  it('tier 1 factories always unlocked', () => {
    const store = useGameStore()
    store.totalLifetimeQSOs = 0n
    const elmer = FACTORIES.find(f => f.id === 'elmer')
    expect(store.isFactoryUnlocked('elmer')).toBe(true)
  })

  it('unlocked factories persist in save data', () => {
    // Test save/load preserves unlocked state
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="game.test.js" -v`
Expected: FAIL - isFactoryUnlocked not defined

- [ ] **Step 3: Add unlockedFactories state and isFactoryUnlocked method**

In `src/stores/game.js`:

```javascript
// In state
unlockedFactories: {},  // { factoryId: true } - tracks which factories have been unlocked

// New getter
isFactoryUnlocked: (state) => (factoryId) => {
  const factory = FACTORIES.find(f => f.id === factoryId)
  if (!factory) return false
  // Tier 1 always unlocked
  if (factory.tier === 1) return true
  // Check if previously unlocked
  if (state.unlockedFactories[factoryId]) return true
  // Check if current QSOs meet threshold
  return state.totalLifetimeQSOs >= factory.unlockThreshold
}
```

- [ ] **Step 4: Add check to buyFactory to unlock when threshold met**

In `buyFactory()`:

```javascript
// When buying a factory for the first time, mark it as unlocked
if (!state.factoryCounts[factoryId] || state.factoryCounts[factoryId] === 0) {
  state.unlockedFactories[factoryId] = true
}
```

- [ ] **Step 5: Add migration for unlockedFactories in loadState**

```javascript
// Migrate legacy saves that don't have unlockedFactories
if (typeof state.unlockedFactories === 'undefined') {
  state.unlockedFactories = {}
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="game.test.js" -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/stores/game.js
git commit -m "feat: add progressive factory unlock based on totalLifetimeQSOs"
```

---

## Chunk 5: Update FactoryCard for Locked State

**Files:**

- Modify: `src/components/FactoryCard.vue`

Factories below unlock threshold should show:

- Name as "???"
- Cost visible
- "Locked" message showing QSOs needed

- [ ] **Step 1: Add locked state to FactoryCard props**

```javascript
const props = defineProps({
  factory: { type: Object, required: true },
  isLocked: { type: Boolean, default: false }, // NEW
})
```

- [ ] **Step 2: Add display logic for locked factories**

```javascript
const displayName = computed(() => {
  if (props.isLocked) return '???'
  return props.factory.name
})

const qsosNeeded = computed(() => {
  if (!props.isLocked) return 0n
  return props.factory.unlockThreshold - store.totalLifetimeQSOs
})
```

- [ ] **Step 3: Update template to show locked state**

In the template, wrap the factory content:

```vue
<div v-if="isLocked" class="opacity-50">
  <div class="text-gray-400">Locked - Need {{ formatNumber(qsosNeeded) }} more QSOs</div>
</div>
<div v-else>
  <!-- Existing factory card content -->
</div>
```

- [ ] **Step 4: Write/update tests for locked state**

```javascript
// In src/components/__tests__/FactoryCard.test.js
it('shows locked state when factory is not unlocked', () => {
  const factory = FACTORIES[0] // elmer
  const wrapper = mountWithState(FactoryCard, {
    props: { factory, isLocked: true },
  })
  expect(wrapper.text()).toContain('???')
  expect(wrapper.text()).toContain('Locked')
})

it('shows factory name when unlocked', () => {
  const factory = FACTORIES[0]
  const wrapper = mountWithState(FactoryCard, {
    props: { factory, isLocked: false },
  })
  expect(wrapper.text()).toContain('Elmer')
})
```

- [ ] **Step 5: Run tests**

Run: `npm test -- --testPathPattern="FactoryCard.test.js" -v`
Expected: PASS (after updating mocks)

- [ ] **Step 6: Commit**

```bash
git add src/components/FactoryCard.vue src/components/__tests__/FactoryCard.test.js
git commit -m "feat: add locked state UI to FactoryCard"
```

---

## Chunk 6: Update FactoryList for Progressive Unlock

**Files:**

- Modify: `src/components/FactoryList.vue`

FactoryList needs to filter factories:

1. By license tier (maxTier)
2. By progressive unlock (totalLifetimeQSOs >= unlockThreshold)

Factories below threshold should still appear but be marked as locked.

- [ ] **Step 1: Update availableFactories computed**

```javascript
const availableFactories = computed(() => {
  const maxTier = getMaxTierForLicense(store.licenseLevel)
  return FACTORIES.filter(f => {
    // Within license tier
    if (f.tier > maxTier) return false
    // Is unlocked (either tier 1, or meets unlock threshold)
    return store.isFactoryUnlocked(f.id)
  })
})

// Also compute locked factories (within tier but not yet unlocked)
const lockedFactories = computed(() => {
  const maxTier = getMaxTierForLicense(store.licenseLevel)
  return FACTORIES.filter(f => {
    if (f.tier > maxTier) return false
    return !store.isFactoryUnlocked(f.id)
  })
})
```

- [ ] **Step 2: Pass isLocked prop to FactoryCard**

```vue
<FactoryCard
  v-for="factory in availableFactories"
  :key="factory.id"
  :factory="factory"
  :is-locked="false"
  @buy="handleBuy"
/>

<!-- Separate section for locked factories if needed -->
<FactoryCard
  v-for="factory in lockedFactories"
  :key="factory.id"
  :factory="factory"
  :is-locked="true"
  @buy="handleBuy"
/>
```

- [ ] **Step 3: Write tests**

```javascript
// In src/components/__tests__/FactoryList.test.js
describe('progressive unlock', () => {
  it('shows tier 1 factories when totalLifetimeQSOs is 0', () => {
    const wrapper = mountWithState(FactoryList, {
      totalLifetimeQSOs: 0n,
      licenseLevel: 1,
    })
    const elmer = FACTORIES.find(f => f.id === 'elmer')
    expect(wrapper.text()).toContain('Elmer')
  })

  it('hides tier 2 factories when totalLifetimeQSOs < 100', () => {
    const wrapper = mountWithState(FactoryList, {
      totalLifetimeQSOs: 50n,
      licenseLevel: 2, // Has access to tier 2
    })
    const dipole = FACTORIES.find(f => f.id === 'dipole-antenna')
    // Dipole requires 100 QSOs, should not be visible
    expect(wrapper.text()).not.toContain('Dipole Antenna')
  })

  it('shows tier 2 factories when totalLifetimeQSOs >= 100', () => {
    const wrapper = mountWithState(FactoryList, {
      totalLifetimeQSOs: 150n,
      licenseLevel: 2,
    })
    expect(wrapper.text()).toContain('Dipole Antenna')
  })
})
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --testPathPattern="FactoryList.test.js" -v`
Expected: FAIL (need to update mocks and implementation)

- [ ] **Step 5: Update FactoryList.vue implementation**

- [ ] **Step 6: Run tests again**

Run: `npm test -- --testPathPattern="FactoryList.test.js" -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/FactoryList.vue src/components/__tests__/FactoryList.test.js
git commit -m "feat: implement progressive factory unlock in FactoryList"
```

---

## Chunk 7: Rework Upgrade System

**Files:**

- Modify: `src/constants/upgrades.js`

Changes needed:

1. First threshold at 5 factories (not 1)
2. Multipliers start at 5 and double: 5, 10, 20, 40, 80, 160, 320, 640, 1280

**New thresholds:** `[5, 10, 25, 50, 100, 150, 200, 250, 300]`

**New multiplier formula:**

```javascript
// multiplier: 5 × 2^(index)
// index 0: 5 × 2^0 = 5
// index 1: 5 × 2^1 = 10
// index 2: 5 × 2^2 = 20
// etc.
```

- [ ] **Step 1: Update UPGRADE_THRESHOLDS**

```javascript
// Cookie Clicker-style upgrade thresholds: 5, 10, 25, 50, 100, 150, 200, 250, 300...
// First upgrade at 5 factories (matches user's requirement)
const UPGRADE_THRESHOLDS = [5, 10, 25, 50, 100, 150, 200, 250, 300]
```

- [ ] **Step 2: Update generateUpgrades function**

```javascript
function generateUpgrades(
  factoryId,
  _factoryName,
  factoryBaseCost,
  upgradeNames,
  upgradeDescriptions,
  icon = '⚡'
) {
  return UPGRADE_THRESHOLDS.slice(0, upgradeNames.length).map((threshold, index) => {
    // Cost formula: baseCost × 50 × 2^(index)
    // Tier 1: baseCost × 50
    // Tier 2: baseCost × 100
    // Tier 3: baseCost × 200
    // etc.
    const cost = BigInt(factoryBaseCost) * 50n * 2n ** BigInt(index)

    return {
      id: `${factoryId}-upgrade-${index}`,
      factoryId: factoryId,
      name: upgradeNames[index],
      threshold: threshold,
      baseCost: cost,
      multiplier: 5 * Math.pow(2, index), // 5, 10, 20, 40, 80...
      description: upgradeDescriptions[index],
      icon: icon,
    }
  })
}
```

- [ ] **Step 3: Write tests for new upgrade system**

```javascript
// In src/stores/__tests__/factories.test.js or upgrades.test.js
describe('upgrade multipliers', () => {
  it('first upgrade has 5x multiplier', () => {
    const elmerUpgrades = UPGRADES.filter(u => u.factoryId === 'elmer')
    expect(elmerUpgrades[0].multiplier).toBe(5)
  })

  it('multipliers double each tier', () => {
    const elmerUpgrades = UPGRADES.filter(u => u.factoryId === 'elmer')
    for (let i = 1; i < elmerUpgrades.length; i++) {
      expect(elmerUpgrades[i].multiplier).toBe(elmerUpgrades[i - 1].multiplier * 2)
    }
  })

  it('upgrade costs double each tier', () => {
    const elmerUpgrades = UPGRADES.filter(u => u.factoryId === 'elmer')
    for (let i = 1; i < elmerUpgrades.length; i++) {
      expect(elmerUpgrades[i].baseCost).toBe(elmerUpgrades[i - 1].baseCost * 2n)
    }
  })

  it('first upgrade requires 5 factories', () => {
    const elmerUpgrades = UPGRADES.filter(u => u.factoryId === 'elmer')
    expect(elmerUpgrades[0].threshold).toBe(5)
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="upgrades" -v`
Expected: FAIL - thresholds and multipliers don't match

- [ ] **Step 5: Update upgrade definitions**

Change all 27 factory upgrade arrays to have 9 entries (matching 9 thresholds)

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="upgrades" -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/constants/upgrades.js
git commit -m "feat: rework upgrade system - start at 5x, unlock at 5 factories

- First upgrade requires 5 factories (was 1)
- Multipliers start at 5 and double: 5, 10, 20, 40, 80, 160, 320, 640, 1280
- Cost formula: baseCost × 50 × 2^(tier-1)"
```

---

## Chunk 8: Update Store Upgrade Logic

**Files:**

- Modify: `src/stores/game.js`

The store's `getUpgradeMultiplier` needs to work with the new multiplier values.

- [ ] **Step 1: Verify getUpgradeMultiplier works with new multipliers**

```javascript
// Test that getUpgradeMultiplier correctly applies the multiplier
it('getUpgradeMultiplier returns 5 for first upgrade', () => {
  const store = useGameStore()
  // With 5 elmer factories and first upgrade purchased...
  store.factoryCounts.elmer = 5
  store.purchasedUpgrades.add('elmer-upgrade-0')

  expect(store.getUpgradeMultiplier('elmer')).toBe(5)
})
```

- [ ] **Step 2: Run existing upgrade tests**

Run: `npm test -- --testPathPattern="game.test.js" -v`
Expected: PASS (no changes needed if getUpgradeMultiplier already uses stored multiplier)

- [ ] **Step 3: Commit if changes needed**

```bash
git add src/stores/game.js  # if changes needed
git commit -m "fix: ensure upgrade multiplier works with new 5x starting value"
```

---

## Chunk 9: Full Integration Test

**Files:**

- Test all changes together

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: ALL TESTS PASS

- [ ] **Step 2: Test progressive unlock flow manually**

Using Playwright:

1. Start fresh game
2. Verify tier 1 factories visible
3. Verify tier 2 factories hidden (show as "???")
4. Earn 100 QSOs
5. Verify dipole antenna unlocks

- [ ] **Step 3: Test upgrade flow**

1. Buy 5 factories
2. Verify first upgrade available
3. Buy upgrade
4. Verify multiplier is 5x

- [ ] **Step 4: Test cost rebalance**

1. Verify early factories cost more (Elmer should be 15, not 10)
2. Verify late factories cost much more (FT8 Bot should be 40M, not 5M)

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "test: add integration tests for progressive unlock and upgrade rework"
```

---

## Summary of Changes

| File                             | Change                                                               |
| -------------------------------- | -------------------------------------------------------------------- |
| `VERSION`                        | 1.1.7 → 1.2.0                                                        |
| `src/stores/game.js`             | Add totalLifetimeQSOs, unlockedFactories tracking, isFactoryUnlocked |
| `src/constants/factories.js`     | Add unlockThreshold, rebalance baseCosts                             |
| `src/constants/upgrades.js`      | New thresholds [5,10,25...], new multipliers 5×2^n                   |
| `src/components/FactoryCard.vue` | Add locked state UI                                                  |
| `src/components/FactoryList.vue` | Filter by progressive unlock                                         |
| Tests                            | Update all affected tests                                            |

---

## Future Considerations (Not in Scope)

### Prestige/Ascension System

When implementing prestige:

- Add `prestigeLevel` and `prestigePoints`
- Add prestige upgrade shop to spend points on:
  - Cost reduction (e.g., -10% factory costs)
  - CPS multiplier
  - Unlock shortcuts
- Factory costs should have a prestige discount factor

### Save Data Migration

When releasing v1.2.0:

- Existing saves need migration for `unlockedFactories`
- `totalLifetimeQSOs` should be initialized from current `qsos`
- Upgrade purchases are preserved (multiplier change may affect output)

---

## Cookie Clicker Reference Formulas

**Upgrade Cost (Cookie Clicker):**

```
cost = building.basePrice × 10 × 5^(tier-1)
```

Example (Grandma, base=100):

- Tier 1: 1,000
- Tier 2: 5,000
- Tier 3: 25,000
- Tier 4: 125,000

**Upgrade Effect:**

- Each tier doubles (×2) building efficiency

**Factory Cost:**

```
cost = basePrice × 1.15^owned
```

**Our New Formulas:**

```
Upgrade cost = baseCost × 50 × 2^(tier-1)
Upgrade multiplier = 5 × 2^(tier-1)
Factory unlock = totalLifetimeQSOs >= unlockThreshold
```
