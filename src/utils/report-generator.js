import fs from "fs";
import path from "path";

const REPORT_DIR = "reports";
const DIFF_DIR = "diff";
const AI_DIR = "reports/ai";

function loadJSON(file) {
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }
  return null;
}

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

  /* LEFT SIDEBAR */
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

  /* 🔥 FIXED THUMBNAIL SIZE */
  .thumb {
    width: 160px;
    height: 120px; 
    object-fit: cover;     /* prevents stretching */
    border-radius: 6px;
    cursor: pointer;
    transition: transform 0.2s;
    border: 1px solid #ddd;
    background: #fff;
  }

  .thumb:hover {
    transform: scale(1.05);
  }

  /* CONTENT BLOCK */
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

  /* FULLSCREEN MODAL */
  .modal {
    display: none;
    position: fixed;
    z-index: 9999;
    left: 0; top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.88);
    overflow: auto;
    text-align: center;
    padding: 40px 0;
  }

  .modal img {
    max-width: 95%;
    height: auto;
    border-radius: 10px;
  }
</style>

<script>
function showFull(src) {
  const modal = document.getElementById("modal");
  const img = document.getElementById("modalImg");

  img.src = src;
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

<!-- FULLSCREEN MODAL -->
<div id="modal" class="modal" onclick="closeModal()">
  <img id="modalImg" src="">
</div>

</body>
</html>`;
}

// MAIN LOGIC
function run() {
  const diffFiles = fs.readdirSync(DIFF_DIR).filter(f => f.endsWith(".json"));
  const sections = [];

  for (const metaFile of diffFiles) {
    const name = metaFile.replace(".json", "");
    const meta = loadJSON(`${DIFF_DIR}/${metaFile}`);

    const ai = loadJSON(`${AI_DIR}/${name}.json`) || {
      nonTechnicalSummary: "N/A",
      technicalAnalysis: "N/A",
      whatChanged: "N/A",
      recommendation: "N/A",
      severity: "UNKNOWN"
    };

    const severityClass =
      ai.severity.toLowerCase() === "high"
        ? "severity-high"
        : ai.severity.toLowerCase() === "medium"
        ? "severity-medium"
        : "severity-low";

    const section = `
    <div class="card">
      
      <!-- LEFT THUMBNAIL COLUMN -->
      <div class="thumb-column">

        <div class="thumb-title">Baseline</div>
        <img class="thumb" src="../baseline/${name}.png" onclick="showFull(this.src)">

        <div class="thumb-title">Actual</div>
        <img class="thumb" src="../actual/${name}.png" onclick="showFull(this.src)">

        <div class="thumb-title">Diff</div>
        <img class="thumb" src="../diff/${name}-diff.png" onclick="showFull(this.src)">
      </div>

      <!-- RIGHT CONTENT -->
      <div class="content">
        
        <h2>${name}</h2>

        <div class="meta-line">
          <b>Pixels Changed:</b> ${meta.mismatches} |
          <b>Diff %:</b> ${meta.percent.toFixed(4)}% |
          <b>Threshold:</b> ${meta.threshold} |
          <b>Regions:</b> ${meta.regions ?? "N/A"}
        </div>

        <div class="severity-${ai.severity.toLowerCase()}"
             style="margin-top:10px; font-size:16px;">
          Severity: ${ai.severity}
        </div>

        <div class="ai-box">
          <h3>🤖 AI Summary</h3>
          <p><b>Non-Technical Summary:</b> ${ai.nonTechnicalSummary}</p>
          <p><b>Technical Analysis:</b> ${ai.technicalAnalysis}</p>
          <p><b>What Changed:</b> ${ai.whatChanged}</p>
          <p><b>Recommendation:</b> ${ai.recommendation}</p>
        </div>

      </div>
    </div>
    `;

    sections.push(section);
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, "index.html"), generateHTML(sections));

  console.log("Report generated → reports/index.html");
}

run();
