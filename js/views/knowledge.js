import { el, affiliateLink } from "../utils.js";
import { FAQS, PARTS, TAGS } from "../data.js";

let kQuery = "";
let kTag = "";

export function viewKnowledge() {
  const wrap = el("div", { class: "space-y-3" });

  wrap.appendChild(el("h2", { class: "text-lg font-semibold" }, "Troubleshooting"));
  wrap.appendChild(
    el("input", {
      class: "input", placeholder: "Won't light, low heat, flare-ups…", value: kQuery,
      onInput: (e) => { kQuery = e.target.value; render(); },
    })
  );

  const tagRow = el("div", { class: "flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" });
  for (const t of [""].concat(TAGS)) {
    tagRow.appendChild(
      el("button", {
        type: "button",
        class: `chip ${kTag === t ? "chip-info" : ""} shrink-0`,
        onClick: () => { kTag = t; render(); },
      }, t || "All")
    );
  }
  wrap.appendChild(tagRow);

  const list = el("div", { class: "space-y-2" });
  wrap.appendChild(list);

  function render() {
    while (list.firstChild) list.removeChild(list.firstChild);
    const matched = FAQS.filter((f) => {
      if (kTag && !f.tags.includes(kTag)) return false;
      if (kQuery) {
        const hay = `${f.q} ${f.tags.join(" ")} ${f.fixes.join(" ")}`.toLowerCase();
        if (!hay.includes(kQuery.toLowerCase())) return false;
      }
      return true;
    });

    if (!matched.length) {
      list.appendChild(el("div", { class: "empty card" },
        el("div", { class: "font-medium text-ink-200" }, "No matches"),
        el("div", { class: "text-sm" }, "Try a broader keyword.")
      ));
      return;
    }

    for (const faq of matched) {
      const partList = faq.parts.map((id) => PARTS.find((p) => p.id === id)).filter(Boolean);
      const card = el("details", { class: "card" },
        el("summary", { class: "font-medium cursor-pointer" }, faq.q),
        el("ol", { class: "list-decimal pl-5 mt-2 space-y-1 text-sm text-ink-200" },
          ...faq.fixes.map((f) => el("li", null, f))
        ),
        partList.length
          ? el("div", { class: "mt-3 pt-3 border-t border-ink-700 space-y-1" },
              el("div", { class: "text-xs text-ink-300" }, "Likely replacement parts:"),
              ...partList.map((p) =>
                el("a", {
                  href: affiliateLink({ query: p.searchTerms }),
                  target: "_blank", rel: "noopener nofollow",
                  class: "block text-sm text-brand-500"
                }, "→ ", p.name)
              )
            )
          : null
      );
      list.appendChild(card);
    }
  }

  render();
  return wrap;
}
