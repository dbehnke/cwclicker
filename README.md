# CW Clicker

CW Clicker is a browser idle game built around a ham radio theme. Tap the keyer to earn QSOs, buy factories to generate passive income, and unlock better licenses to expand your signal empire.

## How It Works

- Tap the keyer to earn QSOs manually.
- Hold for a longer send to earn more.
- Buy factories to generate QSOs automatically.
- Unlock stronger licenses to access higher-tier factories.
- Buy upgrades to double factory output and keep your production climbing.

## Main Systems

### Manual Sending

The keyer is the heart of the game. Short sends and longer sends both add QSOs, so active play always matters.

### Morse Keying Challenge

Earn bonus QSOs by testing your Morse code skills! A random letter appears with its Morse pattern (·−). Key the exact pattern on the keyer within 5 seconds to earn bonus QSOs equal to your current QRQ factory's per-second output. The bonus multiplier resets the challenge, so unlock better factories for higher bonuses. Wrong input or timeout just advances to the next letter—no penalty.

**How to earn bonus QSOs:**

1. Correct key press within 5 seconds → Bonus QSOs awarded
2. Wrong input → Advances to next letter (no penalty)
3. Timeout (5 sec) → Advances to next letter (no penalty)
4. Bonus amount = QRQ factory output per second

This mini-game rewards both manual skill and factory progression, making it a perfect complement to the idle mechanic.

### Factories

Factories provide passive income. Each factory type has its own flavor text, output rate, and cost scaling.

### Upgrades

Upgrades increase a factory’s multiplier. The game keeps upgrade descriptions visible in a compact way on mobile, so the jokes and flavor text still show up without taking over the screen.

### Licenses

Licenses unlock more factory tiers over time. As your total QSOs grow, the game opens up new equipment and more efficient production.

### Offline Progress

When you come back after being away, the game awards a portion of the QSO production you would have earned while offline.

## Factory Economy

- Factory prices scale by tier.
- Bulk buying unlocks after enough factories.
- The interface supports compact purchase options for small screens.

## Responsive Design

The layout is built to work on desktop, tablet, and mobile.

## Example Loop

```text
Tap keyer -> earn QSOs -> buy factory -> unlock upgrade -> earn faster -> unlock more factories
↑
└── Complete Morse challenges for bonus QSOs (skill-based rewards)
```

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

## License

MIT License - Made with ❤️ in Macomb, MI

Inspired by [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/)
