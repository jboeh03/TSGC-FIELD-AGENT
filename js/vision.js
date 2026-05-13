// Client wrapper for the /api/vision serverless function.

const ENDPOINT = "/api/vision";

let healthCache = null;

export async function visionHealth(force = false) {
  if (!force && healthCache) return healthCache;
  try {
    const r = await fetch(ENDPOINT, { method: "GET" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    healthCache = { available: !!data.configured, model: data.model || null, error: null };
  } catch (err) {
    healthCache = { available: false, model: null, error: String(err.message || err) };
  }
  return healthCache;
}

export async function extractFromImage(imageDataUrl) {
  const resp = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageDataUrl }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) {
    const msg = data.error || `Vision request failed (HTTP ${resp.status})`;
    const err = new Error(msg);
    err.details = data.details;
    throw err;
  }
  return data;
}
