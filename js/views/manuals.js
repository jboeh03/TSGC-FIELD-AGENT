import { el, manualSearchLink } from "../utils.js";
import { BRANDS } from "../data.js";

let mQuery = "";
let mBrand = "";

export function viewManuals() {
  const wrap = el("div", { class: "space-y-3" });
  wrap.appendChild(el("h2", { class: "text-lg font-semibold" }, "Service manuals"));
  wrap.appendChild(el("div", { class: "text-sm text-ink-300 -mt-2" },
    "Pick a brand, then enter the model number you read off the rating plate."));

  wrap.appendChild(
    el("input", {
      class: "input", placeholder: "Model # (e.g. 61014001)", value: mQuery,
      onInput: (e) => { mQuery = e.target.value; render(); },
    })
  );

  const brandRow = el("div", { class: "flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" });
  brandRow.appendChild(
    el("button", { type: "button", class: `chip ${mBrand === "" ? "chip-info" : ""} shrink-0`,
      onClick: () => { mBrand = ""; render(); } }, "All")
  );
  for (const b of BRANDS) {
    brandRow.appendChild(
      el("button", {
        type: "button",
        class: `chip ${mBrand === b.id ? "chip-info" : ""} shrink-0`,
        onClick: () => { mBrand = b.id; render(); }
      }, b.name)
    );
  }
  wrap.appendChild(brandRow);

  const list = el("div", { class: "space-y-2" });
  wrap.appendChild(list);

  function render() {
    while (list.firstChild) list.removeChild(list.firstChild);
    const brands = mBrand ? BRANDS.filter((b) => b.id === mBrand) : BRANDS;
    for (const b of brands) {
      const lookup = manualSearchLink(b, mQuery);
      list.appendChild(
        el("div", { class: "card space-y-2" },
          el("div", { class: "flex items-start justify-between gap-3" },
            el("div", { class: "min-w-0" },
              el("div", { class: "font-medium" }, b.name),
              el("div", { class: "text-xs text-ink-400" }, b.notes)
            ),
          ),
          el("div", { class: "flex gap-2" },
            el("a", { href: b.manualSearch, target: "_blank", rel: "noopener", class: "btn btn-secondary btn-sm" }, "Official"),
            el("a", { href: lookup, target: "_blank", rel: "noopener", class: "btn btn-primary btn-sm" },
              mQuery ? `Search "${mQuery}"` : "Web search"
            )
          )
        )
      );
    }
  }

  render();
  return wrap;
}
