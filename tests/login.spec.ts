import { test, expect } from '@playwright/test';

test('login wanderkit', async ({ page }) => {
  await page.goto('/');

  const input = page.locator('input[type="password"]');

  await input.fill(process.env.SITE_PASSWORD!);

  await input.press('Enter');

  await expect(input).not.toBeVisible();
});