import { el, moneyRange, affiliateLink } from "../utils.js";
import { PARTS, BRANDS } from "../data.js";

let filter = { q: "", brand: "", category: "" };

export function viewParts() {
  const wrap = el("div", { class: "space-y-3" });

  wrap.appendChild(el("h2", { class: "text-lg font-semibold" }, "Parts catalog"));
  wrap.appendChild(
    el("div", { class: "text-xs text-ink-300 -mt-2" },
      "All buy links route through grillpartsreplacement.com (ref ",
      el("span", { class: "font-mono" }, "zsgtagbs"), ")."
    )
  );

  wrap.appendChild(
    el("input", {
      class: "input", placeholder: "Search burner, igniter, regulator…", value: filter.q,
      onInput: (e) => { filter.q = e.target.value; render(); },
    })
  );

  wrap.appendChild(
    el("div", { class: "grid grid-cols-2 gap-2" },
      selectFilter("Brand", "brand", [["", "Any brand"], ...BRANDS.map((b) => [b.id, b.name])]),
      selectFilter("Category", "category", [
        ["", "Any category"],
        ...Array.from(new Set(PARTS.map((p) => p.category))).map((c) => [c, c]),
      ])
    )
  );

  const results = el("div", { class: "space-y-2" });
  wrap.appendChild(results);

  function render() {
    while (results.firstChild) results.removeChild(results.firstChild);
    const brand = BRANDS.find((b) => b.id === filter.brand);
    const list = PARTS.filter((p) => {
      if (filter.category && p.category !== filter.category) return false;
      if (brand && !brand.common.includes(p.id)) return false;
      if (filter.q) {
        const hay = `${p.name} ${p.desc} ${p.category} ${p.searchTerms}`.toLowerCase();
        if (!hay.includes(filter.q.toLowerCase())) return false;
      }
      return true;
    });

    if (!list.length) {
      results.appendChild(el("div", { class: "empty card" },
        el("div", { class: "font-medium text-ink-200" }, "No matches"),
        el("div", { class: "text-sm" }, "Try a different keyword.")
      ));
      return;
    }

    for (const p of list) {
      const buyUrl = affiliateLink({
        query: [brand?.name, p.searchTerms].filter(Boolean).join(" "),
      });
      results.appendChild(
        el("div", { class: "card space-y-2" },
          el("div", { class: "flex items-start justify-between gap-3" },
            el("div", { class: "min-w-0" },
              el("div", { class: "font-medium" }, p.name),
              el("div", { class: "text-xs text-ink-400" }, p.category, " · ", moneyRange(p.priceEst))
            ),
            el("a", { href: buyUrl, target: "_blank", rel: "noopener nofollow", class: "btn btn-primary btn-sm shrink-0" }, "Find part")
          ),
          el("div", { class: "text-sm text-ink-300" }, p.desc),
          el("details", { class: "text-sm" },
            el("summary", { class: "text-ink-300 cursor-pointer" }, "Install steps"),
            el("div", { class: "text-ink-200 mt-1 whitespace-pre-wrap" }, p.install)
          )
        )
      );
    }
  }

  render();
  return wrap;

  function selectFilter(label, key, opts) {
    const sel = el("select", {
      class: "select",
      onChange: (e) => { filter[key] = e.target.value; render(); },
    });
    for (const [v, l] of opts) {
      const o = el("option", { value: v }, l);
      if (filter[key] === v) o.selected = true;
      sel.appendChild(o);
    }
    return el("label", { class: "block" }, el("span", { class: "label" }, label), sel);
  }
}
