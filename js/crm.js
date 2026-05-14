// Client wrapper for the /api/customers endpoint backed by a Google Sheet.

const ENDPOINT = "/api/customers";

let healthCache = null;

export async function crmHealth(force = false) {
  if (!force && healthCache) return healthCache;
  try {
    const r = await fetch(`${ENDPOINT}?health=1`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    healthCache = {
      available: !!data.configured,
      range: data.range || null,
      error: null,
    };
  } catch (err) {
    healthCache = { available: false, range: null, error: String(err.message || err) };
  }
  return healthCache;
}

export async function searchCustomers(query) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const r = await fetch(`${ENDPOINT}?${params.toString()}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${r.status}`);
  }
  return data.results || [];
}

export async function getCustomerById(id) {
  const r = await fetch(`${ENDPOINT}?id=${encodeURIComponent(id)}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${r.status}`);
  }
  return (data.results && data.results[0]) || null;
}
