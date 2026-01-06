import fs from "fs";
import path from "path";
import { visualConfig } from "./config.util.js";

/**
 * Captures either:
 * - Full page screenshot
 * - OR region-based screenshot
 *
 * Responsibilities:
 * - Ensure folders exist
 * - Handle invalid / invisible elements
 * - Create baseline when needed
 */
export async function captureScreenshots(page, paths, options = {}) {
  const { element } = options;

  try {
    // 🔹 Ensure required directories exist
    fs.mkdirSync(path.dirname(paths.actual), { recursive: true });
    fs.mkdirSync(path.dirname(paths.baseline), { recursive: true });

    // 🔹 REGION screenshot
    if (element) {
      const visible = await element.isVisible().catch(() => false);

      if (!visible) {
        console.warn("⚠️ Element not visible, skipping region");
        return { skipped: true };
      }

      await element.screenshot({ path: paths.actual });
    }

    // 🔹 FULL PAGE screenshot
    else {
      await page.screenshot({
        path: paths.actual,
        fullPage: true
      });
    }

    // 🔹 Baseline creation / update logic
    if (!fs.existsSync(paths.baseline) || visualConfig.updateBaseline) {
      fs.copyFileSync(paths.actual, paths.baseline);
      return { baselineCreated: true };
    }

    return { baselineCreated: false };

  } catch (err) {
    console.error("❌ Screenshot failed:", err.message);
    return { skipped: true, error: err.message };
  }
}
