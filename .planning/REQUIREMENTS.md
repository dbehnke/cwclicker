# Requirements: CW Keyer Idle Game

**Defined:** 2025-03-19
**Core Value:** Simple, satisfying CW tapping with ham radio satire and classic idle game progression

## v1 Requirements

### Core Mechanics

- [ ] **CORE-01**: Player can click/tap CW keyer to generate QSOs
- [ ] **CORE-02**: Short tap (< 200ms) generates dit = 1 QSO
- [ ] **CORE-03**: Long press (> 200ms) generates dah = 2 QSOs
- [ ] **CORE-04**: Real-time audio tone feedback (600-1000 Hz)
- [ ] **CORE-05**: Visual feedback on keyer (active state animation)
- [ ] **CORE-06**: Keyboard accessible (Space/Enter to activate)

### Factories (Auto-Generation)

- [ ] **FACT-01**: Elmer factory (10 QSOs, 0.1/sec)
- [ ] **FACT-02**: Straight Key factory (50 QSOs, 0.3/sec)
- [ ] **FACT-03**: Novice License Holder factory (100 QSOs, 0.5/sec)
- [ ] **FACT-04**: Paddle Key factory (500 QSOs, 1.0/sec)
- [ ] **FACT-05**: Code Practice Oscillator factory (1,000 QSOs, 2.0/sec)
- [ ] **FACT-06**: Dipole Antenna factory (2,000 QSOs, 4.0/sec)
- [ ] **FACT-07**: Vertical Antenna factory (5,000 QSOs, 8.0/sec)
- [ ] **FACT-08**: Linear Amplifier factory (10,000 QSOs, 15.0/sec)
- [ ] **FACT-09**: Beam Antenna factory (25,000 QSOs, 30.0/sec)
- [ ] **FACT-10**: Tower Installation factory (50,000 QSOs, 60.0/sec)
- [ ] **FACT-11**: Contest Station factory (100,000 QSOs, 120.0/sec)
- [ ] **FACT-12**: DX Cluster factory (250,000 QSOs, 250.0/sec)
- [ ] **FACT-13**: Hamfest factory (500,000 QSOs, 500.0/sec)
- [ ] **FACT-14**: QSL Card Printer factory (1,000,000 QSOs, 1,000.0/sec)
- [ ] **FACT-15**: Remote Station factory (2,500,000 QSOs, 2,500.0/sec)
- [ ] **FACT-16**: FT8 Bot factory (5,000,000 QSOs, 5,000.0/sec)
- [ ] **FACT-17**: Cluster Spotting Network factory (10,000,000 QSOs, 10,000.0/sec)
- [ ] **FACT-18**: EME (Moonbounce) factory (25,000,000 QSOs, 25,000.0/sec)
- [ ] **FACT-19**: Satellite Constellation factory (50,000,000 QSOs, 50,000.0/sec)
- [ ] **FACT-20**: Ionospheric Modification factory (100,000,000 QSOs, 100,000.0/sec)
- [ ] **FACT-21**: Alternate Dimension DXCC factory (500,000,000 QSOs, 500,000.0/sec)

### Progression System

- [ ] **PROG-01**: Technician license (start, Tiers 1-2 unlocked)
- [ ] **PROG-02**: General license (500 QSOs cost, Tiers 3-5 unlocked)
- [ ] **PROG-03**: Extra license (5,000 QSOs cost, Tiers 6-7 unlocked)
- [ ] **PROG-04**: License upgrade button with cost display
- [ ] **PROG-05**: Locked factories show lock icon and requirements

### Economy

- [ ] **ECON-01**: Cost scaling: base_cost × (1.1 ^ owned)
- [ ] **ECON-02**: Multi-buy ×1 (default)
- [ ] **ECON-03**: Multi-buy ×10 (unlocked after 10 total factories)
- [ ] **ECON-04**: Multi-buy ×100 (unlocked after 10 total factories)
- [ ] **ECON-05**: Multi-buy MAX (unlocked after 10 total factories)
- [ ] **ECON-06**: Bulk discount: 5% off total for ×10/×100/MAX

### UI/UX

- [ ] **UI-01**: Retro terminal aesthetic (dark bg, green/amber text)
- [ ] **UI-02**: Monospace font (Courier/Fira Code)
- [ ] **UI-03**: Responsive layout (desktop, tablet, mobile)
- [ ] **UI-04**: QSO counter display
- [ ] **UI-05**: QSOs/sec rate display
- [ ] **UI-06**: Factory list with purchase buttons
- [ ] **UI-07**: Unaffordable factories show red/disabled state

### Audio

- [ ] **AUDIO-01**: Volume slider (0-100%)
- [ ] **AUDIO-02**: Sidetone frequency slider (400-1000 Hz)
- [ ] **AUDIO-03**: Audio initialized on first user interaction (autoplay policy)
- [ ] **AUDIO-04**: Smooth tone start/stop with Web Audio API

### Save System

- [ ] **SAVE-01**: Auto-save every 30 seconds
- [ ] **SAVE-02**: Save to localStorage
- [ ] **SAVE-03**: Load on game start
- [ ] **SAVE-04**: Handle localStorage errors gracefully
- [ ] **SAVE-05**: Export save data (base64 to clipboard)
- [ ] **SAVE-06**: Import save data (paste base64)
- [ ] **SAVE-07**: Offline progress calculation (rate × hours × 0.5, max 24h)

### Accessibility

- [ ] **A11Y-01**: Keyboard operable (Tab navigation, Space/Enter activation)
- [ ] **A11Y-02**: Screen reader labels on all interactive elements
- [ ] **A11Y-03**: ARIA roles (button, slider)
- [ ] **A11Y-04**: Reduced motion support (@media prefers-reduced-motion)
- [ ] **A11Y-05**: Focus indicators visible

### Performance

- [ ] **PERF-01**: 60fps game loop
- [ ] **PERF-02**: BigInt for large QSO numbers
- [ ] **PERF-03**: Throttled UI updates
- [ ] **PERF-04**: Debounced save operations

## v2 Requirements (Stretch Goals)

### Morse Code Decoder

- **DEC-01**: Pattern buffer for last 5-10 elements
- **DEC-02**: Real-time letter matching
- **DEC-03**: Display: "Last: ·–·– ––– ·–· → CQ"
- **DEC-04**: Recognizable letters: E, T, A, I, N, M, S, O, etc.
- **DEC-05**: Recognizable abbreviations: CQ, DE, RST, QTH, QSL, QRZ, 73, 88

### Achievements

- **ACHV-01**: Worked All States (WAS) - contact all 50 US states
- **ACHV-02**: DXCC - work 100 countries
- **ACHV-03**: 5-Band DXCC - work 100 countries on 5 bands
- **ACHV-04**: Contester - 10,000 QSOs in one session

### Events

- **EVENT-01**: CQ WW Contest Weekend (2× QSOs for 48h)
- **EVENT-02**: Field Day (mobile/portable bonuses)
- **EVENT-03**: Solar Maximum (propagation bonuses)

### Prestige System

- **PREST-01**: Reset at 1 billion QSOs
- **PREST-02**: Keep audio/theme preferences
- **PREST-03**: Gain +10% permanent multiplier
- **PREST-04**: Badge showing reset count

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend/server | Single-player only, localStorage sufficient |
| Multiplayer | Would require server, out of scope for entertainment project |
| Mobile app | Browser-based is sufficient |
| Microtransactions | Explicitly not for-pay |
| Actual radio transmission | This is a simulation/game only |
| Full Morse code training | Stretch goal only, not core gameplay |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| CORE-03 | Phase 1 | Pending |
| CORE-04 | Phase 1 | Pending |
| CORE-05 | Phase 1 | Pending |
| CORE-06 | Phase 1 | Pending |
| FACT-01 | Phase 2 | Pending |
| FACT-02 | Phase 2 | Pending |
| FACT-03 | Phase 2 | Pending |
| ... | ... | ... |

**Coverage:**
- v1 requirements: 54 total
- Mapped to phases: Pending roadmap creation
- Unmapped: 54

---
*Requirements defined: 2025-03-19*
*Last updated: 2025-03-19 after initialization*
