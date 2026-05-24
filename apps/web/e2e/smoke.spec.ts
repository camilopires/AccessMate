import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  // Start each test from a clean localStorage so the empty states are
  // deterministic.
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  });
});

test('first run lands on Incidents tab, axe-clean', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Incidents' })).toBeVisible();
  await expect(page.getByRole('button', { name: /start a new report/i })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('Passport empty state shows the set-up CTA', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /passport/i }).click();
  await expect(page.getByRole('heading', { name: /set up your passport/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /set up passport/i })).toBeVisible();
});

test('Settings tab renders accessibility + about sections', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /settings/i }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByText(/font scale/i)).toBeVisible();
});

test('Report flow → draft assembled → lands on incident detail', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /start a new report/i }).click();
  await expect(page.getByRole('heading', { name: 'What happened?' })).toBeVisible();

  await page.locator('select').nth(0).selectOption('avanti-west-coast');
  await page.locator('select').nth(1).selectOption('missed-passenger-assist');
  await page.getByRole('radio', { name: 'Alone' }).click();
  await page.getByRole('button', { name: /draft complaint/i }).click();

  await expect(page.getByRole('heading', { name: /missed passenger assist/i })).toBeVisible();
  await expect(page.getByText('Outgoing letter').first()).toBeVisible();
});

test('Profile editor: toggle a sensory switch → save → fact visible on passport', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^passport$/i }).click();
  await page.getByRole('button', { name: /set up passport/i }).click();
  await expect(page.getByRole('heading', { name: 'Your accessibility profile' })).toBeVisible();
  // Click the label itself; the inner track <span> would intercept a
  // direct click on the hidden checkbox.
  await page.locator('label.switch', { hasText: 'Hard of hearing' }).click();
  await page.getByRole('button', { name: /save profile/i }).click();
  await expect(page.getByRole('heading', { name: 'Accessibility passport' })).toBeVisible();
  await expect(page.getByText('Hard of hearing')).toBeVisible();
});
