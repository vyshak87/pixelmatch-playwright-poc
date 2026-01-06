import fs from "fs";
import path from "path";

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);

      if (fs.lstatSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    }
  }

  // ✅ Always recreate folder
  fs.mkdirSync(dir, { recursive: true });
}

export default async function globalSetup() {
  cleanDir("actual");
  cleanDir("diff");
  cleanDir("reports/ai");

  // ✅ Baseline must exist, but never cleaned
  fs.mkdirSync("baseline", { recursive: true });

  console.log("🧹 Visual folders prepared");
}
