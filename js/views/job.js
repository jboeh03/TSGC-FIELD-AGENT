import { el, money, moneyRange, compressImage, affiliateLink, manualSearchLink, toast, rerender } from "../utils.js";
import {
  getJob, updateJob, deleteJob, estimateTotals,
  addEstimateItem, removeEstimateItem, updateEstimateItem,
} from "../state.js";
import { BRANDS, PARTS, FAQS, LABOR_PRESETS } from "../data.js";
import { extractFromImage } from "../vision.js";
import { customerLookup } from "../customerLookup.js";

export function viewJob(id) {
  const job = getJob(id);
  if (!job) {
    return el("div", { class: "empty card" },
      el("div", { class: "font-medium text-ink-200" }, "Job not found"),
      el("a", { href: "#/jobs", class: "btn btn-primary mt-3 inline-flex" }, "Back to jobs")
    );
  }

  const wrap = el("div", { class: "space-y-4 pb-32" });

  wrap.appendChild(headerCard(job));
  wrap.appendChild(crmLookupCard(job));
  wrap.appendChild(grillCard(job));
  wrap.appendChild(beforeAfterCard(job));
  wrap.appendChild(recommendedPartsCard(job));
  wrap.appendChild(troubleshootingCard(job));
  wrap.appendChild(estimateCard(job));
  wrap.appendChild(notesCard(job));
  wrap.appendChild(dangerCard(job));

  return wrap;
}

// ---------- Header ----------

function headerCard(job) {
  const statusOpts = [
    ["open", "Open"], ["quoted", "Quoted"],
    ["scheduled", "Scheduled"], ["complete", "Complete"],
  ];
  return el("div", { class: "card space-y-3" },
    inlineField("Customer", input(job, "customer.name")),
    el("div", { class: "grid grid-cols-2 gap-3" },
      inlineField("Phone", input(job, "customer.phone", { type: "tel" })),
      inlineField("Email", input(job, "customer.email", { type: "email" }))
    ),
    inlineField("Address",
      textarea(job, "customer.address", { rows: 2, placeholder: "123 Main St\nTown, ST 12345" })
    ),
    el("div", { class: "grid grid-cols-2 gap-3" },
      inlineField("Reason",
        select(job, "visit.reason", [
          ["inspection", "Inspection"], ["cleaning", "Cleaning"],
          ["repair", "Repair"], ["other", "Other"],
        ])
      ),
      inlineField("Status", select(job, "status", statusOpts))
    ),
    el("div", { class: "flex flex-wrap gap-2 pt-1" },
      job.customer.phone && el("a", { href: `tel:${job.customer.phone}`, class: "btn btn-secondary btn-sm" }, "Call"),
      job.customer.phone && el("a", { href: `sms:${job.customer.phone}`, class: "btn btn-secondary btn-sm" }, "Text"),
      job.customer.address && el("a", {
        href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.customer.address)}`,
        target: "_blank", rel: "noopener",
        class: "btn btn-secondary btn-sm"
      }, "Navigate"),
    )
  );
}

// ---------- Grill identification + photos ----------

function grillCard(job) {
  const brand = BRANDS.find((b) => b.id === job.grill.brandId);
  const card = el("div", { class: "card space-y-3" },
    el("div", { class: "flex items-center justify-between" },
      el("div", { class: "font-semibold" }, "Grill"),
      brand
        ? el("a", { href: manualSearchLink(brand, job.grill.model), target: "_blank", rel: "noopener", class: "btn btn-secondary btn-sm" }, "Find manual")
        : null
    ),
    el("div", { class: "grid grid-cols-2 gap-3" },
      photoSlot(job, "photoPlate", "Rating plate"),
      photoSlot(job, "photoGrill", "Whole grill")
    ),
    el("div", { class: "grid grid-cols-2 gap-3" },
      inlineField("Brand", select(job, "grill.brandId", [["", "Select…"], ...BRANDS.map((b) => [b.id, b.name])], {
        onChange: (e) => {
          const b = BRANDS.find((br) => br.id === e.target.value);
          updateJob(job.id, { grill: { brandId: b?.id || "", brandName: b?.name || "" } });
          rerender();
        }
      })),
      inlineField("Fuel", select(job, "grill.fuel", [
        ["lp", "Propane (LP)"], ["ng", "Natural gas"],
        ["pellet", "Pellet"], ["charcoal", "Charcoal / Ceramic"],
        ["electric", "Electric"],
      ]))
    ),
    el("div", { class: "grid grid-cols-2 gap-3" },
      inlineField("Model #", input(job, "grill.model")),
      inlineField("Serial #", input(job, "grill.serial"))
    ),
    inlineField("Grill notes",
      textarea(job, "grill.notes", { rows: 2, placeholder: "Burner count, year, condition, prior repairs…" })
    ),
  );

  if (brand?.notes) {
    card.appendChild(el("div", { class: "text-xs text-ink-300 bg-ink-700/40 border border-ink-700 rounded-lg p-2" }, brand.notes));
  }
  return card;
}

function photoSlot(job, key, label) {
  const current = job.grill[key];
  const slot = el("label", { class: "block" },
    el("span", { class: "label" }, label),
    el("div", { class: "relative" },
      current
        ? el("img", { src: current, class: "photo", alt: label })
        : el("div", { class: "photo flex items-center justify-center aspect-[4/3] text-ink-400 text-sm" },
            el("div", { class: "flex flex-col items-center gap-1" },
              el("div", { html: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>` }),
              el("div", null, "Tap to add")
            )
          ),
      el("input", {
        type: "file", accept: "image/*",
        class: "absolute inset-0 opacity-0",
        onChange: async (e) => {
          const file = e.target.files?.[0]; if (!file) return;
          const dataUrl = await compressImage(file);
          const patch = { grill: {} }; patch.grill[key] = dataUrl;
          updateJob(job.id, patch);
          toast(`${label} saved`);
          rerender();
        }
      })
    ),
    current && el("div", { class: "flex gap-1 mt-1" },
      key === "photoPlate" && el("button", {
        type: "button", class: "btn btn-primary btn-sm flex-1",
        onClick: () => runAiExtract(job, current)
      }, sparkleIcon(), " Auto-extract"),
      el("button", {
        type: "button", class: "btn btn-ghost btn-sm",
        onClick: () => {
          const patch = { grill: {} }; patch.grill[key] = null;
          updateJob(job.id, patch); rerender();
        }
      }, "Remove")
    )
  );
  return slot;
}

function sparkleIcon() {
  return el("span", { html: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M12 3l1.7 4.6L18 9.3 13.7 11 12 15.6 10.3 11 6 9.3l4.3-1.7L12 3z"/><path d="M5 17l.7 1.8L7.5 19.5 5.7 20.2 5 22l-.7-1.8L2.5 19.5l1.8-.7L5 17z"/></svg>` });
}

async function runAiExtract(job, dataUrl) {
  toast("Reading plate…");
  try {
    const data = await extractFromImage(dataUrl);
    const brand = BRANDS.find((b) => b.id === data.brandId);
    const patch = { grill: {
      ...(brand ? { brandId: brand.id, brandName: brand.name } : (data.brandName ? { brandName: data.brandName } : {})),
      ...(data.model  ? { model:  data.model  } : {}),
      ...(data.serial ? { serial: data.serial } : {}),
      ...(data.fuel   ? { fuel:   data.fuel   } : {}),
    }};
    // Append AI summary into grill notes (non-destructive).
    const extras = [];
    if (data.btu)  extras.push(`${data.btu} BTU`);
    if (data.year) extras.push(`${data.year}`);
    if (extras.length) {
      const prev = job.grill.notes || "";
      const tag = `[AI] ${extras.join(" · ")}`;
      if (!prev.includes(tag)) patch.grill.notes = prev ? `${prev}\n${tag}` : tag;
    }
    updateJob(job.id, patch);
    toast("Plate read");
    rerender();
  } catch (err) {
    const m = (err.message || "").toLowerCase();
    if (m.includes("not set") || m.includes("not configured")) toast("Vision API key not configured on server");
    else if (m.includes("404") || m.includes("failed to fetch")) toast("Vision endpoint unavailable on this host");
    else toast(`Vision failed: ${err.message || "unknown"}`);
  }
}

// ---------- CRM lookup (collapsed by default) ----------

function crmLookupCard(job) {
  const wrap = el("details", { class: "card" });
  const summary = el("summary", { class: "cursor-pointer font-medium flex items-center justify-between" },
    el("span", null, "Pull from CRM"),
    el("span", { class: "text-xs text-ink-300" }, "Tap to expand")
  );
  wrap.appendChild(summary);

  let mounted = false;
  wrap.addEventListener("toggle", () => {
    if (!mounted && wrap.open) {
      mounted = true;
      wrap.appendChild(
        el("div", { class: "mt-3" },
          customerLookup({
            compact: true,
            onSelect: (c) => fillJobFromCustomer(job, c),
          })
        )
      );
    }
  });
  return wrap;
}

function fillJobFromCustomer(job, c) {
  const patch = { customer: {} };
  if (c.name)    patch.customer.name    = c.name;
  if (c.phone)   patch.customer.phone   = c.phone;
  if (c.email)   patch.customer.email   = c.email;
  if (c.address) patch.customer.address = c.address;

  if (c.grillBrand || c.grillModel || c.grillSerial) {
    patch.grill = {};
    if (c.grillBrand) {
      const brand = BRANDS.find((b) => b.name.toLowerCase() === c.grillBrand.toLowerCase());
      if (brand) {
        patch.grill.brandId = brand.id;
        patch.grill.brandName = brand.name;
      }
    }
    if (c.grillModel)  patch.grill.model  = c.grillModel;
    if (c.grillSerial) patch.grill.serial = c.grillSerial;
  }
  updateJob(job.id, patch);
  rerender();
}

// ---------- Before & After ----------

function beforeAfterCard(job) {
  const ready = Boolean(job.grill.photoBefore && job.grill.photoAfter);
  const shareBtnClass = ready
    ? "btn btn-primary btn-block"
    : "btn btn-secondary btn-block opacity-60 pointer-events-none";

  return el("div", { class: "card space-y-3" },
    el("div", { class: "flex items-center justify-between" },
      el("div", { class: "font-semibold" }, "Before & After"),
      ready
        ? el("span", { class: "chip chip-ok" }, "Ready to share")
        : el("span", { class: "chip" }, "Add both photos")
    ),
    el("div", { class: "grid grid-cols-2 gap-3" },
      photoSlot(job, "photoBefore", "Before"),
      photoSlot(job, "photoAfter",  "After")
    ),
    el("a", {
      href: ready ? `#/jobs/${job.id}/share` : "#",
      class: shareBtnClass,
      "aria-disabled": ready ? null : "true",
    },
      el("span", { html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-3px;margin-right:6px"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>` }),
      ready ? "Create shareable image" : "Add both photos to share"
    )
  );
}

// ---------- Recommended parts (based on brand) ----------

function recommendedPartsCard(job) {
  const brand = BRANDS.find((b) => b.id === job.grill.brandId);
  const partIds = brand?.common || [];
  const parts = partIds.map((id) => PARTS.find((p) => p.id === id)).filter(Boolean);

  const card = el("div", { class: "card space-y-2" },
    el("div", { class: "flex items-center justify-between" },
      el("div", { class: "font-semibold" }, "Likely parts"),
      el("a", { href: "#/parts", class: "text-sm text-brand-500" }, "All parts →")
    ),
    !parts.length && el("div", { class: "text-sm text-ink-400" }, "Pick a brand to see common service parts."),
  );

  for (const p of parts) {
    const buyUrl = affiliateLink({ query: `${brand?.name || ""} ${job.grill.model || ""} ${p.searchTerms}` });
    card.appendChild(
      el("div", { class: "py-2 border-t border-ink-700 first:border-0" },
        el("div", { class: "flex items-start justify-between gap-3" },
          el("div", { class: "min-w-0" },
            el("div", { class: "font-medium" }, p.name),
            el("div", { class: "text-xs text-ink-400" }, p.category, " · ", moneyRange(p.priceEst))
          ),
          el("div", { class: "flex gap-1 shrink-0" },
            el("button", {
              type: "button", class: "btn btn-secondary btn-sm",
              onClick: () => {
                addEstimateItem(job.id, {
                  type: "part", name: p.name,
                  qty: 1, price: Math.round((p.priceEst[0] + p.priceEst[1]) / 2),
                  link: buyUrl, refId: p.id,
                });
                toast("Added to estimate"); rerender();
              }
            }, "Add"),
            el("a", { href: buyUrl, target: "_blank", rel: "noopener nofollow", class: "btn btn-primary btn-sm" }, "Buy")
          )
        ),
        el("div", { class: "text-xs text-ink-300 mt-1" }, p.desc)
      )
    );
  }
  return card;
}

// ---------- Troubleshooting picker ----------

function troubleshootingCard(job) {
  const card = el("div", { class: "card space-y-2" },
    el("div", { class: "flex items-center justify-between" },
      el("div", { class: "font-semibold" }, "Troubleshoot symptoms"),
      el("a", { href: "#/knowledge", class: "text-sm text-brand-500" }, "Full library →")
    ),
    el("div", { class: "text-sm text-ink-300" }, "Tap a symptom to add the recommended parts to the estimate.")
  );

  for (const faq of FAQS.slice(0, 6)) {
    card.appendChild(
      el("button", {
        type: "button",
        class: "w-full text-left py-2 border-t border-ink-700 first:border-0",
        onClick: () => {
          for (const partId of faq.parts) {
            const p = PARTS.find((x) => x.id === partId); if (!p) continue;
            addEstimateItem(job.id, {
              type: "part", name: p.name,
              qty: 1, price: Math.round((p.priceEst[0] + p.priceEst[1]) / 2),
              link: affiliateLink({ query: `${job.grill.brandName || ""} ${job.grill.model || ""} ${p.searchTerms}` }),
              refId: p.id,
            });
          }
          toast(`Added ${faq.parts.length} part${faq.parts.length === 1 ? "" : "s"}`);
          rerender();
        }
      },
        el("div", { class: "font-medium" }, faq.q),
        el("div", { class: "text-xs text-ink-400 mt-1" },
          "Suggests: ",
          faq.parts.map((id) => PARTS.find((p) => p.id === id)?.name).filter(Boolean).join(", ")
        )
      )
    );
  }
  return card;
}

// ---------- Estimate builder ----------

function estimateCard(job) {
  const { subtotal, discount, tax, total } = estimateTotals(job.estimate);

  const card = el("div", { class: "card space-y-3" },
    el("div", { class: "flex items-center justify-between" },
      el("div", { class: "font-semibold" }, "Estimate"),
      el("div", { class: "flex gap-1" },
        el("button", { type: "button", class: "btn btn-secondary btn-sm", onClick: () => promptAddLabor(job.id) }, "+ Labor"),
        el("button", { type: "button", class: "btn btn-secondary btn-sm", onClick: () => promptAddCustom(job.id) }, "+ Custom"),
      )
    )
  );

  if (!job.estimate.items.length) {
    card.appendChild(el("div", { class: "text-sm text-ink-400" }, "No line items yet. Add parts from above, or use Labor / Custom."));
  } else {
    const list = el("div", { class: "list" });
    for (const it of job.estimate.items) {
      list.appendChild(estimateRow(job, it));
    }
    card.appendChild(list);
  }

  card.appendChild(el("div", { class: "divider" }));

  card.appendChild(
    el("div", { class: "grid grid-cols-3 gap-3" },
      inlineField("Tax %", input(job, "estimate.taxRate", { type: "number", step: "0.01", min: "0" })),
      inlineField("Discount $", input(job, "estimate.discount", { type: "number", step: "0.01", min: "0" })),
      inlineField("Labor $/hr", input(job, "estimate.laborRate", { type: "number", step: "1", min: "0" }))
    )
  );

  card.appendChild(
    el("div", { class: "space-y-1 text-sm" },
      totalRow("Subtotal", money(subtotal)),
      discount ? totalRow("Discount", "-" + money(discount), "text-ink-300") : null,
      tax ? totalRow(`Tax (${Number(job.estimate.taxRate || 0).toFixed(2)}%)`, money(tax), "text-ink-300") : null,
      el("div", { class: "flex justify-between text-base font-semibold pt-1" },
        el("span", null, "Total"),
        el("span", null, money(total))
      )
    )
  );

  card.appendChild(
    el("div", { class: "grid grid-cols-2 gap-2 pt-1" },
      el("button", { type: "button", class: "btn btn-secondary btn-block", onClick: () => shareEstimate(job, "sms") }, "Text quote"),
      el("button", { type: "button", class: "btn btn-secondary btn-block", onClick: () => shareEstimate(job, "email") }, "Email quote"),
      el("button", { type: "button", class: "btn btn-primary btn-block col-span-2", onClick: () => shareEstimate(job, "share") }, "Share / copy"),
    )
  );

  return card;
}

function estimateRow(job, it) {
  return el("div", { class: "py-2" },
    el("div", { class: "flex items-start justify-between gap-3" },
      el("div", { class: "min-w-0 flex-1" },
        el("div", { class: "font-medium text-ink-100 truncate" }, it.name),
        el("div", { class: "text-xs text-ink-400" },
          it.type === "labor" ? "Labor" : "Part",
          it.link ? " · " : "",
          it.link ? el("a", { href: it.link, target: "_blank", rel: "noopener nofollow", class: "text-brand-500" }, "Source") : null
        )
      ),
      el("button", {
        type: "button", class: "btn btn-ghost btn-sm",
        onClick: () => { removeEstimateItem(job.id, it.id); rerender(); }
      }, "✕")
    ),
    el("div", { class: "grid grid-cols-3 gap-2 mt-1" },
      el("label", { class: "block" },
        el("span", { class: "label" }, "Qty"),
        el("input", {
          class: "input", type: "number", step: "1", min: "0", value: String(it.qty),
          onChange: (e) => updateEstimateItem(job.id, it.id, { qty: Number(e.target.value || 0) })
        })
      ),
      el("label", { class: "col-span-2 block" },
        el("span", { class: "label" }, "Unit $"),
        el("input", {
          class: "input", type: "number", step: "0.01", min: "0", value: String(it.price),
          onChange: (e) => updateEstimateItem(job.id, it.id, { price: Number(e.target.value || 0) })
        })
      )
    )
  );
}

function promptAddLabor(jobId) {
  const choices = LABOR_PRESETS.map((l) => `${l.id}\t${l.name} (${money(l.price)})`).join("\n");
  const pick = prompt(`Pick a labor preset by id:\n\n${choices}\n\nOr enter custom name`);
  if (!pick) return;
  const preset = LABOR_PRESETS.find((l) => l.id === pick.trim());
  if (preset) {
    addEstimateItem(jobId, { type: "labor", name: preset.name, qty: 1, price: preset.price });
  } else {
    const price = Number(prompt(`Price for "${pick}"`, "0")) || 0;
    addEstimateItem(jobId, { type: "labor", name: pick.trim(), qty: 1, price });
  }
  rerender();
}

function promptAddCustom(jobId) {
  const name = prompt("Line item name");
  if (!name) return;
  const price = Number(prompt("Unit price", "0")) || 0;
  addEstimateItem(jobId, { type: "part", name: name.trim(), qty: 1, price });
  rerender();
}

function totalRow(label, value, cls = "") {
  return el("div", { class: `flex justify-between ${cls}` },
    el("span", null, label),
    el("span", null, value)
  );
}

function shareEstimate(job, mode) {
  const text = formatEstimateText(job);
  if (mode === "sms" && job.customer.phone) {
    location.href = `sms:${job.customer.phone}${navigator.userAgent.includes("iPhone") ? "&" : "?"}body=${encodeURIComponent(text)}`;
    return;
  }
  if (mode === "email") {
    const subj = encodeURIComponent(`Estimate from Tri-State Grill Cleaning — ${job.customer.name || "your grill"}`);
    const to = job.customer.email || "";
    location.href = `mailto:${to}?subject=${subj}&body=${encodeURIComponent(text)}`;
    return;
  }
  if (navigator.share) {
    navigator.share({ title: "TSGC Estimate", text }).catch(() => copy(text));
  } else {
    copy(text);
  }
}

function copy(text) {
  navigator.clipboard?.writeText(text).then(
    () => toast("Estimate copied"),
    () => toast("Copy failed — long-press to copy")
  );
}

function formatEstimateText(job) {
  const t = estimateTotals(job.estimate);
  const lines = [];
  lines.push(`Tri-State Grill Cleaning — Estimate`);
  if (job.customer.name) lines.push(`For: ${job.customer.name}`);
  const g = [job.grill.brandName, job.grill.model].filter(Boolean).join(" ");
  if (g) lines.push(`Grill: ${g}`);
  lines.push("");
  for (const it of job.estimate.items) {
    lines.push(`• ${it.name}  x${it.qty}  @ ${money(it.price)}  = ${money(it.qty * it.price)}`);
  }
  lines.push("");
  lines.push(`Subtotal: ${money(t.subtotal)}`);
  if (t.discount) lines.push(`Discount: -${money(t.discount)}`);
  if (t.tax) lines.push(`Tax: ${money(t.tax)}`);
  lines.push(`TOTAL: ${money(t.total)}`);
  if (job.estimate.notes) { lines.push(""); lines.push(job.estimate.notes); }
  return lines.join("\n");
}

// ---------- Notes ----------

function notesCard(job) {
  return el("div", { class: "card space-y-2" },
    el("div", { class: "font-semibold" }, "Job notes"),
    textarea(job, "estimate.notes", { rows: 3, placeholder: "Service summary, follow-ups, parts on order…" })
  );
}

// ---------- Danger zone ----------

function dangerCard(job) {
  return el("div", { class: "card space-y-2" },
    el("div", { class: "font-semibold" }, "Job actions"),
    el("button", {
      type: "button", class: "btn btn-danger btn-block",
      onClick: () => {
        if (confirm("Delete this job permanently?")) {
          deleteJob(job.id);
          location.hash = "#/jobs";
        }
      }
    }, "Delete job")
  );
}

// ---------- Field helpers (bound to live state) ----------

function inlineField(label, control) {
  return el("label", { class: "block" },
    el("span", { class: "label" }, label),
    control
  );
}

function input(job, path, attrs = {}) {
  const value = getPath(job, path) ?? "";
  return el("input", {
    class: "input", value, ...attrs,
    onChange: (e) => updatePath(job.id, path, e.target.value),
  });
}

function textarea(job, path, attrs = {}) {
  const value = getPath(job, path) ?? "";
  return el("textarea", {
    class: "textarea", ...attrs,
    onChange: (e) => updatePath(job.id, path, e.target.value),
  }, value);
}

function select(job, path, opts, attrs = {}) {
  const value = String(getPath(job, path) ?? "");
  const node = el("select", {
    class: "select", ...attrs,
    onChange: (e) => {
      updatePath(job.id, path, e.target.value);
      if (typeof attrs.onChange === "function") attrs.onChange(e);
    },
  });
  for (const [val, label] of opts) {
    const o = el("option", { value: val }, label);
    if (String(val) === value) o.selected = true;
    node.appendChild(o);
  }
  return node;
}

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

function updatePath(jobId, path, value) {
  const [a, b] = path.split(".");
  if (!b) updateJob(jobId, { [a]: value });
  else updateJob(jobId, { [a]: { [b]: value } });
}
