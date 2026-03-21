# CW Keyer Idle Game

A browser-based idle game with a ham radio theme. Tap the CW keyer to earn QSOs, purchase factories to generate passive income, and upgrade your license to unlock more equipment!

🎮 **[Play the Demo](https://dbehnke.github.io/cwclicker/)**

## Features

- **CW Keyer**: Tap for dits (1 QSO) and hold for dahs (2 QSOs) with authentic sidetone audio
- **21 Factories**: From Elmers to Alternate Dimension DXCC, each with satirical ham radio descriptions
- **License Progression**: Start as Technician, upgrade to General (500 QSOs) and Extra (5,000 QSOs)
- **Offline Progress**: Earn 50% of your production rate while away (up to 24 hours)
- **Save System**: Auto-saves to localStorage with import/export functionality
- **Audio Controls**: Adjustable volume and sidetone frequency (400-1000 Hz)
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- Vue 3 with Composition API
- Pinia for state management
- Tailwind CSS for styling
- Web Audio API for sidetone generation
- Vitest for testing

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Game Mechanics

### Core Gameplay

- Click/tap the CW keyer to generate QSOs
- Short tap (< 200ms) = dit = 1 QSO
- Long press (> 200ms) = dah = 2 QSOs
- Factories generate QSOs automatically every second

### Factories

21 factories across 3 license tiers:

**Technician (Tiers 1-2)**

- QRQ Protocol, Elmer, Straight Key, Paddle Key, Code Practice Oscillator, Dipole Antenna

**General (Tiers 3-5)**

- Vertical Antenna, Linear Amplifier, Beam Antenna, Tower Installation, Contest Station, DX Cluster, Hamfest, QSL Card Printer, Remote Station

**Extra (Tiers 6-7)**

- FT8 Bot, Cluster Spotting Network, EME (Moonbounce), Satellite Constellation, Ionospheric Modification, Alternate Dimension DXCC

### Economy

- Cost scaling: 10% increase per purchase (Technician), 7% (General), 5% (Extra)
- Multi-buy unlocks after 10 total factories: ×1, ×10, ×100, MAX
- 5% bulk discount for ×10, ×100, and MAX purchases

### Offline Progress

When you return after being away:

- Formula: `rate × hours × 3600 × 0.5`
- Maximum 24 hours of offline earnings
- Minimum 1 minute offline to trigger calculation

## License

MIT License - Made with ❤️ in Macomb, MI

Inspired by [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/)
