import { el, compressImage, toast, manualSearchLink, affiliateLink } from "../utils.js";
import { createJob, updateJob, getJobs } from "../state.js";
import { BRANDS } from "../data.js";

let snapshot = { dataUrl: null, brandId: "", model: "", serial: "" };

export function viewScan() {
  const wrap = el("div", { class: "space-y-3" });

  wrap.appendChild(el("h2", { class: "text-lg font-semibold" }, "Scan grill"));
  wrap.appendChild(el("p", { class: "text-sm text-ink-300 -mt-2" },
    "Snap the rating plate, then attach to a new or existing job."));

  const photoCard = el("div", { class: "card" });
  function renderPhoto() {
    while (photoCard.firstChild) photoCard.removeChild(photoCard.firstChild);
    if (snapshot.dataUrl) {
      photoCard.appendChild(el("img", { src: snapshot.dataUrl, class: "photo", alt: "Rating plate" }));
      photoCard.appendChild(
        el("div", { class: "grid grid-cols-2 gap-2 mt-2" },
          el("button", { type: "button", class: "btn btn-secondary", onClick: () => { snapshot.dataUrl = null; renderPhoto(); } }, "Retake"),
          retakeInput("Retake")
        )
      );
    } else {
      photoCard.appendChild(
        el("div", { class: "photo flex items-center justify-center aspect-[4/3] text-ink-400" },
          el("div", { class: "text-center" },
            el("div", { html: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>` }),
            el("div", { class: "mt-1" }, "Open camera")
          )
        )
      );
      photoCard.appendChild(el("div", { class: "mt-2" }, retakeInput("Open camera")));
    }
  }

  function retakeInput(label) {
    return el("label", { class: "btn btn-primary btn-block" },
      label,
      el("input", {
        type: "file", accept: "image/*", capture: "environment",
        class: "hidden",
        onChange: async (e) => {
          const file = e.target.files?.[0]; if (!file) return;
          snapshot.dataUrl = await compressImage(file);
          renderPhoto(); toast("Captured");
        }
      })
    );
  }

  renderPhoto();
  wrap.appendChild(photoCard);

  // ID form (manual entry; field tech reads it off the photo)
  const idForm = el("div", { class: "card space-y-3" },
    el("div", { class: "font-semibold" }, "Identify from plate"),
    el("label", { class: "block" }, el("span", { class: "label" }, "Brand"),
      (function () {
        const s = el("select", {
          class: "select",
          onChange: (e) => { snapshot.brandId = e.target.value; },
        });
        s.appendChild(el("option", { value: "" }, "Select brand…"));
        for (const b of BRANDS) {
          const o = el("option", { value: b.id }, b.name);
          if (snapshot.brandId === b.id) o.selected = true;
          s.appendChild(o);
        }
        return s;
      })()
    ),
    el("label", { class: "block" }, el("span", { class: "label" }, "Model #"),
      el("input", { class: "input", value: snapshot.model, onInput: (e) => (snapshot.model = e.target.value) })),
    el("label", { class: "block" }, el("span", { class: "label" }, "Serial #"),
      el("input", { class: "input", value: snapshot.serial, onInput: (e) => (snapshot.serial = e.target.value) })),
    el("div", { class: "grid grid-cols-2 gap-2" },
      el("button", {
        type: "button", class: "btn btn-secondary",
        onClick: () => {
          const brand = BRANDS.find((b) => b.id === snapshot.brandId);
          window.open(manualSearchLink(brand, snapshot.model), "_blank", "noopener");
        }
      }, "Find manual"),
      el("button", {
        type: "button", class: "btn btn-secondary",
        onClick: () => {
          const brand = BRANDS.find((b) => b.id === snapshot.brandId);
          const q = [brand?.name, snapshot.model, "parts"].filter(Boolean).join(" ");
          window.open(affiliateLink({ query: q }), "_blank", "noopener");
        }
      }, "Search parts"),
    )
  );
  wrap.appendChild(idForm);

  // Attach to job
  const jobs = getJobs().slice(0, 8);
  const attachCard = el("div", { class: "card space-y-3" },
    el("div", { class: "font-semibold" }, "Attach to job"),
    el("button", {
      type: "button", class: "btn btn-primary btn-block",
      onClick: () => {
        const brand = BRANDS.find((b) => b.id === snapshot.brandId);
        const job = createJob({
          grill: {
            brandId: brand?.id || "",
            brandName: brand?.name || "",
            model: snapshot.model,
            serial: snapshot.serial,
            photoPlate: snapshot.dataUrl || null,
          },
          visit: { reason: "inspection" },
        });
        snapshot = { dataUrl: null, brandId: "", model: "", serial: "" };
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
              ...(snapshot.dataUrl ? { photoPlate: snapshot.dataUrl } : {}),
            },
          });
          snapshot = { dataUrl: null, brandId: "", model: "", serial: "" };
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
  wrap.appendChild(attachCard);

  return wrap;
}
