# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reservation.spec.ts >> Reservation & Dashboard Flow Validation >> Admin dashboard contains capacity and settings panels
- Location: tests\reservation.spec.ts:40:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: 'Ustawienia' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button').filter({ hasText: 'Ustawienia' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e5]:
        - generic [ref=e6]: BW
        - generic [ref=e7]: Dashboard
    - main [ref=e8]:
      - generic [ref=e9]:
        - heading "Zaloguj się" [level=1] [ref=e10]
        - generic [ref=e11]:
          - generic [ref=e12]:
            - text: Email
            - textbox [ref=e13]
          - generic [ref=e14]:
            - text: Hasło
            - textbox [ref=e15]
          - button "Zaloguj" [ref=e16] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - img [ref=e23]
  - alert [ref=e28]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Reservation & Dashboard Flow Validation', () => {
  4  |   test('User can open reservation calendar and interact with form', async ({ page }) => {
  5  |     await page.goto('/#reservation');
  6  |     await page.waitForLoadState('networkidle');
  7  | 
  8  |     // Step 1: Term
  9  |     const sectionHeading = page.locator('text=Zarezerwuj Stolik').last();
  10 |     await expect(sectionHeading).toBeVisible();
  11 | 
  12 |     // The date dropdown toggle
  13 |     const dateToggle = page.locator('button', { hasText: '202' }).first(); // Matches any "202x" year in the date picker output
  14 |     await expect(dateToggle).toBeVisible();
  15 | 
  16 |     // Click to open custom calendar
  17 |     await dateToggle.click();
  18 |     
  19 |     // Calendar should be visible (check for day names or month)
  20 |     const calendarMonth = page.locator('text=Pn').first();
  21 |     await expect(calendarMonth).toBeVisible();
  22 | 
  23 |     // Close calendar by clicking outside (the backdrop)
  24 |     await page.mouse.click(0, 0);
  25 | 
  26 |     // Form inputs should be blocked if no time selected
  27 |     const nextButton = page.locator('button', { hasText: 'Dalej' });
  28 |     await expect(nextButton).toBeDisabled();
  29 |   });
  30 | 
  31 |   test('Admin can access login page', async ({ page }) => {
  32 |     await page.goto('/admin/login');
  33 |     await page.waitForLoadState('networkidle');
  34 | 
  35 |     await expect(page.locator('h1', { hasText: 'Zaloguj się' })).toBeVisible();
  36 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  37 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  38 |   });
  39 | 
  40 |   test('Admin dashboard contains capacity and settings panels', async ({ page }) => {
  41 |     // This assumes the user is logged out and gets redirected to login, OR is logged in.
  42 |     // If we hit login, the test is fine. If we hit the dashboard, we test tabs.
  43 |     await page.goto('/admin');
  44 |     await page.waitForLoadState('networkidle');
  45 | 
  46 |     // If redirected to login, we skip deep assertions. If not, we test the new UIs.
  47 |     const url = page.url();
  48 |     if (url.includes('/admin/login')) {
  49 |       return;
  50 |     }
  51 | 
  52 |     // Check for "Ustawienia" tab
  53 |     const settingsTab = page.locator('button', { hasText: 'Ustawienia' });
> 54 |     await expect(settingsTab).toBeVisible();
     |                               ^ Error: expect(locator).toBeVisible() failed
  55 |     await settingsTab.click();
  56 | 
  57 |     // Check for capacity config
  58 |     await expect(page.locator('text=Liczba Stolików')).toBeVisible();
  59 |     await expect(page.locator('text=Czas Rezerwacji')).toBeVisible();
  60 |     
  61 |     // Check for blocked dates config
  62 |     await expect(page.locator('text=Wyłączenia & Blokady')).toBeVisible();
  63 |     await expect(page.locator('button', { hasText: 'Dodaj Blokadę' })).toBeVisible();
  64 |   });
  65 | });
  66 | 
```