import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Skip the onboarding wizard for every test except the dedicated one below
// by seeding localStorage before any navigation.
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.startsWith('onboarding')) return;
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem(
        'accessmate.settings.v1',
        JSON.stringify({
          fontScale: 1,
          highContrast: false,
          reduceMotion: false,
          aiProvider: 'off',
          onboardingComplete: true,
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

test('onboarding redirect on first run, Set up later returns to Incidents tab', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome to AccessMate' })).toBeVisible();
  await page.getByRole('button', { name: /set up later/i }).click();
  await expect(page.getByRole('heading', { name: 'Incidents' })).toBeVisible();
});

test('passport edit flow: empty → edit → toggle → save → fact visible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /passport/i }).click();
  await page.getByRole('button', { name: /edit profile/i }).click();
  await expect(page.getByRole('heading', { name: 'Your accessibility profile' })).toBeVisible();
  await page.getByRole('switch', { name: 'Hard of hearing' }).click();
  await page.getByRole('button', { name: /save profile/i }).click();
  await expect(page.getByRole('heading', { name: 'Accessibility passport' })).toBeVisible();
  await expect(page.getByText('Hard of hearing')).toBeVisible();
});
