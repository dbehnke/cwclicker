# Factory & License System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Implement all 21 factories across 3 license tiers with cost scaling, multi-buy, and passive QSO generation.

**Architecture:** Vue 3 + Pinia with tier-based cost scaling (10%/7%/5%), requestAnimationFrame game loop, and localStorage persistence.

---

## Overview

This plan implements the complete factory and license system for Phase 2+3:
- 21 factories with tier-based scaling
- Technician → General → Extra license progression
- Multi-buy system (×1/×10/×100/MAX) unlocked at 10 factories
- Passive QSO generation via game loop
- Full save/load integration

---

## Task 1: Create Factory Data Constants

**Files:**
- Create: `src/constants/factories.js`
- Create: `src/constants/__tests__/factories.test.js`

**Steps:**

1. Create test file with basic validation tests
2. Create factories.js with all 21 factory definitions
3. Run tests to verify
4. Commit

**Factory Structure:**
```javascript
{
  id: 'elmer',
  name: 'Elmer', 
  baseCost: 10,
  qsosPerSecond: 0.1,
  tier: 1,
  description: 'Old timers who help you get on the air.'
}
```

**Tiers:**
- Tiers 1-2 (Technician): 10% cost scaling per factory
- Tiers 3-5 (General): 7% cost scaling per factory  
- Tiers 6-7 (Extra): 5% cost scaling per factory

---

## Task 2: Extend Game Store

**Files:**
- Modify: `src/stores/game.js`
- Create: `src/stores/__tests__/factories.test.js`

**Add to store:**
- `licenseLevel` ref (starts at 1)
- `factoryCounts` object ref
- `getFactoryCost(factoryId, owned)` - calculates cost with tier multiplier
- `buyFactory(factoryId, count)` - purchases factories, deducts QSOs
- `getTotalQSOsPerSecond()` - sums all factory production
- `getBulkCost(factoryId, count)` - calculates bulk purchase with 5% discount

**Cost Formula:**
```javascript
const multiplier = factory.tier <= 2 ? 1.1 : factory.tier <= 5 ? 1.07 : 1.05
return Math.floor(factory.baseCost * Math.pow(multiplier, owned))
```

---

## Task 3: Create FactoryCard Component

**Files:**
- Create: `src/components/FactoryCard.vue`
- Create: `src/components/__tests__/FactoryCard.test.js`

**Features:**
- Display factory name, description, QSOs/sec
- Show current cost (calculated from store)
- Buy button (disabled if can't afford)
- Styled with terminal-green theme

---

## Task 4: Create MultiBuyPanel Component

**Files:**
- Create: `src/components/MultiBuyPanel.vue`

**Features:**
- Shows only when 10+ total factories owned
- ×1, ×10, ×100, MAX buttons
- Disabled state when can't afford
- Uses `getBulkCost()` for pricing

---

## Task 5: Create LicensePanel Component

**Files:**
- Create: `src/components/LicensePanel.vue`

**Features:**
- Shows current license (Technician/General/Extra)
- Progress bar to next license
- Upgrade button (disabled until requirements met)
- Requirements: 500 QSOs for General, 5000 for Extra

---

## Task 6: Create FactoryList Component

**Files:**
- Create: `src/components/FactoryList.vue`

**Features:**
- Filters factories by current license tier
- Renders FactoryCard for each available factory
- Shows MultiBuyPanel when unlocked
- Displays total QSOs/sec

---

## Task 7: Create GameLoop Component

**Files:**
- Create: `src/components/GameLoop.vue`

**Features:**
- Uses requestAnimationFrame
- Calls `getTotalQSOsPerSecond()` each tick
- Adds QSOs to store
- Triggers auto-save every 30 seconds

---

## Task 8: Update App.vue

**Files:**
- Modify: `src/App.vue`

**Changes:**
- Add LicensePanel
- Add FactoryList
- Add GameLoop component
- Wire up license upgrade handler

---

## Task 9: Add Save/Load System

**Files:**
- Modify: `src/stores/game.js`
- Modify: `src/main.js`

**Add:**
- `save()` - persists to localStorage
- `load()` - restores from localStorage
- Call `load()` on app startup
- Auto-save every 30 seconds in GameLoop

**Save Schema:**
```javascript
{
  qsos: "12345",
  factoryCounts: { "elmer": 5, "paddle-key": 2 },
  licenseLevel: 2
}
```

---

## Testing Strategy

**Store Tests:**
- Factory cost calculation with tier multipliers
- Buy factory deducts correct QSOs
- getTotalQSOsPerSecond sums correctly
- Save/load preserves all state

**Component Tests:**
- FactoryCard renders and emits buy event
- LicensePanel shows correct progress
- MultiBuyPanel visibility based on factory count
- FactoryList filters by license tier

**Integration:**
- Game loop adds QSOs from factories
- UI updates reactively
- Save/load works end-to-end

---

## Success Criteria

- [ ] All 21 factories defined with correct stats
- [ ] Cost scaling uses tier-based multipliers (10%/7%/5%)
- [ ] Multi-buy unlocks at 10 total factories
- [ ] License gates properly filter factory visibility
- [ ] Passive QSO generation works via game loop
- [ ] Save/load persists all progress
- [ ] All tests pass (36+ total)