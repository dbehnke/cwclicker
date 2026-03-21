# CW Keyer Idle Game - Design Specification

**Date:** 2025-03-19  
**Status:** Ready for Planning  
**Author:** Claude (via brainstorming session)

---

## Overview

A browser-based idle clicker game with a ham radio theme. Players tap out Morse code on a virtual CW keyer to generate QSOs (contacts), then purchase increasingly absurd ham radio equipment to automate QSO generation.

**Core Value:** Simple, satisfying CW tapping with ham radio satire and classic idle game progression.

---

## Core Mechanics

### The CW Keyer (Primary Interaction)

The game centers on a virtual Morse code keyer that players interact with using mouse/touch:

- **Short tap** (< 200ms): Produces a **dit** (·) → Generates **1 QSO**
- **Long press** (> 200ms): Produces a **dah** (–) → Generates **2 QSOs**

**Audio Feedback:**
- Real-time tone generation (600-800 Hz sidetone)
- Tone starts on mouse down, stops on mouse up
- Volume adjustable
- Optional: Visual "arc" animation showing tone duration

**Why 2 QSOs for dah?**
In real CW, a dah is 3× the length of a dit. Using 2× creates satisfying asymmetry while keeping math simple for idle game calculations.

### Rhythm & Feel

Players naturally fall into tapping patterns:
- "CQ CQ DE..." rhythm becomes muscle memory
- Satisfying audio-visual feedback loop
- Encourages "active play" alongside idle progression

---

## Progression System

### License Classes (Progression Gates)

Three license tiers based on real amateur radio licensing:

| License | Cost (QSOs) | Unlocks | Bands | Requirement |
|---------|-------------|---------|-------|-------------|
| **Technician** | Free (start) | Tiers 1-2 | VHF/UHF only (local/regional) | — |
| **General** | 500 QSOs | Tiers 3-5 | HF bands (worldwide DX) | Make 100 QSOs |
| **Extra** | 5,000 QSOs | Tiers 6-7 | Full privileges + vanity calls | Work 50 states (WAS) OR 100 DXCC entities |

**License Exams:**
- Cost QSOs to represent study time/effort
- Achievement-gated (must meet requirement first)
- Visual: Certificate/badge display

**Locked State UI:**
- Icon: Lock emoji (🔒) or lock SVG
- Opacity: 50% or grayscale
- Tooltip on hover: "Requires [achievement]"
- Button: Disabled, shows cost but grayed out
- Unlock notification: Toast/popup when achievement met

### Factories (Auto-Generators)

21 factories across 7 tiers, each generating QSOs per second passively.

#### Tier 1: The Basics (Technician)
| Factory | Cost | QSOs/sec | Satirical Description |
|---------|------|----------|----------------------|
| Elmer | 10 | 0.1 | Old timers who help you get on the air. "Just listen for a bit, son." |
| Straight Key | 50 | 0.3 | Purists who insist "real hams use straight keys." Click... click... click... |
| Novice License Holder | 100 | 0.5 | Eager beginners copying code at 5 WPM. Very... slow... but... enthusiastic. |

#### Tier 2: Equipment Accumulation (Technician)
| Factory | Cost | QSOs/sec | Satirical Description |
|---------|------|----------|----------------------|
| Paddle Key | 500 | 1.0 | "Finally upgraded from that straight key!" 3× faster, but somehow less romantic. |
| Code Practice Oscillator | 1,000 | 2.0 | Beeping into the void. Your neighbors love you. |
| Dipole Antenna | 2,000 | 4.0 | "It's not much, but it's honest work." Strung between trees. |

#### Tier 3: The Upgrade Path (General - HF Unlocked!)
| Factory | Cost | QSOs/sec | Satirical Description |
|---------|------|----------|----------------------|
| Vertical Antenna | 5,000 | 8.0 | "No radials? Good enough." HOA nightmares begin. |
| Linear Amplifier | 10,000 | 15.0 | "If I can't hear them, they can hear ME!" (1.5kW legal limit abuse) |
| Beam Antenna | 25,000 | 30.0 | "You have a beam? Must be nice." Rotatable superiority complex. |

#### Tier 4: Serious Business (General)
| Factory | Cost | QSOs/sec | Satirical Description |
|---------|------|----------|----------------------|
| Tower Installation | 50,000 | 60.0 | "It's only 70 feet. The neighbors will get used to it." |
| Contest Station | 100,000 | 120.0 | "CQ CQ CQ TEST!" Pileup generators. Sleep is for the weak. |
| DX Cluster | 250,000 | 250.0 | Internet-connected spotting networks. "SPOTTED: VK0EK 14.195" |

#### Tier 5: The Obsession (General)
| Factory | Cost | QSOs/sec | Satirical Description |
|---------|------|----------|----------------------|
| Hamfest | 500,000 | 500.0 | Swap meets where old gear goes to find new hoarders. "I'll take that Heathkit." |
| QSL Card Printer | 1,000,000 | 1,000.0 | Confirming contacts that definitely happened. Bureau backlog: 3 years. |
| Remote Station | 2,500,000 | 2,500.0 | "I'm operating from the Caribbean... remotely from Ohio." |

#### Tier 6: Questionable Methods (Extra)

**Requirements:** 100 DXCC entities OR 50 states worked (track via simple counters)

| Factory | Cost | QSOs/sec | Satirical Description |
|---------|------|----------|----------------------|
| FT8 Bot | 5,000,000 | 5,000.0 | *Controversial* "Is it even ham radio if a computer does it?" |
| ├─ FT4 Upgrade | 2,500,000 | +50% speed | "Faster contacts! 7.5 seconds instead of 15. Still no actual conversation." |
| ├─ FT2 Upgrade | 5,000,000 | +100% speed | "Relay buster! 3.75 seconds! Pure efficiency. Zero soul." |
| Cluster Spotting Network | 10,000,000 | 10,000.0 | "Worked all states from my bathroom using spots." |
| EME (Moonbounce) | 25,000,000 | 25,000.0 | "If the moon's up, I can work anyone." Extremely overkill. |

#### Tier 7: Absurdity (Extra)
| Factory | Cost | QSOs/sec | Satirical Description |
|---------|------|----------|----------------------|
| Satellite Constellation | 50,000,000 | 50,000.0 | Why use one satellite when you can launch 40,000? |
| Ionospheric Modification | 100,000,000 | 100,000.0 | "I just need to heat the ionosphere a bit... for better propagation." |
| Alternate Dimension DXCC | 500,000,000 | 500,000.0 | "I've worked all 340 entities in THIS timeline." |

### Cost Scaling

Each additional factory of the same type costs slightly more (compounding):
- Base cost increases by ~10% per purchase
- Formula for Nth factory: `cost = base_cost × (1.1 ^ (owned))`
- Buying in bulk (×10, ×100) applies 5% discount vs individual purchases
- Bulk formula: `total = sum(cost for i in 0..n-1) × 0.95`

---

## Multi-Buy System

After purchasing 10 of any factory type, unlock bulk purchase buttons:

| Button | Function | Display |
|--------|----------|---------|
| **×1** | Buy one (default) | Standard price |
| **×10** | Buy 10 | Total cost for 10 |
| **×100** | Buy 100 | Total cost for 100 |
| **MAX** | Buy max affordable | "Buy 47 Elmers for 4,230 QSOs" |

**Unaffordable Purchases:**
- Button: Disabled state (grayed out, no hover effect)
- Price text: Red color or strikethrough
- Tooltip: "Need X more QSOs"
- Visual: Lock icon overlay on factory card

---

## UI/UX Design

### Visual Style

**Retro Terminal Aesthetic:**
- Dark background (#0d1117 or similar)
- Amber/green phosphor text options
- Monospace fonts (Courier, Fira Code)
- CRT scanline overlay (subtle)
- Terminal cursor blink on active elements

**Color Coding:**
- QSO counter: Bright green/amber
- Available purchases: White
- Locked content: Dimmed gray
- Recently purchased: Flash highlight

### Layout

**Responsive Design:**
- Desktop: Full layout as shown
- Tablet: 2-column factory grid
- Mobile: Single column, swipe between tabs
- Touch: Same mouse events work (touchstart/touchend)

```
┌─────────────────────────────────────────────────────┐
│  CW KEYER IDLE        QSOs: 1,247,392,018    [⚙]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│              ┌─────────────────┐                    │
│              │                 │                    │
│              │   CW KEYER      │  <- Click/tap      │
│              │    [IMAGE]      │     this area      │
│              │                 │                    │
│              └─────────────────┘                    │
│                                                     │
│           QSOs/sec: 4,203 [+2,847 idle]             │
│                                                     │
├─────────────────────────────────────────────────────┤
│  LICENSES        FACTORIES       STATS      [?]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Technician]  │  Elmer           0.1/sec   10×    │
│   General 🔒   │  Straight Key    0.3/sec   50×    │
│   Extra 🔒     │  Paddle Key      1.0/sec  500×    │
│                │  [12 more...]                       │
│                │                                     │
│                │  ×1  ×10  ×100  MAX                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Audio Controls

- Master volume slider
- Sidetone frequency selector (400-1000 Hz)
- Mute toggle
- Audio enabled by default

---

## Game Balance

### Idle vs Active Play

**Target Ratio:** Active clicking viable for first 10-15 minutes, then factories take over
- Clicking (active): ~5-10 QSOs/sec at steady rhythm
- Tier 1 factories combined: ~1 QSO/sec
- Tier 3+ factories: Gradually surpass clicking

**Progression curve:**
- 0-10 min: Clicking is primary source
- 10-60 min: Mix of clicking + early factories
- 60+ min: Factories dominate

### Offline Progress

Calculate QSOs earned while away:
- **Formula:** `offline_QSOs = (current_QSOs_per_sec) × (offline_hours) × 0.5`
- **Cap:** Maximum 24 hours of offline progress (prevents infinite accumulation)
- **Display:** Show "Welcome back! You earned X QSOs while away"

### Prestige System

**New Game+ mechanic:**
- **Reset at:** 1 billion QSOs (arbitrary "I've conquered this band" milestone)
- **Keep:** Audio preferences, theme selection
- **Gain:** Permanent +10% QSO generation multiplier (compounds)
- **Bonus:** Unique badge showing number of resets
- **Optional:** Can be disabled for casual players

## Save System

### Save Data Schema

```javascript
{
  version: 1,  // For migration
  timestamp: 1234567890,
  qsos: "12345678901234567890",  // String for BigInt
  qsosPerSec: 1234,
  license: "general",  // technician|general|extra
  factories: {
    elmer: { owned: 42, totalProduced: 999999 }
    // ... each factory
  },
  stats: {
    totalClicks: 9999,
    totalTimePlayed: 3600,  // seconds
    statesWorked: ["CA", "TX", "NY"],  // For WAS achievement
    dxccCount: 47,  // For DXCC achievement
    resets: 0
  },
  settings: {
    volume: 0.7,
    frequency: 600,
    theme: "amber"
  }
}
```

### Error Handling

**localStorage failures:**
- Try/catch around all localStorage operations
- On failure: Show warning toast "Save failed - progress may be lost"
- Graceful degradation: Continue playing, retry save on next interval

**Quota exceeded:**
- Compress save data (JSON → minified)
- If still failing: Warn user to export save manually

**Data migration:**
- Check `save.version` on load
- If outdated: Run migration function to upgrade schema
- Keep backup of old format until migration succeeds

**Import/Export:**
- Export: Copy save JSON to clipboard as base64-encoded string
- Import: Paste base64 string, decode, validate schema, apply if valid

### Morse Code Decoder Display

**Feature:** Show recognized letters/abbreviations as player taps patterns.

**Implementation:**
- Pattern buffer (last 5-10 elements)
- Real-time matching against Morse code table
- Display: "Last: ·–·– ––– ·–· → CQ"

**Recognizable:**
- Individual letters: E, T, A, I, N, M, S, O, etc.
- Ham abbreviations: CQ, DE, RST, QTH, QSL, QRZ, 73, 88
- Player callsign (customizable)

**Priority:** Post-MVP. Nice polish feature.

### Achievements/Badges

- **Worked All States (WAS):** Make contact with all 50 US states
- **DXCC:** Work 100 countries
- **5-Band DXCC:** Work 100 countries on 5 different bands
- **Contester:** Make 10,000 QSOs in one session
- **Elmer:** Help 100 other players (if multiplayer)

### Events

- **CQ WW Contest Weekend:** 2× QSO generation for 48 hours
- **Field Day:** Special bonuses for mobile/portable operation
- **Solar Maximum:** Increased propagation = bonus multipliers

---

## Technical Architecture

### Tech Stack

- **Framework:** Vanilla JavaScript or lightweight framework (Preact/Svelte)
- **State Management:** Simple store pattern (no Redux needed)
- **Audio:** Web Audio API for real-time tone generation
- **Storage:** localStorage for save game
- **Styling:** CSS with CSS variables for theming

### Key Components

1. **Keyer Component:**
   - Mouse/touch event handlers
   - Audio context management (lazy init on first interaction)
   - Timing logic (dit/dah detection)
   - Visual feedback (animations)
   - **Interface:** Emits `{ type: 'dit' | 'dah', count: 1 | 2 }` events
   - **Note:** Audio context created on first click to avoid autoplay blocking

2. **Game Loop:**
   - RequestAnimationFrame-based
   - Calculate QSO generation from factories
   - Update UI at 60fps
   - Auto-save every 30 seconds
   - **Interface:** Exposes `getQSOs()` and `addQSOs(n)` methods
   - **Event flow:** Factories calculate rate → Game Loop accumulates → UI displays

3. **Factory Manager:**
   - Track owned factories
   - Calculate total QSO/sec
   - Handle purchase logic
   - Cost scaling calculations
   - **Interface:** `getRate()`, `canAfford(factory)`, `purchase(factory, count)`

4. **License System:**
   - Gate content based on achievements
   - Track player progress
   - Unlock notifications

### Performance Considerations

- Use BigInt or string math for large QSO numbers (idle games hit huge values)
- Throttle UI updates for large numbers (don't re-render every frame)
- Efficient audio context handling (avoid creating/destroying)
- Debounce save operations

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend/server | Single-player only, localStorage sufficient |
| Multiplayer | Would require server, out of scope for entertainment project |
| Mobile app | Browser-based is sufficient |
| Microtransactions | Explicitly not for-pay |
| Actual radio transmission | This is a simulation/game only |
| Full Morse code training | Stretch goal only, not core gameplay |

---

## Success Criteria

- [ ] Player can click/tap keyer to generate QSOs with satisfying audio
- [ ] Dit = 1 QSO, Dah = 2 QSOs mechanics work correctly
- [ ] All 21 factories implemented with correct costs/QSO rates
- [ ] License progression gates function correctly
- [ ] Multi-buy (×10/×100/MAX) works after 10 owned
- [ ] Game saves/loads progress via localStorage
- [ ] Retro terminal aesthetic implemented
- [ ] Audio controls functional
- [ ] No console errors, runs smoothly at 60fps
- [ ] **Accessibility:** Keyboard operable (Space/Enter to click keyer, Tab navigation)
- [ ] **Accessibility:** Screen reader labels for all interactive elements
- [ ] **Accessibility:** Reduced motion option (disable animations)
- [ ] **Mobile:** Touch events work correctly on iOS/Android
- [ ] **Mobile:** Responsive layout works on 320px+ screens

---

## Open Questions

None - all decisions resolved in Game Balance section.

---

*Last updated: 2025-03-19 after brainstorming session*
