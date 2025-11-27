// @ts-check
import { test, expect } from '@playwright/test';

test('homepage loads and has title', async ({ page }) => {
  await page.goto('https://blitzkrieg-tcg.web.app');

  // Verify the page title
  await expect(page).toHaveTitle(/Blitzkrieg TCG/);

  // Verify the main buttons are visible
  await expect(page.getByRole('button', { name: 'Battle' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Barracks' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Supply Lines' })).toBeVisible();
});