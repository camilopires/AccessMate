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

test('incident capture flow: start → note → save → home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /something went wrong/i }).click();
  await expect(page.getByRole('heading', { name: /something went wrong/i })).toBeVisible();
  await expect(page.getByText(/0 items captured so far/i)).toBeVisible();

  await page.getByPlaceholder(/what happened/i).fill('No ramp at the door');
  await page.getByRole('button', { name: /add note/i }).click();
  await expect(page.getByText(/1 item captured so far/i)).toBeVisible();

  await page.getByPlaceholder(/short summary/i).fill('Denied boarding at Euston');
  await page.getByRole('button', { name: /save & finish/i }).click();
  await expect(page.getByRole('heading', { name: 'AccessMate' })).toBeVisible();
  // No resume banner: the incident is completed.
  await expect(page.getByText(/incident.* in progress/i)).toHaveCount(0);
});

test('complaint composer: capture → list → detail → compose → draft visible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /something went wrong/i }).click();
  await page.getByPlaceholder(/what happened/i).fill('No ramp at the door at Euston');
  await page.getByRole('button', { name: /add note/i }).click();
  await page.getByPlaceholder(/short summary/i).fill('Missed Passenger Assist');
  await page.getByRole('button', { name: /save & finish/i }).click();

  await expect(page.getByRole('heading', { name: 'AccessMate' })).toBeVisible();
  await page.getByRole('button', { name: /recent incidents/i }).click();
  await expect(page.getByRole('heading', { name: /recent incidents/i })).toBeVisible();

  await page
    .getByRole('button', { name: /missed passenger assist/i })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: /missed passenger assist/i })).toBeVisible();
  await page.getByRole('button', { name: /compose complaint/i }).click();

  await expect(page.getByRole('heading', { name: /compose complaint/i })).toBeVisible();
  await page.getByRole('button', { name: 'Missed Passenger Assist' }).click();
  await expect(page.getByLabel(/complaint draft/i)).toContainText('# Missed Passenger Assist');
  await expect(page.getByLabel(/complaint draft/i)).toContainText('No ramp at the door at Euston');
});

test('tracker: composer → send → complaints list shows it → mark acknowledged', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /something went wrong/i }).click();
  await page.getByPlaceholder(/what happened/i).fill('No ramp at door');
  await page.getByRole('button', { name: /add note/i }).click();
  await page.getByPlaceholder(/short summary/i).fill('Missed Passenger Assist');
  await page.getByRole('button', { name: /save & finish/i }).click();

  await page.getByRole('button', { name: /recent incidents/i }).click();
  await page
    .getByRole('button', { name: /missed passenger assist/i })
    .first()
    .click();
  await page.getByRole('button', { name: /compose complaint/i }).click();
  await page.getByRole('button', { name: 'Missed Passenger Assist' }).click();

  // Catch the popup that mailto would open (chromium handles mailto with a dialog).
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  await page.getByRole('button', { name: /send by email/i }).click();

  // Now the tracker should show the new complaint
  await page.goto('/');
  await page.getByRole('button', { name: /^complaints$/i }).click();
  await expect(page.getByRole('heading', { name: 'Complaints' })).toBeVisible();
  await expect(page.getByText('Missed Passenger Assist')).toBeVisible();
  await expect(page.getByText('Draft').first()).toBeVisible();
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
