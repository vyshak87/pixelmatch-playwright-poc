import fs from "fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { pathsFor } from "./paths.js";

const args = process.argv.slice(2);
const name = args[0];
const threshold = parseFloat(args[1] || "0.1");
const minCoverage = parseFloat(args[2] || "0.5");

const p = pathsFor(name);

// First-run → create baseline
if (!fs.existsSync(p.baseline)) {
  fs.copyFileSync(p.actual, p.baseline);
  console.log("Baseline created");
  process.exit(0);
}

const img1 = PNG.sync.read(fs.readFileSync(p.baseline));
const img2 = PNG.sync.read(fs.readFileSync(p.actual));

if (img1.width !== img2.width || img1.height !== img2.height) {
  console.error("Image size mismatch.");
  process.exit(3);
}

// CLEAN previous diff file ALWAYS (correct way)
if (fs.existsSync(p.diff)) {
  fs.unlinkSync(p.diff);
}

// Clean previous metadata too
if (fs.existsSync(p.meta)) {
  fs.unlinkSync(p.meta);
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

const percent = (mismatches / (img1.width * img1.height)) * 100;

function countDifferenceAreas(diffImg, minSize = 300) {
  const width = diffImg.width;
  const height = diffImg.height;
  const data = diffImg.data;
  const visited = new Set();

  function isRedPixel(i) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    return r > 200 && g < 80 && b < 80;
  }

  function idx(x, y) {
    return (y * width + x) * 4;
  }

  function floodFill(startX, startY) {
    const stack = [[startX, startY]];
    let count = 0;

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const i = idx(x, y);
      if (visited.has(i)) continue;
      visited.add(i);

      if (!isRedPixel(i)) continue;
      count++;

      const neighbors = [
        [x + 1, y], [x - 1, y],
        [x, y + 1], [x, y - 1]
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = idx(nx, ny);
          if (!visited.has(ni)) stack.push([nx, ny]);
        }
      }
    }

    return count;
  }

  let areas = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      if (!visited.has(i) && isRedPixel(i)) {
        const areaSize = floodFill(x, y);
        if (areaSize >= minSize) {
          areas++;     // Only large “visual difference areas”
        }
      }
    }
  }

  return areas;
}

const differenceAreas = countDifferenceAreas(diff);


// Write new diff file every time
fs.writeFileSync(p.diff, PNG.sync.write(diff));

// Write metadata
const meta = {
  name,
  mismatches,
  percent,
  differenceAreas,
  threshold,
  timestamp: new Date().toISOString()
};

fs.writeFileSync(p.meta, JSON.stringify(meta, null, 2));

console.log(`Diff: ${percent.toFixed(4)}%`);

if (mismatches === 0) {
  fs.unlinkSync(p.diff);
  fs.unlinkSync(p.meta);
  console.log("No differences. Clean.");
  process.exit(0);
}

if (percent > minCoverage) {
  console.log("FAIL");
  process.exit(4);
} else {
  console.log("PASS within threshold");
  process.exit(0);
}
