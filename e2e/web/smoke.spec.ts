import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home screen loads and passes axe', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AccessMate' })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('navigating to directory shows Avanti', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /plan a trip/i }).click();
  await expect(page.getByText('Avanti West Coast')).toBeVisible();
});
