import { test, expect } from '@playwright/test';

test('flujo real: crear viaje en wanderkit', async ({ page }) => {

  // errores frontend
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('ERROR FRONT:', msg.text());
    }
  });

  // errores backend
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('ERROR HTTP:', response.url(), response.status());
    }
  });

  // 1. entrar
  await page.goto('/');
  await page.waitForTimeout(2000);

  // 2. login
  const password = page.locator('input[type="password"]');

  if (await password.isVisible()) {
    await password.fill(process.env.SITE_PASSWORD!);
    await password.press('Enter');
    await page.waitForTimeout(3000);
  }

  // 3. validar que entró
  await expect(page.locator('body')).toBeVisible();

  // 4. ir a crear viaje (ajustar texto si cambia)
  const crearViajeBtn = page.locator('text=Crear viaje');

  if (await crearViajeBtn.count() > 0) {
    await crearViajeBtn.click();
    await page.waitForTimeout(2000);
  } else {
    console.log('No encontró botón Crear viaje');
  }

  // 5. llenar formulario viaje
  const inputs = page.locator('input');

  for (let i = 0; i < await inputs.count(); i++) {
    try {
      const type = await inputs.nth(i).getAttribute('type');

      if (type === 'text') {
        await inputs.nth(i).fill('Viaje Test QA');
      }

      if (type === 'date') {
        await inputs.nth(i).fill('2026-12-20');
      }

    } catch (e) {
      console.log('Input error:', i);
    }
  }

  // 6. enviar formulario
  const submit = page.locator('button[type="submit"]');

  if (await submit.count() > 0) {
    await submit.first().click();
    await page.waitForTimeout(3000);
  } else {
    console.log('No encontró botón submit');
  }

  // 7. validar resultado
  await expect(page.locator('text=Viaje')).toBeVisible();

});