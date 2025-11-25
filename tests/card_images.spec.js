// @ts-check
import { test, expect } from '@playwright/test';

test('card images load successfully in barracks', async ({ page }) => {
  // Go to the app
  await page.goto('https://blitzkrieg-tcg.web.app');

  // Navigate to Barracks
  await page.getByRole('button', { name: 'Barracks' }).click();

  // Wait for at least one card image to appear
  // We look for images that have src containing "pollinations" OR "firebasestorage"
  const firstCardImage = page.locator('img[src*="pollinations"], img[src*="firebasestorage"]').first();
  await expect(firstCardImage).toBeVisible({ timeout: 30000 });

  // Optional: Check if the image loaded without error
  // We wait for the naturalWidth to be > 0 (polling)
  await expect.poll(async () => {
    const img = page.locator('img[src*="pollinations"], img[src*="firebasestorage"]').first();
    return await img.evaluate((node) => node instanceof HTMLImageElement && node.naturalWidth > 0);
  }, {
    message: 'Image should have naturalWidth > 0',
    timeout: 10000,
  }).toBeTruthy();
});
