// Vercel serverless function — proxies PT program text to Anthropic API.
// Receives extracted PDF text (not raw binary) to stay within Vercel's 4.5MB limit.

const SYSTEM_PROMPT = `You are parsing a physical therapy Home Exercise Program.
Extract every exercise and return ONLY a JSON array — no markdown, no explanation, no backticks.

Each item in the array must have exactly these fields:
{
  "name": "exercise name as written in the document",
  "sets": number or null,
  "reps": number or null,
  "holdSeconds": number or null (convert "30 sec." → 30, null if N/A),
  "frequency": "daily" or "alternate" (daily if 7x/week or daily, alternate if 3x/week or every other day),
  "formCues": "the patient-specific exercise directions verbatim, condensed to 1-2 sentences max"
}

Rules:
- If both reps and holdSeconds are present, include both (it's a reps-with-hold exercise).
- If Sets is N/A but Reps has a value, treat Reps as the set count and sets as 1.
- Return null for any field that is genuinely N/A or missing.
- Return ONLY the JSON array. No other text.`;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pdfText = req.body?.pdfText;
  if (!pdfText) {
    return res.status(400).json({ error: "Missing pdfText in request body" });
  }

  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Anthropic API key not configured" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Here is the text extracted from a PT home exercise program PDF:\n\n${pdfText}\n\nExtract all exercises as a JSON array.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({
        error: err?.error?.message || "Anthropic API error",
      });
    }

    const data = await response.json();
    const text = data.content.find((b) => b.type === "text")?.text || "[]";

    try {
      const exercises = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json({ exercises });
    } catch {
      return res.status(500).json({
        error: "Could not parse Claude response as JSON",
        raw: text.slice(0, 200),
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "Request failed" });
  }
}
