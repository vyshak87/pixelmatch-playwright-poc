import fs from "fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { writeJSON } from "./fs.util.js";
import path from "path";

export function runPixelmatch(paths, threshold) {
   if (!fs.existsSync(paths.baseline) || !fs.existsSync(paths.actual)) {
    console.warn("⚠️ Missing baseline or actual image. Skipping comparison.");
    return { skipped: true };
  }

  fs.mkdirSync(path.dirname(paths.diff), { recursive: true });
  const img1 = PNG.sync.read(fs.readFileSync(paths.baseline));
  const img2 = PNG.sync.read(fs.readFileSync(paths.actual));

  if (img1.width !== img2.width || img1.height !== img2.height) {
    throw new Error("Image size mismatch");
  }

  const diff = new PNG({ width: img1.width, height: img1.height });

  const mismatches = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    img1.width,
    img1.height,
    { threshold }
  );

  fs.writeFileSync(paths.diff, PNG.sync.write(diff));

  const percent = (mismatches / (img1.width * img1.height)) * 100;

  writeJSON(paths.meta, {
    mismatches,
    percent,
    threshold,
    timestamp: new Date().toISOString()
  });

  return { mismatches, percent };
}
