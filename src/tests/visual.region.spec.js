import { test, expect } from '@playwright/test';
import fs from 'fs';
import { pathsFor } from '../utils/paths.js';

test('Visual: Header element only (region test)', async ({ page }) => {

  await page.goto('https://playwright.dev');

  const name = 'header-region';
  const p = pathsFor(name);

  // Ensure folders
  fs.mkdirSync('actual', { recursive: true });
  fs.mkdirSync('baseline', { recursive: true });
  fs.mkdirSync('diff', { recursive: true });

  // 1️⃣ SELECT REGION (HEADER)
  const header = page.getByRole('img',{name:'Browsers (Chromium, Firefox, WebKit)'});   // <-- any element
  await header.waitFor();

  // 2️⃣ CAPTURE ONLY THAT ELEMENT
  await header.screenshot({ path: p.actual });

  // 3️⃣ If baseline missing → create it
  if (!fs.existsSync(p.baseline)) {
    fs.copyFileSync(p.actual, p.baseline);
    console.log('Baseline created for element region.');
    return;
  }

  // 4️⃣ Run pixelmatch comparison for this element only
  const { execSync } = await import('child_process');

  try {
    execSync(`node ./src/utils/compare.js ${name} 0.1 0.0`, { stdio: 'inherit' });

    // 5️⃣ Optional: AI enhancement
    execSync(`node ./src/utils/ai-analyze.js ${name}`, { stdio: "inherit" });
    execSync(`node ./src/utils/report-generator.js`, { stdio: "inherit" });

    expect(true).toBe(true);

  } catch (e) {
    console.log('Comparison failed — running AI...');
    execSync(`node ./src/utils/ai-analyze.js ${name}`, { stdio: "inherit" });
    execSync(`node ./src/utils/report-generator.js`, { stdio: "inherit" });

    expect(false).toBe(true);
  }
});
