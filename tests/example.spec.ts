import { test, expect } from '@playwright/test';

test('abre wanderkit', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/wanderkit/);
});