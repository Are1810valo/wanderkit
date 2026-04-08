import { test, expect } from '@playwright/test';

test('flujo completo wanderkit', async ({ page }) => {

  // 1. Ir al home
  await page.goto('/');

  // ✅ validar que cargó algo real
  await expect(page.locator('body')).toBeVisible();

  // 2. Esperar carga
  await page.waitForTimeout(2000);

  // 3. Click en botones
  const botones = page.locator('button');
  const totalBotones = await botones.count();

  for (let i = 0; i < totalBotones; i++) {
    try {
      await botones.nth(i).click({ timeout: 2000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('Botón no clickeable:', i);
    }
  }

  // 4. Click en links
  const links = page.locator('a');
  const totalLinks = await links.count();

  for (let i = 0; i < totalLinks; i++) {
    try {
      const href = await links.nth(i).getAttribute('href');

      if (href && !href.startsWith('#')) {
        await links.nth(i).click({ timeout: 2000 });
        await page.waitForTimeout(1500);
        await page.goBack();
      }
    } catch (e) {
      console.log('Link con problema:', i);
    }
  }

  // 5. Validar que no haya errores visibles
  await expect(page.locator('text=Error')).not.toBeVisible();

});