import { uid } from "./utils.js";

const KEY = "tsgc.field.v1";

const DEFAULT_SETTINGS = {
  companyName: "Tri-State Grill Cleaning",
  techName: "",
  taxRate: 0,        // percent
  laborRate: 95,     // $/hr
  tripFee: 35,
  estimatePrefix: "TSGC-",
};

function emptyState() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    jobs: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      ...emptyState(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    };
  } catch {
    return emptyState();
  }
}

let state = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Storage save failed", e);
  }
}

// ---------- API ----------

export function getSettings() { return { ...state.settings }; }
export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  save();
  return getSettings();
}

export function getJobs() {
  return [...state.jobs].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function getJob(id) {
  return state.jobs.find((j) => j.id === id) || null;
}

export function createJob(partial = {}) {
  const now = Date.now();
  const job = {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    status: "open",        // open | quoted | scheduled | complete
    customer: {
      name: "",
      phone: "",
      email: "",
      address: "",
      ...(partial.customer || {}),
    },
    grill: {
      brandId: "",
      brandName: "",
      model: "",
      serial: "",
      fuel: "lp",          // lp | ng | pellet | charcoal | electric
      photoPlate: null,    // data URL
      photoGrill: null,    // data URL
      notes: "",
          ...(partial.grill || {}),
    },
    visit: {
      reason: "inspection", // inspection | cleaning | repair | other
      notes: "",
      ...(partial.visit || {}),
    },
    estimate: {
      items: [],            // [{ id, type:'part'|'labor', name, qty, price, link }]
      taxRate: state.settings.taxRate,
      laborRate: state.settings.laborRate,
      discount: 0,
      notes: "",
      ...(partial.estimate || {}),
    },
  };
  state.jobs.push(job);
  save();
  return job;
}

export function updateJob(id, patch) {
  const idx = state.jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  const cur = state.jobs[idx];
  const merged = {
    ...cur,
    ...patch,
    customer: { ...cur.customer, ...(patch.customer || {}) },
    grill: { ...cur.grill, ...(patch.grill || {}) },
    visit: { ...cur.visit, ...(patch.visit || {}) },
    estimate: { ...cur.estimate, ...(patch.estimate || {}) },
    updatedAt: Date.now(),
  };
  state.jobs[idx] = merged;
  save();
  return merged;
}

export function deleteJob(id) {
  state.jobs = state.jobs.filter((j) => j.id !== id);
  save();
}

// ---------- Estimate helpers ----------

export function addEstimateItem(jobId, item) {
  const job = getJob(jobId);
  if (!job) return null;
  const newItem = {
    id: uid(),
    type: "part",
    qty: 1,
    price: 0,
    ...item,
  };
  const items = [...job.estimate.items, newItem];
  return updateJob(jobId, { estimate: { ...job.estimate, items } });
}

export function updateEstimateItem(jobId, itemId, patch) {
  const job = getJob(jobId);
  if (!job) return null;
  const items = job.estimate.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it));
  return updateJob(jobId, { estimate: { ...job.estimate, items } });
}

export function removeEstimateItem(jobId, itemId) {
  const job = getJob(jobId);
  if (!job) return null;
  const items = job.estimate.items.filter((it) => it.id !== itemId);
  return updateJob(jobId, { estimate: { ...job.estimate, items } });
}

export function estimateTotals(estimate) {
  const subtotal = estimate.items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0);
  const discount = Number(estimate.discount || 0);
  const taxBase = Math.max(0, subtotal - discount);
  const tax = taxBase * (Number(estimate.taxRate || 0) / 100);
  const total = taxBase + tax;
  return { subtotal, discount, tax, total };
}

// ---------- Export / import ----------

export function exportAll() {
  return JSON.stringify(state, null, 2);
}

export function importAll(json) {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") throw new Error("bad json");
    state = {
      ...emptyState(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    };
    save();
    return true;
  } catch {
    return false;
  }
}

export function wipeAll() {
  state = emptyState();
  save();
}
