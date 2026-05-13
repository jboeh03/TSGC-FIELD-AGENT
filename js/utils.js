import { AFFILIATE } from "./data.js";

// ---------- DOM helpers ----------

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "dataset") for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === "for") node.htmlFor = v;
    else if (v === true) node.setAttribute(k, "");
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function $(sel, root = document) { return root.querySelector(sel); }
export function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

export function rerender() {
  window.dispatchEvent(new CustomEvent("tsgc:rerender"));
}

// ---------- Money / format ----------

export function money(n) {
  if (n == null || isNaN(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n));
}

export function moneyRange(range) {
  if (!Array.isArray(range)) return money(range);
  const [lo, hi] = range;
  return `${money(lo)}–${money(hi)}`;
}

export function dateShort(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return dateShort(ts);
}

export function uid() { return "id_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

export function slug(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ---------- Affiliate link ----------
// Every link out to grillpartsreplacement.com must pass through here so
// the ?ref=zsgtagbs affiliate parameter is always preserved.

export function affiliateLink({ query = "", path = "" } = {}) {
  const base = AFFILIATE.baseUrl.replace(/\/$/, "");
  const cleanPath = path ? "/" + String(path).replace(/^\//, "") : "/";
  const params = new URLSearchParams();
  if (query) params.set("s", query);
  params.set("ref", AFFILIATE.ref);
  return `${base}${cleanPath}?${params.toString()}`;
}

export function manualSearchLink(brand, modelOrQuery) {
  if (!modelOrQuery) return brand?.manualSearch || "https://www.google.com/search?q=grill+owners+manual";
  const q = encodeURIComponent(`${brand?.name || ""} ${modelOrQuery} owners manual`.trim());
  return `https://www.google.com/search?q=${q}`;
}

// ---------- Toast ----------

let toastTimer;
export function toast(msg, ms = 1800) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), ms);
}

// ---------- Image helpers ----------

// Compress a captured photo to keep localStorage usage reasonable.
export async function compressImage(file, maxW = 1280, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
