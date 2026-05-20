// Branded before/after composite renderer for share images.
//
// Two visual styles:
//   "standard" -- cream frame, photos, navy footer band with title/caption/contact
//   "branded"  -- adds a navy header bar with company name + tagline + service-area
//                 pill, and the footer adds star rating + phone + website
//
// Two photo modes:
//   single  -- one grill: [before, after]                  (2 photos)
//   double  -- two grills (e.g. neighbor 2-for-1):
//              [g1Before, g1After, g2Before, g2After]      (4 photos, 2x2 grid)
//
// API:
//   renderComposite({
//     style,             // "standard" | "branded"  (default "standard")
//     formatId,          // "square" | "portrait" | "story" | "landscape"
//     before, after,     // single mode
//     photos: [...],     // double mode (4 entries)
//     eyebrow, title, caption,   // editable overlay text
//     companyName,       // optional, defaults to "Tri-State Grill Cleaning"
//     tagline,           // optional, defaults to brand short-tagline
//     serviceArea,       // optional, defaults to "Cincinnati · NKY · Dayton"
//     phone, website,    // optional, defaults to brand contact info
//   }) -> HTMLCanvasElement

// ---------- brand palette ----------
const NAVY        = "#1A3055";
const NAVY_DARK   = "#122440";
const BURGUNDY    = "#8B1F2F";
const CREAM       = "#F7F3EE";
const CREAM_DARK  = "#EDE8E0";
const WHITE       = "#FFFFFF";

const FONT_DISPLAY = `"Oswald", "Helvetica Neue", Arial, sans-serif`;
const FONT_BODY    = `"Inter", "Helvetica Neue", Arial, sans-serif`;

const DEFAULTS = {
  companyName: "Tri-State Grill Cleaning",
  tagline:     "Veteran-founded · Locally operated",
  serviceArea: "Cincinnati · NKY · Dayton",
  phone:       "(657) 831-4276",
  website:     "tristategrillcleaning.com",
};

const FORMATS = {
  square:    { id: "square",    label: "Square 1:1 — IG / FB feed",       w: 1080, h: 1080, layout: "side"  },
  portrait:  { id: "portrait",  label: "Portrait 4:5 — IG feed",          w: 1080, h: 1350, layout: "side"  },
  story:     { id: "story",     label: "Story 9:16 — IG / TikTok",        w: 1080, h: 1920, layout: "side"  },
  landscape: { id: "landscape", label: "Landscape 16:9 — website / email",w: 1920, h: 1080, layout: "side"  },
};

export function listFormats() { return Object.values(FORMATS); }

export const STYLES = [
  { id: "standard", label: "Standard",
    hint: "Cream frame · navy footer with title + caption" },
  { id: "branded",  label: "Branded",
    hint: "Adds company header · ★★★★★ rating · phone" },
];

export async function renderComposite(opts) {
  const f = FORMATS[opts.formatId];
  if (!f) throw new Error(`Unknown format: ${opts.formatId}`);

  const photoSources = Array.isArray(opts.photos)
    ? opts.photos
    : (opts.before && opts.after ? [opts.before, opts.after] : null);
  if (!photoSources || (photoSources.length !== 2 && photoSources.length !== 4)) {
    throw new Error("Provide 2 photos (before+after) or 4 photos (two grills).");
  }
  const mode  = photoSources.length === 4 ? "double" : "single";
  const style = opts.style === "branded" ? "branded" : "standard";

  await ensureFontsLoaded(f.h);

  const canvas = document.createElement("canvas");
  canvas.width = f.w;
  canvas.height = f.h;
  const ctx = canvas.getContext("2d");

  // 1. Cream background (frame)
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, f.w, f.h);

  // 2. Layout maths
  const outerMargin = Math.round(Math.min(f.w, f.h) * 0.028);
  const gap         = Math.round(Math.min(f.w, f.h) * 0.013);
  const radius      = Math.round(Math.min(f.w, f.h) * 0.024);
  const minDim      = Math.min(f.w, f.h);

  const headerH = style === "branded" ? Math.round(f.h * 0.108) : 0;
  const headerGap = style === "branded" ? gap : 0;
  const footerH = Math.round(f.h * (style === "branded" ? 0.175 : 0.170));
  const footerGap = gap;

  const photoTop    = outerMargin + headerH + headerGap;
  const photoBottom = f.h - outerMargin - footerH - footerGap;
  const photoAreaH  = photoBottom - photoTop;

  const boxes = computeBoxes(f, mode, outerMargin, gap, photoTop, photoAreaH);

  // 3. Load + draw images
  const imgs = await Promise.all(photoSources.map(loadImage));
  for (let i = 0; i < boxes.length; i++) drawPhoto(ctx, imgs[i], boxes[i], radius);

  // 4. Branded header
  if (style === "branded") {
    drawHeaderBand(ctx, f, {
      x: outerMargin, y: outerMargin, w: f.w - outerMargin * 2, h: headerH,
      radius,
      companyName: opts.companyName || DEFAULTS.companyName,
      tagline:     opts.tagline     || DEFAULTS.tagline,
      serviceArea: opts.serviceArea || DEFAULTS.serviceArea,
    });
  }

  // 5. Footer band
  drawFooterBand(ctx, f, {
    x: outerMargin, y: f.h - outerMargin - footerH,
    w: f.w - outerMargin * 2, h: footerH,
    radius,
    style,
    eyebrow: (opts.eyebrow || "").trim(),
    title:   (opts.title   || "").trim(),
    caption: (opts.caption || "").trim(),
    phone:   opts.phone   || DEFAULTS.phone,
    website: opts.website || DEFAULTS.website,
  });

  // 6. Pills last so they sit above any shadow / overlay
  drawPill(ctx, "BEFORE", boxes[0], { variant: "light",
    corner: "tl", inset: radius * 0.55 });
  const afterIdx = mode === "double" ? 1 : 1;
  drawPill(ctx, "AFTER", boxes[afterIdx], { variant: "burgundy",
    corner: "tr", inset: radius * 0.55 });

  return canvas;
}

function computeBoxes(f, mode, outerMargin, gap, photoTop, photoAreaH) {
  const photoW = Math.floor((f.w - outerMargin * 2 - gap) / 2);
  if (mode === "double") {
    const photoH = Math.floor((photoAreaH - gap) / 2);
    return [
      { x: outerMargin,                y: photoTop,                w: photoW, h: photoH }, // TL G1B
      { x: outerMargin + photoW + gap, y: photoTop,                w: photoW, h: photoH }, // TR G1A
      { x: outerMargin,                y: photoTop + photoH + gap, w: photoW, h: photoH }, // BL G2B
      { x: outerMargin + photoW + gap, y: photoTop + photoH + gap, w: photoW, h: photoH }, // BR G2A
    ];
  }
  return [
    { x: outerMargin,                y: photoTop, w: photoW, h: photoAreaH }, // before
    { x: outerMargin + photoW + gap, y: photoTop, w: photoW, h: photoAreaH }, // after
  ];
}

export async function compositeDataUrl(opts) {
  const c = await renderComposite(opts);
  return c.toDataURL("image/jpeg", 0.92);
}

export async function compositeBlob(opts) {
  const c = await renderComposite(opts);
  return new Promise((res) => c.toBlob((b) => res(b), "image/jpeg", 0.92));
}

// ---------- drawing primitives ----------

function drawPhoto(ctx, img, box, r) {
  ctx.fillStyle = CREAM_DARK;
  roundRectPath(ctx, box.x, box.y, box.w, box.h, r);
  ctx.fill();

  ctx.save();
  roundRectPath(ctx, box.x, box.y, box.w, box.h, r);
  ctx.clip();
  const scale = Math.max(box.w / img.width, box.h / img.height);
  const sw = box.w / scale;
  const sh = box.h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, box.x, box.y, box.w, box.h);
  ctx.restore();
}

function drawHeaderBand(ctx, f, opts) {
  // Navy-dark rectangle with rounded corners
  ctx.fillStyle = NAVY_DARK;
  roundRectPath(ctx, opts.x, opts.y, opts.w, opts.h, opts.radius);
  ctx.fill();

  // Burgundy accent strip along the bottom edge (clipped to header rect)
  const accentH = Math.max(3, Math.round(opts.h * 0.05));
  ctx.save();
  roundRectPath(ctx, opts.x, opts.y, opts.w, opts.h, opts.radius);
  ctx.clip();
  ctx.fillStyle = BURGUNDY;
  ctx.fillRect(opts.x, opts.y + opts.h - accentH, opts.w, accentH);
  ctx.restore();

  const unit = Math.min(f.w, f.h);
  const companyFont = Math.round(unit * 0.034);
  const taglineFont = Math.round(unit * 0.015);
  const pillFont    = Math.round(unit * 0.018);

  const padX = Math.round(opts.w * 0.025);
  const padTop = Math.round(opts.h * 0.22);

  // Company name (left)
  ctx.fillStyle = WHITE;
  ctx.font = `700 ${companyFont}px ${FONT_DISPLAY}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(opts.companyName, opts.x + padX, opts.y + padTop + companyFont);

  // Tagline (burgundy, small caps tracked) below the company name
  ctx.fillStyle = BURGUNDY;
  ctx.font = `600 ${taglineFont}px ${FONT_DISPLAY}`;
  drawTrackedText(ctx, opts.tagline.toUpperCase(),
    opts.x + padX,
    opts.y + padTop + companyFont + Math.round(taglineFont * 1.5),
    taglineFont * 0.18);

  // Service-area pill (right)
  const pillText = opts.serviceArea;
  ctx.font = `600 ${pillFont}px ${FONT_DISPLAY}`;
  const pillPadX = Math.round(pillFont * 0.95);
  const pillPadY = Math.round(pillFont * 0.50);
  const tracking = pillFont * 0.10;
  const textW = measureTrackedWidth(ctx, pillText, tracking);
  const pillW = Math.ceil(textW) + pillPadX * 2;
  const pillH = pillFont + pillPadY * 2;
  const pillX = opts.x + opts.w - padX - pillW;
  const pillY = opts.y + (opts.h - accentH - pillH) / 2;

  ctx.fillStyle = BURGUNDY;
  roundRectPath(ctx, pillX, pillY, pillW, pillH, Math.round(pillFont * 0.35));
  ctx.fill();
  ctx.fillStyle = WHITE;
  drawTrackedText(ctx, pillText,
    pillX + pillPadX, pillY + pillPadY + pillFont * 0.86, tracking);
}

function drawFooterBand(ctx, f, opts) {
  const { x, y, w, h, radius, style } = opts;

  // Drop shadow below the band for separation
  ctx.save();
  ctx.shadowColor = "rgba(18,36,64,0.18)";
  ctx.shadowBlur = Math.round(Math.min(f.w, f.h) * 0.014);
  ctx.shadowOffsetY = Math.round(Math.min(f.w, f.h) * 0.004);
  ctx.fillStyle = NAVY_DARK;
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.restore();

  // Burgundy accent strip across the top of the footer
  const accentH = Math.max(3, Math.round(h * 0.030));
  ctx.save();
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.fillStyle = BURGUNDY;
  ctx.fillRect(x, y, w, accentH);
  ctx.restore();

  const unit = Math.min(f.w, f.h);
  const eyebrowSize = Math.round(unit * 0.024);
  const titleSize   = Math.round(unit * 0.054);
  const captionSize = Math.round(unit * 0.024);

  // For branded, leave room on the right for the rating/phone block
  const padLeft = x + Math.round(w * 0.040);
  const rightBlockW = style === "branded" ? Math.round(w * 0.30) : Math.round(w * 0.34);
  const textBlockW  = w - rightBlockW - Math.round(w * 0.06);

  // Pre-measure / wrap title
  ctx.font = `700 ${titleSize}px ${FONT_DISPLAY}`;
  const titleLines = opts.title
    ? wrapText(ctx, opts.title, textBlockW, `700 ${titleSize}px ${FONT_DISPLAY}`, 2)
    : [];

  // Build vertical stack
  const items = [];
  if (opts.eyebrow) items.push({ kind: "eyebrow", h: eyebrowSize });
  for (let i = 0; i < titleLines.length; i++) items.push({ kind: "title", h: titleSize, text: titleLines[i] });
  if (opts.caption) items.push({ kind: "caption", h: captionSize });

  if (items.length) {
    // line spacing
    const spacing = items.map((cur, i) => {
      if (i === 0) return 0;
      const prev = items[i - 1].kind;
      if (prev === "eyebrow" && cur.kind === "title")   return Math.round(titleSize * 0.18);
      if (prev === "title"   && cur.kind === "title")   return Math.round(titleSize * 0.08);
      if (prev === "title"   && cur.kind === "caption") return Math.round(captionSize * 0.6);
      return Math.round(cur.h * 0.2);
    });
    const blockH = items.reduce((s, it, i) => s + it.h + spacing[i], 0);
    let cy = y + Math.round((h - blockH) / 2) + Math.round(h * 0.02) + accentH;

    let ti = 0;
    for (let i = 0; i < items.length; i++) {
      cy += spacing[i];
      const it = items[i];
      if (it.kind === "eyebrow") {
        ctx.font = `600 ${eyebrowSize}px ${FONT_DISPLAY}`;
        ctx.fillStyle = BURGUNDY;
        drawTrackedText(ctx, opts.eyebrow.toUpperCase(),
          padLeft, cy + eyebrowSize * 0.86, eyebrowSize * 0.12);
      } else if (it.kind === "title") {
        ctx.font = `700 ${titleSize}px ${FONT_DISPLAY}`;
        ctx.fillStyle = WHITE;
        ctx.fillText(titleLines[ti++], padLeft, cy + titleSize * 0.86);
      } else if (it.kind === "caption") {
        ctx.font = `500 ${captionSize}px ${FONT_BODY}`;
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        ctx.fillText(opts.caption, padLeft, cy + captionSize * 0.86);
      }
      cy += it.h;
    }
  }

  // ---- Right side: contact (standard) or stars + phone + website (branded) ----
  const padRight = x + w - Math.round(w * 0.040);

  if (style === "branded") {
    const starSize  = Math.round(unit * 0.028);
    const phoneSize = Math.round(unit * 0.034);
    const siteSize  = Math.round(unit * 0.018);

    const starRowH  = starSize;
    const blockH = starRowH + Math.round(phoneSize * 1.3) + phoneSize + Math.round(siteSize * 0.6) + siteSize;
    let cy = y + Math.round((h - blockH) / 2) + Math.round(h * 0.02) + accentH;

    // 5 burgundy stars, right-aligned
    drawStars(ctx, padRight, cy + starSize, 5, starSize, BURGUNDY);
    cy += starSize + Math.round(phoneSize * 0.4);

    // Phone (white, big)
    ctx.font = `700 ${phoneSize}px ${FONT_DISPLAY}`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = "right";
    ctx.fillText(opts.phone, padRight, cy + phoneSize * 0.9);
    cy += phoneSize + Math.round(siteSize * 0.4);

    // Website (light gray small uppercase tracked)
    ctx.font = `500 ${siteSize}px ${FONT_DISPLAY}`;
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    const trk = siteSize * 0.10;
    const siteText = opts.website.toUpperCase();
    const w_ = measureTrackedWidth(ctx, siteText, trk);
    drawTrackedText(ctx, siteText, padRight - w_, cy + siteSize * 0.86, trk);
    ctx.textAlign = "left";
  } else {
    // Standard: single contact line on the top-right of the footer
    const cfSize = Math.round(unit * 0.018);
    ctx.font = `500 ${cfSize}px ${FONT_DISPLAY}`;
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    const trk = cfSize * 0.10;
    const txt = `${opts.phone} · ${opts.website}`.toUpperCase();
    const w_ = measureTrackedWidth(ctx, txt, trk);
    const cy = y + Math.round(h * 0.18) + accentH / 2;
    drawTrackedText(ctx, txt, padRight - w_, cy, trk);
  }
}

function drawStars(ctx, rightX, baselineY, count, size, color) {
  const spacing = size * 0.16;
  ctx.fillStyle = color;
  const totalW = count * size + spacing * (count - 1);
  let cx = rightX - totalW;
  for (let i = 0; i < count; i++) {
    drawStar(ctx, cx + size / 2, baselineY - size * 0.55, size * 0.50);
    cx += size + spacing;
  }
}

function drawStar(ctx, cx, cy, r) {
  const inner = r * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : inner;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawPill(ctx, text, box, opts) {
  const variant = opts.variant === "burgundy"
    ? { bg: BURGUNDY,  fg: WHITE }
    : { bg: "rgba(255,255,255,0.95)", fg: NAVY };

  const fontSize = Math.round(box.h * 0.055);
  ctx.font = `700 ${fontSize}px ${FONT_DISPLAY}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const padX = Math.round(fontSize * 0.90);
  const padY = Math.round(fontSize * 0.50);
  const tracking = fontSize * 0.15;
  const textW = measureTrackedWidth(ctx, text, tracking);
  const pillW = Math.ceil(textW) + padX * 2;
  const pillH = fontSize + padY * 2;

  const x = opts.corner === "tr"
    ? box.x + box.w - opts.inset - pillW
    : box.x + opts.inset;
  const y = box.y + opts.inset;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.20)";
  ctx.shadowBlur = Math.round(fontSize * 0.35);
  ctx.shadowOffsetY = Math.round(fontSize * 0.10);
  ctx.fillStyle = variant.bg;
  roundRectPath(ctx, x, y, pillW, pillH, Math.round(fontSize * 0.35));
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = variant.fg;
  drawTrackedText(ctx, text, x + padX, y + padY + fontSize * 0.85, tracking);
}

// ---------- helpers ----------

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTrackedText(ctx, text, x, y, spacing) {
  ctx.textAlign = "left";
  let cx = x;
  for (const ch of Array.from(text)) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

function measureTrackedWidth(ctx, text, spacing) {
  const chars = Array.from(text);
  let total = 0;
  for (const ch of chars) total += ctx.measureText(ch).width;
  total += spacing * Math.max(0, chars.length - 1);
  return total;
}

function wrapText(ctx, text, maxWidth, font, maxLines) {
  ctx.font = font;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (let wi = 0; wi < words.length; wi++) {
    const w = words[wi];
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width <= maxWidth || !line) {
      line = probe;
    } else {
      lines.push(line);
      if (lines.length >= maxLines - 1) {
        let rest = words.slice(wi).join(" ");
        while (rest && ctx.measureText(rest + "…").width > maxWidth) rest = rest.slice(0, -1);
        const original = words.slice(wi).join(" ");
        lines.push(rest + (rest.length < original.length ? "…" : ""));
        return lines;
      }
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
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
      document.fonts.load(`600 ${Math.round(sampleSize * 0.03)}px "Oswald"`),
      document.fonts.load(`500 ${Math.round(sampleSize * 0.03)}px "Inter"`),
    ]);
  } catch { /* fall back */ }
}
