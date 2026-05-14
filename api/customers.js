// Vercel Node serverless function — reads customers from a Google Sheet.
// GET /api/customers?health=1   -> { ok, configured, range }
// GET /api/customers?q=jane     -> { ok, total, results: [...] }
// GET /api/customers?id=C001    -> { ok, total, results: [oneRow] }
//
// Env vars (set on the Vercel project):
//   GOOGLE_SHEETS_API_KEY  -- API key from Google Cloud (Sheets API enabled)
//   GOOGLE_SHEET_ID        -- the spreadsheet's document ID
//   GOOGLE_SHEET_RANGE     -- optional, defaults to "Customers!A:I"
//
// The Sheet must be readable via the API key. The simplest way: share it
// "Anyone with the link can view" — the URL is only stored in our Vercel env,
// never exposed to the client. For stricter access use a service account.

const DEFAULT_RANGE = "Customers!A:I";

// Each app-side field maps to one or more header strings on the Sheet.
// First match wins. Headers are matched case-insensitively after trimming.
const FIELD_MAP = {
  id:          ["id", "customer id", "customer_id", "cust id"],
  name:        ["name", "customer", "customer name", "full name"],
  phone:       ["phone", "phone number", "mobile", "cell"],
  email:       ["email", "email address"],
  address:     ["address", "service address", "street"],
  grillBrand:  ["grill brand", "brand"],
  grillModel:  ["grill model", "model"],
  grillSerial: ["grill serial", "serial", "serial #"],
  notes:       ["notes", "comments"],
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey  = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const range   = process.env.GOOGLE_SHEET_RANGE || DEFAULT_RANGE;

  const wantsHealth = "health" in (req.query || {});
  if (wantsHealth) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      configured: Boolean(apiKey && sheetId),
      range,
    });
  }

  if (!apiKey || !sheetId) {
    return res.status(500).json({
      error: "CRM not configured — set GOOGLE_SHEETS_API_KEY and GOOGLE_SHEET_ID in Vercel",
      configured: false,
    });
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?key=${encodeURIComponent(apiKey)}&majorDimension=ROWS`;

  let upstream;
  try {
    upstream = await fetch(url);
  } catch (err) {
    return res.status(502).json({ error: "Upstream fetch failed", details: String(err) });
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return res.status(502).json({
      error: `Google Sheets API ${upstream.status}`,
      details: text.slice(0, 500),
    });
  }

  const data = await upstream.json();
  const rows = data.values || [];
  if (rows.length < 2) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, total: 0, results: [] });
  }

  const headers = rows[0].map((h) => String(h || "").toLowerCase().trim());
  const fieldIdx = {};
  for (const [field, aliases] of Object.entries(FIELD_MAP)) {
    fieldIdx[field] = -1;
    for (const alias of aliases) {
      const i = headers.indexOf(alias);
      if (i >= 0) { fieldIdx[field] = i; break; }
    }
  }

  const customers = rows.slice(1).map((row, i) => {
    const c = { _row: i + 2 };
    for (const [field, idx] of Object.entries(fieldIdx)) {
      c[field] = idx >= 0 && row[idx] != null ? String(row[idx]).trim() : "";
    }
    return c;
  }).filter((c) => c.name || c.id);

  const q = String((req.query && req.query.q) || "").trim().toLowerCase();
  const id = String((req.query && req.query.id) || "").trim();

  let results;
  if (id) {
    results = customers.filter((c) => c.id.toLowerCase() === id.toLowerCase());
  } else if (q) {
    results = customers.filter((c) => {
      const hay = `${c.id} ${c.name} ${c.phone} ${c.email} ${c.address}`.toLowerCase();
      return hay.includes(q);
    }).slice(0, 12);
  } else {
    results = customers.slice(0, 12);
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    ok: true,
    total: customers.length,
    results,
  });
}
