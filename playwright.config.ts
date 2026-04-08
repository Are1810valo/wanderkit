import * as dotenv from 'dotenv';

// 👇 carga .env.local manualmente
dotenv.config({ path: '.env.local' });

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  reporter: [['html', { open: 'never' }]],

  use: {
    baseURL: 'https://wanderkit.vercel.app',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});