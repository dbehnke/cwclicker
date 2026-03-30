# Icon Overhaul Completion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the transition from emoji-based icons to the new `IconRenderer` component across all remaining UI components, and generate base placeholder image assets for all factories and upgrades to prevent 404 errors during development.

**Architecture:** We are standardizing the visual style using the `IconRenderer.vue` component which resolves `.png` files from `src/assets/icons/`. We need to replace instances of `{{ upgrade.icon }}` and other emoji usages with `<IconRenderer>`. Then, we need to create transparent or single-pixel 1x1 `.png` placeholder files for all expected assets.

**Tech Stack:** Vue 3, Vite.

---

## Chunk 1: Component Refactoring

### Task 1: Refactor UpgradeRailDetailsSheet.vue

**Files:**

- Modify: `src/components/upgrade-rail/UpgradeRailDetailsSheet.vue`
- Test: `tests/components/upgrade-rail/UpgradeRailDetailsSheet.test.js` (if exists)

- [ ] **Step 1: Write the failing test / Verify current state**

Run: `grep -n "upgrade.icon" src/components/upgrade-rail/UpgradeRailDetailsSheet.vue`
Expected: Should show the line where the raw emoji is being rendered.

- [ ] **Step 2: Implement the minimal code**

Edit `src/components/upgrade-rail/UpgradeRailDetailsSheet.vue`:
Import `IconRenderer` and replace `{{ upgrade.icon }}` with `<IconRenderer :icon="upgrade.icon" class="w-6 h-6 inline-block mr-2" />` (adjust sizing classes to match the existing design).

- [ ] **Step 3: Run the project linter/tests to verify**

Run: `npm run lint` and `npm run test`

- [ ] **Step 4: Commit**

```bash
git add src/components/upgrade-rail/UpgradeRailDetailsSheet.vue
git commit -m "refactor: use IconRenderer in UpgradeRailDetailsSheet"
```

### Task 2: Refactor RareDxBonus.vue

**Files:**

- Modify: `src/components/RareDxBonus.vue`

- [ ] **Step 1: Verify current state**

Run: `cat src/components/RareDxBonus.vue` and identify emoji usage (usually a globe or star).

- [ ] **Step 2: Implement the minimal code**

Edit `src/components/RareDxBonus.vue` to import and use `<IconRenderer icon="dx-bonus.png" />`.

- [ ] **Step 3: Run the project linter/tests to verify**

Run: `npm run lint` and `npm run test`

- [ ] **Step 4: Commit**

```bash
git add src/components/RareDxBonus.vue
git commit -m "refactor: use IconRenderer in RareDxBonus"
```

### Task 3: Refactor AchievementList.vue

**Files:**

- Modify: `src/components/AchievementList.vue`

- [ ] **Step 1: Verify current state**

Run: `cat src/components/AchievementList.vue` and identify emoji usage for achievements.

- [ ] **Step 2: Implement the minimal code**

Edit `src/components/AchievementList.vue` to use `<IconRenderer icon="achievement.png" />` or similar, depending on the achievement structure.

- [ ] **Step 3: Run the project linter/tests to verify**

Run: `npm run lint` and `npm run test`

- [ ] **Step 4: Commit**

```bash
git add src/components/AchievementList.vue
git commit -m "refactor: use IconRenderer in AchievementList"
```

---

## Chunk 2: Placeholder Assets

### Task 4: Generate Base Placeholder Assets

**Files:**

- Create: `src/assets/icons/upgrades/bronze-upgrade.png`
- Create: `src/assets/icons/upgrades/silver-upgrade.png`
- Create: `src/assets/icons/upgrades/gold-upgrade.png`
- Create: `src/assets/icons/factories/straight-key.png` (and other factory icons)

- [ ] **Step 1: Create a generic 1x1 transparent PNG generator script**

Create `scripts/generate-placeholders.mjs` (or use a simple base64 echo) to generate 1x1 `.png` files.

- [ ] **Step 2: Generate Upgrade placeholders**

Run the script to create the `bronze-upgrade.png`, `silver-upgrade.png`, and `gold-upgrade.png` in `src/assets/icons/upgrades/`.

- [ ] **Step 3: Generate Factory placeholders**

Parse `src/constants/factories.js` to extract all `.png` filenames and run the script to create them in `src/assets/icons/factories/`.

- [ ] **Step 4: Verify Assets**

Run: `ls -la src/assets/icons/upgrades/` and `ls -la src/assets/icons/factories/`.

- [ ] **Step 5: Commit**

```bash
git add src/assets/icons/
git commit -m "chore: add placeholder PNGs for all expected icons"
```
