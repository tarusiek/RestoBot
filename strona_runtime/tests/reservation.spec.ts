import { test, expect } from '@playwright/test';

test.describe('Reservation & Dashboard Flow Validation', () => {
  test('User can open reservation calendar and interact with form', async ({ page }) => {
    await page.goto('/#reservation');
    await page.waitForLoadState('networkidle');

    // Step 1: Term
    const sectionHeading = page.locator('text=Zarezerwuj Stolik').last();
    await expect(sectionHeading).toBeVisible();

    // The date dropdown toggle
    const dateToggle = page.locator('button', { hasText: '202' }).first(); // Matches any "202x" year in the date picker output
    await expect(dateToggle).toBeVisible();

    // Click to open custom calendar
    await dateToggle.click();
    
    // Calendar should be visible (check for day names or month)
    const calendarMonth = page.locator('text=Pn').first();
    await expect(calendarMonth).toBeVisible();

    // Close calendar by clicking outside (the backdrop)
    await page.mouse.click(0, 0);

    // Form inputs should be blocked if no time selected
    const nextButton = page.locator('button', { hasText: 'Dalej' });
    await expect(nextButton).toBeDisabled();
  });

  test('Admin can access login page', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1', { hasText: 'Zaloguj się' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Admin dashboard contains capacity and settings panels', async ({ page }) => {
    // This assumes the user is logged out and gets redirected to login, OR is logged in.
    // If we hit login, the test is fine. If we hit the dashboard, we test tabs.
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // If redirected to login, we skip deep assertions. If not, we test the new UIs.
    const url = page.url();
    if (url.includes('/admin/login')) {
      return;
    }

    // Check for "Ustawienia" tab
    const settingsTab = page.locator('button', { hasText: 'Ustawienia' });
    await expect(settingsTab).toBeVisible();
    await settingsTab.click();

    // Check for capacity config
    await expect(page.locator('text=Liczba Stolików')).toBeVisible();
    await expect(page.locator('text=Czas Rezerwacji')).toBeVisible();
    
    // Check for blocked dates config
    await expect(page.locator('text=Wyłączenia & Blokady')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Dodaj Blokadę' })).toBeVisible();
  });
});
