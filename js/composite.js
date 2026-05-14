// Canvas-based composite renderer for branded before/after share images.
// Produces square / portrait / story / landscape variants for socials + website.
// Styled to Tri-State Grill Cleaning brand guidelines.

import { getSettings } from "./state.js";

// Brand palette
const NAVY        = "#1A3055";
const NAVY_DARK   = "#122440";
const BURGUNDY    = "#8B1F2F";
const CREAM       = "#F7F3EE";
const CREAM_DARK  = "#EDE8E0";
const WHITE       = "#FFFFFF";
const MUTED       = "#6B6B67";

const TAGLINE     = "The dirty work. Done right.";
const PHONE       = "(657) 831-4276";
const WEBSITE     = "tristategrillcleaning.com";

const FONT_DISPLAY = `"Oswald", ui-sans-serif, system-ui, sans-serif`;
const FONT_BODY    = `"Inter", ui-sans-serif, system-ui, sans-serif`;

const FORMATS = {
  square:    { id: "square",    label: "Square — IG / FB feed",       w: 1080, h: 1080, layout: "side"  },
  portrait:  { id: "portrait",  label: "Portrait — IG feed 4:5",      w: 1080, h: 1350, layout: "stack" },
  story:     { id: "story",     label: "Story — IG / FB / TikTok",    w: 1080, h: 1920, layout: "stack" },
  landscape: { id: "landscape", label: "Landscape — website / email", w: 1920, h: 1080, layout: "side"  },
};

export function listFormats() { return Object.values(FORMATS); }

export async function renderComposite({ before, after, formatId, subtitle }) {
  const f = FORMATS[formatId];
  if (!f) throw new Error(`Unknown format: ${formatId}`);

  const settings = getSettings();
  const companyName = (settings.companyName || "Tri-State Grill Cleaning").toUpperCase();

  // Ensure Oswald is ready before drawing — otherwise the first paint falls back.
  await ensureFontsLoaded(f.h);

  const canvas = document.createElement("canvas");
  canvas.width = f.w;
  canvas.height = f.h;
  const ctx = canvas.getContext("2d");

  // Cream background
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, f.w, f.h);

  // ---- Navy header band ----
  const headerH = Math.round(f.h * 0.11);
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, f.w, headerH);

  // Thin burgundy accent strip under the header
  const accentH = Math.max(4, Math.round(headerH * 0.05));
  ctx.fillStyle = BURGUNDY;
  ctx.fillRect(0, headerH, f.w, accentH);

  // Header text (company name in tracked Oswald)
  const headerFont = Math.round(headerH * 0.36);
  ctx.fillStyle = WHITE;
  ctx.font = `700 ${headerFont}px ${FONT_DISPLAY}`;
  ctx.textBaseline = "middle";
  fillTrackedText(ctx, companyName, f.w / 2, headerH * 0.45, headerFont * 0.06);

  // Tagline (smaller, lighter)
  const taglineFont = Math.round(headerH * 0.18);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `500 ${taglineFont}px ${FONT_DISPLAY}`;
  fillTrackedText(ctx, TAGLINE.toUpperCase(), f.w / 2, headerH * 0.78, taglineFont * 0.18);

  // ---- Footer band ----
  const footerH = Math.round(f.h * 0.085);
  ctx.fillStyle = NAVY_DARK;
  ctx.fillRect(0, f.h - footerH, f.w, footerH);

  // Burgundy accent strip above footer
  ctx.fillStyle = BURGUNDY;
  ctx.fillRect(0, f.h - footerH - accentH, f.w, accentH);

  // Footer line 1: subtitle (customer name / grill)
  const subFont = Math.round(footerH * 0.26);
  ctx.fillStyle = WHITE;
  ctx.font = `600 ${subFont}px ${FONT_BODY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const subText = subtitle || "Professional grill cleaning & repair";
  ctx.fillText(subText, f.w / 2, f.h - footerH * 0.62);

  // Footer line 2: phone + website
  const metaFont = Math.round(footerH * 0.22);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `500 ${metaFont}px ${FONT_DISPLAY}`;
  fillTrackedText(ctx, `${PHONE}  ·  ${WEBSITE.toUpperCase()}  ·  CINCINNATI · N. KENTUCKY · DAYTON`, f.w / 2, f.h - footerH * 0.28, metaFont * 0.06);

  // ---- Photo area ----
  const margin = Math.round(f.w * 0.03);
  const photoArea = {
    x: margin,
    y: headerH + accentH + margin,
    w: f.w - margin * 2,
    h: f.h - (headerH + accentH) - (footerH + accentH) - margin * 2,
  };

  const [imgBefore, imgAfter] = await Promise.all([loadImage(before), loadImage(after)]);

  if (f.layout === "side") {
    const gap = margin;
    const halfW = Math.floor((photoArea.w - gap) / 2);
    drawPhoto(ctx, imgBefore, photoArea.x,              photoArea.y, halfW, photoArea.h, "BEFORE");
    drawPhoto(ctx, imgAfter,  photoArea.x + halfW + gap, photoArea.y, halfW, photoArea.h, "AFTER");
  } else {
    const gap = margin;
    const halfH = Math.floor((photoArea.h - gap) / 2);
    drawPhoto(ctx, imgBefore, photoArea.x, photoArea.y,              photoArea.w, halfH, "BEFORE");
    drawPhoto(ctx, imgAfter,  photoArea.x, photoArea.y + halfH + gap, photoArea.w, halfH, "AFTER");
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

// ---------- drawing helpers ----------

function drawPhoto(ctx, img, x, y, w, h, label) {
  const r = Math.min(w, h) * 0.022;

  // Cream-dark backdrop (in case the photo doesn't fully cover)
  ctx.fillStyle = CREAM_DARK;
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fill();

  // Cover-fit image
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();

  // Subtle inner border
  ctx.save();
  roundRectPath(ctx, x + 1, y + 1, w - 2, h - 2, r);
  ctx.strokeStyle = "rgba(26,48,85,0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Burgundy label pill
  drawLabelPill(ctx, label, x + Math.round(w * 0.035), y + Math.round(w * 0.035), Math.round(w * 0.055));
}

function drawLabelPill(ctx, text, x, y, fontSize) {
  ctx.save();
  ctx.font = `700 ${fontSize}px ${FONT_DISPLAY}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const padX = Math.round(fontSize * 0.7);
  const padY = Math.round(fontSize * 0.35);
  const metrics = ctx.measureText(text);
  const trackedW = metrics.width + fontSize * 0.12 * (text.length - 1);
  const boxW = Math.ceil(trackedW) + padX * 2;
  const boxH = fontSize + padY * 2;

  ctx.fillStyle = BURGUNDY;
  roundRectPath(ctx, x, y, boxW, boxH, Math.round(fontSize * 0.18));
  ctx.fill();

  ctx.fillStyle = WHITE;
  drawTrackedTextLeft(ctx, text, x + padX, y + padY + fontSize * 0.86, fontSize * 0.12);
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

function drawTrackedTextLeft(ctx, text, x, y, spacing) {
  ctx.textAlign = "left";
  let cx = x;
  for (const c of Array.from(text)) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + spacing;
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

async function ensureFontsLoaded(sampleSize) {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.all([
      document.fonts.load(`700 ${Math.round(sampleSize * 0.05)}px "Oswald"`),
      document.fonts.load(`500 ${Math.round(sampleSize * 0.03)}px "Oswald"`),
      document.fonts.load(`600 ${Math.round(sampleSize * 0.03)}px "Inter"`),
    ]);
  } catch { /* fall back to whatever rendered */ }
}
