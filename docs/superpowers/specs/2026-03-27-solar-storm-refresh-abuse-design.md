# Solar Storm Refresh Abuse Fix Design

## Summary

Players can currently avoid an active Solar Storm penalty by refreshing at the right time.
For v1.1.9, reloading during an active storm will re-apply a full storm duration from load time.

## Goals

- Prevent refresh/reload from bypassing Solar Storm penalties.
- Keep implementation small and store-centric.
- Preserve existing save key compatibility (`cw-keyer-game`).

## Non-Goals

- No full anti-cheat system or session fingerprinting.
- No changes to storm chance, multiplier, or base duration values.
- No gameplay rebalance outside this exploit fix.

## Current Behavior

- `lotteryState` is persisted with `isSolarStorm` and `solarStormEndTime`.
- `load()` restores storm state if `now < solarStormEndTime`.
- Under certain save/reload timing windows, players can avoid or reduce storm impact.

## Proposed Behavior

When loading saved state:

- If saved state indicates an active storm (`isSolarStorm === true` and `now < solarStormEndTime`),
  force a full reset:
  - `isSolarStorm = true`
  - `solarStormEndTime = now + SOLAR_STORM_DURATION_MS`
- If storm is expired at load time (`now >= solarStormEndTime`), normalize to inactive:
  - `isSolarStorm = false`
  - `solarStormEndTime = 0`

This intentionally penalizes reload during active storms by restarting the full duration.

## Design Details

### Store Changes

Primary file: `src/stores/game.js`

- Update the `load()` lottery restoration block to compute `hadActiveStormAtLoad` from the saved
  state and current `now`.
- If `hadActiveStormAtLoad` is true, overwrite restored storm end time with
  `now + SOLAR_STORM_DURATION_MS`.
- If `now >= saved solarStormEndTime`, clear storm state to inactive values.
- Keep positive bonus restoration logic unchanged.

### UI Changes

- No functional UI changes required.
- Optional copy update in settings/help text to make the rule explicit: reloading during an active
  storm restarts its full duration.

## Data and Compatibility

- Local storage key remains `cw-keyer-game`.
- No schema migration required for this change.
- Existing saves continue to load.

## Error Handling

- Continue existing defensive load behavior for malformed saves.
- Add explicit storm normalization for malformed/partial data:
  - If `isSolarStorm` is not a boolean, treat as `false`.
  - If `solarStormEndTime` is not a finite number, treat as `0`.
  - Only apply reset logic when normalized values indicate an active storm at load.

## Test Plan

### Unit Tests

Update/add tests in `src/stores/__tests__/save.test.js`:

1. Active saved storm reloads as full-duration storm from `now`.
2. Expired saved storm remains inactive after load.
3. Non-storm lottery states are unchanged by this rule.
4. Boundary case `now === solarStormEndTime` loads as expired/inactive.
5. Malformed storm fields (`isSolarStorm` non-boolean, `solarStormEndTime` non-finite) fall back
   safely to inactive behavior.

Update/add test in `src/stores/__tests__/game.test.js`:

6. Multiplier after load-time reset remains `SOLAR_STORM_MULTIPLIER` while storm is active.

### Manual Verification

1. Trigger a Solar Storm.
2. Refresh immediately.
3. Confirm storm remains active and timer is reset to near-full duration.
4. Confirm factory output reflects storm multiplier until timer expires.

## Risks and Mitigations

- Risk: Players who accidentally refresh during a storm are penalized.
  - Mitigation: This is intentional per product decision; document in UI copy.
- Risk: Timer-based tests may be flaky.
  - Mitigation: Use fake timers and bounded time assertions.

## Rollout

- Ship with v1.1.9 bugfix work.
- No migration or one-time backfill needed.
