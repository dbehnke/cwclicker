# Tier Batch Visibility Fix (v1.2.2) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure General and Extra factory batches stay hidden until license unlock (`licenseLevel >= 2/3`), while preserving next-unlock reveal progression and owned-factory visibility invariants.

**Architecture:** Keep visibility logic store-centric in `src/stores/game.js` by introducing explicit license-batch gates and enforcing them in both reveal progression and `isFactoryUnlocked`. Keep `FactoryList` dumb by rendering only what the store reports as unlocked. Trigger reveal progression immediately on license upgrades so newly eligible batch progression appears without requiring a later QSO tick.

**Tech Stack:** Vue 3 (Composition API), Pinia, Vitest, npm, Playwright MCP (manual confirmation)

---

## File Structure and Responsibilities

- Modify: `src/stores/game.js`
  - Add explicit batch unlock computed state (`isGeneralUnlocked`, `isExtraUnlocked`)
  - Gate reveal progression candidate pool by current license range
  - Gate `isFactoryUnlocked` for unowned factories outside current license range
- Modify: `src/App.vue`
  - Trigger `revealAffordableFactories()` immediately after successful license upgrade
- Modify: `src/components/FactoryList.vue`
  - Remove component fallback tier filtering; rely exclusively on `store.isFactoryUnlocked`
- Modify: `src/stores/__tests__/factories.test.js`
  - Add license boundary + leaked revealed-ID regressions
- Modify: `src/components/__tests__/FactoryList.test.js`
  - Update tests to store-predicate contract; remove tier-fallback assumptions
- Modify: `src/components/__tests__/App.test.js`
  - Add assertions that license upgrades trigger store reveal call
- Modify: `src/stores/__tests__/save.test.js`
  - Add load regression for pre-revealed locked IDs remaining hidden when unowned
- Modify: `VERSION`
  - Bump release version to `1.2.2`

Use @superpowers/test-driven-development and keep RED-GREEN-REFACTOR discipline per task.

---

## Chunk 1: Store License Gates and Reveal Progression

**Files:**

- Modify: `src/stores/game.js`
- Test: `src/stores/__tests__/factories.test.js`

### Task 1: Add failing store tests for license-batch boundaries (RED)

- [ ] **Step 1: Add failing test for license 1 never exposing tier 4+ unowned factories**

```javascript
it('keeps unowned tier-4+ factories locked at license level 1 even with high QSOs', () => {
  const store = useGameStore()
  store.licenseLevel = 1
  store.qsos = 10_000_000_000n

  store.revealAffordableFactories()

  expect(store.isFactoryUnlocked('beam-antenna')).toBe(false)
  expect(store.isFactoryUnlocked('ft8-bot')).toBe(false)
})
```

- [ ] **Step 2: Add one failing transition test (`2 -> 3`) for tier-7 gate**

```javascript
it('keeps tier-7 locked at license 2 and unlocks it after transition to license 3', () => {
  const store = useGameStore()
  store.licenseLevel = 2
  store.qsos = 10_000_000_000n

  store.revealAffordableFactories()

  expect(store.isFactoryUnlocked('ft8-bot')).toBe(false)

  store.licenseLevel = 3
  store.revealAffordableFactories()

  expect(store.isFactoryUnlocked('ft8-bot')).toBe(true)
})
```

- [ ] **Step 3: Add failing transition test for sequential reveal in newly unlocked General batch**

```javascript
it('reveals newly unlocked batch sequentially and affordability-gated after license upgrade', () => {
  const store = useGameStore()
  const generalFactories = FACTORIES.filter(f => f.tier >= 4 && f.tier <= 6)
  const firstGeneral = generalFactories[0]

  expect(firstGeneral).toBeDefined()
  const firstGeneralCost = store.getFactoryCost(firstGeneral.id, 0)
  const blockedGeneral = generalFactories.find(
    f => store.getFactoryCost(f.id, 0) > firstGeneralCost
  )
  expect(blockedGeneral).toBeDefined()

  store.licenseLevel = 1
  store.qsos = firstGeneralCost

  store.revealAffordableFactories()

  // Before upgrade: tier 4 is still gated
  expect(store.isFactoryUnlocked(firstGeneral.id)).toBe(false)

  store.licenseLevel = 2
  store.revealAffordableFactories()

  expect(store.isFactoryUnlocked(firstGeneral.id)).toBe(true)
  expect(store.isFactoryUnlocked(blockedGeneral.id)).toBe(false)
})
```

- [ ] **Step 4: Add failing transition test for sequential reveal in Extra batch (`2 -> 3`)**

```javascript
it('reveals extra batch sequentially after upgrade to license 3', () => {
  const store = useGameStore()
  const extraFactories = FACTORIES.filter(f => f.tier >= 7 && f.tier <= 9)
  const firstExtra = extraFactories[0]

  expect(firstExtra).toBeDefined()
  const firstExtraCost = store.getFactoryCost(firstExtra.id, 0)
  const blockedExtra = extraFactories.find(f => store.getFactoryCost(f.id, 0) > firstExtraCost)
  expect(blockedExtra).toBeDefined()

  store.licenseLevel = 2
  store.qsos = firstExtraCost

  store.revealAffordableFactories()
  expect(store.isFactoryUnlocked(firstExtra.id)).toBe(false)

  store.licenseLevel = 3
  store.revealAffordableFactories()

  expect(store.isFactoryUnlocked(firstExtra.id)).toBe(true)
  expect(store.isFactoryUnlocked(blockedExtra.id)).toBe(false)
})
```

- [ ] **Step 5: Add failing test for pre-revealed locked IDs remaining hidden unless owned**

```javascript
it('hides pre-revealed locked-batch factories when unowned but keeps owned visible', () => {
  const store = useGameStore()
  store.licenseLevel = 1
  store.revealedFactoryIds = new Set(['beam-antenna'])

  expect(store.isFactoryUnlocked('beam-antenna')).toBe(false)

  store.factoryCounts['beam-antenna'] = 1
  expect(store.isFactoryUnlocked('beam-antenna')).toBe(true)
})
```

- [ ] **Step 6: Run tests to confirm failure**

Run: `npx vitest run src/stores/__tests__/factories.test.js`
Expected: FAIL in new tests (license gating not implemented yet).

### Task 2: Implement minimal store gating logic (GREEN)

- [ ] **Step 1: Add explicit batch unlock computed state in `game.js`**

```javascript
const maxUnlockedTier = computed(() => getMaxTierForLicense(licenseLevel.value))
```

- [ ] **Step 2: Gate reveal candidate pool in `revealAffordableFactories()` using canonical `FACTORIES` order**

```javascript
const revealPool = FACTORIES.filter(factory => factory.tier <= maxUnlockedTier.value)

while (true) {
  const nextFactory = revealPool.find(factory => !nextRevealed.has(factory.id))
  if (!nextFactory) break
  // existing affordability check logic unchanged
}
```

- [ ] **Step 3: Gate `isFactoryUnlocked()` for unowned factories outside current license range**

```javascript
if (!factory) {
  return false
}

if ((factoryCounts.value[factoryId] || 0) > 0) {
  return true
}

if (factory.tier > maxUnlockedTier.value) {
  return false
}

return revealedFactoryIds.value.has(factoryId)
```

- [ ] **Step 4: Keep existing unknown-ID guard and owned-factory-first behavior unchanged**

Do not regress the current invalid-ID behavior (`false`) or owned-factory visibility invariant.

- [ ] **Step 5: Run targeted tests to verify pass**

Run: `npx vitest run src/stores/__tests__/factories.test.js`
Expected: PASS for new and existing factory tests.

- [ ] **Step 6: Commit chunk 1**

```bash
git add src/stores/game.js src/stores/__tests__/factories.test.js
git commit -m "fix(v1.2.2): gate factory unlocks by license batch"
```

---

## Chunk 2: License Upgrade Trigger + Component Contract

**Files:**

- Modify: `src/App.vue`
- Modify: `src/components/FactoryList.vue`
- Test: `src/components/__tests__/App.test.js`
- Test: `src/components/__tests__/FactoryList.test.js`

### Task 3: Add failing UI contract tests first (RED)

- [ ] **Step 1: Add failing App test that successful license upgrade triggers reveal**

```javascript
it('calls revealAffordableFactories after upgrading to General', async () => {
  const revealAffordableFactories = vi.fn()
  const save = vi.fn()
  useGameStore.mockReturnValue({
    // existing fields...
    licenseLevel: 1,
    totalQsosEarned: 50_000_000n,
    revealAffordableFactories,
    save,
  })

  const wrapper = shallowMount(App, {
    /* existing stubs */
  })
  await wrapper.findComponent({ name: 'LicensePanel' }).vm.$emit('upgrade')

  expect(revealAffordableFactories).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Replace FactoryList fallback tests with store-predicate tests**

```javascript
it('renders only factories returned as unlocked by store predicate', () => {
  useGameStore.mockReturnValue({
    // existing fields...
    isFactoryUnlocked: id => ['elmer', 'straight-key'].includes(id),
  })

  const wrapper = mount(FactoryList)
  expect(wrapper.text()).toContain('Elmer')
  expect(wrapper.text()).toContain('Straight Key')
  expect(wrapper.text()).not.toContain('Beam Antenna')
})
```

- [ ] **Step 3: Add failing FactoryList regression for pre-revealed locked IDs not shown**

```javascript
it('does not render locked-batch revealed IDs unless store unlock predicate allows it', () => {
  useGameStore.mockReturnValue({
    // existing fields...
    isFactoryUnlocked: id => id === 'elmer',
  })

  const wrapper = mount(FactoryList)
  expect(wrapper.text()).toContain('Elmer')
  expect(wrapper.text()).not.toContain('Beam Antenna')
})
```

- [ ] **Step 4: Run component tests to confirm failure**

Run: `npx vitest run src/components/__tests__/App.test.js src/components/__tests__/FactoryList.test.js`
Expected: FAIL due to missing reveal trigger and old fallback assumptions.

### Task 4: Implement component contract changes (GREEN)

- [ ] **Step 1: Update `handleLicenseUpgrade` in `App.vue`**

```javascript
const handleLicenseUpgrade = () => {
  if (store.licenseLevel === 1 && store.totalQsosEarned >= 50_000_000n) {
    store.licenseLevel = 2
    store.revealAffordableFactories()
    store.save()
  } else if (store.licenseLevel === 2 && store.totalQsosEarned >= 500_000_000n) {
    store.licenseLevel = 3
    store.revealAffordableFactories()
    store.save()
  }
}
```

- [ ] **Step 2: Remove fallback tier filtering from `FactoryList.vue`**

```javascript
const availableFactories = computed(() => {
  if (typeof store.isFactoryUnlocked !== 'function') {
    return []
  }
  return FACTORIES.filter(factory => store.isFactoryUnlocked(factory.id))
})
```

Also remove unused `getMaxTierForLicense` import.

- [ ] **Step 3: Run updated component tests**

Run: `npx vitest run src/components/__tests__/App.test.js src/components/__tests__/FactoryList.test.js`
Expected: PASS.

- [ ] **Step 4: Commit chunk 2**

```bash
git add src/App.vue src/components/FactoryList.vue src/components/__tests__/App.test.js src/components/__tests__/FactoryList.test.js
git commit -m "fix(v1.2.2): enforce store-owned factory visibility contract"
```

---

## Chunk 3: Save Regression + Version Bump + Verification

**Files:**

- Modify: `src/stores/__tests__/save.test.js`
- Modify: `VERSION`
- Modify: `src/stores/game.js` (GAME_VERSION)

### Task 5: Add save/load regression test for pre-revealed locked IDs (RED)

- [ ] **Step 1: Add failing test in `save.test.js`**

```javascript
it('keeps pre-revealed locked-batch factories hidden after load when unowned', () => {
  const saveData = {
    version: '1.2.1',
    qsos: '1000000000',
    qsosThisRun: '1000000000',
    totalQsosEarned: '1000000000',
    licenseLevel: 1,
    factoryCounts: {},
    revealedFactoryIds: ['beam-antenna'],
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))

  const store = useGameStore()
  store.load()

  expect(store.isFactoryUnlocked('beam-antenna')).toBe(false)
})
```

- [ ] **Step 2: Run test to verify behavior**

Run: `npx vitest run src/stores/__tests__/save.test.js`
Expected: PASS once chunk 1 logic is merged; if failing, debug and minimally fix.

### Task 6: Version bump to v1.2.2

- [ ] **Step 1: Update `VERSION` to `1.2.2`**
- [ ] **Step 2: Update `GAME_VERSION` in `src/stores/game.js` to `1.2.2`**

### Task 7: Full verification and Playwright confirmation

- [ ] **Step 1: Run full automated tests**

Run: `npm test -- --run`
Expected: PASS (all tests green).

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS with generated `dist/` output.

- [ ] **Step 3: Manual Playwright confirmation (ASCII checklist)**

```text
[ ] Fresh state (clear localStorage key cw-keyer-game)
[ ] Technician: no General/Extra factory names visible
[ ] Upgrade to General: General names visible, Extra still hidden
[ ] Upgrade to Extra: Extra names visible
```

- [ ] **Step 4: Commit chunk 3**

```bash
git add src/stores/__tests__/save.test.js src/stores/game.js VERSION
git commit -m "chore(v1.2.2): bump version and lock tier-batch visibility"
```

---

## Final Integration Checks

- [ ] Run: `git status --short --branch`
  - Expected: clean working tree on feature branch.
- [ ] If preparing PR, include validation notes:
  - Store-level gate logic for license batches
  - App upgrade trigger runs reveal immediately
  - Component relies solely on store unlock predicate
  - Version bump (`VERSION` and `GAME_VERSION`) both at `1.2.2`
