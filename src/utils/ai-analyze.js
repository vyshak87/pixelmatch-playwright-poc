import fs from "fs";
import sharp from "sharp";
import OpenAI from "openai";

// Load OpenAI Vision Model
const openai = new OpenAI({
  apiKey: ""
});

const testName = process.argv[2];

const diffPath = `diff/${testName}-diff.png`;
const metaPath = `diff/${testName}.json`;

if (!fs.existsSync(metaPath)) {
  console.log("No metadata found. Skipping AI.");
  process.exit(0);
}

const metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));

async function shrinkImage(file) {
  const buf = await sharp(file)
    .resize(512)
    .jpeg({ quality: 60 })
    .toBuffer();
  return buf.toString("base64");
}

async function runAI() {
  try {
    console.log("🤖 GPT-4o-mini Vision — AI started…");

    const diffImg = await shrinkImage(diffPath);

    // GPT-4o-mini Vision prompt
    const prompt = `
You are a Visual Regression AI.

You are given:
1. A DIFF image (baseline vs actual)
2. Metadata about mismatch pixels

Respond ONLY in **valid JSON** with this structure:

{
  "nonTechnicalSummary": "",
  "technicalAnalysis": "",
  "whatChanged": "",
  "recommendation": "",
  "severity": "LOW | MEDIUM | HIGH"
}

DO NOT return markdown.
DO NOT wrap JSON in backticks.
DO NOT add comments.
`;

    // Call Vision Model
    const response = await openai.responses.create({
      model: "gpt-4o-mini", // or gpt-4o-mini, gpt-4o-mini-vision when fully available
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

    let aiText = response.output[0].content[0].text;

    // 🔥 SANITIZE AI OUTPUT — REMOVE ALL BAD FORMATTING
    aiText = aiText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Validate final JSON
    let finalJson;
    try {
      finalJson = JSON.parse(aiText); // ensure valid
    } catch (e) {
      console.log("⚠️ AI returned invalid JSON, wrapping into fallback...");
      finalJson = {
        nonTechnicalSummary: "AI returned invalid JSON.",
        technicalAnalysis: aiText,
        whatChanged: "Unknown due to formatting issue.",
        recommendation: "Check manually.",
        severity: "UNKNOWN"
      };
    }

    // Save clean JSON
    fs.mkdirSync("reports/ai", { recursive: true });
    const out = `reports/ai/${testName}.json`;
    fs.writeFileSync(out, JSON.stringify(finalJson, null, 2));

    console.log("✅ AI analysis saved →", out);

  } catch (err) {
    console.log("❌ AI FAILED:", err);

    const fallback = {
      nonTechnicalSummary: "AI failed to analyze image.",
      technicalAnalysis: err.message,
      whatChanged: "Unknown (AI failure)",
      recommendation: "Manual review needed.",
      severity: "UNKNOWN"
    };

    fs.mkdirSync("reports/ai", { recursive: true });
    fs.writeFileSync(
      `reports/ai/${testName}.json`,
      JSON.stringify(fallback, null, 2)
    );
  }
}

runAI();
