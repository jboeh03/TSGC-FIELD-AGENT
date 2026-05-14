// Reusable customer-lookup component (search + ID).
// Returns a DOM node. Calls onSelect(customer) when one is picked.

import { el, toast } from "./utils.js";
import { searchCustomers, getCustomerById, crmHealth } from "./crm.js";

export function customerLookup({ onSelect, compact = false } = {}) {
  const wrap = el("div", { class: "card space-y-2" });

  const statusChip = el("span", { class: "chip" }, "checking…");
  wrap.appendChild(
    el("div", { class: "flex items-center justify-between" },
      el("div", { class: "font-semibold" }, "Look up customer"),
      statusChip
    )
  );

  if (!compact) {
    wrap.appendChild(
      el("div", { class: "text-xs text-ink-300" },
        "Pulls from your Google Sheet CRM. Type a name / phone / email, or paste a customer ID."
      )
    );
  }

  // Search input
  let searchTimer;
  const searchInput = el("input", {
    class: "input",
    placeholder: "Search name, phone, email…",
    type: "search",
    autocapitalize: "off",
    onInput: (e) => {
      clearTimeout(searchTimer);
      const q = e.target.value;
      searchTimer = setTimeout(() => runSearch(q), 250);
    },
  });
  wrap.appendChild(
    el("label", { class: "block" },
      el("span", { class: "label" }, "Search"),
      searchInput
    )
  );

  // ID input
  const idInput = el("input", {
    class: "input",
    placeholder: "C001, C002, etc.",
    autocapitalize: "characters",
  });
  wrap.appendChild(
    el("label", { class: "block" },
      el("span", { class: "label" }, "Or paste customer ID"),
      el("div", { class: "grid grid-cols-[1fr_auto] gap-2" },
        idInput,
        el("button", {
          type: "button", class: "btn btn-secondary",
          onClick: async () => {
            const id = idInput.value.trim();
            if (!id) return;
            try {
              const c = await getCustomerById(id);
              if (!c) { toast("No customer with that ID"); return; }
              onSelect && onSelect(c);
              toast(`Loaded ${c.name || c.id}`);
              idInput.value = "";
            } catch (err) {
              toast(err.message || "Lookup failed");
            }
          }
        }, "Fill")
      )
    )
  );

  const results = el("div", { class: "space-y-1" });
  wrap.appendChild(results);

  // Async health check
  crmHealth().then((h) => {
    statusChip.textContent = h.available ? "CRM connected" : "CRM not configured";
    statusChip.classList.add(h.available ? "chip-ok" : "chip-warn");
    if (!h.available) {
      results.appendChild(
        el("div", { class: "text-xs text-ink-400 mt-1" },
          "Set up the Sheet connection in Settings → CRM."
        )
      );
    }
  });

  async function runSearch(q) {
    while (results.firstChild) results.removeChild(results.firstChild);
    if (!q || !q.trim()) return;
    results.appendChild(
      el("div", { class: "text-xs text-ink-400 py-1" }, "Searching…")
    );
    try {
      const matches = await searchCustomers(q.trim());
      while (results.firstChild) results.removeChild(results.firstChild);
      if (!matches.length) {
        results.appendChild(
          el("div", { class: "text-sm text-ink-400 py-1" }, "No matches.")
        );
        return;
      }
      for (const c of matches) {
        results.appendChild(
          el("button", {
            type: "button",
            class: "w-full text-left p-2 rounded-lg border border-ink-700 active:bg-ink-700",
            onClick: () => {
              onSelect && onSelect(c);
              toast(`Loaded ${c.name || c.id}`);
              searchInput.value = "";
              while (results.firstChild) results.removeChild(results.firstChild);
            }
          },
            el("div", { class: "flex items-center justify-between gap-2" },
              el("div", { class: "min-w-0 flex-1" },
                el("div", { class: "font-medium text-ink-100 truncate" }, c.name || "(no name)"),
                el("div", { class: "text-xs text-ink-400 truncate" },
                  [c.phone, c.email].filter(Boolean).join(" · ") || c.address || "—"
                )
              ),
              c.id ? el("span", { class: "chip text-[10px]" }, c.id) : null
            )
          )
        );
      }
    } catch (err) {
      while (results.firstChild) results.removeChild(results.firstChild);
      results.appendChild(
        el("div", { class: "text-sm text-red-400" }, err.message || "Search failed")
      );
    }
  }

  return wrap;
}
