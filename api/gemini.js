import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  try {
    const geminiRes = await axios.post(
      "https://api.openai.com/v1/responses",
      { model: "gpt-5-mini", input: prompt },
      { headers: { Authorization: `Bearer ${process.env.GEMINI_API_KEY}`, "Content-Type": "application/json" } }
    );

    const answer = geminiRes.data.output?.[0]?.content?.[0]?.text || "No response";
    res.json({ answer });
  } catch (err) {
    console.error("Gemini API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Gemini request failed" });
  }
}
