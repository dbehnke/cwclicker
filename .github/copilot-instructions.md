# Copilot Coding Agent Instructions

This file provides instructions for AI coding agents working on CW Clicker.

## Project Overview

CW Clicker is a browser idle game (cookie clicker clone) with a ham radio theme. Players tap a CW keyer to earn QSOs, buy factories for passive income, and unlock better licenses as they progress. A Morse Challenge mini-game rewards skilled manual keying.

- **Repository:** github.com/dbehnke/cwclicker
- **License:** MIT
- **Status:** Active development (v1.4.2)
- **Tech Stack:** Node.js 24.x, Vanilla JS + Vite, Vitest, Tailwind, ESLint, Prettier

## Quick Start

```bash
npm ci              # Install dependencies (deterministic, matches lockfile)
npm run dev         # Start dev server
npm test            # Run test suite
npm run format      # Format code
npm run lint        # Lint code
npm run build       # Production build
```

## Critical Workflow Rules

### Context-Mode (context window protection)

**BLOCKED:** curl, wget, requests, fetch('http...) in shell — these are intercepted.
**Instead use:** `context-mode_ctx_fetch_and_index(url, source)` and `context-mode_ctx_execute(language, code)`

**Tool selection hierarchy:**
1. `context-mode_ctx_batch_execute(commands, queries)` — run + search in one call
2. `context-mode_ctx_search(queries: [...])` — query indexed content
3. `context-mode_ctx_execute(language, code)` — sandbox execution
4. `context-mode_ctx_execute_file(path, language, code)` — read files for analysis

### Git Workflow (fork-based)

This repository uses a fork-based workflow. Do NOT push directly to origin/main.

```bash
# Sync with upstream
git fetch origin && git rebase origin/main

# Create feature branch
git checkout -b feat/my-feature

# After changes, push to fork
git push -u origin feat/my-feature

# Create PR via GitHub web interface
gh pr create --base main --head trinity-ai-agent:feat/my-feature --fill --web
```

## Code Style & Conventions

- **ESLint + Prettier** enforcement via husky pre-commit hooks
- **Vitest** for unit testing (`.test.js` files alongside source)
- Coverage required for logic changes
- Single-purpose commits with clear messages
- Responsive design: desktop, tablet, mobile

### Key Conventions

- `·` ( middot / center dot U+00B7 ) for dit in morse representations
- `−` ( hyphen-minus U+002D ) for dah in morse representations  
- Morese patterns stored as strings like `"·−·−−"` (A = dit-dah-dit-dit-dah)
- BigInt used for QSO counts (can reach trillions)
- State managed via composables; persistence via localStorage

## Architecture

### Directory Structure

```
src/
├── app.js              # Vue app initialization
├── main.js             # Entry point
├── state/              # Reactive state (Vue composition API)
│   ├── GameState.js    # Central game state
│   ├── FactoryState.js # Factory purchase/upgrades
│   ├── MorseState.js   # Morse challenge logic
│   └── LicenseState.js # License tier progression
├── components/         # Vue SFCs
│   ├── KeyerButton.js  # CW keyer UI
│   ├── QsoDisplay.js   # QSO counter
│   ├── FactoryCard.js  # Factory purchase card
│   ├── MorseChallenge.js # Morse challenge mini-game
│   └── SignalGrid.js   # Desktop signal grid UI
├── audio/              # Web Audio API audio engine
│   └── AudioEngine.js  # CW tone generation (700Hz standard)
├── utils/              # Utilities
│   ├── BigIntMath.js   # Large number operations
│   └── MorseEncoder.js # Text → morse string encoder
└── styles/             # Tailwind + custom CSS

tests/                  # Vitest unit tests (mirrors src structure)
.github/workflows/      # CI: lockfile check, format, lint, test, build
.planning/              # Internal planning docs (roadmap, specs)
```

### Key Systems

#### CW Keyer / Manual Sending
- Short press → 1 QSO + short tone
- Long press → 2 QSOs + extended tone (threshold ~300ms)
- Tone: 700Hz standard offset

#### Morse Challenge Mini-game
- Random letter appears with morse pattern
- Key the exact pattern within 5 seconds for bonus QSOs
- Bonus = current QRQ factory output per second
- **Known issues:** Issue #32 — Challenge can get stuck and not reset properly on edge cases. Track `morseChallengeActive` and `currentLetter` state carefully. Check `onMounted` recovery logic for `wrong-retry` state.

#### Factories & Upgrades
- Prices scale by tier using powers-of-two progression
- Multipliers increase output 2x per upgrade
- Factory tiers unlocked by license class (Novice → Extra)
- Only next affordable factory revealed at a time

#### Licenses
- Unlock tiers: Novice → Technician → General → Extra
- Progressive reveal of factory types
- Full reset on prestige

## Common Tasks

### Adding a new factory

1. Add to factory definitions in `src/state/FactoryState.js`
2. Update license tier gate if needed
3. Add tests in `tests/state/FactoryState.test.js`
4. Update CHANGELOG if behavioral change

### Fixing Morse Challenge

- Check `src/components/MorseChallenge.js` for state machine logic
- Key states: `idle`, `waiting`, `wrong-retry`, `correct`, `timeout`
- Recovery on `onMounted` handles `wrong-retry` stuck state
- Test edge cases with wrong inputs and page reloads

### Running specific tests

```bash
npm test -- --run src/components/MorseChallenge.test.js
npm test -- --coverage
```

## GitHub Resources

- **Owner:** dbehnke
- **Repo:** cwclicker (public)
- **CI:** GitHub Actions (lockfile check → format → lint → test → build)
- **Issues:** #32 (Morse stuck), #23 (Copilot instructions — you are here)

## Notes

- The repository uses Node.js 24.x specifically — do not assume older versions work
- `npm ci` (not `npm install`) is required for CI-compatible installs
- Pre-commit hooks run `lint-staged` (format + lint on staged files)
- Offline progress awards a portion of QSO production while away
