# CW Clicker Upgrade Expansion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every factory family a full 9-upgrade progression chain so the game’s upgrade system is consistent across all 27 factories.

**Architecture:** Keep the existing upgrade generation pattern intact. Extend `src/constants/upgrades.js` with new `generateUpgrades()` blocks for the remaining factory families, preserve the existing `2x` multiplier and threshold ladder, and verify that `FactoryCard` can surface upgrades for every factory. This is a content expansion, not a gameplay refactor.

**Tech Stack:** Vue 3, Pinia, Vitest, plain JavaScript constants

---

## File Map

- `src/constants/upgrades.js` — add the missing upgrade chains
- `src/stores/__tests__/factories.test.js` — verify every factory family now has upgrade coverage
- `src/components/__tests__/FactoryCard.test.js` — spot-check that the card can show next upgrades for missing families

---

## Chunk 1: Add Remaining Upgrade Chains

**Files:**
- Modify: `src/constants/upgrades.js`

### Task 1: Extend the upgrade constants

- [ ] **Step 0: Verify the reference pattern**

Review the existing `ELMER_UPGRADES` block in `src/constants/upgrades.js` and mirror the same `generateUpgrades()` structure for every new factory family.

- [ ] **Step 1: Write the missing upgrade sets**

Add 9 upgrades each for:
- `bug-catcher`, `vertical-antenna`, `linear-amplifier`
- `beam-antenna`, `ragchew-net`, `tower-installation`
- `contest-station`, `paper-logbook`, `dx-cluster`
- `hamfest`, `qsl-card-printer`, `remote-station`
- `ft8-bot`, `digital-interface`, `cluster-spotting-network`
- `eme-moonbounce`, `lunar-repeater`, `satellite-constellation`
- `ionospheric-modification`, `time-travel-dx`, `alternate-dimension-dxcc`

Use the same 9-threshold ladder, the same `2x` multiplier, and the same `'⚡'` upgrade icon for consistency.

- [ ] **Step 2: Run a focused verification of the constants**

Run: `npx vitest run src/stores/__tests__/factories.test.js`
Expected: existing tests still pass once coverage is updated in the next chunk.

- [ ] **Step 3: Commit**

```bash
git add src/constants/upgrades.js
git commit -m "feat: add upgrades for remaining factories"
```

---

## Chunk 2: Update Coverage Tests

**Files:**
- Modify: `src/stores/__tests__/factories.test.js`
- Modify: `src/components/__tests__/FactoryCard.test.js` if a spot-check is needed

### Task 2: Verify upgrade coverage for all factories

- [ ] **Step 1: Write the failing coverage test**

Add a test that iterates over every factory in `FACTORIES` and asserts `getAvailableUpgrades(factory.id, 0)` is not used as a proxy for missing data by checking that each factory has at least one upgrade definition in `UPGRADES`.

Add a spot-check that one of the newly covered factories (for example, `bug-catcher`) exposes a valid `nextUpgrade` when the owned count reaches its first threshold.

- [ ] **Step 2: Run the tests to verify they fail before the constant update lands**

Run: `npx vitest run src/stores/__tests__/factories.test.js src/components/__tests__/FactoryCard.test.js`
Expected: fail on the missing factories before the constants are expanded.

- [ ] **Step 3: Keep the test minimal**

Use the current store helpers and `FactoryCard` behavior; do not introduce new helper APIs.

- [ ] **Step 4: Run the focused tests**

Run: `npx vitest run src/stores/__tests__/factories.test.js src/components/__tests__/FactoryCard.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/__tests__/factories.test.js src/components/__tests__/FactoryCard.test.js
git commit -m "test: cover upgrade availability for all factories"
```

---

## Chunk 3: Final Verification

**Files:**
- All modified files from prior chunks

### Task 3: Verify the full expansion

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: PASS with no regressions.

- [ ] **Step 2: Inspect the diff**

Run: `git diff --stat`
Expected: Only upgrade constants and targeted tests changed.

- [ ] **Step 3: Stop and hand off for review**

Do not merge or push until the full suite is green and the upgrade expansion is reviewed.
