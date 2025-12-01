import { test, expect } from '@playwright/test';
import fs from 'fs';
import { pathsFor } from '../utils/paths.js';

test('Visual: Masking dynamic elements (ads / rotating banners)', async ({ page }) => {

  await page.goto('https://sourcecad.com/autocad-dynamic-blocks/');
  
  const name = 'masked-homepage';
  const p = pathsFor(name);

  // Ensure folders
  fs.mkdirSync('actual', { recursive: true });
  fs.mkdirSync('baseline', { recursive: true });
  fs.mkdirSync('diff', { recursive: true });

  // 1️⃣ Identify dynamic elements (ads, carousels, banners)
  const dynamicElements = [
    page.locator('p[data-css="tve-u-18f01a28547"]').last() // ad block
  ];

  // 2️⃣ Mask them with Playwright (only visually hide)
  await page.screenshot({
    path: p.actual,
    fullPage: true,
    mask: dynamicElements,      // ⭐⭐ KEY LINE  
    maskColor: '#000'           // blacked-out region
  });

  // 3️⃣ Create baseline if missing
  if (!fs.existsSync(p.baseline)) {
    fs.copyFileSync(p.actual, p.baseline);
    console.log('Baseline created (masked elements).');
    return;
  }

  // 4️⃣ Compare using pixelmatch
  const { execSync } = await import('child_process');

  try {
    execSync(`node ./src/utils/compare.js ${name} 0.1 0.0`, { stdio: 'inherit' });

    // 5️⃣ AI analysis & enhanced reporting
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
