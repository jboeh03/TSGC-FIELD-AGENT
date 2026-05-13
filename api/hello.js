// Tiniest possible Vercel Node function — diagnostic only.
// If GET /api/hello works but /api/vision doesn't, the issue is specific to vision.js.
// If neither works, Vercel isn't building api/ functions at all.

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    where: "api/hello",
    method: req.method,
    node: process.version,
    hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
