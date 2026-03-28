# CW Clicker Upgrade Rail Design (v1.3.0)

## Goal

Move upgrade purchasing to a single Cookie Clicker-inspired upgrade rail in the Store tab, while
simplifying factory cards to focus on factory buying.

## Scope

- Add a centralized `UpgradeRail` component above the factory list in `Store`.
- Show a first-row priority set of 5 upgrade icons.
- Prioritize row content as: affordable upgrades, then available-not-affordable upgrades, then recently
  purchased upgrades.
- Add inline expandable grid for additional upgrades.
- Use compact number formatting (`1.01M` style) everywhere in rail UI.
- Keep current prestige system unchanged for this release (flat tap bonus).

## Out of Scope

- Heavenly Chips-style prestige redesign.
- Economy rebalance of factory/upgrade costs.
- New upgrade content.
- New animation systems beyond existing hover/tap feedback.

## UX Direction

- Cookie Clicker-inspired, but consistent with CW Clicker's terminal visual language.
- Upgrade interactions:
  - Desktop: hover tooltip with details.
  - Mobile: tap opens detail sheet.
- Purchase model:
  - Affordable upgrades can be bought directly from the detail sheet CTA.
  - Desktop only: affordable upgrades may also be bought via an inline quick-buy control in tooltip.
  - Non-affordable upgrades show disabled CTA with formatted cost gap.
- Expand model:
  - In-place expansion under the first row.
  - Scrollable grid for additional upgrades.

## Layout

Store tab structure:

1. Store title + QSO totals/rate
2. Upgrade rail
3. Simplified factory cards

ASCII wireframe:

```text
┌──────────────────────────────────────────────────────────────┐
| Factory Store                      12.34M QSOs               |
| Producing: 321.0 QSOs/sec                                   |
├──────────────────────────────────────────────────────────────┤
| Upgrade Rail                                    [Expand v]   |
| [⚡][⚡][⚡][⚡][⚡]   (Affordable first)                      |
| hover: tooltip | tap: details                                |
|--------------------------------------------------------------|
| (expanded)                                                   |
| Ready to Buy:      [⚡][⚡][⚡]                               |
| Almost There:      [⚡][⚡][⚡][⚡]                            |
| Recently Purchased:[⚡][⚡]                                  |
| (scrollable area)                                            |
└──────────────────────────────────────────────────────────────┘

┌────────────────────────── Factory Card ──────────────────────┐
| icon + name + tier + owned                                   |
| output/sec + per-unit breakdown                              |
| cost                                                 [Buy]    |
└───────────────────────────────────────────────────────────────┘
```

## Component Design

### New: `src/components/UpgradeRail.vue`

Responsibilities:

- Build derived upgrade view model from `UPGRADES` and store state.
- Compute priority row (max 5).
- Render expandable grouped grid.
- Handle tooltip/sheet state and purchase actions.
- Emit accessibility semantics for icon buttons and expansion controls.

Suggested internal computed groups:

- `readyToBuy`
- `almostThere`
- `recentlyPurchased`
- `lockedByThreshold` (always rendered as collapsed-by-default group)

### Updated: `src/App.vue`

- Insert `UpgradeRail` in Store tab above factory list.
- Keep existing store totals and rates.

### Updated: `src/components/FactoryCard.vue`

- Remove per-card upgrade teaser and purchased-upgrades accordion.
- Keep:
  - unlock masking behavior
  - production numbers
  - cost and buy action

## Data and Ranking Rules

For each upgrade, compute:

- `isPurchased`
- `isAvailable` (threshold met and not purchased)
- `isAffordable` (`store.qsos >= baseCost`)
- `costDelta` (`max(baseCost - qsos, 0)`)

Priority row fill algorithm (up to 5):

1. `isAvailable && isAffordable` sorted by lowest `baseCost`
2. `isAvailable && !isAffordable` sorted by lowest `costDelta`
3. recently purchased sorted descending by purchase time

Deterministic tie-breakers for all sorts (including recent fallback and timestamp ties):

1. lower `baseCost`
2. factory order by `FACTORIES` index
3. upgrade order by `UPGRADES` index

## Store State Additions

To support "recently purchased" ordering globally, add:

- `upgradePurchaseMeta` (map `id -> purchasedAt` timestamp in milliseconds)

Persisted shape example:

```json
{
  "upgradePurchaseMeta": {
    "elmer-upgrade-0": 1760000000000,
    "qrq-protocol-upgrade-1": 1760000005300
  }
}
```

Save/load impact:

- Persist the chosen metadata in save payload.
- Backward compatible default when field is missing.
- Legacy saves without `upgradePurchaseMeta` use deterministic fallback for "recently purchased":
  - treat purchased upgrades as `purchasedAt = 0`
  - apply standard tie-breakers (baseCost, FACTORIES index, UPGRADES index)

## Formatting Rules

- Use existing formatting utilities for all displayed numbers.
- No raw large integers in user-visible rail UI.
- Cost/rate/shortfall all shown in compact format.

## Accessibility

- Icon tiles are `button` elements, not generic divs.
- `aria-label` includes name + status + cost.
- Expand toggle uses `aria-expanded` and `aria-controls`.
- Mobile details sheet supports keyboard close (`Escape`) and proper focus management.
- Tooltip-only details are never the sole source of information.

## Interaction Matrix

### Desktop

- Hover icon: show tooltip (name, flavor, multiplier, threshold, formatted cost).
- Click icon:
  - affordable -> open details and allow buy
  - not affordable -> open details with disabled CTA and formatted shortfall

Post-purchase behavior (desktop):

- Successful purchase from details CTA closes details panel and returns focus to the purchased icon tile.
- Tooltip does not contain a buy control in v1.3.0.

### Mobile

- Tap icon:
  - always opens detail sheet
  - buy occurs only by tapping sheet CTA (no single-tap direct buy)

## Store API Contract

`UpgradeRail` reads:

- `store.qsos`
- `store.factoryCounts`
- `store.purchasedUpgrades`
- `store.upgradePurchaseMeta`

`UpgradeRail` writes:

- `store.buyUpgrade(upgradeId)` (single canonical purchase path)
- `store.save()` (or purchase action internally persists; implementation may keep save centralized in store)

Store purchase responsibilities:

- `buyUpgrade` remains the canonical mutation point.
- On successful purchase, store updates both:
  - `purchasedUpgrades`
  - `upgradePurchaseMeta[upgradeId] = Date.now()`

## Testing Strategy

### New tests

- `src/components/__tests__/UpgradeRail.test.js`
  - priority ordering (affordable, almost-there, recent)
  - 5-icon row cap
  - expand/collapse and grouped rendering
  - buy flow updates ordering/state
  - compact number formatting appears
  - a11y attributes (`aria-expanded`, button labels)

### Updated tests

- `src/components/__tests__/FactoryCard.test.js`
  - remove assertions for removed embedded-upgrade sections
  - keep production/cost/buy/locked behavior coverage

- `src/stores/__tests__/save.test.js`
  - add persistence tests for new purchase metadata
  - verify backward compatibility when metadata absent

## Versioning

This work targets `v1.3.0`.

Required version updates during implementation:

- `VERSION` -> `1.3.0`
- `src/stores/game.js` -> `GAME_VERSION = '1.3.0'`

## Acceptance Criteria

- Upgrade purchases are available in one centralized rail in Store tab.
- First row shows up to 5 icons prioritized by affordable-first policy.
- Expanded in-place grid is available for additional upgrades.
- Factory cards no longer contain upgrade-specific teaser/history UI.
- Upgrade numbers in rail/details use compact formatting.
- Existing factory buy flow remains intact.
- Test suite passes with new/updated coverage.
