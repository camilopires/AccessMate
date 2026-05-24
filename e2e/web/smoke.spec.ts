import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Seed defaults so each test starts from a known settings state.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem(
        'accessmate.settings.v1',
        JSON.stringify({
          fontScale: 1,
          highContrast: false,
          reduceMotion: false,
          aiProvider: 'off',
        }),
      );
    } catch {
      // ignore (e.g., in service-worker contexts)
    }
  });
});

test('incidents tab is the default landing and passes axe', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Incidents' })).toBeVisible();
  await expect(page.getByRole('button', { name: /start a new report/i })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('three filter chips render with row counts', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('switch', { name: /drafts \(0\)/i })).toBeVisible();
  await expect(page.getByRole('switch', { name: /in progress \(0\)/i })).toBeVisible();
  await expect(page.getByRole('switch', { name: /completed \(0\)/i })).toBeVisible();
});

test('passport tab opens the passport screen and passes axe', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /passport/i }).click();
  await expect(page.getByRole('heading', { name: 'Accessibility passport' })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('settings tab opens settings', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /settings/i }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});

test('first run lands on Incidents directly; Passport empty state shows the set-up CTA', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Incidents' })).toBeVisible();
  await page.getByRole('tab', { name: /passport/i }).click();
  await expect(page.getByRole('heading', { name: /set up your passport/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /set up passport/i })).toBeVisible();
});

test('report flow (template): walks 4 steps → lands on incident detail', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /start a new report/i }).click();
  await expect(page.getByRole('heading', { name: 'New report' })).toBeVisible();
  // Step 1: When? — Next
  await page.getByRole('button', { name: /^next$/i }).click();
  // Step 2: Operator — Avanti West Coast → Next
  await page.getByText('Avanti West Coast').click();
  await page.getByRole('button', { name: /^next$/i }).click();
  // Step 3: Scenario — Missed Passenger Assist → Next
  await page.getByText('Missed Passenger Assist').click();
  await page.getByRole('button', { name: /^next$/i }).click();
  // Step 4: Accompanied? — Alone → Draft
  await page.getByRole('switch', { name: 'Alone' }).click();
  await page.getByRole('button', { name: /draft complaint/i }).click();
  // Lands on incident detail
  await expect(page.getByRole('heading', { name: /missed passenger assist/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^send$/i })).toBeVisible();
});

test('passport edit flow: empty → set up → toggle → save → fact visible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /passport/i }).click();
  await page.getByRole('button', { name: /set up passport/i }).click();
  await expect(page.getByRole('heading', { name: 'Your accessibility profile' })).toBeVisible();
  await page.getByRole('switch', { name: 'Hard of hearing' }).click();
  await page.getByRole('button', { name: /save profile/i }).click();
  await expect(page.getByRole('heading', { name: 'Accessibility passport' })).toBeVisible();
  await expect(page.getByText('Hard of hearing')).toBeVisible();
});
