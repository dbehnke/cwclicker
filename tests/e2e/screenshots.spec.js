import { test, expect } from '@playwright/test'

test.describe('Signal Grid UI Screenshots', () => {
  async function waitForStoreBridge(page) {
    await page.waitForFunction(() => typeof window.useGameStore === 'function')
  }

  async function seedOwnedFactoryState(page) {
    await page.evaluate(() => {
      const store = window.useGameStore?.()
      if (!store) {
        return
      }

      store.qsos = 1_000_000n
      store.qsosThisRun = 1_000_000n
      store.totalQsosEarned = 1_000_000n
      store.licenseLevel = 3
      store.factoryCounts = {
        ...(store.factoryCounts || {}),
        elmer: 1,
      }

      if (typeof store.revealAffordableFactories === 'function') {
        store.revealAffordableFactories()
      }
      if (typeof store.save === 'function') {
        store.save()
      }
    })
  }

  test('Capture Store Grid - Desktop', async ({ page }) => {
    // Navigate to the app (assuming it's running on localhost:5173 via npm run dev)
    await page.goto('http://localhost:5173/cwclicker/')

    await waitForStoreBridge(page)

    // Inject state to guarantee at least one owned factory card appears
    await seedOwnedFactoryState(page)

    // Wait for the "Factories" header instead of .grid as it's more stable
    const header = page.locator('h2:has-text("Factories")')
    await expect(header).toBeVisible({ timeout: 15000 })

    // Wait for at least one factory card
    const firstCard = page.locator('[data-testid="factory-card-root"]').first()
    await expect(firstCard).toBeVisible({ timeout: 15000 })

    // Take a full page screenshot
    await page.screenshot({ path: 'docs/screenshots/signal-grid-desktop.png', fullPage: true })

    // Hover over the first factory card to show the overlay
    await firstCard.hover()

    // Wait for the overlay to appear
    await expect(page.locator('[data-testid="factory-production"]').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/signal-grid-hover.png' })
  })

  test('Capture Store Grid - Mobile', async ({ page }) => {
    // Set viewport for mobile
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('http://localhost:5173/cwclicker/')

    await waitForStoreBridge(page)
    await seedOwnedFactoryState(page)

    // Grid content is behind tabs on mobile
    await page.locator('#tab-grid').click()

    const header = page.locator('h2:has-text("Factories")')
    await expect(header).toBeVisible({ timeout: 15000 })
    await expect(page.locator('[data-testid="factory-card-root"]').first()).toBeVisible({
      timeout: 15000,
    })

    await page.screenshot({ path: 'docs/screenshots/signal-grid-mobile.png' })
  })
})
