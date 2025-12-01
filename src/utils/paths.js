import path from "path";

export function pathsFor(name) {
  return {
    baseline: path.join(process.cwd(), "baseline", `${name}.png`),
    actual: path.join(process.cwd(), "actual", `${name}.png`),
    diff: path.join(process.cwd(), "diff", `${name}-diff.png`),
    meta: path.join(process.cwd(), "diff", `${name}.json`)
  };
}
