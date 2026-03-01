export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY in Vercel environment variables",
      });
    }

    const { text } = req.body ?? {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text input" });
    }

    const prompt = `
You are an expert truck dispatcher AI assistant.

Analyze the broker/load message below.

Extract structured data and evaluate profitability.

Return ONLY valid JSON with this exact structure:

{
  "origin": "",
  "destination": "",
  "rate": number | null,
  "estimated_miles": number | null,
  "rate_per_mile": number | null,
  "suggested_rate": number | null,
  "dispatcher_commission_10_percent": number | null,
  "risk_level": "low" | "medium" | "high",
  "analysis": ""
}

Rules:
- If rate missing, use null
- If miles missing, estimate reasonably
- Risk is HIGH if rate_per_mile < 1.8
- Risk is MEDIUM if rate_per_mile between 1.8 and 2.2
- Risk is LOW if rate_per_mile > 2.2
- Keep analysis short and professional
- Return JSON only (no extra text)

Broker Message:
${text}
`.trim();

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.2,
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      return res.status(500).json({
        error: "OpenAI API error",
        details: errText,
      });
    }

    const data = await openaiResponse.json();

    // Extract model text safely
    let outputText = "";

    try {
      outputText =
        data.output?.[0]?.content?.[0]?.text ??
        data.output_text ??
        "";
    } catch {
      outputText = data.output_text ?? "";
    }

    if (!outputText) {
      return res.status(500).json({
        error: "AI returned empty response",
      });
    }

    // Try parsing JSON strictly
    let parsed;

    try {
      parsed = JSON.parse(outputText);
    } catch {
      // Attempt to extract JSON block if model added extra text
      const match = outputText.match(/\{[\s\S]*\}/);
      if (!match) {
        return res.status(500).json({
          error: "AI did not return valid JSON",
          raw: outputText,
        });
      }
      parsed = JSON.parse(match[0]);
    }

    return res.status(200).json({
      ok: true,
      data: parsed,
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
