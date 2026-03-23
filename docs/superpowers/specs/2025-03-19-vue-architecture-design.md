# Vue.js Architecture Design - CW Clicker

**Date:** 2025-03-19  
**Status:** Approved for Planning  

## Overview
Moving away from pure Vanilla JS to leverage Vue.js's reactivity system, which is perfectly suited for the state-driven nature of an idle clicker game.

## 1. Build Tooling & Framework
- **Vite:** For instant server start and lightning-fast HMR (Hot Module Replacement).
- **Vue 3 (Composition API):** Using `<script setup>` for clean, concise component logic.
- **Tailwind CSS:** For rapid styling of the retro terminal aesthetic without writing endless custom CSS classes.

## 2. State Management (The Core Engine)
We will use **Pinia** (Vue's official state management library) as the single source of truth.
- **Store:** `useGameStore`
- **State:** `qsos`, `factoriesOwned`, `currentLicense`, `settings` (volume, frequency).
- **Getters (Computed):** `qsosPerSecond`, `affordableFactories`, `nextLicenseCost`.
- **Actions:** 
  - `tapKeyer()`
  - `buyFactory(id)`
  - `upgradeLicense()`
  - `tick()` (the 60fps game loop that adds QSOs based on `qsosPerSecond`)
  - `save()`
  - `load()`
- The `tick()` action runs via `requestAnimationFrame`, automatically updating the state and driving the UI.

## 3. Component Structure
Isolated, single-responsibility components:
- `App.vue`: Main layout container and game loop initializer.
- `KeyerArea.vue`: Click target. Handles mouse/touch events, measures tap duration (dit vs dah), and triggers `tapKeyer()`.
- `StatHeader.vue`: Displays current QSOs and QSOs/sec.
- `FactoryList.vue`: Iterates over available factories and renders `FactoryCard`s.
- `FactoryCard.vue`: Displays info, cost, and buy button (disabled if unaffordable).
- `LicensePanel.vue`: Shows current license and progress.
- `SettingsModal.vue`: Controls for audio and game resets.

## 4. Audio Management
- **AudioService:** A plain JS module or Vue composable.
- Initializes the `AudioContext` only on the *first* interaction inside `KeyerArea.vue` to respect browser autoplay policies.
- Exposes `playTone()` and `stopTone()`.