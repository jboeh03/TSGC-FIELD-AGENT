// Vercel serverless function (Edge runtime).
// POST /api/vision  { imageDataUrl: "data:image/jpeg;base64,..." }
// → { brandId, brandName, model, serial, fuel, btu, year, rawText }
//
// The Anthropic API key lives only in Vercel env vars — never the browser.
// Set ANTHROPIC_API_KEY in the Vercel project dashboard.

export const config = { runtime: "edge" };

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

export default async function handler(req) {
  if (req.method === "GET") {
    // Cheap health-check so the UI can show "Vision API ready".
    return json({ ok: true, configured: Boolean(process.env.ANTHROPIC_API_KEY), model: process.env.ANTHROPIC_VISION_MODEL || DEFAULT_MODEL });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "ANTHROPIC_API_KEY not set on the server" }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { imageDataUrl } = body || {};
  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    return json({ error: "imageDataUrl is required" }, 400);
  }

  const m = imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!m) return json({ error: "imageDataUrl must be a base64 JPEG/PNG/WEBP/GIF data URL" }, 400);
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
    return json({ error: "Upstream fetch failed", details: String(err) }, 502);
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return json({ error: `Anthropic API ${upstream.status}`, details: text.slice(0, 600) }, 502);
  }

  const result = await upstream.json();
  const text = (result.content || []).map((c) => c.text || "").join("").trim();

  // Be forgiving — strip fences if the model added them.
  const jsonText = (text.match(/\{[\s\S]*\}/) || [text])[0];
  let parsed;
  try { parsed = JSON.parse(jsonText); }
  catch { return json({ error: "Could not parse model output as JSON", raw: text.slice(0, 600) }, 502); }

  // Normalize brandId to our enum.
  if (parsed.brandId && !KNOWN_BRAND_IDS.includes(parsed.brandId)) {
    parsed.brandId = "other";
  }

  return json({
    ok: true,
    model,
    usage: result.usage || null,
    ...parsed,
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
