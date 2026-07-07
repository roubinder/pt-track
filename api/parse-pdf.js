// Vercel serverless function — proxies PDF parsing to Anthropic API.
// Runs server-side so the API key never touches the browser,
// and avoids the HTTP/2 protocol error from direct browser calls.

const SYSTEM_PROMPT = `You are parsing a physical therapy Home Exercise Program PDF.
Extract every exercise and return ONLY a JSON array — no markdown, no explanation, no backticks.

Each item in the array must have exactly these fields:
{
  "name": "exercise name as written in the PDF",
  "sets": number or null,
  "reps": number or null,
  "holdSeconds": number or null (convert "30 sec." → 30, null if N/A),
  "frequency": "daily" or "alternate" (daily if 7x/week or daily, alternate if 3x/week or every other day),
  "formCues": "the patient-specific exercise directions verbatim, condensed to 1-2 sentences max"
}

Rules:
- If both reps and holdSeconds are present, include both (it's a reps-with-hold exercise).
- If Sets is N/A in the PDF but Reps has a value, treat Reps as the set count and sets as 1.
- Return null for any field that is genuinely N/A or missing.
- Return ONLY the JSON array. No other text.`;

// Tell Vercel to allow larger request bodies (PDFs can be several MB as base64)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Vercel parses JSON body automatically when Content-Type is application/json
  const pdfBase64 = req.body?.pdfBase64;
  if (!pdfBase64) {
    return res.status(400).json({ error: "Missing pdfBase64 in request body" });
  }

  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Anthropic API key not configured on server" });
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
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64,
                },
              },
              {
                type: "text",
                text: "Extract all exercises from this PT home exercise program PDF.",
              },
            ],
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
