# Roadmap: CW Keyer Idle Game

**Created:** 2025-03-19
**Phases:** 7
**Requirements:** 54 v1 requirements

---

## Phase 1: Core Mechanics
**Goal:** Player can tap CW keyer to generate QSOs with audio feedback

**Requirements:** CORE-01 through CORE-06

**Plans:**
1. **Setup** - HTML structure, CSS styling, file organization
2. **Game State** - QSO management, factory tracking, BigInt handling
3. **CW Keyer** - Audio feedback, dit/dah detection (1 vs 2 QSOs)

**Success Criteria:**
- [ ] Click/tap keyer generates QSOs
- [ ] Dit = 1 QSO, Dah = 2 QSOs
- [ ] Audio tones play correctly
- [ ] Visual feedback on keyer
- [ ] Keyboard accessible

---

## Phase 2: Factory System
**Goal:** Players can purchase factories that auto-generate QSOs

**Requirements:** FACT-01 through FACT-09, ECON-01 through ECON-06

**Plans:**
1. **Factory Manager** - Factory display, purchasing logic
2. **Cost Scaling** - 10% increase per purchase, bulk discounts
3. **Multi-Buy** - ×1/×10/×100/MAX unlock after 10 factories

**Success Criteria:**
- [ ] All 9 Technician/General factories purchasable
- [ ] Cost scaling works correctly
- [ ] Multi-buy unlocks and functions
- [ ] QSOs generate passively from factories

---

## Phase 3: License Progression
**Goal:** License gates control factory access

**Requirements:** PROG-01 through PROG-05

**Plans:**
1. **License System** - Tech/Gen/Extra gates
2. **Upgrade UI** - Cost display, requirements, notifications
3. **Factory Unlocking** - Tier-based factory visibility

**Success Criteria:**
- [ ] Start as Technician (Tiers 1-2)
- [ ] Upgrade to General unlocks Tiers 3-5
- [ ] Upgrade to Extra unlocks Tiers 6-7
- [ ] Locked factories show requirements

---

## Phase 4: Remaining Factories
**Goal:** All 21 factories implemented

**Requirements:** FACT-10 through FACT-21

**Plans:**
1. **Tier 4 Factories** - Tower, Contest, DX Cluster
2. **Tier 5 Factories** - Hamfest, QSL Printer, Remote Station
3. **Tier 6 Factories** - FT8 Bot, Cluster Network, EME
4. **Tier 7 Factories** - Satellite, Ionospheric, Alternate Dimension

**Success Criteria:**
- [ ] All 21 factories with correct costs/rates
- [ ] Satirical descriptions displayed
- [ ] Proper tier locking

---

## Phase 5: Save System
**Goal:** Progress persists across sessions

**Requirements:** SAVE-01 through SAVE-07

**Plans:**
1. **Save Manager** - localStorage auto-save
2. **Import/Export** - Base64 clipboard operations
3. **Offline Progress** - Calculate earnings while away

**Success Criteria:**
- [ ] Auto-save every 30 seconds
- [ ] Save loads on game start
- [ ] Export/import works
- [ ] Offline progress calculated

---

## Phase 6: UI/UX Polish
**Goal:** Professional look and feel

**Requirements:** UI-01 through UI-07, AUDIO-01 through AUDIO-04

**Plans:**
1. **Audio Controls** - Volume and frequency sliders
2. **Responsive Design** - Mobile, tablet, desktop layouts
3. **Visual Polish** - CRT effects, animations, color coding

**Success Criteria:**
- [ ] Retro terminal aesthetic complete
- [ ] Audio controls functional
- [ ] Responsive on all screen sizes
- [ ] Smooth 60fps performance

---

## Phase 7: Accessibility
**Goal:** Game playable by everyone

**Requirements:** A11Y-01 through A11Y-05, PERF-01 through PERF-04

**Plans:**
1. **Keyboard Navigation** - Tab order, Space/Enter activation
2. **Screen Readers** - ARIA labels, roles
3. **Reduced Motion** - Respect prefers-reduced-motion
4. **Performance** - BigInt, throttling, debouncing

**Success Criteria:**
- [ ] Fully keyboard operable
- [ ] Screen reader compatible
- [ ] Reduced motion support
- [ ] No console errors
- [ ] 60fps maintained

---

## Traceability

| Requirement | Phase |
|-------------|-------|
| CORE-01 to CORE-06 | Phase 1 |
| FACT-01 to FACT-09, ECON-01 to ECON-06 | Phase 2 |
| PROG-01 to PROG-05 | Phase 3 |
| FACT-10 to FACT-21 | Phase 4 |
| SAVE-01 to SAVE-07 | Phase 5 |
| UI-01 to UI-07, AUDIO-01 to AUDIO-04 | Phase 6 |
| A11Y-01 to A11Y-05, PERF-01 to PERF-04 | Phase 7 |

**Coverage:**
- v1 requirements: 54 total
- Mapped to phases: 54
- Unmapped: 0 ✓

---

## ▶ Next Up

**Phase 1: Core Mechanics** — Player can tap CW keyer to generate QSOs with audio feedback

`/gsd-plan-phase 1` — Create detailed implementation plan

<sub>/clear first → fresh context window</sub>

---

*Roadmap created: 2025-03-19*
