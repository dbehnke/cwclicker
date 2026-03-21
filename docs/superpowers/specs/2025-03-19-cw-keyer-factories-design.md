# CW Keyer Idle Game - Factory & License System Design

**Date:** 2025-03-19  
**Status:** Ready for Implementation  

---

## Overview

Implementation of all 21 factories across 3 tiers (Technician, General, Extra) with license gates and comprehensive cost scaling. Players purchase factories that generate QSOs automatically, progressing through Technician → General → Extra licenses.

---

## Core Features

### 1. Factory Data Model

**21 Factories total, organized by tier:**

**Tier 1-2: Technician License** (Elmer through Beam Antenna)
- 9 factories with 0.1 - 30 QSOs/sec rates

**Tier 3-5: General License** (Tower through DX Cluster)
- 9 factories with 60 - 250 QSOs/sec rates

**Tier 6-7: Extra License** (FT8 Bot through Alternate Dimension)
- 3 factories with 5,000 - 500,000 QSOs/sec rates

**Factory Object Structure:**
```javascript
{
  id: 'elmer',
  name: 'Elmer',
  baseCost: 10,
  qsosPerSecond: 0.1,
  tier: 1,
  description: 'Old timers who help you get on the air...'
}
```

### 2. Cost Scaling

**Tier-based progression formula:**

```
Cost of Factory N = baseCost × (1 + tierMultiplier)^(owned)
```

**Tier multipliers:**
- Tiers 1-2: 10% per factory → `baseCost × 1.10^owned`
- Tiers 3-5: 7% per factory → `baseCost × 1.07^owned`
- Tiers 6-7: 5% per factory → `baseCost × 1.05^owned`

**Example Calculations:**
- **Elmer (Tier 1, cost 10):** 10, 11, 12, 14, 15... (10% scaling)
- **Paddle Key (Tier 2, cost 500):** 500, 535, 572, 613, 656... (10% scaling)
- **Tower (Tier 4, cost 50,000):** 50,000, 53,500, 57,245, 61,252, 65,740... (7% scaling)
- **FT8 Bot (Tier 6, cost 5,000,000):** 5,000,000, 5,250,000, 5,512,500, 5,798,125, 6,088,031... (5% scaling)

### 3. Multi-Buy System

**Unlocks at:** 10 total factories owned (across all types)

**Buttons:**
- **×1:** Buy 1 factory (standard price)
- **×10:** Buy 10 at once (5% discount)
- **×100:** Buy 100 at once (5% discount)
- **MAX:** Buy as many as affordable (5% discount)

**Bulk Cost Formula:**
```javascript
function calculateBulkCost(factory, count) {
  let total = 0
  for (let i = 0; i < count; i++) {
    const cost = factory.baseCost × tierMultiplier^(factory.owned + i)
    total += cost
  }
  return floor(total × 0.95) // 5% bulk discount
}
```

### 4. License Progression

**Three license tiers:**

| License | Cost (QSOs) | Unlocks | Requirements |
|---------|-------------|---------|--------------|
| **Technician** | Free (start) | Tiers 1-2 | — |
| **General** | 500 QSOs total | Tiers 3-5 | Earn 500 QSOs |
| **Extra** | 5,000 QSOs total | Tiers 6-7 | Earn 5,000 QSOs |

**License UI:**
- Display current license prominently
- Show progress bar: "250/500 QSOs earned"
- Locked buttons show cost and requirements
- Unlock notification: Toast popup when requirements met

### 5. Store Actions

```javascript
// Factory management
- buyFactory(factoryId, count = 1)
- getFactoryCost(factoryId, owned)
- getBulkCost(factoryId, count)

// License management  
- upgradeLicense(licenseType)

// Derived values
- getTotalQSOsPerSecond()
- isMultiBuyUnlocked()
- canAffordFactory(factoryId)

// Save integration
- save()
- load()
```

### 6. Component Structure

**New Components:**
- `FactoryList.vue`: Scrolling container for all factories
- `FactoryCard.vue`: Individual factory display with purchase buttons
- `MultiBuyPanel.vue`: ×1/×10/×100/MAX controls (unlocks at 10 factories)
- `LicensePanel.vue`: License status and upgrade buttons
- `GameLoop.vue`: Manages requestAnimationFrame loop for passive QSO generation
- `FactoryTests.vue`: Comprehensive test suite

**Updated Components:**
- `App.vue`: Integrate LicensePanel and FactoryList into main layout
- `KeyerArea.vue`: Already has keyer functionality (no changes needed)

### 7. Game Loop

**Passive QSO generation:**

```javascript
// In useGameStore
function tick(deltaSeconds) {
  const qsosToAdd = factoryTotalQSOsPerSecond × deltaSeconds
  
  if (qsosToAdd > 0) {
    qsos.value += qsosToAdd
    save()
  }
}
```

**Implementation:**
- `requestAnimationFrame` calls `tick()` every frame
- Accumulates delta time between frames
- Converts to QSOs per second
- Updates global `qsosPerSecond` reactive value

### 8. Save System Integration

**Extended Schema:**

```javascript
{
  version: 1,
  timestamp: 1234567890,
  qsos: "12345678901234567890",  // String for BigInt
  currentLicense: "technician",  // technician|general|extra
  licenseLevel: 1,               // 1=Technician, 2=General, 3=Extra
  
  factories: {
    "elmer": { owned: 42, totalProduced: 999999 },
    "straight-key": { owned: 5, totalProduced: 150 },
    "paddle-key": { owned: 2, totalProduced: 5000 },
    // ... all 21 factories
  },
  
  stats: {
    totalClicks: 9999,
    totalTimePlayed: 3600,
    // (future achievements tracking)
  },
  
  settings: {
    volume: 0.7,
    frequency: 600
  }
}
```

### 9. Testing Strategy

**Store Tests:**
- Factory purchase adds correct amount
- Cost scaling applies tier multiplier
- Multi-buy calculates 5% discount
- License upgrade checks requirements
- getTotalQSOsPerSecond sums correctly
- Save/load preserves all state

**Component Tests:**
- FactoryCard renders with correct data
- Disabled button shows "Need X more QSOs"
- Multi-buy panel visible when 10 factories owned
- FactoryCard hidden when license tier doesn't allow it
- LicensePanel shows upgrade progress

**Integration Tests:**
- Game loop adds factory QSOs
- UI updates reactively when state changes
- Multi-buy buttons update cost dynamically
- Save loads with correct factory counts

### 10. Factory Data

**All 21 Factories with Tier & QSOs/sec:**

**Tier 1-2 (Technician):**
1. Elmer (Tier 1) - 0.1 QSOs/sec, cost 10
2. Straight Key (Tier 1) - 0.3 QSOs/sec, cost 50
3. Novice License Holder (Tier 1) - 0.5 QSOs/sec, cost 100
4. Paddle Key (Tier 2) - 1.0 QSOs/sec, cost 500
5. Code Practice Oscillator (Tier 2) - 2.0 QSOs/sec, cost 1,000
6. Dipole Antenna (Tier 2) - 4.0 QSOs/sec, cost 2,000

**Tier 3-5 (General - Unlocked at 500 QSOs):**
7. Vertical Antenna (Tier 3) - 8.0 QSOs/sec, cost 5,000
8. Linear Amplifier (Tier 3) - 15.0 QSOs/sec, cost 10,000
9. Beam Antenna (Tier 3) - 30.0 QSOs/sec, cost 25,000
10. Tower Installation (Tier 4) - 60.0 QSOs/sec, cost 50,000
11. Contest Station (Tier 4) - 120.0 QSOs/sec, cost 100,000
12. DX Cluster (Tier 5) - 250.0 QSOs/sec, cost 250,000

**Tier 6-7 (Extra - Unlocked at 5,000 QSOs):**
13. Hamfest (Tier 6) - 500.0 QSOs/sec, cost 500,000
14. QSL Card Printer (Tier 6) - 1,000.0 QSOs/sec, cost 1,000,000
15. Remote Station (Tier 6) - 2,500.0 QSOs/sec, cost 2,500,000
16. FT8 Bot (Tier 6) - 5,000.0 QSOs/sec, cost 5,000,000
17. Cluster Spotting Network (Tier 7) - 10,000.0 QSOs/sec, cost 10,000,000
18. EME (Moonbounce) (Tier 7) - 25,000.0 QSOs/sec, cost 25,000,000
19. Satellite Constellation (Tier 7) - 50,000.0 QSOs/sec, cost 50,000,000
20. Ionospheric Modification (Tier 7) - 100,000.0 QSOs/sec, cost 100,000,000
21. Alternate Dimension DXCC (Tier 7) - 500,000.0 QSOs/sec, cost 500,000,000

---

## Architecture

**Tech Stack:** Vue 3 (Composition API), Pinia, Tailwind CSS

**File Structure:**
```
src/
├── constants/
│   └── factories.js         # 21 factory definitions
├── components/
│   ├── FactoryList.vue      # Scrolling list of all factories
│   ├── FactoryCard.vue      # Individual factory card
│   ├── MultiBuyPanel.vue    # ×1/×10/×100/MAX controls
│   ├── LicensePanel.vue     # License status & upgrades
│   └── GameLoop.vue         # RequestAnimationFrame loop
├── stores/
│   └── game.js              # Extended with factory logic
└── ...
```

**Data Flow:**
1. Factory definition constant → FactoryCard component → User clicks buy
2. Click triggers store.buyFactory() → Updates factory counts → Recalculates costs
3. Recalculate costs → UI updates reactive values automatically
4. GameLoop tick() → Calculates factory QSOs/sec → Updates global QSO counter
5. Save() called on tick → localStorage persists progress

---

## Implementation Notes

- **Tier Logic:** Factories are filtered by `license >= factory.tier` (tier 1=Technician, tier 2=Technician, tier 3=General, etc.)
- **BigInt:** QSOs stored as string to support huge numbers (far beyond 2^53)
- **Performance:** Factory list rendered once, reactive updates only when buying
- **Multi-buy:** Bulk calculations done in memory, displayed to user as total cost
- **Error Handling:** Store actions validate affordable purchases before deducting
- **Save System:** Auto-save every 30 seconds (existing Phase 1 logic)