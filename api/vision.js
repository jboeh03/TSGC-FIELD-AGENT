// Vercel Node serverless function (default runtime, declared via package.json engines).
// POST /api/vision  { imageDataUrl: "data:image/jpeg;base64,..." }
// → { brandId, brandName, model, serial, fuel, btu, year, rawText }
//
// The Anthropic API key lives only in Vercel env vars — never the browser.
// Set ANTHROPIC_API_KEY in the Vercel project dashboard.

const DEFAULT_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";

const KNOWN_BRAND_IDS = [
  "weber", "napoleon", "broilking", "char-broil", "traeger", "pit-boss",
  "kamado-joe", "big-green-egg", "blackstone", "lynx", "dcs", "twin-eagles",
  "other",
];

const SYSTEM = `You read the rating plate of a barbecue grill from a photograph and return identifying information for a field service technician. Return ONLY a single valid JSON object — no prose, no markdown fences, no commentary. Use null for any field you cannot determine confidently.`;

const USER_INSTRUCTIONS = `Look at this photo of a grill's rating plate (or, if not a rating plate, the grill itself). Extract its identifying info as JSON with this exact shape:

{
  "brandId":   one of ${JSON.stringify(KNOWN_BRAND_IDS)} — pick the closest match, or "other",
  "brandName": the brand name as written on the plate (e.g. "Weber", "Napoleon", "Char-Broil"),
  "model":     the model number (e.g. "61014001", "PRO22BLK"),
  "serial":    the serial number,
  "fuel":      one of "lp" | "ng" | "pellet" | "charcoal" | "electric" | null,
  "btu":       BTU rating as an integer, or null,
  "year":      year of manufacture as a 4-digit string, or null,
  "rawText":   all visible text on the plate, concatenated with newlines
}

Return ONLY the JSON object — no \`\`\` fences, no explanation.`;

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

export default async function handler(req, res) {
  // Cheap health-check so the UI can show "Vision API ready".
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      configured: Boolean(process.env.ANTHROPIC_API_KEY),
      model: process.env.ANTHROPIC_VISION_MODEL || DEFAULT_MODEL,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set on the server" });
  }

  // Vercel auto-parses JSON bodies, but be defensive.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON" }); }
  }

  const { imageDataUrl } = body || {};
  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    return res.status(400).json({ error: "imageDataUrl is required" });
  }

  const m = imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!m) {
    return res.status(400).json({ error: "imageDataUrl must be a base64 JPEG/PNG/WEBP/GIF data URL" });
  }
  const [, mediaType, data] = m;

  const model = process.env.ANTHROPIC_VISION_MODEL || DEFAULT_MODEL;

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: SYSTEM,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data } },
            { type: "text",  text: USER_INSTRUCTIONS },
          ],
        }],
      }),
    });
  } catch (err) {
    return res.status(502).json({ error: "Upstream fetch failed", details: String(err) });
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return res.status(502).json({ error: `Anthropic API ${upstream.status}`, details: text.slice(0, 600) });
  }

  const result = await upstream.json();
  const text = (result.content || []).map((c) => c.text || "").join("").trim();

  // Strip fences if the model added them.
  const jsonText = (text.match(/\{[\s\S]*\}/) || [text])[0];
  let parsed;
  try { parsed = JSON.parse(jsonText); }
  catch { return res.status(502).json({ error: "Could not parse model output as JSON", raw: text.slice(0, 600) }); }

  if (parsed.brandId && !KNOWN_BRAND_IDS.includes(parsed.brandId)) {
    parsed.brandId = "other";
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    ok: true,
    model,
    usage: result.usage || null,
    ...parsed,
  });
}
