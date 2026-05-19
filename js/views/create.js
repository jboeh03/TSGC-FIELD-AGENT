// Standalone Before & After creator — works without a job.
// Pick two photos, edit eyebrow / title / caption, switch formats,
// then download or share. Same renderer the job-share page uses.

import { el, toast, compressImage } from "../utils.js";
import { renderComposite, compositeBlob, listFormats } from "../composite.js";
import { getSettings } from "../state.js";

export function viewCreate(ctx = {}) {
  const settings = getSettings();
  const initial = ctx.initial || {};
  const state = {
    before: initial.before || null,
    after:  initial.after  || null,
    eyebrow: initial.eyebrow ?? defaultEyebrow(settings),
    title:   initial.title   || "",
    caption: initial.caption || "",
    formatId: initial.formatId || "square",
  };

  const wrap = el("div", { class: "space-y-4 pb-24" });

  if (initial.heading) {
    wrap.appendChild(el("h2", { class: "text-lg font-semibold" }, initial.heading));
  } else {
    wrap.appendChild(el("h2", { class: "text-lg font-semibold" }, "Create before & after"));
  }
  wrap.appendChild(
    el("p", { class: "text-sm text-ink-300 -mt-2" },
      initial.subhead ||
      "Pick two photos, edit the labels, and export branded versions for every platform."
    )
  );

  if (initial.backHref) {
    wrap.appendChild(
      el("a", { href: initial.backHref, class: "btn btn-secondary btn-sm inline-flex" }, "← Back to job")
    );
  }

  // ---- Photo picker row ----
  const photoRow = el("div", { class: "grid grid-cols-2 gap-3" });
  photoRow.appendChild(photoSlot("Before", "before"));
  photoRow.appendChild(photoSlot("After",  "after"));
  wrap.appendChild(photoRow);

  // ---- Text inputs ----
  const textCard = el("div", { class: "card space-y-3" },
    el("div", { class: "font-semibold" }, "Text overlay"),
    textField("Eyebrow",  "eyebrow", state.eyebrow, "CINCINNATI, OH · MAY 2026"),
    textField("Title",    "title",   state.title,   "DCS 5-burner built-in"),
    textField("Caption",  "caption", state.caption, "Service time: 4.5 hrs"),
    el("div", { class: "text-xs text-ink-400" },
      "Leave all three blank to export a clean version with no overlay."
    )
  );
  wrap.appendChild(textCard);

  // ---- Format tabs ----
  const formatCard = el("div", { class: "card space-y-3" });
  formatCard.appendChild(el("div", { class: "font-semibold" }, "Platform"));
  const formatBtns = el("div", { class: "grid grid-cols-2 gap-2" });
  for (const f of listFormats()) {
    const btn = el("button", {
      type: "button",
      class: "btn btn-secondary btn-block text-left",
      "data-format": f.id,
      onClick: () => { state.formatId = f.id; selectFormat(); rerender(); },
    },
      el("div", { class: "flex flex-col items-start gap-0.5" },
        el("span", { class: "font-display uppercase tracking-wider text-[11px]" }, f.label.split(" — ")[0]),
        el("span", { class: "text-[10px] text-ink-300 normal-case tracking-normal" }, `${f.w} × ${f.h}`)
      )
    );
    formatBtns.appendChild(btn);
  }
  formatCard.appendChild(formatBtns);
  wrap.appendChild(formatCard);

  // ---- Preview ----
  const previewCard = el("div", { class: "card space-y-3" });
  previewCard.appendChild(el("div", { class: "font-semibold flex items-center justify-between" },
    el("span", null, "Preview"),
    el("span", { class: "chip", id: "previewStatus" }, "Pick photos to preview")
  ));
  const previewHolder = el("div", { class: "rounded-md overflow-hidden bg-cream-dark", id: "previewHolder" });
  previewCard.appendChild(previewHolder);
  wrap.appendChild(previewCard);

  // ---- Action bar ----
  const actions = el("div", { class: "grid grid-cols-2 gap-2" });
  const downloadBtn = el("button", {
    type: "button", class: "btn btn-primary btn-block", disabled: true,
    onClick: doDownload,
  }, "Download JPG");
  const shareBtn = el("button", {
    type: "button", class: "btn btn-secondary btn-block", disabled: true,
    onClick: doShare,
  }, "Share");
  actions.appendChild(downloadBtn);
  actions.appendChild(shareBtn);
  wrap.appendChild(actions);

  wrap.appendChild(
    el("button", {
      type: "button", class: "btn btn-ghost btn-block",
      onClick: () => {
        state.before = state.after = null;
        state.title = state.caption = "";
        state.eyebrow = defaultEyebrow(settings);
        for (const inp of wrap.querySelectorAll("input.input, textarea.textarea")) {
          if (inp.name === "eyebrow") inp.value = state.eyebrow;
          else if (inp.name === "title" || inp.name === "caption") inp.value = "";
        }
        for (const slot of wrap.querySelectorAll("[data-photo-slot]")) {
          slot.querySelector("[data-photo-img]")?.remove();
          slot.querySelector("[data-photo-placeholder]")?.classList.remove("hidden");
        }
        rerender();
      }
    }, "Reset")
  );

  // Mount: paint initial state
  setTimeout(() => { selectFormat(); rerender(); }, 0);

  // ---------- helpers (closures) ----------

  function photoSlot(label, key) {
    const slot = el("label", {
      class: "card flex items-center justify-center text-center cursor-pointer aspect-square relative overflow-hidden",
      "data-photo-slot": key,
    });
    const ph = el("div", {
      class: "flex flex-col items-center gap-2 p-2" + (state[key] ? " hidden" : ""),
      "data-photo-placeholder": "",
    },
      el("div", { class: "font-display uppercase tracking-wider text-[11px] text-burgundy" }, label),
      el("div", { class: "text-sm text-muted" }, "Tap to add"),
      el("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round", class: "text-muted" },
        el("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
        el("circle", { cx: "9", cy: "9", r: "2" }),
        el("path", { d: "M21 15l-5-5L5 21" })
      )
    );
    slot.appendChild(ph);
    if (state[key]) {
      slot.appendChild(el("img", {
        src: state[key], alt: label,
        class: "absolute inset-0 w-full h-full object-cover",
        "data-photo-img": "",
      }));
    }
    slot.appendChild(el("input", {
      type: "file", accept: "image/*", capture: "environment",
      class: "hidden",
      onChange: async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        try {
          const dataUrl = await compressImage(f, 2000, 0.9);
          state[key] = dataUrl;
          ph.classList.add("hidden");
          const old = slot.querySelector("[data-photo-img]");
          if (old) old.remove();
          slot.appendChild(el("img", {
            src: dataUrl, alt: label,
            class: "absolute inset-0 w-full h-full object-cover",
            "data-photo-img": "",
          }));
          rerender();
        } catch (err) {
          toast(err.message || "Could not load photo");
        }
      },
    }));
    return slot;
  }

  function textField(label, name, value, placeholder) {
    const isMulti = name === "caption";
    const control = isMulti
      ? el("textarea", {
          class: "textarea", name, rows: 2, placeholder,
          onInput: (e) => { state[name] = e.target.value; rerender(); },
        }, value || "")
      : el("input", {
          class: "input", name, type: "text", value: value || "", placeholder,
          onInput: (e) => { state[name] = e.target.value; rerender(); },
        });
    return el("label", { class: "block" },
      el("span", { class: "label" }, label),
      control
    );
  }

  function selectFormat() {
    for (const b of formatBtns.querySelectorAll("button")) {
      if (b.dataset.format === state.formatId) {
        b.classList.remove("btn-secondary");
        b.classList.add("btn-primary");
      } else {
        b.classList.add("btn-secondary");
        b.classList.remove("btn-primary");
      }
    }
  }

  let renderToken = 0;
  let renderTimer = null;
  function rerender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(actuallyRender, 120);
  }
  async function actuallyRender() {
    const status = wrap.querySelector("#previewStatus");
    const holder = wrap.querySelector("#previewHolder");

    if (!state.before || !state.after) {
      status.textContent = "Pick both photos";
      status.classList.add("chip-burgundy");
      status.classList.remove("chip-ok");
      while (holder.firstChild) holder.removeChild(holder.firstChild);
      holder.appendChild(el("div", { class: "p-12 text-center text-sm text-muted" },
        "Add a BEFORE and an AFTER photo to see your preview."
      ));
      downloadBtn.disabled = true;
      shareBtn.disabled = true;
      return;
    }

    const myToken = ++renderToken;
    status.textContent = "Rendering…";
    status.classList.remove("chip-burgundy", "chip-ok");
    try {
      const canvas = await renderComposite({
        before: state.before,
        after:  state.after,
        formatId: state.formatId,
        eyebrow: state.eyebrow,
        title:   state.title,
        caption: state.caption,
      });
      if (myToken !== renderToken) return; // a newer render started
      canvas.style.cssText = "display:block; width:100%; height:auto;";
      while (holder.firstChild) holder.removeChild(holder.firstChild);
      holder.appendChild(canvas);
      status.textContent = "Ready";
      status.classList.add("chip-ok");
      downloadBtn.disabled = false;
      shareBtn.disabled = false;
    } catch (err) {
      if (myToken !== renderToken) return;
      console.error(err);
      status.textContent = "Render failed";
      status.classList.add("chip-burgundy");
      while (holder.firstChild) holder.removeChild(holder.firstChild);
      holder.appendChild(el("div", { class: "p-6 text-sm text-burgundy text-center" },
        err.message || "Could not render preview"
      ));
    }
  }

  async function doDownload() {
    try {
      const blob = await compositeBlob({
        before: state.before, after: state.after, formatId: state.formatId,
        eyebrow: state.eyebrow, title: state.title, caption: state.caption,
      });
      const fileName = buildFileName(state);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast("Downloaded");
    } catch (err) {
      console.error(err);
      toast("Download failed");
    }
  }

  async function doShare() {
    try {
      const blob = await compositeBlob({
        before: state.before, after: state.after, formatId: state.formatId,
        eyebrow: state.eyebrow, title: state.title, caption: state.caption,
      });
      const fileName = buildFileName(state);
      const file = new File([blob], fileName, { type: "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Tri-State Grill Cleaning",
          text: [state.title, state.caption].filter(Boolean).join(" — ") || "Before & after",
        });
      } else {
        await doDownload();
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
      console.error(err);
      toast("Share failed");
    }
  }

  return wrap;
}

function defaultEyebrow(settings) {
  const city = settings.serviceCity || "CINCINNATI, OH";
  const d = new Date();
  const monthYear = d.toLocaleString("en-US", { month: "short", year: "numeric" }).toUpperCase();
  return `${city.toUpperCase()} · ${monthYear}`;
}

function buildFileName(state) {
  const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const parts = ["tsgc", state.formatId];
  if (state.title) parts.push(slug(state.title));
  parts.push(new Date().toISOString().slice(0, 10));
  return parts.filter(Boolean).join("-") + ".jpg";
}
