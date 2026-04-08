# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-user.spec.ts >> flujo real: crear viaje en wanderkit
- Location: tests\real-user.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Viaje')
Expected: visible
Error: strict mode violation: locator('text=Viaje') resolved to 8 elements:
    1) <div>Gestor de Viajes</div> aka getByText('Gestor de Viajes')
    2) <div>Mis Viajes</div> aka getByText('Mis Viajes', { exact: true })
    3) <button class="btn-press">＋ Nuevo viaje</button> aka getByRole('button', { name: '＋ Nuevo viaje' }).first()
    4) <div>Planifica cada detalle, registra lo que viviste y…</div> aka getByText('Planifica cada detalle,')
    5) <button class="btn-press fade-up-1">＋ Nuevo viaje</button> aka getByRole('button', { name: '＋ Nuevo viaje' }).nth(1)
    6) <div>Total viajes</div> aka getByText('Total viajes')
    7) <div>Mis viajes</div> aka getByText('Mis viajes', { exact: true })
    8) <div>1 viaje</div> aka getByText('1 viaje')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Viaje')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - text: Wander
          - emphasis [ref=e7]: Kit
        - generic [ref=e8]: Gestor de Viajes
      - generic [ref=e9]:
        - generic [ref=e10]: Mis Viajes
        - generic [ref=e13] [cursor=pointer]:
          - generic [ref=e14]: San Andres
          - generic [ref=e15]: San Andres Colombia
      - button "＋ Nuevo viaje" [ref=e18] [cursor=pointer]
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: Bienvenido a WanderKit
        - generic [ref=e23]:
          - text: Tus
          - emphasis [ref=e24]: aventuras,
          - text: organizadas.
        - generic [ref=e25]: Planifica cada detalle, registra lo que viviste y recuerda cada viaje para siempre.
        - button "＋ Nuevo viaje" [ref=e26] [cursor=pointer]
      - generic [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e29]: "1"
          - generic [ref=e30]: Total viajes
        - generic [ref=e31]:
          - generic [ref=e32]: "0"
          - generic [ref=e33]: En curso
        - generic [ref=e34]:
          - generic [ref=e35]: "1"
          - generic [ref=e36]: Planificados
        - generic [ref=e37]:
          - generic [ref=e38]: "0"
          - generic [ref=e39]: Finalizados
      - generic [ref=e41]:
        - generic [ref=e42]: Mis viajes
        - generic [ref=e43]: 1 viaje
      - generic [ref=e45] [cursor=pointer]:
        - generic [ref=e47]:
          - generic [ref=e48]: 🌍
          - generic [ref=e49]: Planificado
        - generic [ref=e50]:
          - generic [ref=e51]: San Andres
          - generic [ref=e52]: 📍 San Andres Colombia
          - generic [ref=e53]:
            - generic [ref=e54]: 📅 2026-05-01
            - generic [ref=e55]: 💰 $600.000
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('flujo real: crear viaje en wanderkit', async ({ page }) => {
  4  | 
  5  |   // errores frontend
  6  |   page.on('console', msg => {
  7  |     if (msg.type() === 'error') {
  8  |       console.log('ERROR FRONT:', msg.text());
  9  |     }
  10 |   });
  11 | 
  12 |   // errores backend
  13 |   page.on('response', response => {
  14 |     if (response.status() >= 400) {
  15 |       console.log('ERROR HTTP:', response.url(), response.status());
  16 |     }
  17 |   });
  18 | 
  19 |   // 1. entrar
  20 |   await page.goto('/');
  21 |   await page.waitForTimeout(2000);
  22 | 
  23 |   // 2. login
  24 |   const password = page.locator('input[type="password"]');
  25 | 
  26 |   if (await password.isVisible()) {
  27 |     await password.fill(process.env.SITE_PASSWORD!);
  28 |     await password.press('Enter');
  29 |     await page.waitForTimeout(3000);
  30 |   }
  31 | 
  32 |   // 3. validar que entró
  33 |   await expect(page.locator('body')).toBeVisible();
  34 | 
  35 |   // 4. ir a crear viaje (ajustar texto si cambia)
  36 |   const crearViajeBtn = page.locator('text=Crear viaje');
  37 | 
  38 |   if (await crearViajeBtn.count() > 0) {
  39 |     await crearViajeBtn.click();
  40 |     await page.waitForTimeout(2000);
  41 |   } else {
  42 |     console.log('No encontró botón Crear viaje');
  43 |   }
  44 | 
  45 |   // 5. llenar formulario viaje
  46 |   const inputs = page.locator('input');
  47 | 
  48 |   for (let i = 0; i < await inputs.count(); i++) {
  49 |     try {
  50 |       const type = await inputs.nth(i).getAttribute('type');
  51 | 
  52 |       if (type === 'text') {
  53 |         await inputs.nth(i).fill('Viaje Test QA');
  54 |       }
  55 | 
  56 |       if (type === 'date') {
  57 |         await inputs.nth(i).fill('2026-12-20');
  58 |       }
  59 | 
  60 |     } catch (e) {
  61 |       console.log('Input error:', i);
  62 |     }
  63 |   }
  64 | 
  65 |   // 6. enviar formulario
  66 |   const submit = page.locator('button[type="submit"]');
  67 | 
  68 |   if (await submit.count() > 0) {
  69 |     await submit.first().click();
  70 |     await page.waitForTimeout(3000);
  71 |   } else {
  72 |     console.log('No encontró botón submit');
  73 |   }
  74 | 
  75 |   // 7. validar resultado
> 76 |   await expect(page.locator('text=Viaje')).toBeVisible();
     |                                            ^ Error: expect(locator).toBeVisible() failed
  77 | 
  78 | });
```