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

test('passport flow: empty state → edit → toggle → save → fact visible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /your accessibility passport/i }).click();
  await expect(page.getByRole('heading', { name: 'Accessibility passport' })).toBeVisible();
  await expect(page.getByText(/passport is empty/i)).toBeVisible();

  const emptyResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(emptyResults.violations).toEqual([]);

  await page.getByRole('button', { name: /edit profile/i }).click();
  await expect(page.getByRole('heading', { name: 'Your accessibility profile' })).toBeVisible();

  await page.getByRole('switch', { name: 'Hard of hearing' }).click();
  await page.getByRole('button', { name: /save profile/i }).click();

  await expect(page.getByRole('heading', { name: 'Accessibility passport' })).toBeVisible();
  await expect(page.getByText('Hard of hearing')).toBeVisible();

  const filledResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(filledResults.violations).toEqual([]);
});
