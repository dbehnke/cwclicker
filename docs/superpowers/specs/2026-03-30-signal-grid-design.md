# Design Spec: Signal Grid UI (Factory Overhaul)

**Date:** 2026-03-30
**Status:** DRAFT
**Project:** cwclicker
**Topic:** UI Layout Redesign for Factory Store

## Goal

Transform the Factory Store from a vertical list into a responsive "Signal Grid" to better showcase custom 16-bit icons and provide a more "inventory-like" game feel.

## Visual Design

### 1. The Grid Container

- **Location:** Inside `App.vue`'s "Store" tab panel.
- **Responsive Layout:**
  - **Desktop:** `grid-cols-2` to `grid-cols-4` depending on container width.
  - **Mobile:** `grid-cols-2`.
- **Styling:** Uses existing `terminal-green` and `terminal-amber` colors with a high-contrast dark background for pixel art visibility.

### 2. The Factory Tile (`FactoryCard.vue`)

- **Structure:**
  - **Icon Display (Top):** 80x80px or 96x96px centered area. Icons are high-contrast on solid black backgrounds.
  - **Stats Overlay (Bottom):** Name and current quantity.
  - **Action Area:** The "Buy" button is integrated as a bottom footer on each tile, changing color (Green vs Gray) based on affordability.
- **Hover/Active States:**
  - Desktop hover reveals the "QSOs/sec" production stat and factory tier.
  - Subtle "signal flicker" animation when a tile is first unlocked.

## Architecture & Components

- **`FactoryCard.vue`:** Significant refactor to change from horizontal flex layout to vertical flex/grid layout.
- **`App.vue`:** Update the factory listing section to use a CSS grid container (`display: grid`) instead of a vertical stack.
- **`IconRenderer.vue`:** May need slight adjustment if icons need specific scaling/aspect-ratio handling within the new tiles.

## Trade-offs

- **Pros:** Icons are much more visible; store feels more complete and organized; better use of screen real estate on desktop.
- **Cons:** Less room for long descriptions (descriptions move to tooltips or hover states); vertical scrolling is replaced by a denser multi-column layout.

## Testing Strategy

- **Visual Regression:** Use Playwright screenshots to verify grid alignment on desktop and mobile viewports.
- **Interaction:** Ensure "Buy" button is still easily clickable (meets touch target sizes on mobile).
- **Accessibility:** Ensure tab navigation and aria-labels for quantity and production stats remain intact.
