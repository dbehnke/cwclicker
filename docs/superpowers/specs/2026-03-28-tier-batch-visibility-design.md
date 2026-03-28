# Tier Batch Visibility Fix Design (v1.2.2)

## Summary

Fix a progression bug where General and Extra factory items can appear before their license tier is
unlocked. The expected rule is license-gated visibility by batch:

- Technician (license 1): only technician batch visible (tiers 1-3)
- General (license 2): technician + general batches visible (tiers 1-6)
- Extra (license 3): all batches visible (tiers 1-9)

Within any visible batch, the existing "next unlockable only" reveal behavior remains in place.

## Goals

- Prevent General and Extra factories from appearing before their license class is unlocked.
- Keep unlock behavior store-owned and deterministic.
- Preserve owned-factory visibility safeguards.
- Ship as version `1.2.2`.

## Non-Goals

- No rebalance of factory costs, output, or tier thresholds.
- No redesign of license progression costs.
- No storage key changes (`cw-keyer-game` remains unchanged).

## Current Problem

`FactoryList` currently falls back to direct tier filtering (`tier <= getMaxTierForLicense`) when
`isFactoryUnlocked` is unavailable. This allows UI-level visibility behavior to diverge from
store-owned reveal progression and can expose items from future batches prematurely.

## Product Rules (Approved)

1. "General unlocked" means `licenseLevel >= 2`.
2. "Extra unlocked" means `licenseLevel >= 3`.
3. Locked batches are hidden entirely for unowned factories; owned factories remain visible.
4. For unlocked batches, reveal progression still shows only what is unlocked/owned, not all items.

## Proposed Design

### 1) Explicit Batch Unlock State in Store

Primary file: `src/stores/game.js`

Add explicit computed gates derived from `licenseLevel`:

- `isGeneralUnlocked = licenseLevel >= 2`
- `isExtraUnlocked = licenseLevel >= 3`

Use these gates to compute the maximum revealable tier for the current state.

### 2) License-Gated Reveal Candidate Selection

Update `revealAffordableFactories()` so it selects the next unrevealed factory from the
license-gated pool instead of the full `FACTORIES` list.

The license-gated candidate pool order must be deterministic and match canonical `FACTORIES` order
(single source of truth for progression sequence).

Flow:

```text
[QSOs gained OR licenseLevel changes OR save load] -> revealAffordableFactories()
                          |
                          v
                 [license-gated pool]
                          |
                          v
               [first unrevealed in pool]
                          |
                     affordable?
                     /        \
                   yes        no
                   |           |
            reveal + continue  stop
```

This guarantees General/Extra factories cannot be revealed early.

- Must be invoked immediately after license upgrades so newly eligible batch progression is
  revealed without requiring an extra QSO tick.
- Mandatory trigger call sites:
  - the license upgrade action in `src/App.vue` (`handleUpgradeLicense`) after incrementing
    `store.licenseLevel`
  - store load/hydration path in `src/stores/game.js` after restoring persisted state

### 3) Unlock Predicate Owns Visibility Contract

Update `isFactoryUnlocked(factoryId)` to be license-aware for unowned factories:

- If owned, always return `true` (existing safety invariant).
- If unowned and outside the currently unlocked license batch, return `false`.
- Otherwise, return whether the factory is in `revealedFactoryIds`.

### 4) FactoryList Uses Store Unlock Predicate Only

Primary file: `src/components/FactoryList.vue`

- Remove fallback tier filtering.
- Render from `FACTORIES.filter(factory => store.isFactoryUnlocked(factory.id))`.

This avoids split business logic across UI/store and prevents future visibility drift.

## Expected Behavior (ASCII Mockups)

```text
Technician (license 1)
----------------------
Visible cards:
[QRQ Protocol] [Elmer] ... (only unlocked/owned in tiers 1-3)

Hidden entirely:
General batch (tiers 4-6)
Extra batch   (tiers 7-9)


General (license 2)
-------------------
Visible cards:
[...tech progression...] + [next unlocked/owned in tiers 4-6]

Hidden entirely:
Extra batch (tiers 7-9)


Extra (license 3)
-----------------
Visible cards:
[...tech/general progression...] + [next unlocked/owned in tiers 7-9]
```

## Data and Compatibility

- Keep localStorage key `cw-keyer-game` unchanged.
- No save schema migration required; behavior is computed from existing state.
- Existing saves remain valid.
- If `revealedFactoryIds` contains unowned factories from locked batches (from pre-fix saves),
  they remain hidden until the corresponding license gate unlocks.
- Owned factories remain visible regardless of license gate (backward-compatibility invariant).

## Test Plan

### Store Tests

Update `src/stores/__tests__/factories.test.js` with regressions:

1. License 1 with large QSOs does not unlock tier 4+ factories.
2. License 2 can unlock up to tier 6 but not tier 7+.
3. License 3 can unlock tier 7+ factories.
4. Owned factory remains unlocked regardless of tier gate.
5. On license transition (`1 -> 2`, `2 -> 3`), `revealAffordableFactories` runs and reveals only
   sequentially affordable factories in the newly unlocked batch.
6. If `revealedFactoryIds` contains tier 4+ while license is 1, `isFactoryUnlocked` returns false
   for unowned items and true for owned items.

### Component Tests

Update `src/components/__tests__/FactoryList.test.js`:

1. Remove/replace assertions based on component-side `tier <= maxTier` fallback.
2. Assert rendered list follows `isFactoryUnlocked` predicate.
3. Add regression coverage for hidden General/Extra before license upgrade.
4. Factories present in `revealedFactoryIds` but outside current license gate are not rendered
   unless owned.

### Playwright Confirmation

Manual E2E confirmation via Playwright:

1. Fresh save, Technician state: confirm no General/Extra names are visible.
2. Upgrade to General: confirm General appears; Extra remains hidden.
3. Upgrade to Extra: confirm Extra appears.

## Rollout and Versioning

For v1.2.2 release, bump both version sources together:

- `VERSION` -> `1.2.2`
- `src/stores/game.js` (`GAME_VERSION`) -> `1.2.2`

## Risks and Mitigations

- Risk: removing fallback could hide everything if store contract breaks.
  - Mitigation: add component tests that mock and assert `isFactoryUnlocked` usage.
- Risk: reveal progression regression around boundary tiers.
  - Mitigation: targeted store tests for license 1/2/3 boundaries.
