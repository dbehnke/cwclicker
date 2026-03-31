<!-- markdownlint-disable MD013 MD032 MD009 -->

# Three Lane Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the application into a persistent 3-column CSS Grid layout on desktop (inspired by Cookie Clicker) while maintaining a responsive tabbed view for mobile.

**Architecture:**

- Extract the current store logic into a `CompactFactoryItem.vue` and `StoreLane.vue` for the right column.
- Repurpose the existing "Signal Grid" (`FactoryCard.vue` and `FactoryList.vue`) to serve purely as the visual representation of _purchased_ factories in the center lane.
- Update `App.vue` to use a CSS Grid for desktop (`lg:grid-cols-[300px_1fr_350px]`) and tabbed navigation for mobile (`< lg`).
- Left lane: Interaction (`KeyerArea`, stats, challenges).
- Center lane: The visual Signal Grid (owned factories).
- Right lane: Upgrades and the Store (compact factory list).

**Tech Stack:** Vue 3, Tailwind CSS, Pinia

---

## Chunk 1: Compact Factory Item & Store Lane

### Task 1: Create `CompactFactoryItem.vue`

**Files:**

- Create: `src/components/CompactFactoryItem.vue`
- Modify: `src/components/StoreLane.vue` (create)

- [ ] **Step 1: Write the failing test**
      Create `tests/components/CompactFactoryItem.spec.js` (or equivalent test setup in `src/components/__tests__/CompactFactoryItem.spec.js`) to mount the component with a mock factory and test for Title, Cost, and Number Owned.

- [ ] **Step 2: Run test to verify it fails**
      Run `npx vitest run CompactFactoryItem` to see the test fail because the component doesn't exist.

- [ ] **Step 3: Write minimal implementation**
      Create `CompactFactoryItem.vue`. It should take `factory` as a prop and use `useGameStore` to get current cost and owned count.
      Layout rules:
- Container: flex, items-center, cursor-pointer, hover effect, disabled state if can't afford.
- Left: `IconRenderer` (small size, e.g., 40-48px).
- Middle: Flex-col, flex-grow. Title (text-lg, font-bold), Cost (text-sm).
- Right: Owned count (text-2xl, font-bold, text-right).

- [ ] **Step 4: Run test to verify it passes**
      Run `npx vitest run CompactFactoryItem`. Ensure it passes.

- [ ] **Step 5: Commit**
      `git add src/components/CompactFactoryItem.vue tests/` and commit.

### Task 2: Create `StoreLane.vue`

**Files:**

- Create: `src/components/StoreLane.vue`

- [ ] **Step 1: Write the failing test**
      Create a test that mounts `StoreLane` and checks that it renders `UpgradeRail` and a list of `CompactFactoryItem` components.

- [ ] **Step 2: Run test to verify it fails**
      Run tests.

- [ ] **Step 3: Write minimal implementation**
      Create `StoreLane.vue`. It should:
- Have a fixed layout (flex-col, h-full, overflow-y-auto).
- Render `UpgradeRail` at the top.
- Render a list of `CompactFactoryItem` components for each unlocked factory from `FACTORIES`.
- Emit a `buy` event or directly call `store.buyFactory` when an item is clicked.

- [ ] **Step 4: Run test to verify it passes**
      Run tests.

- [ ] **Step 5: Commit**
      Commit `StoreLane.vue`.

---

## Chunk 2: Center Lane (Signal Grid) adjustments

### Task 3: Adapt `FactoryCard.vue` and `FactoryList.vue` for the Center Lane

Currently, `FactoryCard` has a "Buy" button. For the Center Lane, we only want to show _purchased_ factories, and we don't necessarily need a buy button anymore (or we can hide it via a prop `readOnly`).

**Files:**

- Modify: `src/components/FactoryCard.vue`
- Modify: `src/components/FactoryList.vue`

- [ ] **Step 1: Write/Update the failing test**
      Update `FactoryCard` tests to support a `readOnly` prop that hides the action row.
      Update `FactoryList` tests to only render factories where `store.factoryCounts[id] > 0` (or leave it as is if we want to show unpurchased factories in the grid too, but the spec says "visual representation of all purchased factories").

- [ ] **Step 2: Run test to verify it fails**
      Run tests.

- [ ] **Step 3: Write minimal implementation**
      In `FactoryCard.vue`, add a `readOnly` Boolean prop (default `false`). If `readOnly` is true, use `v-if="!readOnly"` to hide the bottom action row containing the Buy button and cost.
      In `FactoryList.vue`, filter the `availableFactories` to only include those where `store.factoryCounts[factory.id] > 0`. Also, pass `readOnly="true"` to `FactoryCard`. Hide the MultiBuyPanel if we are in read-only mode, or move MultiBuyPanel to the Store Lane.

- [ ] **Step 4: Run test to verify it passes**
      Run tests.

- [ ] **Step 5: Commit**
      Commit changes to `FactoryCard` and `FactoryList`.

---

## Chunk 3: The 3-Lane App Layout

### Task 4: Refactor `App.vue` Layout

**Files:**

- Modify: `src/App.vue`

- [ ] **Step 1: Write/Update the failing test**
      Update the E2E or component tests for `App.vue` to check for the new 3-column layout on desktop (or just adapt the existing tab logic). The tabs should only appear on mobile screens (`lg:hidden`).

- [ ] **Step 2: Run test to verify it fails**
      Run tests (especially screenshot/layout tests if applicable, though standard vitest might just check for DOM nodes).

- [ ] **Step 3: Write minimal implementation**
      Modify `App.vue`:
- Container: `<div class="h-screen w-full flex flex-col lg:grid lg:grid-cols-[320px_1fr_350px] lg:overflow-hidden bg-terminal-bg text-gray-200">`
- Mobile Tabs Header: Add `lg:hidden` to the `<nav role="tablist">` section.
- **Left Lane** (`<section class="...">`): Contains `StatHeader`, `LicensePanel`, `KeyerArea`, `ClickIndicator`, `RareDxBonus`, `MorseChallenge`. On mobile, always visible or inside a tab? (Spec says "Responsive Tabbed Navigation view... switch between Keyer, Grid, and Store"). So Left Lane content is the "Keyer" tab on mobile. On desktop (`lg:flex lg:flex-col lg:overflow-y-auto lg:border-r lg:border-terminal-green/30 p-4`).
- **Center Lane** (`<section class="...">`): Contains `FactoryList` (The Signal Grid). On desktop (`lg:flex lg:flex-col lg:overflow-y-auto p-4`). Mobile: "Grid" tab.
- **Right Lane** (`<section class="...">`): Contains `StoreLane`. On desktop (`lg:flex lg:flex-col lg:overflow-y-auto lg:border-l lg:border-terminal-green/30 bg-black/20 p-0`). Mobile: "Store" tab.
- Update `activeTab` logic so that on desktop, all three sections are visible simultaneously. We can use a computed property `isDesktop` (using a window matchMedia listener) or just use CSS media queries (`hidden lg:flex` vs `flex` based on activeTab). Using CSS is preferred:
  - Left Lane: `:class="{'hidden lg:flex': activeTab !== 'keyer', 'flex': activeTab === 'keyer'}"`
  - Center Lane: `:class="{'hidden lg:flex': activeTab !== 'grid', 'flex': activeTab === 'grid'}"`
  - Right Lane: `:class="{'hidden lg:flex': activeTab !== 'store', 'flex': activeTab === 'store'}"`
- Rename tabs to: 'keyer', 'grid', 'store'.

- [ ] **Step 4: Run test to verify it passes**
      Run tests and check layout manually.

- [ ] **Step 5: Commit**
      Commit layout changes.

### Task 5: Final Polish and Cleanup

- [ ] **Step 1: Check UI/UX alignment**
      Ensure the `CompactFactoryItem` looks like the Cookie Clicker store items (large icon left, title/cost middle, count right). Ensure scrolling works independently in each of the 3 columns (using `overflow-y-auto` and `h-full` or `h-screen`).
      Ensure `MultiBuyPanel` is accessible (maybe put it in the `StoreLane`).

- [ ] **Step 2: Update remaining tests**
      Fix any broken Playwright E2E tests (`tests/e2e/screenshots.spec.js`) that relied on the old tab names or structures.

- [ ] **Step 3: Commit**
      Commit all final fixes.
