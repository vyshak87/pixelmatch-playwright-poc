import { visualConfig } from "./config.util.js";
import { getPaths } from "./paths.util.js";
import { captureScreenshots } from "./screenshot.util.js";
import { runPixelmatch } from "./pixelmatch.util.js";
import { runAI } from "./ai.util.js";
import { generateReport } from "./report.util.js";
import fs from "fs";
import path from "path";

/**
 * Orchestrates the complete visual test flow:
 *  - Screenshot capture (full page or region)
 *  - Baseline handling
 *  - Pixel comparison
 *  - Optional AI analysis
 *  - Report generation
 */
export async function runVisualTest(page, name, options = {}) {
  const { browserName, element, threshold } = options;

  /**
   * browserName is mandatory because:
   * - We maintain browser-specific baselines
   * - Prevents Chrome baseline being compared with Firefox
   */
  if (!browserName) {
    throw new Error("browserName must be provided to runVisualTest");
  }

  /**
   * Resolve file paths for this test + browser
   * Example:
   *  baseline/chromium/login-page.png
   *  actual/firefox/login-page.png
   */
  const paths = getPaths(name, browserName);

  /**
   * Threshold resolution:
   * - Test-level threshold (if provided)
   * - Else fallback to global config
   */
  const finalThreshold = threshold ?? visualConfig.globalThreshold;

  /**
   * 1️⃣ Capture screenshot
   * - Full page if `element` is undefined
   * - Region screenshot if `element` is provided
   *
   * Possible outcomes:
   * - baselineCreated → first run
   * - skipped → invalid / missing element
   */
  const { baselineCreated, skipped } =
    await captureScreenshots(page, paths, { element });

  /**
   * If region is invalid / not visible:
   * - Do NOT fail the test
   * - Mark it as skipped
   * - Report layer can show this info
   */
  if (skipped) {
     // ✅ ensure diff/<browser> directory exists
   fs.mkdirSync(path.dirname(paths.meta), { recursive: true });

    fs.writeFileSync(paths.meta, JSON.stringify({
    name,
    browser: browserName,
    skipped: true,
    reason: "Element not visible or not found",
    threshold: finalThreshold,
    mismatches: 0,
    percent: 0
  }, null, 2));

  generateReport();
    
    return {
      passed: true,
      skipped: true
    };
  }

  /**
   * If baseline was created:
   * - This is an expected first-run behavior
   * - No comparison needed
   */
  if (baselineCreated) {
    console.log(`🟢 Baseline created for: ${name} [${browserName}]`);
    return { passed: true, baselineCreated: true };
  }

  try {
    /**
     * 2️⃣ Run pixelmatch comparison
     * Throws error on:
     * - Image size mismatch
     * - File read issues
     */
    const result = runPixelmatch(paths, finalThreshold);

    /**
     * If no visual differences:
     * - Generate report
     * - Mark test as passed
     */
    if (result.mismatches === 0) {
      generateReport();
      return { passed: true };
    }

    /**
     * 3️⃣ Optional AI analysis
     * Controlled via config:
     *   visualConfig.enableAI = true | false
     */
    if (visualConfig.enableAI) {
      await runAI(name, browserName);
    }

    /**
     * 4️⃣ Generate report (always)
     */
    generateReport();

    return { passed: false, ...result };

  } catch (err) {
    /**
     * Even on unexpected failure:
     * - Try AI (if enabled)
     * - Generate report for debugging
     */
    if (visualConfig.enableAI) {
      await runAI(name, browserName);
    }

    generateReport();
    throw err;
  }
}
