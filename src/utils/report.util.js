import fs from "fs";
import path from "path";

const REPORT_DIR = "reports";
const DIFF_DIR = "diff";
const AI_DIR = "reports/ai";

/* ---------- HELPERS ---------- */
function loadJSON(file) {
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }
  return null;
}

/* ---------- HTML TEMPLATE ---------- */
function generateHTML(sections) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Visual Report</title>

<style>
  body {
    font-family: Arial, sans-serif;
    background: #f5f6fa;
    margin: 20px;
  }

  h1 { margin-bottom: 5px; }

  .card {
    background: white;
    padding: 20px;
    border-radius: 14px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.1);
    margin-bottom: 25px;
    display: flex;
    gap: 20px;
  }

  .card.skipped {
    background: #fff3cd;
    border-left: 6px solid #ffa502;
  }

  .thumb-column {
    width: 180px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 5px;
  }

  .thumb-title {
    font-size: 14px;
    margin-bottom: 4px;
    font-weight: bold;
  }

  .thumb {
    width: 160px;
    height: 120px;
    object-fit: cover;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid #ddd;
  }

  .content {
    flex: 1;
  }

  .meta-line {
    margin-top: 5px;
    font-size: 15px;
    color: #222;
  }

  .ai-box {
    background: #eef7ff;
    padding: 15px;
    border-radius: 10px;
    margin-top: 15px;
  }

  .severity-low { color: green; font-weight: bold; }
  .severity-medium { color: orange; font-weight: bold; }
  .severity-high { color: red; font-weight: bold; }

  .skipped-msg {
    font-size: 16px;
    font-weight: bold;
    color: #856404;
  }

  .modal {
    display: none;
    position: fixed;
    z-index: 9999;
    left: 0; top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.88);
    text-align: center;
    padding: 40px 0;
  }

  .modal img {
    max-width: 95%;
    height: auto;
  }
</style>

<script>
function showFull(src) {
  const modal = document.getElementById("modal");
  document.getElementById("modalImg").src = src;
  modal.style.display = "block";
}
function closeModal() {
  document.getElementById("modal").style.display = "none";
}
</script>

</head>
<body>

<h1>Visual Report</h1>
<p>Generated: ${new Date().toLocaleString()}</p>

${sections.join("\n")}

<div id="modal" class="modal" onclick="closeModal()">
  <img id="modalImg" src="">
</div>

</body>
</html>`;
}

/* ---------- MAIN REPORT GENERATOR ---------- */
export function generateReport() {
  const sections = [];

  if (!fs.existsSync(DIFF_DIR)) {
    console.log("⚠️ No diff directory found. Skipping report.");
    return;
  }

  const browsers = fs.readdirSync(DIFF_DIR);

  for (const browser of browsers) {
    const browserDir = path.join(DIFF_DIR, browser);
    if (!fs.statSync(browserDir).isDirectory()) continue;

    const files = fs.readdirSync(browserDir);

    for (const file of files) {
      const fullPath = path.join(browserDir, file);

  

      /* ---------- 🟢 NORMAL DIFF ---------- */
      if (!file.endsWith(".json")) continue;

      const name = file.replace(".json", "");
      const meta = loadJSON(fullPath);
      if (!meta) continue;

      const ai =
        loadJSON(path.join(AI_DIR, `${name}.json`)) || {
          nonTechnicalSummary:
           meta.mismatches === 0
      ? "No visual changes detected between baseline and actual screenshots."
      : "AI analysis not available.",
          technicalAnalysis: 
          meta.mismatches === 0
      ? "Pixel-by-pixel comparison shows identical images."
      : "Technical analysis was not generated.",
          whatChanged:
            meta.mismatches === 0
      ? "No UI elements have changed."
      : "Change details unavailable.",
          recommendation:
           meta.mismatches === 0
      ? "No UI elements have changed."
      : "Change details unavailable.",
          severity:
          meta.mismatches === 0
          ? "LOW"
      : "UNKNOWN"
        };

        if (meta.skipped) {
  sections.push(`
<div class="card" style="border-left: 6px solid orange;">
  <div class="content">
    <h2>${name}</h2>

    <div class="meta-line">
      <b>Browser:</b> ${browser}
    </div>

    <div style="margin-top:10px; font-size:16px; color: orange;">
      ⚠️ Region Skipped
    </div>

    <div class="ai-box">
      <p><b>Reason:</b> ${meta.reason}</p>
    </div>
  </div>
</div>
  `);
  continue;
}


      sections.push(`
<div class="card">
  <div class="thumb-column">
    <div class="thumb-title">Baseline</div>
    <img class="thumb" src="../baseline/${browser}/${name}.png" onclick="showFull(this.src)">

    <div class="thumb-title">Actual</div>
    <img class="thumb" src="../actual/${browser}/${name}.png" onclick="showFull(this.src)">

    <div class="thumb-title">Diff</div>
    <img class="thumb" src="../diff/${browser}/${name}-diff.png" onclick="showFull(this.src)">
  </div>

  <div class="content">
    <h2>${name}</h2>

    <div class="meta-line">
      <b>Browser:</b> ${browser} |
      <b>Pixels:</b> ${meta.mismatches} |
      <b>Diff %:</b> ${meta.percent.toFixed(4)}% |
      <b>Threshold:</b> ${meta.threshold}
    </div>

    <div class="severity-${ai.severity.toLowerCase()}"
         style="margin-top:10px;">
      Severity: ${ai.severity}
    </div>

    <div class="ai-box">
      <h3>🤖 AI Summary</h3>
      <p><b>Non-Technical:</b> ${ai.nonTechnicalSummary}</p>
      <p><b>Technical:</b> ${ai.technicalAnalysis}</p>
      <p><b>What Changed:</b> ${ai.whatChanged}</p>
      <p><b>Recommendation:</b> ${ai.recommendation}</p>
    </div>
  </div>
</div>
`);
    }
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORT_DIR, "index.html"),
    generateHTML(sections)
  );

  console.log("Report generated → reports/index.html");
}
