# CW Clicker Upgrade Expansion Design

## Goal

Give every factory family a full 9-step upgrade chain so progression is consistent across the entire game.

## Scope

- Add 9 upgrades for each of the remaining 21 factory families.
- Match the existing upgrade structure used by the original 6 families.
- Keep thresholds, multipliers, and UI behavior consistent.
- Add tests that verify coverage and spot-check a few upgrade sets.

## Approach

- Use the existing `generateUpgrades()` helper and the same 9-threshold ladder.
- Preserve the current `2x` multiplier pattern and cookie-clicker-style scaling.
- Write upgrade names and joke descriptions to match each factory’s theme.

## Factories To Add

- `bug-catcher`, `vertical-antenna`, `linear-amplifier`
- `beam-antenna`, `ragchew-net`, `tower-installation`
- `contest-station`, `paper-logbook`, `dx-cluster`
- `hamfest`, `qsl-card-printer`, `remote-station`
- `ft8-bot`, `digital-interface`, `cluster-spotting-network`
- `eme-moonbounce`, `lunar-repeater`, `satellite-constellation`
- `ionospheric-modification`, `time-travel-dx`, `alternate-dimension-dxcc`

## Reference Pattern

Use the existing `ELMER_UPGRADES` block in `src/constants/upgrades.js` as the template:

```js
const ELMER_UPGRADES = generateUpgrades(
  'elmer',
  'Elmer',
  10,
  [
    'Rusty Soldering Iron',
    'Coffee-Stained Logbook',
    ...
  ],
  [
    "It's seen better days, but it still works.",
    'Every contact since 1987, meticulously recorded.',
    ...
  ],
  '⚡'
)
```

## Icon Policy

- Keep the existing upgrade icon convention: use `'⚡'` for the new families as well.

## Description Style

- Use the same satirical, self-deprecating ham-radio humor already present in the file.
- Keep descriptions short enough to read inside the compact upgrade teaser on mobile.

## Files to Update

- `src/constants/upgrades.js`
- `src/stores/__tests__/factories.test.js`
- `src/components/__tests__/FactoryCard.test.js` (only if needed for new coverage assumptions)

## Acceptance Criteria

- Every factory family in `src/constants/factories.js` has at least one upgrade.
- Each factory family has a complete 9-upgrade chain.
- `FactoryCard` shows next upgrades and purchased upgrades for all factory families.
- The full test suite still passes.
