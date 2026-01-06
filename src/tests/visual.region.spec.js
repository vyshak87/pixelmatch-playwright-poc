import { test, expect } from '@playwright/test';
import { runVisualTest } from "../utils/visual-runner.util.js";


test('Visual: Landing page multiple regions', async ({ page }, testInfo) => {

  await page.goto('https://playwright.dev');

  const regions = [
    {
      name: 'header',
      element: page.getByRole('img', { name: 'Browsers (Chromium, Firefox, WebKit)' })
    },
    {
      name: 'hero-section',
      element: page.locator('.hero__titless')
    },
    {
      name: 'footer',
      element: page.locator('h2', { hasText: 'Chosen by companies and open source projects' })
    }
  ];

  const results = [];

  for (const region of regions) {
    const result = await runVisualTest(
      page,
      `landing-${region.name}`,
      {
        browserName: testInfo.project.name,
        element: region.element
      }
    );

    results.push({ region: region.name, result });
  }

  // 🔴 Fail test if ANY region fails
  const failed = results.filter(r => !r.result.passed);

  if (failed.length > 0) {
    console.log('❌ Failed regions:', failed.map(f => f.region));
  }

  expect(failed.length).toBe(0);
});
