// Branded before/after composite renderer for share images.
// Implements the "cream frame + gradient overlay" layout: two photos
// with rounded corners floated on a cream background, BEFORE/AFTER pills
// at the top corners, and a navy gradient + editable text block at the
// bottom (eyebrow / title / caption).
//
// API:
//   renderComposite({ before, after, formatId, eyebrow, title, caption })
//     -> HTMLCanvasElement
//   compositeBlob(opts)    -> Promise<Blob>      JPEG
//   compositeDataUrl(opts) -> Promise<string>    JPEG data URL
//   listFormats() -> [{ id, label, w, h, layout }]
//
// All text fields are optional. When all three are blank the gradient/text
// block is skipped and you get a clean two-photo image with pills only.

// Brand palette
const NAVY        = "#1A3055";
const NAVY_DARK   = "#122440";
const BURGUNDY    = "#8B1F2F";
const CREAM       = "#F7F3EE";
const CREAM_DARK  = "#EDE8E0";
const WHITE       = "#FFFFFF";

const FONT_DISPLAY = `"Oswald", "Helvetica Neue", Arial, sans-serif`;
const FONT_BODY    = `"Inter", "Helvetica Neue", Arial, sans-serif`;

const FORMATS = {
  square:    { id: "square",    label: "Square 1:1 — IG / FB feed",       w: 1080, h: 1080, layout: "side"  },
  portrait:  { id: "portrait",  label: "Portrait 4:5 — IG feed",          w: 1080, h: 1350, layout: "side"  },
  story:     { id: "story",     label: "Story 9:16 — IG / TikTok",        w: 1080, h: 1920, layout: "stack" },
  landscape: { id: "landscape", label: "Landscape 16:9 — website / email",w: 1920, h: 1080, layout: "side"  },
};

export function listFormats() { return Object.values(FORMATS); }

export async function renderComposite(opts) {
  const f = FORMATS[opts.formatId];
  if (!f) throw new Error(`Unknown format: ${opts.formatId}`);

  await ensureFontsLoaded(f.h);

  const canvas = document.createElement("canvas");
  canvas.width = f.w;
  canvas.height = f.h;
  const ctx = canvas.getContext("2d");

  // 1. Cream background (the "frame")
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, f.w, f.h);

  // 2. Layout maths
  const outerMargin = Math.round(Math.min(f.w, f.h) * 0.028);
  const gap         = Math.round(Math.min(f.w, f.h) * 0.013);
  const radius      = Math.round(Math.min(f.w, f.h) * 0.024);

  let beforeBox, afterBox;
  if (f.layout === "side") {
    const photoW = Math.floor((f.w - outerMargin * 2 - gap) / 2);
    const photoH = f.h - outerMargin * 2;
    beforeBox = { x: outerMargin,                  y: outerMargin, w: photoW, h: photoH };
    afterBox  = { x: outerMargin + photoW + gap,   y: outerMargin, w: photoW, h: photoH };
  } else {
    const photoW = f.w - outerMargin * 2;
    const photoH = Math.floor((f.h - outerMargin * 2 - gap) / 2);
    beforeBox = { x: outerMargin, y: outerMargin,                  w: photoW, h: photoH };
    afterBox  = { x: outerMargin, y: outerMargin + photoH + gap,   w: photoW, h: photoH };
  }

  // 3. Load images and draw
  const [imgBefore, imgAfter] = await Promise.all([
    loadImage(opts.before),
    loadImage(opts.after),
  ]);
  drawPhoto(ctx, imgBefore, beforeBox, radius);
  drawPhoto(ctx, imgAfter,  afterBox,  radius);

  // 4. Gradient + text block — only if there's text to show
  const hasText = (opts.eyebrow && opts.eyebrow.trim()) ||
                  (opts.title   && opts.title.trim())   ||
                  (opts.caption && opts.caption.trim());

  if (hasText) {
    drawGradientOverlay(ctx, f, beforeBox, afterBox, radius);
    drawTextBlock(ctx, f, beforeBox, afterBox, {
      eyebrow: (opts.eyebrow || "").trim(),
      title:   (opts.title   || "").trim(),
      caption: (opts.caption || "").trim(),
    });
  }

  // 5. Pills last so they sit over the gradient if it reaches that high
  drawPill(ctx, "BEFORE", beforeBox, { variant: "light", corner: "tl", inset: radius * 0.55 });
  drawPill(ctx, "AFTER",  afterBox,  { variant: "burgundy", corner: f.layout === "side" ? "tr" : "tl", inset: radius * 0.55 });

  return canvas;
}

export async function compositeDataUrl(opts) {
  const c = await renderComposite(opts);
  return c.toDataURL("image/jpeg", 0.92);
}

export async function compositeBlob(opts) {
  const c = await renderComposite(opts);
  return new Promise((res) => c.toBlob((b) => res(b), "image/jpeg", 0.92));
}

// ---------- drawing ----------

function drawPhoto(ctx, img, box, r) {
  // Cream-dark backdrop in case the image doesn't fill
  ctx.fillStyle = CREAM_DARK;
  roundRectPath(ctx, box.x, box.y, box.w, box.h, r);
  ctx.fill();

  // Cover-fit image inside rounded rect
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

function drawGradientOverlay(ctx, f, beforeBox, afterBox, r) {
  // Cover the photo area's bottom ~50% with a navy-dark gradient,
  // each photo clipped to its rounded rect so the gap stays cream.
  const overlayHeight = Math.round(f.h * 0.45);

  for (const box of [beforeBox, afterBox]) {
    const yTop = box.y + box.h - overlayHeight;
    const grad = ctx.createLinearGradient(0, yTop, 0, box.y + box.h);
    grad.addColorStop(0,    "rgba(18, 36, 64, 0.00)");
    grad.addColorStop(0.55, "rgba(18, 36, 64, 0.55)");
    grad.addColorStop(1,    "rgba(18, 36, 64, 0.92)");

    ctx.save();
    roundRectPath(ctx, box.x, box.y, box.w, box.h, r);
    ctx.clip();
    ctx.fillStyle = grad;
    ctx.fillRect(box.x, yTop, box.w, overlayHeight);
    ctx.restore();
  }
}

function drawTextBlock(ctx, f, beforeBox, afterBox, text) {
  // Text starts at the left edge of the photo area, baseline near bottom.
  const padLeft   = beforeBox.x + Math.round(beforeBox.w * 0.075);
  const padBottom = Math.round(f.h * 0.055);
  const safeRight = (afterBox.x + afterBox.w) - Math.round(beforeBox.w * 0.05);
  const safeWidth = safeRight - padLeft;

  // Font sizing scales with the shorter canvas dimension so it reads
  // consistently across formats.
  const unit = Math.min(f.w, f.h);
  const eyebrowSize = Math.round(unit * 0.026);
  const titleSize   = Math.round(unit * 0.058);
  const captionSize = Math.round(unit * 0.027);

  // Measure stack height for bottom-anchoring
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  const titleLines = text.title
    ? wrapText(ctx, text.title, safeWidth, `700 ${titleSize}px ${FONT_DISPLAY}`, 2)
    : [];

  const stackParts = [];
  if (text.eyebrow) stackParts.push({ kind: "eyebrow", h: eyebrowSize * 1.0, gap: Math.round(titleSize * 0.30) });
  if (titleLines.length) {
    for (let i = 0; i < titleLines.length; i++) {
      stackParts.push({ kind: i === 0 ? "title-first" : "title-rest", h: titleSize * 1.0, gap: i === 0 ? Math.round(titleSize * 0.20) : Math.round(titleSize * 0.10) });
    }
  }
  if (text.caption) stackParts.push({ kind: "caption", h: captionSize * 1.0, gap: 0 });

  // Compute baseline positions from the bottom up
  let cursor = f.h - padBottom;
  const positions = [];
  for (let i = stackParts.length - 1; i >= 0; i--) {
    const p = stackParts[i];
    positions[i] = cursor;
    cursor -= p.h;
    if (i > 0) cursor -= stackParts[i - 1].gap;
  }

  let titleIdx = 0;
  for (let i = 0; i < stackParts.length; i++) {
    const p = stackParts[i];
    const y = positions[i];
    if (p.kind === "eyebrow") {
      ctx.font = `600 ${eyebrowSize}px ${FONT_DISPLAY}`;
      ctx.fillStyle = BURGUNDY;
      drawTrackedText(ctx, text.eyebrow.toUpperCase(), padLeft, y, eyebrowSize * 0.12);
    } else if (p.kind.startsWith("title")) {
      ctx.font = `700 ${titleSize}px ${FONT_DISPLAY}`;
      ctx.fillStyle = WHITE;
      ctx.fillText(titleLines[titleIdx++], padLeft, y);
    } else if (p.kind === "caption") {
      ctx.font = `500 ${captionSize}px ${FONT_BODY}`;
      ctx.fillStyle = "rgba(255,255,255,0.86)";
      ctx.fillText(text.caption, padLeft, y);
    }
  }
}

function drawPill(ctx, text, box, opts) {
  const variant = opts.variant === "burgundy"
    ? { bg: BURGUNDY,  fg: WHITE }
    : { bg: "rgba(255,255,255,0.92)", fg: NAVY };

  const fontSize = Math.round(box.h * 0.046);
  ctx.font = `700 ${fontSize}px ${FONT_DISPLAY}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const padX = Math.round(fontSize * 0.85);
  const padY = Math.round(fontSize * 0.45);
  const tracking = fontSize * 0.14;
  const textW = measureTrackedWidth(ctx, text, tracking);
  const pillW = Math.ceil(textW) + padX * 2;
  const pillH = fontSize + padY * 2;

  let x, y;
  if (opts.corner === "tr") {
    x = box.x + box.w - opts.inset - pillW;
  } else {
    x = box.x + opts.inset;
  }
  y = box.y + opts.inset;

  // Subtle shadow for legibility
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = Math.round(fontSize * 0.3);
  ctx.shadowOffsetY = Math.round(fontSize * 0.08);
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
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width <= maxWidth || !line) {
      line = probe;
    } else {
      lines.push(line);
      if (lines.length >= maxLines - 1) {
        // Stuff the rest onto the last line, truncating with ellipsis if needed
        let rest = text.slice(lines.join(" ").length).trim();
        while (rest && ctx.measureText(rest + "…").width > maxWidth) {
          rest = rest.slice(0, -1);
        }
        lines.push(rest + (rest.length < text.slice(lines.join(" ").length).trim().length ? "…" : ""));
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
  } catch { /* fall back to whatever renders */ }
}
