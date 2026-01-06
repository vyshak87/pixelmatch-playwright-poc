import fs from "fs";

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function exists(path) {
  return fs.existsSync(path);
}

export function readJSON(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

export function writeJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
