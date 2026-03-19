# CW Keyer Idle Game

## What This Is

A browser-based idle clicker game with a ham radio theme. Players tap out Morse code on a virtual CW keyer to generate QSOs (contacts), then purchase increasingly absurd ham radio equipment to automate QSO generation. Features 21 satirical factories across 7 tiers, license progression (Technician → General → Extra), and a retro terminal aesthetic.

## Core Value

Simple, satisfying CW tapping with ham radio satire and classic idle game progression.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Player can click/tap keyer to generate QSOs with satisfying audio
- [ ] Dit = 1 QSO, Dah = 2 QSOs mechanics work correctly
- [ ] All 21 factories implemented with correct costs/QSO rates
- [ ] License progression gates function correctly
- [ ] Multi-buy (×10/×100/MAX) works after 10 owned
- [ ] Game saves/loads progress via localStorage
- [ ] Retro terminal aesthetic implemented
- [ ] Audio controls functional
- [ ] No console errors, runs smoothly at 60fps
- [ ] Keyboard operable (Space/Enter to click keyer, Tab navigation)
- [ ] Screen reader labels for all interactive elements
- [ ] Reduced motion option (disable animations)
- [ ] Touch events work correctly on iOS/Android
- [ ] Responsive layout works on 320px+ screens

### Out of Scope

- Backend/server — Single-player only, localStorage sufficient
- Multiplayer — Would require server, out of scope for entertainment project
- Mobile app — Browser-based is sufficient
- Microtransactions — Explicitly not for-pay
- Actual radio transmission — This is a simulation/game only
- Full Morse code training — Stretch goal only, not core gameplay

## Context

This is an entertainment project, not a commercial product. The goal is to create a fun, satirical take on ham radio culture through the lens of idle games. The CW keyer mechanic (short tap = dit, long press = dah) provides a novel interaction that actually teaches rhythm and timing while remaining simple enough for idle game math.

## Constraints

- **Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3, Web Audio API, localStorage
- **Platform:** Browser-based only (desktop and mobile)
- **Scope:** Single-player idle clicker, no backend required
- **Budget:** None — personal entertainment project
- **Timeline:** MVP prioritized, stretch goals (Morse decoder, achievements) post-MVP

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| QSOs as resource | Classic idle game resource, "50,000 QSOs" sounds impressive | — Pending |
| Dit=1, Dah=2 QSOs | Dahs are 3× longer in real CW; 2× feels right for game balance | — Pending |
| 21 factories in 7 tiers | Mirrors ham radio progression from Elmers to absurdity | — Pending |
| License gates (Tech/Gen/Extra) | Respects real ham radio HF privilege structure | — Pending |
| Retro terminal aesthetic | Fits ham radio "old technology" culture | — Pending |
| Vanilla JS (no framework) | Simple project, no build step needed | — Pending |

---
*Last updated: 2025-03-19 after initialization*
