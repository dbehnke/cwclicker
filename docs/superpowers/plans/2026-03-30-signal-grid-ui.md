<!-- markdownlint-disable MD013 -->

# Signal Grid UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Factory Store into a responsive "Signal Grid" to showcase 16-bit icons as the primary UI focus.

**Architecture:** Refactor `FactoryCard.vue` to a vertical tile layout and update `App.vue` to wrap the factory list and mystery factory in a single CSS grid container.

**Tech Stack:** Vue 3, Tailwind CSS, Vite.

---

## Chunk 1: Grid Container Setup

### Task 1: Update App.vue Layout

**Files:**

- Modify: `src/App.vue`

- [ ] **Step 1: Locate the factory store loop**
      In `src/App.vue`, find the `<div class="space-y-4">` that contains the `FactoryCard` loop (approx. lines 227-272).

- [ ] **Step 2: Apply Grid classes to a shared container**
      Update the container to use a responsive grid that includes both the loop and the mystery factory:

```html
<div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <FactoryCard
    v-for="factory in availableFactories"
    :key="factory.id"
    :factory="factory"
    @buy="handleFactoryBuy"
  />

  <!-- Mystery Factory Card integrated into grid -->
  <div
    v-if="nextMysteryFactory"
    class="flex flex-col rounded border-2 border-terminal-green/60 bg-terminal-bg p-4 opacity-90 h-full transition-all hover:border-terminal-amber/30"
    data-testid="mystery-factory-card"
  >
    <!-- Top: Icon placeholder -->
    <div
      class="flex-shrink-0 mb-3 flex justify-center bg-black/40 p-4 rounded border border-terminal-green/10"
    >
      <span class="text-4xl">❓</span>
    </div>

    <!-- Middle: Info -->
    <div class="flex-1 flex flex-col min-w-0">
      <div class="flex justify-between items-start mb-1">
        <h3 class="text-lg font-bold text-terminal-green leading-tight">???</h3>
        <span class="text-[10px] text-terminal-amber font-mono opacity-60 uppercase tracking-wider"
          >[Tier ?]</span
        >
      </div>

      <p class="text-[10px] text-gray-500 mb-3 italic line-clamp-3 min-h-[3rem]">
        A new signal source is nearby. Build your station to reveal it.
      </p>

      <div class="mb-4 space-y-0.5" data-testid="mystery-production">
        <div class="text-terminal-amber/50 font-bold text-sm">???/sec</div>
        <div class="text-[10px] text-gray-600">(??? each)</div>
      </div>
    </div>

    <!-- Bottom: Action Row -->
    <div
      class="mt-auto pt-4 border-t border-terminal-green/20 flex items-center justify-between gap-2"
      data-testid="mystery-action-row"
    >
      <span class="text-terminal-green font-mono font-bold">???</span>
      <button
        disabled
        class="rounded px-4 py-1.5 font-bold bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed text-sm uppercase tracking-wide"
      >
        Buy
      </button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/App.vue
git commit -m "ui: change factory store container to responsive grid layout"
```

---

## Chunk 2: FactoryCard Component Refactor

### Task 2: Refactor FactoryCard.vue to Vertical Tile

**Files:**

- Modify: `src/components/FactoryCard.vue`

- [ ] **Step 1: Update template structure to vertical flex**
      Replace the template content (lines 146-198) with a vertical tile structure.
      Note: We keep the production stats in a hover-revealed overlay on desktop (as per spec) while keeping them always visible on mobile for clarity.

```html
<template>
  <div
    class="flex flex-col rounded border-2 border-terminal-green bg-terminal-bg p-4 h-full transition-all hover:border-terminal-amber/50 group relative overflow-hidden"
    data-testid="factory-card-root"
  >
    <!-- Top: Large Icon Display (matching spec: ~80-96px) -->
    <div
      class="flex-shrink-0 mb-3 flex justify-center bg-black/40 p-4 rounded border border-terminal-green/10 group-hover:bg-black/60 transition-colors"
    >
      <IconRenderer :icon="factory.icon" type="factory" fallback="Radio" size="80" />
    </div>

    <!-- Middle: Info and Stats -->
    <div class="flex-1 flex flex-col min-w-0">
      <div class="flex justify-between items-start mb-1">
        <h3
          class="text-lg font-bold text-terminal-green leading-tight truncate mr-1"
          :title="displayName"
        >
          {{ displayName }}
        </h3>
        <span
          v-if="ownedCount > 0"
          class="text-xs font-bold text-terminal-amber px-1.5 py-0.5 border border-terminal-amber/30 rounded"
        >
          Owned {{ ownedCount }}
        </span>
      </div>

      <p class="text-[10px] uppercase tracking-wider text-terminal-amber/70 mb-2 font-mono">
        Tier {{ factory.tier }}
      </p>

      <div
        class="text-xs text-gray-400 mb-3 italic line-clamp-3 min-h-[3rem]"
        :title="displayDescription"
      >
        {{ displayDescription }}
      </div>

      <!-- Desktop Hover Overlay for Stats / Mobile Always Visible -->
      <div
        class="mb-4 space-y-0.5 transition-all duration-300 lg:opacity-0 lg:group-hover:opacity-100"
        data-testid="factory-production"
      >
        <div class="text-terminal-amber font-bold text-sm">{{ formatRate(actualOutput) }}/sec</div>
        <div v-if="ownedCount > 0" class="text-[10px] text-gray-500">
          ({{ formatRate(effectivePerFactoryRate) }}/sec × {{ ownedCount }})
        </div>
        <!-- Preserve Upgrade Progress -->
        <div
          v-if="upgradeProgressText"
          class="text-[9px] text-terminal-amber/80 mt-1 font-mono leading-tight"
          data-testid="factory-upgrade-progress"
        >
          {{ upgradeProgressText }}
        </div>
      </div>
    </div>

    <!-- Bottom: Action Row -->
    <div
      class="mt-auto pt-4 border-t border-terminal-green/20 flex items-center justify-between gap-2"
      data-testid="factory-action-row"
    >
      <span class="text-terminal-green font-mono font-bold">{{ formatNumber(currentCost) }}</span>
      <button
        @click="handleBuy"
        :disabled="!canBuy"
        class="rounded px-4 py-1.5 font-bold transition-all text-sm uppercase tracking-wide"
        :class="{
          'bg-terminal-green text-terminal-bg hover:bg-terminal-amber hover:text-black active:scale-95': canBuy,
          'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed': !canBuy,
        }"
      >
        Buy
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FactoryCard.vue
git commit -m "ui: refactor FactoryCard to vertical tile layout with emphasized icon and hover stats"
```

---

## Chunk 3: Verification

### Task 3: Visual and Functional Check

- [ ] **Step 1: Build the project**
      Run: `npm run build`
      Expected: Successful build without asset errors.

- [ ] **Step 2: Run verification tests**
      Run: `npx vitest run src/components/__tests__/FactoryCard.test.js`
      Expected: PASS.

- [ ] **Step 3: Commit verification results**

```bash
git commit --allow-empty -m "test: verify grid layout build and tests pass"
```
