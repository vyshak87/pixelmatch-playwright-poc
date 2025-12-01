import { test, expect } from '@playwright/test';
import fs from 'fs';
import { pathsFor } from '../utils/paths.js';

test('Visual: Login page (Pixelmatch POC)', async ({ page }) => {

      console.log(process.env.GEMINI_API_KEY)

  const name = 'login-page';
  const p = pathsFor(name);

  // Create folders
  fs.mkdirSync('actual', { recursive: true });
  fs.mkdirSync('baseline', { recursive: true });
  fs.mkdirSync('diff', { recursive: true });

  // Go to page BEFORE screenshot
  await page.goto('https://playwright.dev/');
  await page.waitForLoadState('networkidle'); // optional but good

  // Take actual screenshot
  await page.screenshot({ path: p.actual, fullPage: true });

  // Create baseline if missing
  if (!fs.existsSync(p.baseline)) {
    fs.copyFileSync(p.actual, p.baseline);
    console.log('Baseline created.');
    return;
  }

  const { execSync } = await import('child_process');

  try {
    // Compare images
    execSync(`node ./src/utils/compare.js ${name} 0.1 0.0`, { stdio: 'inherit' });
    console.log('Comparison passed');

    // Option B → Run AI even if diff exists but test passed
    if (fs.existsSync(p.diff)) {
      console.log("Diff exists — running AI...");
      execSync(`node ./src/utils/ai-analyze.js ${name}`, { stdio: "inherit" });
      execSync(`node ./src/utils/report-generator.js`, { stdio: "inherit" });
    }

    expect(true).toBe(true);

  } catch (e) {
    console.log('Comparison failed — running AI...');
    execSync(`node ./src/utils/ai-analyze.js ${name}`, { stdio: "inherit" });
    execSync(`node ./src/utils/report-generator.js`, { stdio: "inherit" });

    expect(false).toBe(true);
  }
});