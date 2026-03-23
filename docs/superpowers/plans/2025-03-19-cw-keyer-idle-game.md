# CW Clicker Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based idle clicker game where players tap CW Morse code to generate QSOs and purchase ham radio equipment

**Architecture:** Vanilla JavaScript with modular ES6 classes. Core loop uses requestAnimationFrame. State managed via simple store pattern. Web Audio API for real-time tones. localStorage for persistence.

**Tech Stack:** HTML5, Vanilla JavaScript (ES6+), CSS3, Web Audio API, localStorage

---

## Chunk 1: Project Setup and Core HTML Structure

### Task 1: Initialize Project Structure

**Files:**
- Create: `index.html`
- Create: `src/styles/main.css`
- Create: `src/js/main.js`
- Create: `src/js/game-state.js`
- Create: `src/js/cw-keyer.js`
- Create: `src/js/factory-manager.js`
- Create: `src/js/audio-manager.js`

- [ ] **Step 1: Create HTML structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CW Clicker</title>
    <link rel="stylesheet" href="src/styles/main.css">
</head>
<body>
    <div id="game-container">
        <header>
            <h1>CW CLICKER</h1>
            <div id="qso-counter">QSOs: 0</div>
            <div id="qso-rate">QSOs/sec: 0</div>
        </header>
        
        <main>
            <section id="keyer-section">
                <div id="cw-keyer" tabindex="0" role="button" aria-label="CW Clicker - click to send Morse code">
                    <div class="keyer-button"></div>
                    <div class="keyer-label">TAP TO SEND</div>
                </div>
            </section>
            
            <section id="controls">
                <div id="license-panel">
                    <h2>LICENSE</h2>
                    <div id="current-license">Technician</div>
                    <button id="upgrade-license" disabled>Upgrade to General (500 QSOs)</button>
                </div>
                
                <div id="factories-panel">
                    <h2>FACTORIES</h2>
                    <div id="factories-list"></div>
                    <div id="multi-buy-controls" style="display: none;">
                        <button data-multi="1" class="active">×1</button>
                        <button data-multi="10">×10</button>
                        <button data-multi="100">×100</button>
                        <button data-multi="max">MAX</button>
                    </div>
                </div>
            </section>
        </main>
    </div>
    
    <script type="module" src="src/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create basic CSS structure**

```css
:root {
    --bg-color: #0d1117;
    --text-color: #00ff00;
    --accent-color: #00aa00;
    --disabled-color: #333;
    --font-mono: 'Courier New', Courier, monospace;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-mono);
    background-color: var(--bg-color);
    color: var(--text-color);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

#game-container {
    width: 100%;
    max-width: 800px;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 30px;
}

h1 {
    font-size: 2rem;
    margin-bottom: 10px;
}

#qso-counter {
    font-size: 1.5rem;
    margin-bottom: 5px;
}

#qso-rate {
    font-size: 1rem;
    opacity: 0.8;
}

#keyer-section {
    display: flex;
    justify-content: center;
    margin-bottom: 30px;
}

#cw-keyer {
    width: 200px;
    height: 200px;
    border: 3px solid var(--text-color);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.1s;
    user-select: none;
}

#cw-keyer:active {
    transform: scale(0.95);
    background-color: rgba(0, 255, 0, 0.1);
}

#cw-keyer:focus {
    outline: 2px solid var(--accent-color);
    outline-offset: 4px;
}

.keyer-label {
    margin-top: 10px;
    font-size: 0.8rem;
}

#controls {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 20px;
}

#license-panel, #factories-panel {
    border: 2px solid var(--text-color);
    padding: 15px;
    border-radius: 8px;
}

h2 {
    font-size: 1rem;
    margin-bottom: 15px;
    border-bottom: 1px solid var(--text-color);
    padding-bottom: 5px;
}

button {
    font-family: var(--font-mono);
    background-color: transparent;
    color: var(--text-color);
    border: 2px solid var(--text-color);
    padding: 8px 16px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
}

button:hover:not(:disabled) {
    background-color: var(--text-color);
    color: var(--bg-color);
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: var(--disabled-color);
    color: var(--disabled-color);
}

#multi-buy-controls {
    margin-top: 15px;
    display: flex;
    gap: 5px;
}

#multi-buy-controls button {
    padding: 5px 10px;
    font-size: 0.8rem;
}

#multi-buy-controls button.active {
    background-color: var(--text-color);
    color: var(--bg-color);
}

.factory-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid var(--text-color);
    border-radius: 4px;
}

.factory-item.locked {
    opacity: 0.5;
}

.factory-item.unaffordable {
    border-color: #ff0000;
}

.factory-info {
    flex: 1;
}

.factory-name {
    font-weight: bold;
    margin-bottom: 5px;
}

.factory-rate {
    font-size: 0.8rem;
    opacity: 0.8;
}

.factory-owned {
    font-size: 1.2rem;
    margin: 0 15px;
}

.factory-cost {
    text-align: right;
}

@media (max-width: 600px) {
    #controls {
        grid-template-columns: 1fr;
    }
    
    #cw-keyer {
        width: 150px;
        height: 150px;
    }
}
```

- [ ] **Step 3: Verify HTML loads correctly**

Open `index.html` in browser and verify:
- Page loads without console errors
- Green terminal-style styling visible
- CW keyer circle displayed
- Layout responsive

- [ ] **Step 4: Commit initial structure**

```bash
git add index.html src/
git commit -m "feat: initial project structure with HTML and CSS"
```

---

## Chunk 2: Game State Management

### Task 2: Create Game State Module

**Files:**
- Create: `src/js/game-state.js`
- Modify: `src/js/main.js`
- Test: Open browser console

- [ ] **Step 1: Write GameState class**

```javascript
// src/js/game-state.js

export class GameState {
    constructor() {
        this.qsos = 0n;
        this.qsosPerSec = 0;
        this.license = 'technician';
        this.factories = {};
        this.multiplier = 1;
        this.lastSave = Date.now();
        this.totalClicks = 0;
        
        // Initialize all factories with 0 owned
        this.initializeFactories();
    }
    
    initializeFactories() {
        const factoryData = [
            { id: 'elmer', baseCost: 10, baseRate: 0.1, tier: 1 },
            { id: 'straightKey', baseCost: 50, baseRate: 0.3, tier: 1 },
            { id: 'novice', baseCost: 100, baseRate: 0.5, tier: 1 },
            { id: 'paddleKey', baseCost: 500, baseRate: 1.0, tier: 2 },
            { id: 'oscillator', baseCost: 1000, baseRate: 2.0, tier: 2 },
            { id: 'dipole', baseCost: 2000, baseRate: 4.0, tier: 2 },
            { id: 'vertical', baseCost: 5000, baseRate: 8.0, tier: 3 },
            { id: 'amplifier', baseCost: 10000, baseRate: 15.0, tier: 3 },
            { id: 'beam', baseCost: 25000, baseRate: 30.0, tier: 3 },
            { id: 'tower', baseCost: 50000, baseRate: 60.0, tier: 4 },
            { id: 'contest', baseCost: 100000, baseRate: 120.0, tier: 4 },
            { id: 'dxCluster', baseCost: 250000, baseRate: 250.0, tier: 4 },
            { id: 'hamfest', baseCost: 500000, baseRate: 500.0, tier: 5 },
            { id: 'qslPrinter', baseCost: 1000000, baseRate: 1000.0, tier: 5 },
            { id: 'remoteStation', baseCost: 2500000, baseRate: 2500.0, tier: 5 },
            { id: 'ft8', baseCost: 5000000, baseRate: 5000.0, tier: 6 },
            { id: 'clusterNetwork', baseCost: 10000000, baseRate: 10000.0, tier: 6 },
            { id: 'eme', baseCost: 25000000, baseRate: 25000.0, tier: 6 },
            { id: 'satellite', baseCost: 50000000, baseRate: 50000.0, tier: 7 },
            { id: 'ionospheric', baseCost: 100000000, baseRate: 100000.0, tier: 7 },
            { id: 'alternateDimension', baseCost: 500000000, baseRate: 500000.0, tier: 7 }
        ];
        
        factoryData.forEach(factory => {
            this.factories[factory.id] = {
                ...factory,
                owned: 0
            };
        });
    }
    
    addQSOs(amount) {
        this.qsos += BigInt(Math.floor(amount));
    }
    
    getQSOs() {
        return this.qsos;
    }
    
    getQSOsString() {
        return this.qsos.toString();
    }
    
    canAfford(cost) {
        return this.qsos >= BigInt(Math.floor(cost));
    }
    
    spend(cost) {
        if (this.canAfford(cost)) {
            this.qsos -= BigInt(Math.floor(cost));
            return true;
        }
        return false;
    }
    
    getFactoryCost(factoryId) {
        const factory = this.factories[factoryId];
        if (!factory) return Infinity;
        
        // cost = base_cost × (1.1 ^ owned)
        return factory.baseCost * Math.pow(1.1, factory.owned);
    }
    
    getFactoryRate(factoryId) {
        const factory = this.factories[factoryId];
        if (!factory) return 0;
        
        return factory.baseRate * factory.owned * this.multiplier;
    }
    
    getTotalQSOsPerSec() {
        let total = 0;
        Object.keys(this.factories).forEach(id => {
            total += this.getFactoryRate(id);
        });
        return total;
    }
    
    purchaseFactory(factoryId, count = 1) {
        let totalCost = 0;
        let currentOwned = this.factories[factoryId].owned;
        
        for (let i = 0; i < count; i++) {
            totalCost += this.getFactoryCost(factoryId) * Math.pow(1.1, i);
        }
        
        if (this.spend(totalCost)) {
            this.factories[factoryId].owned += count;
            this.qsosPerSec = this.getTotalQSOsPerSec();
            return true;
        }
        return false;
    }
    
    getMaxAffordable(factoryId) {
        let count = 0;
        let currentOwned = this.factories[factoryId].owned;
        let totalCost = 0;
        
        while (true) {
            const nextCost = this.getFactoryCost(factoryId) * Math.pow(1.1, count);
            if (this.qsos >= BigInt(Math.floor(totalCost + nextCost))) {
                totalCost += nextCost;
                count++;
            } else {
                break;
            }
        }
        
        return count;
    }
    
    getTierForLicense() {
        const tiers = {
            'technician': 2,
            'general': 5,
            'extra': 7
        };
        return tiers[this.license] || 2;
    }
    
    canUpgradeLicense() {
        const requirements = {
            'technician': { cost: 500, requirement: 'Make 100 QSOs' },
            'general': { cost: 5000, requirement: 'Work 50 states or 100 DXCC' }
        };
        
        if (this.license === 'extra') return false;
        
        const nextLicense = this.license === 'technician' ? 'general' : 'extra';
        const req = requirements[this.license];
        
        return this.qsos >= BigInt(req.cost);
    }
    
    upgradeLicense() {
        if (!this.canUpgradeLicense()) return false;
        
        const costs = {
            'technician': 500,
            'general': 5000
        };
        
        if (this.spend(costs[this.license])) {
            this.license = this.license === 'technician' ? 'general' : 'extra';
            return true;
        }
        return false;
    }
    
    toJSON() {
        return {
            version: 1,
            timestamp: Date.now(),
            qsos: this.qsos.toString(),
            license: this.license,
            factories: this.factories,
            multiplier: this.multiplier,
            totalClicks: this.totalClicks
        };
    }
    
    fromJSON(data) {
        if (data.qsos) {
            this.qsos = BigInt(data.qsos);
        }
        if (data.license) {
            this.license = data.license;
        }
        if (data.factories) {
            Object.keys(data.factories).forEach(id => {
                if (this.factories[id]) {
                    this.factories[id].owned = data.factories[id].owned || 0;
                }
            });
        }
        if (data.multiplier) {
            this.multiplier = data.multiplier;
        }
        if (data.totalClicks) {
            this.totalClicks = data.totalClicks;
        }
        this.qsosPerSec = this.getTotalQSOsPerSec();
    }
}

export default GameState;
```

- [ ] **Step 2: Test GameState in browser console**

In browser console:
```javascript
import('./src/js/game-state.js').then(m => {
    window.gameState = new m.GameState();
    console.log('GameState created:', gameState.getQSOsString());
    gameState.addQSOs(100);
    console.log('After adding 100:', gameState.getQSOsString());
    console.log('Elmer cost:', gameState.getFactoryCost('elmer'));
});
```

Expected output:
- "GameState created: 0"
- "After adding 100: 100"
- "Elmer cost: 10"

- [ ] **Step 3: Commit GameState module**

```bash
git add src/js/game-state.js
git commit -m "feat: add GameState module with QSO management and factory tracking"
```

---

## Chunk 3: CW Clicker Component with Audio

### Task 3: Implement CW Clicker with Audio Feedback

**Files:**
- Create: `src/js/cw-keyer.js`
- Create: `src/js/audio-manager.js`
- Modify: `src/js/main.js`
- Test: Manual browser testing

- [ ] **Step 1: Write AudioManager class**

```javascript
// src/js/audio-manager.js

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.oscillator = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.frequency = 600;
        this.volume = 0.5;
    }
    
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    startTone() {
        this.init();
        
        if (this.isPlaying) return;
        
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();
        
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(this.frequency, this.audioContext.currentTime);
        
        this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
        
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        
        this.oscillator.start();
        this.isPlaying = true;
    }
    
    stopTone() {
        if (!this.isPlaying || !this.oscillator) return;
        
        const stopTime = this.audioContext.currentTime + 0.01;
        this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0, stopTime);
        
        this.oscillator.stop(stopTime);
        this.isPlaying = false;
        
        setTimeout(() => {
            if (this.oscillator) {
                this.oscillator.disconnect();
                this.oscillator = null;
            }
        }, 20);
    }
    
    setFrequency(freq) {
        this.frequency = freq;
    }
    
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }
}

export default AudioManager;
```

- [ ] **Step 2: Write CWKeyer class**

```javascript
// src/js/cw-keyer.js

import AudioManager from './audio-manager.js';

export class CWKeyer {
    constructor(element, onDit, onDah) {
        this.element = element;
        this.audioManager = new AudioManager();
        this.onDit = onDit;
        this.onDah = onDah;
        this.pressStartTime = 0;
        this.ditThreshold = 200; // ms
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Mouse events
        this.element.addEventListener('mousedown', (e) => this.onPress(e));
        this.element.addEventListener('mouseup', (e) => this.onRelease(e));
        this.element.addEventListener('mouseleave', (e) => this.onRelease(e));
        
        // Touch events
        this.element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onPress(e);
        });
        this.element.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onRelease(e);
        });
        
        // Keyboard events
        this.element.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.onPress(e);
            }
        });
        this.element.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.onRelease(e);
            }
        });
    }
    
    onPress(e) {
        this.pressStartTime = Date.now();
        this.audioManager.startTone();
        this.element.classList.add('active');
    }
    
    onRelease(e) {
        if (this.pressStartTime === 0) return;
        
        const duration = Date.now() - this.pressStartTime;
        this.audioManager.stopTone();
        this.element.classList.remove('active');
        
        if (duration < this.ditThreshold) {
            // Dit - short press = 1 QSO
            if (this.onDit) this.onDit();
        } else {
            // Dah - long press = 2 QSOs
            if (this.onDah) this.onDah();
        }
        
        this.pressStartTime = 0;
    }
}

export default CWKeyer;
```

- [ ] **Step 3: Wire up keyer in main.js**

```javascript
// src/js/main.js

import GameState from './game-state.js';
import CWKeyer from './cw-keyer.js';

const gameState = new GameState();
const keyerElement = document.getElementById('cw-keyer');

// Create CW Clicker with callbacks
const cwKeyer = new CWKeyer(
    keyerElement,
    () => {
        // Dit callback - 1 QSO
        gameState.addQSOs(1);
        gameState.totalClicks++;
        updateDisplay();
    },
    () => {
        // Dah callback - 2 QSOs
        gameState.addQSOs(2);
        gameState.totalClicks++;
        updateDisplay();
    }
);

// Update display
function updateDisplay() {
    const qsoCounter = document.getElementById('qso-counter');
    const qsoRate = document.getElementById('qso-rate');
    
    if (qsoCounter) {
        qsoCounter.textContent = `QSOs: ${gameState.getQSOsString()}`;
    }
    if (qsoRate) {
        qsoRate.textContent = `QSOs/sec: ${gameState.getTotalQSOsPerSec().toFixed(1)}`;
    }
}

// Initial display update
updateDisplay();

// Game loop for idle generation
let lastTime = Date.now();

function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - lastTime) / 1000; // Convert to seconds
    lastTime = now;
    
    // Generate QSOs from factories
    const qsosPerSec = gameState.getTotalQSOsPerSec();
    if (qsosPerSec > 0) {
        gameState.addQSOs(qsosPerSec * deltaTime);
        updateDisplay();
    }
    
    requestAnimationFrame(gameLoop);
}

// Start game loop
requestAnimationFrame(gameLoop);

// Expose for debugging
window.gameState = gameState;
```

- [ ] **Step 4: Add active state CSS**

```css
/* Add to src/styles/main.css */

#cw-keyer.active {
    background-color: rgba(0, 255, 0, 0.2);
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
}
```

- [ ] **Step 5: Test CW keyer**

Manual test in browser:
1. Click/hold CW keyer
2. Verify tone plays (may need to interact first due to autoplay policy)
3. Short click (< 200ms) should add 1 QSO
4. Long click (> 200ms) should add 2 QSOs
5. Counter updates in real-time

- [ ] **Step 6: Commit CW keyer**

```bash
git add src/js/cw-keyer.js src/js/audio-manager.js src/js/main.js src/styles/main.css
git commit -m "feat: implement CW keyer with audio feedback and dit/dah detection"
```

---

## Chunk 4: Factory Display and Purchasing

### Task 4: Implement Factory UI and Purchase Logic

**Files:**
- Create: `src/js/factory-manager.js`
- Modify: `src/js/main.js`
- Modify: `src/styles/main.css`
- Test: Browser testing

- [ ] **Step 1: Write FactoryManager class**

```javascript
// src/js/factory-manager.js

export class FactoryManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.multiBuy = 1;
        this.container = document.getElementById('factories-list');
        this.multiBuyControls = document.getElementById('multi-buy-controls');
        
        this.factoryNames = {
            elmer: 'Elmer',
            straightKey: 'Straight Key',
            novice: 'Novice License Holder',
            paddleKey: 'Paddle Key',
            oscillator: 'Code Practice Oscillator',
            dipole: 'Dipole Antenna',
            vertical: 'Vertical Antenna',
            amplifier: 'Linear Amplifier',
            beam: 'Beam Antenna',
            tower: 'Tower Installation',
            contest: 'Contest Station',
            dxCluster: 'DX Cluster',
            hamfest: 'Hamfest',
            qslPrinter: 'QSL Card Printer',
            remoteStation: 'Remote Station',
            ft8: 'FT8 Bot',
            clusterNetwork: 'Cluster Spotting Network',
            eme: 'EME (Moonbounce)',
            satellite: 'Satellite Constellation',
            ionospheric: 'Ionospheric Modification',
            alternateDimension: 'Alternate Dimension DXCC'
        };
        
        this.bindMultiBuy();
    }
    
    bindMultiBuy() {
        const buttons = this.multiBuyControls.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.multiBuy = btn.dataset.multi === 'max' ? 'max' : parseInt(btn.dataset.multi);
                this.updateDisplay();
            });
        });
    }
    
    checkMultiBuyUnlock() {
        let totalOwned = 0;
        Object.values(this.gameState.factories).forEach(f => {
            totalOwned += f.owned;
        });
        
        if (totalOwned >= 10) {
            this.multiBuyControls.style.display = 'flex';
        }
    }
    
    render() {
        this.container.innerHTML = '';
        
        const maxTier = this.gameState.getTierForLicense();
        
        Object.keys(this.gameState.factories).forEach(id => {
            const factory = this.gameState.factories[id];
            const element = this.createFactoryElement(id, factory, maxTier);
            this.container.appendChild(element);
        });
    }
    
    createFactoryElement(id, factory, maxTier) {
        const div = document.createElement('div');
        div.className = 'factory-item';
        div.dataset.factory = id;
        
        const isLocked = factory.tier > maxTier;
        const cost = this.gameState.getFactoryCost(id);
        const canAfford = this.gameState.canAfford(cost);
        
        if (isLocked) {
            div.classList.add('locked');
        }
        
        if (!canAfford && !isLocked) {
            div.classList.add('unaffordable');
        }
        
        const name = this.factoryNames[id] || id;
        const rate = factory.baseRate;
        
        div.innerHTML = `
            <div class="factory-info">
                <div class="factory-name">${name}</div>
                <div class="factory-rate">${rate}/sec each</div>
            </div>
            <div class="factory-owned">${factory.owned}</div>
            <div class="factory-cost">
                <button ${!canAfford || isLocked ? 'disabled' : ''}>
                    ${Math.floor(cost)} QSOs
                </button>
            </div>
        `;
        
        if (!isLocked) {
            const button = div.querySelector('button');
            button.addEventListener('click', () => this.purchaseFactory(id));
        }
        
        return div;
    }
    
    purchaseFactory(id) {
        let count;
        if (this.multiBuy === 'max') {
            count = this.gameState.getMaxAffordable(id);
            if (count === 0) return;
        } else {
            count = this.multiBuy;
        }
        
        // Apply 5% discount for bulk
        if (count > 1) {
            // Bulk purchase logic handled in gameState
        }
        
        if (this.gameState.purchaseFactory(id, count)) {
            this.updateDisplay();
            this.checkMultiBuyUnlock();
        }
    }
    
    updateDisplay() {
        const maxTier = this.gameState.getTierForLicense();
        
        Object.keys(this.gameState.factories).forEach(id => {
            const factory = this.gameState.factories[id];
            const element = this.container.querySelector(`[data-factory="${id}"]`);
            
            if (element) {
                const isLocked = factory.tier > maxTier;
                const cost = this.gameState.getFactoryCost(id);
                const canAfford = this.gameState.canAfford(cost);
                
                element.classList.toggle('locked', isLocked);
                element.classList.toggle('unaffordable', !canAfford && !isLocked);
                
                const ownedEl = element.querySelector('.factory-owned');
                const buttonEl = element.querySelector('button');
                
                if (ownedEl) ownedEl.textContent = factory.owned;
                if (buttonEl) {
                    buttonEl.textContent = `${Math.floor(cost)} QSOs`;
                    buttonEl.disabled = !canAfford || isLocked;
                }
            }
        });
    }
}

export default FactoryManager;
```

- [ ] **Step 2: Integrate FactoryManager in main.js**

```javascript
// Add to src/js/main.js imports
import FactoryManager from './factory-manager.js';

// Add after gameState creation
const factoryManager = new FactoryManager(gameState);
factoryManager.render();

// Update updateDisplay to include factory refresh
function updateDisplay() {
    const qsoCounter = document.getElementById('qso-counter');
    const qsoRate = document.getElementById('qso-rate');
    
    if (qsoCounter) {
        qsoCounter.textContent = `QSOs: ${gameState.getQSOsString()}`;
    }
    if (qsoRate) {
        qsoRate.textContent = `QSOs/sec: ${gameState.getTotalQSOsPerSec().toFixed(1)}`;
    }
    
    // Update factory buttons
    factoryManager.updateDisplay();
}
```

- [ ] **Step 3: Add locked/unaffordable styles**

```css
/* Add to src/styles/main.css */

.factory-item.locked {
    opacity: 0.4;
    border-color: #333;
    color: #666;
}

.factory-item.locked .factory-name::after {
    content: " 🔒";
}

.factory-item.unaffordable {
    border-color: #ff4444;
}

.factory-item.unaffordable button {
    border-color: #ff4444;
    color: #ff4444;
}
```

- [ ] **Step 4: Test factory purchasing**

Manual test:
1. Click keyer to earn 20+ QSOs
2. Verify Elmer factory appears and is purchasable
3. Click "Buy" on Elmer - QSOs decrease, owned count increases
4. Buy 10 total factories, verify ×10/×100/MAX buttons appear
5. Test bulk purchase
6. Verify locked factories show lock icon

- [ ] **Step 5: Commit factory system**

```bash
git add src/js/factory-manager.js src/js/main.js src/styles/main.css
git commit -m "feat: add factory display, purchasing, and multi-buy system"
```

---

## Chunk 5: License Progression System

### Task 5: Implement License Upgrades

**Files:**
- Modify: `src/js/main.js`
- Modify: `index.html`
- Test: Browser testing

- [ ] **Step 1: Update HTML for license section**

```html
<!-- Update #license-panel in index.html -->
<div id="license-panel">
    <h2>LICENSE</h2>
    <div id="current-license">Technician</div>
    <div id="license-requirement"></div>
    <button id="upgrade-license" disabled>Upgrade License</button>
</div>
```

- [ ] **Step 2: Add license logic to main.js**

```javascript
// Add to src/js/main.js after factoryManager creation

// License upgrade handling
const licenseElement = document.getElementById('current-license');
const upgradeButton = document.getElementById('upgrade-license');
const requirementElement = document.getElementById('license-requirement');

function updateLicenseDisplay() {
    const current = gameState.license;
    licenseElement.textContent = current.charAt(0).toUpperCase() + current.slice(1);
    
    if (current === 'extra') {
        upgradeButton.style.display = 'none';
        requirementElement.textContent = 'Maximum license achieved!';
        return;
    }
    
    const canUpgrade = gameState.canUpgradeLicense();
    upgradeButton.disabled = !canUpgrade;
    
    const costs = {
        'technician': 500,
        'general': 5000
    };
    
    const nextLicense = current === 'technician' ? 'General' : 'Extra';
    const cost = costs[current];
    
    upgradeButton.textContent = `Upgrade to ${nextLicense} (${cost} QSOs)`;
    
    if (canUpgrade) {
        requirementElement.textContent = 'Requirements met! Click to upgrade.';
        requirementElement.style.color = '#00ff00';
    } else {
        const qsosNeeded = cost - Number(gameState.getQSOs());
        requirementElement.textContent = `Need ${qsosNeeded} more QSOs`;
        requirementElement.style.color = '#ff6666';
    }
}

upgradeButton.addEventListener('click', () => {
    if (gameState.upgradeLicense()) {
        updateLicenseDisplay();
        factoryManager.render(); // Re-render to unlock new factories
        
        // Show upgrade notification
        alert(`Congratulations! You've upgraded to ${gameState.license.toUpperCase()} Class!`);
    }
});

// Update updateDisplay to include license
function updateDisplay() {
    const qsoCounter = document.getElementById('qso-counter');
    const qsoRate = document.getElementById('qso-rate');
    
    if (qsoCounter) {
        qsoCounter.textContent = `QSOs: ${gameState.getQSOsString()}`;
    }
    if (qsoRate) {
        qsoRate.textContent = `QSOs/sec: ${gameState.getTotalQSOsPerSec().toFixed(1)}`;
    }
    
    factoryManager.updateDisplay();
    updateLicenseDisplay();
}

// Initial calls
updateLicenseDisplay();
```

- [ ] **Step 3: Style license panel**

```css
/* Add to src/styles/main.css */

#current-license {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 10px;
    color: #00ff00;
}

#license-requirement {
    font-size: 0.9rem;
    margin-bottom: 15px;
    min-height: 1.2rem;
}

#upgrade-license {
    width: 100%;
}

#upgrade-license:disabled {
    opacity: 0.5;
}
```

- [ ] **Step 4: Test license upgrades**

Manual test:
1. Start game (Technician)
2. Click until you have 500+ QSOs
3. Verify upgrade button enables
4. Click upgrade button
5. Verify license changes to General
6. Verify new factories unlock (Tier 3-5)
7. Repeat for Extra (need 5000 QSOs)

- [ ] **Step 5: Commit license system**

```bash
git add src/js/main.js index.html src/styles/main.css
git commit -m "feat: implement license progression system with upgrade requirements"
```

---

## Chunk 6: Save/Load System

### Task 6: Implement localStorage Persistence

**Files:**
- Create: `src/js/save-manager.js`
- Modify: `src/js/main.js`
- Test: Browser testing

- [ ] **Step 1: Write SaveManager class**

```javascript
// src/js/save-manager.js

export class SaveManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.saveKey = 'cwKeyerIdle_save';
        this.autoSaveInterval = 30000; // 30 seconds
    }
    
    save() {
        try {
            const data = this.gameState.toJSON();
            data.lastSave = Date.now();
            localStorage.setItem(this.saveKey, JSON.stringify(data));
            console.log('Game saved');
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            this.showNotification('Save failed - storage may be full');
            return false;
        }
    }
    
    load() {
        try {
            const saved = localStorage.getItem(this.saveKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.gameState.fromJSON(data);
                
                // Calculate offline progress
                if (data.lastSave) {
                    const offlineTime = (Date.now() - data.lastSave) / 1000; // seconds
                    const offlineHours = offlineTime / 3600;
                    const cappedHours = Math.min(offlineHours, 24); // Max 24 hours
                    
                    const offlineQSOs = this.gameState.getTotalQSOsPerSec() * cappedHours * 0.5;
                    if (offlineQSOs > 0) {
                        this.gameState.addQSOs(offlineQSOs);
                        this.showNotification(`Welcome back! Earned ${Math.floor(offlineQSOs)} QSOs while away`);
                    }
                }
                
                console.log('Game loaded');
                return true;
            }
        } catch (e) {
            console.error('Load failed:', e);
            this.showNotification('Failed to load save');
        }
        return false;
    }
    
    export() {
        const data = this.gameState.toJSON();
        const base64 = btoa(JSON.stringify(data));
        navigator.clipboard.writeText(base64).then(() => {
            this.showNotification('Save data copied to clipboard!');
        }).catch(() => {
            this.showNotification('Failed to copy save data');
        });
    }
    
    import(base64String) {
        try {
            const json = atob(base64String);
            const data = JSON.parse(json);
            
            if (data.version && data.qsos) {
                this.gameState.fromJSON(data);
                this.save();
                this.showNotification('Save data imported successfully!');
                return true;
            } else {
                throw new Error('Invalid save data');
            }
        } catch (e) {
            console.error('Import failed:', e);
            this.showNotification('Invalid save data');
            return false;
        }
    }
    
    startAutoSave() {
        setInterval(() => this.save(), this.autoSaveInterval);
    }
    
    showNotification(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #00ff00;
            color: #0d1117;
            padding: 15px 20px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Add animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

export default SaveManager;
```

- [ ] **Step 2: Integrate save system in main.js**

```javascript
// Add to src/js/main.js imports
import SaveManager from './save-manager.js';

// Add after gameState creation
const saveManager = new SaveManager(gameState);

// Try to load existing save
if (saveManager.load()) {
    factoryManager.render();
    updateLicenseDisplay();
}

// Start auto-save
saveManager.startAutoSave();

// Add manual save/load UI
const settingsButton = document.querySelector('header [⚙]') || document.createElement('button');
if (!settingsButton.parentElement) {
    settingsButton.textContent = '⚙';
    settingsButton.style.cssText = 'position: absolute; top: 20px; right: 20px; font-size: 1.5rem; background: none; border: none; cursor: pointer;';
    document.body.appendChild(settingsButton);
}

settingsButton.addEventListener('click', () => {
    const action = prompt('Save/Load Options:\n1. Save Now\n2. Export Save\n3. Import Save\n\nEnter number:');
    
    if (action === '1') {
        saveManager.save();
        saveManager.showNotification('Game saved!');
    } else if (action === '2') {
        saveManager.export();
    } else if (action === '3') {
        const data = prompt('Paste save data:');
        if (data) {
            saveManager.import(data);
            updateDisplay();
            factoryManager.render();
        }
    }
});

// Save before page unload
window.addEventListener('beforeunload', () => {
    saveManager.save();
});
```

- [ ] **Step 3: Test save/load**

Manual test:
1. Play game, buy some factories
2. Refresh page
3. Verify save loads (factories and QSOs restored)
4. Test export (should copy to clipboard)
5. Clear localStorage, refresh
6. Test import (paste exported data)
7. Verify state restored
8. Wait 30 seconds, verify auto-save

- [ ] **Step 4: Commit save system**

```bash
git add src/js/save-manager.js src/js/main.js
git commit -m "feat: implement save/load system with localStorage and import/export"
```

---

## Chunk 7: Audio Controls and Polish

### Task 7: Add Audio Settings UI

**Files:**
- Modify: `index.html`
- Modify: `src/js/main.js`
- Modify: `src/styles/main.css`
- Test: Browser testing

- [ ] **Step 1: Add audio controls to HTML**

```html
<!-- Add to header in index.html -->
<div id="audio-controls">
    <label>
        Volume:
        <input type="range" id="volume-slider" min="0" max="100" value="50">
    </label>
    <label>
        Tone:
        <input type="range" id="frequency-slider" min="400" max="1000" value="600">
    </label>
    <span id="frequency-display">600 Hz</span>
</div>
```

- [ ] **Step 2: Wire up audio controls in main.js**

```javascript
// Add to src/js/main.js

// Audio controls
const volumeSlider = document.getElementById('volume-slider');
const frequencySlider = document.getElementById('frequency-slider');
const frequencyDisplay = document.getElementById('frequency-display');

if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        cwKeyer.audioManager.setVolume(volume);
    });
}

if (frequencySlider) {
    frequencySlider.addEventListener('input', (e) => {
        const freq = e.target.value;
        cwKeyer.audioManager.setFrequency(freq);
        if (frequencyDisplay) {
            frequencyDisplay.textContent = `${freq} Hz`;
        }
    });
}
```

- [ ] **Step 3: Style audio controls**

```css
/* Add to src/styles/main.css */

#audio-controls {
    margin-top: 15px;
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
    font-size: 0.8rem;
}

#audio-controls label {
    display: flex;
    align-items: center;
    gap: 8px;
}

#audio-controls input[type="range"] {
    width: 100px;
    accent-color: #00ff00;
}

#frequency-display {
    min-width: 60px;
}
```

- [ ] **Step 4: Add reduced motion support**

```css
/* Add to src/styles/main.css */

@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

- [ ] **Step 5: Final polish and testing**

Manual comprehensive test:
- [ ] CW keyer works with mouse
- [ ] CW keyer works with touch (mobile)
- [ ] CW keyer works with keyboard (Space/Enter)
- [ ] Audio plays correctly
- [ ] Volume slider works
- [ ] Frequency slider works
- [ ] QSOs increment correctly (1 for dit, 2 for dah)
- [ ] Factories generate QSOs passively
- [ ] Factory purchasing works
- [ ] Multi-buy unlocks after 10 total factories
- [ ] License upgrades work
- [ ] Save/load works
- [ ] Export/import works
- [ ] Responsive layout works on mobile
- [ ] No console errors

- [ ] **Step 6: Final commit**

```bash
git add index.html src/js/main.js src/styles/main.css
git commit -m "feat: add audio controls, reduced motion support, and final polish"
```

---

## Success Criteria Verification

Before marking complete, verify all success criteria from spec:

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

## Post-MVP Stretch Goals (Not in this plan)

- Morse code decoder display (show letters as you tap)
- Achievement system (WAS, DXCC badges)
- Prestige system (reset for multipliers)
- Events (contest weekends)
- Sound effects for purchases
- Animations for QSO generation

---

*Plan created: 2025-03-19*
*Ready for implementation*
