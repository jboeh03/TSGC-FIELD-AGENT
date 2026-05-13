import { el, compressImage, toast, manualSearchLink, affiliateLink, rerender } from "../utils.js";
import { createJob, updateJob, getJobs } from "../state.js";
import { BRANDS } from "../data.js";
import { extractFromImage, visionHealth } from "../vision.js";

// Module-level snapshot so capture survives re-renders.
let snapshot = { dataUrl: null, brandId: "", brandName: "", model: "", serial: "", fuel: "", btu: null, year: null, rawText: "" };
let extracting = false;

export function viewScan() {
  const wrap = el("div", { class: "space-y-3" });

  wrap.appendChild(el("h2", { class: "text-lg font-semibold" }, "Scan grill"));
  wrap.appendChild(el("p", { class: "text-sm text-ink-300 -mt-2" },
    "Snap the rating plate, hit ", el("b", null, "Auto-extract"), ", then attach to a job."));

  wrap.appendChild(photoCard());
  wrap.appendChild(extractCard());
  wrap.appendChild(idCard());
  wrap.appendChild(attachCard());

  return wrap;
}

// ---------- Photo capture ----------

function photoCard() {
  const card = el("div", { class: "card" });
  if (snapshot.dataUrl) {
    card.appendChild(el("img", { src: snapshot.dataUrl, class: "photo", alt: "Rating plate" }));
    card.appendChild(
      el("div", { class: "grid grid-cols-2 gap-2 mt-2" },
        el("button", {
          type: "button", class: "btn btn-secondary",
          onClick: () => { snapshot.dataUrl = null; rerender(); }
        }, "Clear"),
        cameraInput("Retake")
      )
    );
  } else {
    card.appendChild(
      el("div", { class: "photo flex items-center justify-center aspect-[4/3] text-ink-400" },
        el("div", { class: "text-center" },
          el("div", { html: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>` }),
          el("div", { class: "mt-1" }, "Take photo or upload")
        )
      )
    );
    card.appendChild(el("div", { class: "mt-2" }, cameraInput("Take photo or upload")));
  }
  return card;
}

function cameraInput(label) {
  return el("label", { class: "btn btn-primary btn-block" },
    label,
    el("input", {
      type: "file", accept: "image/*",
      class: "hidden",
      onChange: async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        snapshot.dataUrl = await compressImage(file);
        toast("Captured");
        rerender();
      }
    })
  );
}

// ---------- AI extraction ----------

function extractCard() {
  const card = el("div", { class: "card space-y-2" },
    el("div", { class: "flex items-center justify-between" },
      el("div", { class: "font-semibold flex items-center gap-2" },
        sparkle(),
        "Auto-extract with AI"
      ),
      visionStatusChip()
    ),
    el("div", { class: "text-xs text-ink-300" },
      "Sends the photo to Claude vision to read brand / model / serial / BTU off the plate."
    ),
  );

  const btn = el("button", {
    type: "button",
    class: `btn btn-block ${snapshot.dataUrl ? "btn-primary" : "btn-secondary"}`,
    disabled: !snapshot.dataUrl || extracting,
    onClick: runExtraction,
  },
    extracting
      ? el("span", null,
          el("span", { class: "inline-block animate-spin", html: "⟳" }),
          " Reading plate…"
        )
      : el("span", null, sparkle(), " ", snapshot.dataUrl ? "Auto-extract from photo" : "Capture a photo first")
  );
  card.appendChild(btn);

  if (snapshot.rawText) {
    card.appendChild(
      el("details", { class: "text-xs text-ink-300" },
        el("summary", { class: "cursor-pointer" }, "Show raw plate text"),
        el("pre", { class: "whitespace-pre-wrap mt-2 text-ink-200" }, snapshot.rawText)
      )
    );
  }
  return card;
}

function sparkle() {
  return el("span", { html: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M12 3l1.7 4.6L18 9.3 13.7 11 12 15.6 10.3 11 6 9.3l4.3-1.7L12 3z"/><path d="M5 17l.7 1.8L7.5 19.5 5.7 20.2 5 22l-.7-1.8L2.5 19.5l1.8-.7L5 17z"/></svg>` });
}

let healthChipState = null;
function visionStatusChip() {
  // Render a placeholder chip and update it async.
  const chip = el("span", { class: "chip" }, healthChipState?.label || "checking…");
  if (healthChipState?.cls) chip.classList.add(healthChipState.cls);
  if (!healthChipState) {
    visionHealth().then((h) => {
      healthChipState = h.available
        ? { label: `AI: ${h.model || "ready"}`, cls: "chip-ok" }
        : { label: "AI not configured", cls: "chip-warn" };
      chip.textContent = healthChipState.label;
      chip.classList.add(healthChipState.cls);
    });
  }
  return chip;
}

async function runExtraction() {
  if (!snapshot.dataUrl || extracting) return;
  extracting = true;
  rerender();
  try {
    const data = await extractFromImage(snapshot.dataUrl);
    const brand = BRANDS.find((b) => b.id === data.brandId);
    snapshot = {
      ...snapshot,
      brandId:   data.brandId   || snapshot.brandId   || "",
      brandName: brand?.name    || data.brandName     || snapshot.brandName || "",
      model:     data.model     || snapshot.model     || "",
      serial:    data.serial    || snapshot.serial    || "",
      fuel:      data.fuel      || snapshot.fuel      || "",
      btu:       data.btu       ?? snapshot.btu       ?? null,
      year:      data.year      ?? snapshot.year      ?? null,
      rawText:   data.rawText   || snapshot.rawText   || "",
    };
    toast("Plate read");
  } catch (err) {
    console.error("vision error", err);
    const m = (err.message || "").toLowerCase();
    if (m.includes("not set") || m.includes("not configured")) {
      toast("Vision API key not configured on server");
    } else if (m.includes("404") || m.includes("failed to fetch")) {
      toast("Vision endpoint unavailable on this host");
    } else {
      toast(`Vision failed: ${err.message || "unknown"}`);
    }
  } finally {
    extracting = false;
    rerender();
  }
}

// ---------- Manual ID form (also receives AI output) ----------

function idCard() {
  return el("div", { class: "card space-y-3" },
    el("div", { class: "font-semibold" }, "Plate details"),
    el("label", { class: "block" },
      el("span", { class: "label" }, "Brand"),
      brandSelect()
    ),
    el("div", { class: "grid grid-cols-2 gap-3" },
      labeledInput("Model #",  "model",  { placeholder: "e.g. 61014001" }),
      labeledInput("Serial #", "serial", { placeholder: "e.g. 220511…" })
    ),
    el("div", { class: "grid grid-cols-3 gap-3" },
      labeledSelect("Fuel", "fuel", [
        ["", "—"], ["lp", "LP"], ["ng", "NG"],
        ["pellet", "Pellet"], ["charcoal", "Charcoal"], ["electric", "Electric"],
      ]),
      labeledInput("BTU", "btu", { type: "number", min: 0, placeholder: "—" }),
      labeledInput("Year", "year", { placeholder: "—" })
    ),
    el("div", { class: "grid grid-cols-2 gap-2" },
      el("button", {
        type: "button", class: "btn btn-secondary",
        disabled: !snapshot.brandId && !snapshot.model,
        onClick: () => {
          const brand = BRANDS.find((b) => b.id === snapshot.brandId);
          window.open(manualSearchLink(brand, snapshot.model), "_blank", "noopener");
        }
      }, "Find manual"),
      el("button", {
        type: "button", class: "btn btn-secondary",
        disabled: !snapshot.brandId && !snapshot.model,
        onClick: () => {
          const brand = BRANDS.find((b) => b.id === snapshot.brandId);
          const q = [brand?.name, snapshot.model, "parts"].filter(Boolean).join(" ");
          window.open(affiliateLink({ query: q }), "_blank", "noopener");
        }
      }, "Search parts")
    )
  );
}

function brandSelect() {
  const s = el("select", {
    class: "select",
    onChange: (e) => {
      snapshot.brandId = e.target.value;
      snapshot.brandName = BRANDS.find((b) => b.id === e.target.value)?.name || "";
    },
  });
  s.appendChild(el("option", { value: "" }, "Select brand…"));
  for (const b of BRANDS) {
    const o = el("option", { value: b.id }, b.name);
    if (snapshot.brandId === b.id) o.selected = true;
    s.appendChild(o);
  }
  return s;
}

function labeledInput(label, key, attrs = {}) {
  return el("label", { class: "block" },
    el("span", { class: "label" }, label),
    el("input", {
      class: "input",
      value: snapshot[key] ?? "",
      ...attrs,
      onInput: (e) => { snapshot[key] = e.target.value; },
    })
  );
}

function labeledSelect(label, key, opts) {
  const s = el("select", {
    class: "select",
    onChange: (e) => { snapshot[key] = e.target.value; },
  });
  for (const [v, l] of opts) {
    const o = el("option", { value: v }, l);
    if (String(snapshot[key] ?? "") === String(v)) o.selected = true;
    s.appendChild(o);
  }
  return el("label", { class: "block" }, el("span", { class: "label" }, label), s);
}

// ---------- Attach to job ----------

function attachCard() {
  const jobs = getJobs().slice(0, 8);
  return el("div", { class: "card space-y-3" },
    el("div", { class: "font-semibold" }, "Attach to job"),
    el("button", {
      type: "button", class: "btn btn-primary btn-block",
      onClick: () => {
        const brand = BRANDS.find((b) => b.id === snapshot.brandId);
        const job = createJob({
          grill: {
            brandId: brand?.id || "",
            brandName: brand?.name || snapshot.brandName || "",
            model: snapshot.model || "",
            serial: snapshot.serial || "",
            fuel: snapshot.fuel || "lp",
            photoPlate: snapshot.dataUrl || null,
            notes: notesFromSnapshot(),
          },
          visit: { reason: "inspection" },
        });
        snapshot = { dataUrl: null, brandId: "", brandName: "", model: "", serial: "", fuel: "", btu: null, year: null, rawText: "" };
        location.hash = `#/jobs/${job.id}`;
      }
    }, "Create new job from scan"),
    jobs.length ? el("div", { class: "text-xs text-ink-400 pt-1" }, "Or attach to an existing job:") : null,
    ...jobs.map((j) =>
      el("button", {
        type: "button",
        class: "w-full text-left py-2 border-t border-ink-700 first:border-0",
        onClick: () => {
          const brand = BRANDS.find((b) => b.id === snapshot.brandId);
          updateJob(j.id, {
            grill: {
              ...(brand ? { brandId: brand.id, brandName: brand.name } : {}),
              ...(snapshot.model ? { model: snapshot.model } : {}),
              ...(snapshot.serial ? { serial: snapshot.serial } : {}),
              ...(snapshot.fuel ? { fuel: snapshot.fuel } : {}),
              ...(snapshot.dataUrl ? { photoPlate: snapshot.dataUrl } : {}),
            },
          });
          snapshot = { dataUrl: null, brandId: "", brandName: "", model: "", serial: "", fuel: "", btu: null, year: null, rawText: "" };
          location.hash = `#/jobs/${j.id}`;
        }
      },
        el("div", { class: "font-medium text-ink-100" }, j.customer.name || "(no name)"),
        el("div", { class: "text-xs text-ink-400" },
          [j.grill.brandName, j.grill.model].filter(Boolean).join(" ") || "Grill TBD"
        )
      )
    )
  );
}

function notesFromSnapshot() {
  const bits = [];
  if (snapshot.btu) bits.push(`${snapshot.btu} BTU`);
  if (snapshot.year) bits.push(`${snapshot.year}`);
  return bits.join(" · ");
}
