import { test, expect } from '@playwright/test';

test.describe('Responsive Layout & Visual Validation', () => {
  test('Homepage maintains layout integrity and has no horizontal overflow', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be fully loaded including images and fonts
    await page.waitForLoadState('networkidle');

    // 1. Validate no horizontal overflow exists
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalOverflow, 'Found horizontal overflow on the page.').toBeFalsy();

    // 2. Validate typography and core CTAs are visible
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();

    const reservationCTA = page.locator('text=Zarezerwuj Stolik').first();
    await expect(reservationCTA).toBeVisible();

    const menuCTA = page.locator('text=Zobacz Menu').first();
    await expect(menuCTA).toBeVisible();

    // 3. Take a full page screenshot for visual regression
    await expect(page).toHaveScreenshot('homepage-full-validation.png', { fullPage: true, maxDiffPixelRatio: 0.1 });
  });

  test('Gallery section does not clip text on mobile viewports', async ({ page, isMobile }) => {
    // Only run this specific edge case check on mobile viewports
    if (!isMobile) return;

    await page.goto('/#gallery');
    await page.waitForLoadState('networkidle');

    // Check if the instagram handle is visible and within bounds
    const instaHandle = page.locator('text=@bistrowarszawacafe');
    await expect(instaHandle).toBeVisible();

    const box = await instaHandle.boundingBox();
    const viewportSize = page.viewportSize();

    if (box && viewportSize) {
      // Ensure the right edge of the text box does not exceed viewport width
      expect(box.x + box.width, 'Instagram handle is clipping horizontally').toBeLessThanOrEqual(viewportSize.width);
    }
  });
});
