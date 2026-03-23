# CW Clicker - Vue Architecture Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 1 (Foundation): Initialize the Vue 3 + Vite project, configure Tailwind CSS and Vitest, and implement the core game state (Pinia) and Keyer interaction. (Note: Factories, Licenses, and Save/Load will be implemented in subsequent Phase 2+ plans to keep tasks bite-sized).

**Architecture:** A reactive Vue 3 Single Page Application where Pinia holds the single source of truth for the game state. (Note: The `requestAnimationFrame` loop, factories, and licenses will be implemented in subsequent plans).

**Tech Stack:** Vue 3 (Composition API), Vite, Pinia, Tailwind CSS, Vitest.

---

## Chunk 1: Project Scaffolding & Setup

### Task 1: Scaffold Vite Project & Install Dependencies

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/App.vue`

- [ ] **Step 1: Scaffold Vite Vue project**
```bash
npm create vite@latest . -- --template vue --force
```

- [ ] **Step 2: Install dependencies**
```bash
npm install pinia
npm install -D tailwindcss postcss autoprefixer vitest @vue/test-utils jsdom
```

- [ ] **Step 3: Initialize Tailwind**
```bash
npx tailwindcss init -p
```

- [ ] **Step 4: Configure Tailwind**
Modify `tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'terminal-bg': '#0d1117',
        'terminal-green': '#4af626',
        'terminal-amber': '#ffb000',
      },
      fontFamily: {
        'mono': ['Courier', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Setup global CSS**
Create `src/style.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-terminal-bg text-terminal-green font-mono;
}
```

- [ ] **Step 6: Configure Vite and package scripts**
Modify `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true
  }
})
```
Add to `package.json` scripts:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest"
}
```

- [ ] **Step 7: Update main.js**
Modify `src/main.js`:
```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')
```

- [ ] **Step 8: Verify build and tests**
```bash
npm run build
```
Expected: PASS

- [ ] **Step 9: Commit**
```bash
git add .
git commit -m "chore: scaffold vue vite project with pinia and tailwind"
```

## Chunk 2: Core Game State

### Task 2: Pinia Game Store

**Files:**
- Create: `src/stores/game.js`
- Create: `src/stores/__tests__/game.test.js`

- [ ] **Step 1: Write the failing test**
Create `src/stores/__tests__/game.test.js`:
```javascript
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../game'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Game Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with 0 QSOs', () => {
    const store = useGameStore()
    expect(store.qsos).toBe(0)
  })

  it('adds QSOs when keyer is tapped (dit = 1)', () => {
    const store = useGameStore()
    store.tapKeyer('dit')
    expect(store.qsos).toBe(1)
  })

  it('adds QSOs when keyer is tapped (dah = 2)', () => {
    const store = useGameStore()
    store.tapKeyer('dah')
    expect(store.qsos).toBe(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npm run test -- src/stores/__tests__/game.test.js --run
```
Expected: FAIL (useGameStore not defined)

- [ ] **Step 3: Write minimal implementation**
Create `src/stores/game.js`:
```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  const qsos = ref(0)
  
  function tapKeyer(type) {
    if (type === 'dit') {
      qsos.value += 1
    } else if (type === 'dah') {
      qsos.value += 2
    }
  }

  return {
    qsos,
    tapKeyer
  }
})
```

- [ ] **Step 4: Run test to verify it passes**
```bash
npm run test -- src/stores/__tests__/game.test.js --run
```
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/stores/
git commit -m "feat: implement core pinia game store for qsos"
```

## Chunk 3: Audio System

### Task 3: Audio Service Module

**Files:**
- Create: `src/services/audio.js`
- Create: `src/services/__tests__/audio.test.js`

- [ ] **Step 1: Write the failing test**
Create `src/services/__tests__/audio.test.js`:
```javascript
import { describe, it, expect, vi } from 'vitest'
import { AudioService } from '../audio'

// Mock browser AudioContext
global.window = {
  AudioContext: vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn().mockReturnValue({
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn()
    }),
    createGain: vi.fn().mockReturnValue({
      gain: { setValueAtTime: vi.fn() },
      connect: vi.fn()
    }),
    destination: {}
  }))
}

describe('AudioService', () => {
  it('does not initialize AudioContext until first interaction', () => {
    const audio = new AudioService()
    expect(audio.isInitialized).toBe(false)
    audio.init()
    expect(audio.isInitialized).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npm run test -- src/services/__tests__/audio.test.js --run
```
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
Create `src/services/audio.js`:
```javascript
export class AudioService {
  constructor() {
    this.context = null
    this.oscillator = null
    this.gainNode = null
    this.isInitialized = false
    this.frequency = 600
  }

  init() {
    if (this.isInitialized) return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    this.context = new AudioContext()
    this.gainNode = this.context.createGain()
    this.gainNode.connect(this.context.destination)
    this.gainNode.gain.setValueAtTime(0, this.context.currentTime)
    this.isInitialized = true
  }

  playTone() {
    if (!this.isInitialized) this.init()
    
    this.oscillator = this.context.createOscillator()
    this.oscillator.type = 'sine'
    this.oscillator.frequency.setValueAtTime(this.frequency, this.context.currentTime)
    
    this.oscillator.connect(this.gainNode)
    this.oscillator.start()
    
    // Quick fade in to prevent clicks
    this.gainNode.gain.setTargetAtTime(0.1, this.context.currentTime, 0.01)
  }

  stopTone() {
    if (!this.oscillator) return
    
    // Quick fade out
    this.gainNode.gain.setTargetAtTime(0, this.context.currentTime, 0.01)
    
    const osc = this.oscillator
    this.oscillator = null
    
    setTimeout(() => {
      osc.stop()
      osc.disconnect()
    }, 50)
  }
}

export const audioService = new AudioService()
```

- [ ] **Step 4: Run test to verify it passes**
```bash
npm run test -- src/services/__tests__/audio.test.js --run
```
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/services/
git commit -m "feat: create web audio api service for sidetone"
```

## Chunk 4: UI Components

### Task 4: UI Components

**Files:**
- Create: `src/components/StatHeader.vue`
- Create: `src/components/KeyerArea.vue`
- Create: `src/components/__tests__/KeyerArea.test.js`
- Modify: `src/App.vue`

- [ ] **Step 1: Write the failing test**
Create `src/components/__tests__/KeyerArea.test.js`:
```javascript
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import KeyerArea from '../KeyerArea.vue'
import { useGameStore } from '../../stores/game'

vi.mock('../../services/audio', () => ({
  audioService: {
    playTone: vi.fn(),
    stopTone: vi.fn()
  }
}))

describe('KeyerArea.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('triggers tap on mousedown/mouseup', async () => {
    const wrapper = mount(KeyerArea)
    const store = useGameStore()
    
    await wrapper.trigger('mousedown')
    await wrapper.trigger('mouseup')
    
    // Fast click = dit
    expect(store.qsos).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npm run test -- src/components/__tests__/KeyerArea.test.js --run
```
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
Create `src/components/KeyerArea.vue`:
```vue
<template>
  <div 
    class="w-full h-48 border-2 border-terminal-green rounded flex items-center justify-center cursor-pointer select-none"
    @mousedown="handleDown"
    @mouseup="handleUp"
    @mouseleave="handleUp"
    @touchstart.prevent="handleDown"
    @touchend.prevent="handleUp"
  >
    <span class="text-2xl font-bold uppercase tracking-widest">
      [ CW KEYER ]
    </span>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import { audioService } from '../services/audio'

const store = useGameStore()
const startTime = ref(0)
const isDown = ref(false)

const handleDown = () => {
  if (isDown.value) return
  isDown.value = true
  startTime.value = Date.now()
  audioService.playTone()
}

const handleUp = () => {
  if (!isDown.value) return
  isDown.value = false
  audioService.stopTone()
  
  const duration = Date.now() - startTime.value
  const type = duration < 200 ? 'dit' : 'dah'
  store.tapKeyer(type)
}
</script>
```

- [ ] **Step 4: Create StatHeader component**
Create `src/components/StatHeader.vue`:
```vue
<template>
  <header class="mb-8 flex justify-between border-b border-terminal-green pb-4">
    <h1 class="text-2xl font-bold">CW CLICKER</h1>
    <div class="text-xl">QSOs: {{ store.qsos }}</div>
  </header>
</template>

<script setup>
import { useGameStore } from '../stores/game'
const store = useGameStore()
</script>
```

- [ ] **Step 5: Wire components into App.vue**
Modify `src/App.vue`:
```vue
<template>
  <div class="min-h-screen p-8 max-w-4xl mx-auto">
    <StatHeader />
    <main>
      <KeyerArea />
    </main>
  </div>
</template>

<script setup>
import StatHeader from './components/StatHeader.vue'
import KeyerArea from './components/KeyerArea.vue'
</script>
```

- [ ] **Step 6: Run tests**
```bash
npm run test -- src/components/__tests__/KeyerArea.test.js --run
```
Expected: PASS

- [ ] **Step 7: Commit**
```bash
git add src/components/ src/App.vue
git commit -m "feat: implement StatHeader and KeyerArea components"
```