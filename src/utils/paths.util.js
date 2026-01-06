import path from "path";

export function getPaths(testName, browserName = "default") {
  return {
    actual: path.join("actual", browserName, `${testName}.png`),
    baseline: path.join("baseline", browserName, `${testName}.png`),
    diff: path.join("diff", browserName, `${testName}-diff.png`),
    meta: path.join("diff", browserName, `${testName}.json`)
  };
}
