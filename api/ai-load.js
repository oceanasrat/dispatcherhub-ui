export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel" });
    }

    const { text } = req.body ?? {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text" });
    }

    const prompt = `
You are a dispatcher assistant. Extract load details from the user's text.
Return ONLY valid JSON with keys:
origin (string), destination (string), rate (number), status (one of: booked,in_transit,delivered,invoiced,paid).
If a field is missing, use empty string for origin/destination, null for rate, and "booked" for status.

User text:
${text}
`.trim();

    const r = await fetch("https://api.openai.com/v1/responses", {
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

    if (!r.ok) {
      const errText = await r.text();
      return res.status(500).json({ error: "OpenAI error", details: errText });
    }

    const data = await r.json();

    // Pull the text output in a robust way
    let out = "";
    try {
      out =
        data.output?.[0]?.content?.[0]?.text ??
        data.output_text ??
        "";
    } catch {
      out = data.output_text ?? "";
    }

    // Ensure JSON parse
    let parsed;
    try {
      parsed = JSON.parse(out);
    } catch {
      // If model added extra text, attempt to salvage JSON block
      const m = out.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("Model did not return JSON");
      parsed = JSON.parse(m[0]);
    }

    return res.status(200).json({ ok: true, data: parsed });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
