// Canvas-based composite renderer for branded before/after share images.
// Produces square / portrait / story / landscape variants for socials + website.

import { getSettings } from "./state.js";

const BRAND_ORANGE = "#ef6b1a";
const BRAND_DARK   = "#0b1220";
const BRAND_INK    = "#9aa3bf";

const FORMATS = {
  square:    { id: "square",    label: "Square — IG / FB feed",      w: 1080, h: 1080, layout: "side"  },
  portrait:  { id: "portrait",  label: "Portrait — IG feed 4:5",     w: 1080, h: 1350, layout: "stack" },
  story:     { id: "story",     label: "Story — IG / FB / TikTok",   w: 1080, h: 1920, layout: "stack" },
  landscape: { id: "landscape", label: "Landscape — website / email", w: 1920, h: 1080, layout: "side"  },
};

export function listFormats() { return Object.values(FORMATS); }

export async function renderComposite({ before, after, formatId, subtitle }) {
  const f = FORMATS[formatId];
  if (!f) throw new Error(`Unknown format: ${formatId}`);

  const settings = getSettings();
  const companyName = (settings.companyName || "Tri-State Grill Cleaning").toUpperCase();

  const canvas = document.createElement("canvas");
  canvas.width = f.w;
  canvas.height = f.h;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = BRAND_DARK;
  ctx.fillRect(0, 0, f.w, f.h);

  // Header band
  const headerH = Math.round(f.h * 0.085);
  ctx.fillStyle = BRAND_ORANGE;
  ctx.fillRect(0, 0, f.w, headerH);

  ctx.fillStyle = BRAND_DARK;
  const headerFont = Math.round(headerH * 0.42);
  ctx.font = `900 ${headerFont}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // tracking
  fillTrackedText(ctx, companyName, f.w / 2, headerH / 2, headerFont * 0.06);

  // Footer band
  const footerH = Math.round(f.h * 0.06);
  const footerFont = Math.round(footerH * 0.42);
  ctx.fillStyle = BRAND_INK;
  ctx.font = `500 ${footerFont}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const footerText = subtitle
    ? `${subtitle}  ·  Professional grill cleaning & repair`
    : "Professional grill cleaning & repair";
  fillTrackedText(ctx, footerText, f.w / 2, f.h - footerH / 2, footerFont * 0.02);

  // Photo area
  const margin = Math.round(f.w * 0.025);
  const photoArea = {
    x: margin,
    y: headerH + margin,
    w: f.w - margin * 2,
    h: f.h - headerH - footerH - margin * 2,
  };

  const [imgBefore, imgAfter] = await Promise.all([loadImage(before), loadImage(after)]);

  if (f.layout === "side") {
    const gap = margin;
    const halfW = Math.floor((photoArea.w - gap) / 2);
    drawImageCover(ctx, imgBefore, photoArea.x,              photoArea.y, halfW, photoArea.h);
    drawImageCover(ctx, imgAfter,  photoArea.x + halfW + gap, photoArea.y, halfW, photoArea.h);
    drawLabel(ctx, "BEFORE", photoArea.x,                photoArea.y, halfW);
    drawLabel(ctx, "AFTER",  photoArea.x + halfW + gap,  photoArea.y, halfW);
  } else {
    const gap = margin;
    const halfH = Math.floor((photoArea.h - gap) / 2);
    drawImageCover(ctx, imgBefore, photoArea.x, photoArea.y,              photoArea.w, halfH);
    drawImageCover(ctx, imgAfter,  photoArea.x, photoArea.y + halfH + gap, photoArea.w, halfH);
    drawLabel(ctx, "BEFORE", photoArea.x, photoArea.y,              photoArea.w);
    drawLabel(ctx, "AFTER",  photoArea.x, photoArea.y + halfH + gap, photoArea.w);
  }

  return canvas;
}

export async function compositeDataUrl(opts) {
  const canvas = await renderComposite(opts);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function compositeBlob(opts) {
  const canvas = await renderComposite(opts);
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.92));
}

// --- drawing helpers ---

function drawImageCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  const r = Math.min(w, h) * 0.018;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function drawLabel(ctx, text, areaX, areaY, areaW) {
  const padX = Math.round(areaW * 0.028);
  const padY = Math.round(areaW * 0.015);
  const fontSize = Math.round(areaW * 0.052);

  ctx.save();
  ctx.font = `900 ${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const metrics = ctx.measureText(text);
  const boxW = Math.ceil(metrics.width) + padX * 2;
  const boxH = fontSize + padY * 2;
  const x = areaX + Math.round(areaW * 0.025);
  const y = areaY + Math.round(areaW * 0.025);

  ctx.fillStyle = BRAND_ORANGE;
  roundRectPath(ctx, x, y, boxW, boxH, 8);
  ctx.fill();

  ctx.fillStyle = BRAND_DARK;
  ctx.fillText(text, x + padX, y + padY + fontSize * 0.86);
  ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Letter-spaced fill text — gives the company name a tighter "logo" feel.
function fillTrackedText(ctx, text, cx, cy, spacing) {
  const chars = Array.from(text);
  let total = 0;
  for (const c of chars) total += ctx.measureText(c).width;
  total += spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  for (const c of chars) {
    ctx.fillText(c, x, cy);
    x += ctx.measureText(c).width + spacing;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}
