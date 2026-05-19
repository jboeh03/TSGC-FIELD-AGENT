// Customers browse view — lists customers from the Google Sheet CRM,
// with quick search and a one-tap "Add job" that deep-links into
// #/jobs/new with the customer prefilled.

import { el, toast } from "../utils.js";
import { searchCustomers, crmHealth } from "../crm.js";

export function viewCustomers() {
  const wrap = el("div", { class: "space-y-3" });

  wrap.appendChild(el("h2", { class: "text-lg font-semibold" }, "Customers"));
  wrap.appendChild(
    el("p", { class: "text-sm text-ink-300 -mt-1" },
      "Live from your Google Sheet CRM. Tap a row to start a job for that customer."
    )
  );

  const statusCard = el("div", { class: "card flex items-center justify-between" },
    el("div", null,
      el("div", { class: "font-display uppercase tracking-wider text-[11px] text-burgundy" }, "CRM"),
      el("div", { class: "font-medium", id: "crmStatusText" }, "Checking…")
    ),
    el("span", { class: "chip", id: "crmStatusChip" }, "…")
  );
  wrap.appendChild(statusCard);

  // Search input
  let searchTimer;
  const searchInput = el("input", {
    class: "input",
    placeholder: "Search name, phone, email…",
    type: "search",
    onInput: (e) => {
      clearTimeout(searchTimer);
      const q = e.target.value;
      searchTimer = setTimeout(() => load(q), 250);
    },
  });
  wrap.appendChild(
    el("label", { class: "block" },
      el("span", { class: "label" }, "Search"),
      searchInput
    )
  );

  const list = el("div", { class: "space-y-2" });
  wrap.appendChild(list);

  // Initial load
  crmHealth().then((h) => {
    const chip = wrap.querySelector("#crmStatusChip");
    const txt  = wrap.querySelector("#crmStatusText");
    if (h.available) {
      chip.textContent = "Connected";
      chip.classList.add("chip-ok");
      txt.textContent = "Google Sheet connected";
      load("");
    } else {
      chip.textContent = "Not configured";
      chip.classList.add("chip-burgundy");
      txt.textContent = "Set GOOGLE_SHEET_ID + API key in Vercel";
    }
  });

  async function load(q) {
    while (list.firstChild) list.removeChild(list.firstChild);
    list.appendChild(el("div", { class: "text-sm text-ink-400 py-2 text-center" }, "Loading…"));
    try {
      const rows = await searchCustomers(q);
      while (list.firstChild) list.removeChild(list.firstChild);
      if (!rows.length) {
        list.appendChild(emptyState(q));
        return;
      }
      for (const c of rows) list.appendChild(customerRow(c));
    } catch (err) {
      while (list.firstChild) list.removeChild(list.firstChild);
      list.appendChild(
        el("div", { class: "card text-sm text-burgundy" },
          err.message || "Failed to load CRM"
        )
      );
    }
  }

  return wrap;
}

function customerRow(c) {
  const href = newJobLink(c);
  return el("a", { href, class: "card card-hover block" },
    el("div", { class: "flex items-start justify-between gap-3" },
      el("div", { class: "min-w-0 flex-1 space-y-0.5" },
        el("div", { class: "font-display uppercase tracking-wider text-[11px] text-muted" },
          c.id || "Customer"
        ),
        el("div", { class: "font-semibold text-charcoal truncate" }, c.name || "(no name)"),
        el("div", { class: "text-xs text-muted truncate" },
          [c.phone, c.email].filter(Boolean).join("  ·  ") || c.address || "—"
        ),
        c.grillBrand || c.grillModel
          ? el("div", { class: "text-xs text-muted truncate" },
              [c.grillBrand, c.grillModel].filter(Boolean).join(" ")
            )
          : null
      ),
      el("span", { class: "chip chip-burgundy shrink-0" }, "Add job")
    )
  );
}

function newJobLink(c) {
  const params = new URLSearchParams();
  if (c.id)          params.set("customerId", c.id);
  if (c.name)        params.set("name", c.name);
  if (c.phone)       params.set("phone", c.phone);
  if (c.email)       params.set("email", c.email);
  if (c.address)     params.set("address", c.address);
  if (c.grillBrand)  params.set("brand", c.grillBrand);
  if (c.grillModel)  params.set("model", c.grillModel);
  if (c.grillSerial) params.set("serial", c.grillSerial);
  if (c.notes)       params.set("notes", c.notes);
  params.set("source", `CRM · ${c.name || c.id || "customer"}`);
  return `#/jobs/new?${params.toString()}`;
}

function emptyState(q) {
  return el("div", { class: "empty" },
    el("div", { class: "font-medium" }, q ? `No matches for "${q}"` : "No customers in the Sheet yet"),
    el("div", { class: "text-sm mt-1" },
      q ? "Try a different search term." : "Add rows to your Customers sheet and they'll show up here."
    )
  );
}
