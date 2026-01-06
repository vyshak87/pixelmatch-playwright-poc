import fs from "fs";
import sharp from "sharp";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: ""
});

/**
 * Shrink image for vision model
 */
async function shrinkImage(file) {
  const buf = await sharp(file)
    .resize(512)
    .jpeg({ quality: 60 })
    .toBuffer();
  return buf.toString("base64");
}

/**
 * Run AI analysis for a given test
 * @param {string} testName
 * @param {string} browserName
 */
export async function runAI(testName, browserName) {
  const diffPath = `diff/${browserName}/${testName}-diff.png`;
  const metaPath = `diff/${browserName}/${testName}.json`;

  console.log("AI paths →", diffPath, metaPath);

  if (!fs.existsSync(metaPath) || !fs.existsSync(diffPath)) {
    console.log("⚠️ AI skipped — diff/meta not found for", testName);
    return;
  }

  const metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));

  try {
    console.log("🤖 GPT-4o-mini Vision — AI started…");

    const diffImg = await shrinkImage(diffPath);

    const prompt = `
You are a Visual Regression AI.

You are given:
1. A DIFF image (baseline vs actual)
2. Metadata about mismatch pixels

Respond ONLY in valid JSON:

{
  "nonTechnicalSummary": "",
  "technicalAnalysis": "",
  "whatChanged": "",
  "recommendation": "",
  "severity": "LOW | MEDIUM | HIGH"
}
`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${diffImg}`
            }
          ]
        }
      ]
    });

    let aiText = response.output[0].content[0].text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let finalJson;
    try {
      finalJson = JSON.parse(aiText);
    } catch {
      finalJson = {
        nonTechnicalSummary: "AI returned invalid JSON.",
        technicalAnalysis: aiText,
        whatChanged: "Unknown",
        recommendation: "Manual review needed.",
        severity: "UNKNOWN"
      };
    }

    fs.mkdirSync("reports/ai", { recursive: true });
    fs.writeFileSync(
      `reports/ai/${testName}.json`,
      JSON.stringify(finalJson, null, 2)
    );

    console.log("✅ AI analysis saved → reports/ai/" + testName + ".json");

  } catch (err) {
    console.log("❌ AI FAILED:", err.message);

    fs.mkdirSync("reports/ai", { recursive: true });
    fs.writeFileSync(
      `reports/ai/${testName}.json`,
      JSON.stringify({
        nonTechnicalSummary: "AI failed",
        technicalAnalysis: err.message,
        whatChanged: "Unknown",
        recommendation: "Manual review required",
        severity: "UNKNOWN"
      }, null, 2)
    );
  }
}
