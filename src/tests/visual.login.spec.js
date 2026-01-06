import { test, expect } from '@playwright/test';
import { runVisualTest } from "../utils/visual-runner.util.js";

test('Visual: Login page (Pixelmatch POC)', async ({ page },testInfo) => {

 await page.goto("https://playwright.dev/");

  const result = await runVisualTest(page, "Playwright landing page with normal visual check",{
    browserName:testInfo.project.name
  });

    if (!result.passed) {
    console.log("❌ Visual difference detected. See report.");
  }
  
  expect(result.passed).toBe(true);
  
  
});