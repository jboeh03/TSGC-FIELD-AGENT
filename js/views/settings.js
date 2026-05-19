import { el, toast } from "../utils.js";
import { getSettings, updateSettings, exportAll, importAll, wipeAll } from "../state.js";
import { crmHealth } from "../crm.js";

export function viewSettings() {
  const s = getSettings();
  const wrap = el("div", { class: "space-y-4" });

  wrap.appendChild(el("h2", { class: "text-lg font-semibold" }, "Settings"));

  wrap.appendChild(
    el("div", { class: "card space-y-3" },
      field("Company name", inputBound(s, "companyName")),
      field("Technician name", inputBound(s, "techName", { placeholder: "Your name (for estimates)" })),
      el("div", { class: "grid grid-cols-3 gap-3" },
        field("Tax %", inputBound(s, "taxRate", { type: "number", step: "0.01" })),
        field("Labor $/hr", inputBound(s, "laborRate", { type: "number", step: "1" })),
        field("Trip fee $", inputBound(s, "tripFee", { type: "number", step: "1" }))
      )
    )
  );

  wrap.appendChild(
    el("div", { class: "card space-y-2" },
      el("div", { class: "font-semibold" }, "Affiliate"),
      el("div", { class: "text-sm text-ink-300" },
        "All part links pass through ",
        el("span", { class: "font-mono" }, "grillpartsreplacement.com/?ref=zsgtagbs"),
        ". Add more affiliate sources later by editing data.js."
      )
    )
  );

  wrap.appendChild(crmSection());
  wrap.appendChild(leadEmailSection());

  wrap.appendChild(
    el("div", { class: "card space-y-2" },
      el("div", { class: "font-semibold" }, "Backup"),
      el("div", { class: "grid grid-cols-2 gap-2" },
        el("button", { type: "button", class: "btn btn-secondary btn-block", onClick: doExport }, "Export JSON"),
        el("label", { class: "btn btn-secondary btn-block" }, "Import JSON",
          el("input", {
            type: "file", accept: "application/json", class: "hidden",
            onChange: async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const ok = importAll(await f.text());
              toast(ok ? "Imported" : "Import failed");
              if (ok) setTimeout(() => location.reload(), 500);
            }
          })
        )
      ),
      el("button", { type: "button", class: "btn btn-danger btn-block", onClick: () => {
        if (confirm("Wipe ALL local data? This cannot be undone.")) { wipeAll(); location.reload(); }
      } }, "Wipe all data")
    )
  );

  return wrap;

  function field(label, control) {
    return el("label", { class: "block" }, el("span", { class: "label" }, label), control);
  }
  function inputBound(s, key, attrs = {}) {
    return el("input", {
      class: "input", value: s[key] ?? "", ...attrs,
      onChange: (e) => {
        let v = e.target.value;
        if (attrs.type === "number") v = Number(v || 0);
        updateSettings({ [key]: v });
        toast("Saved");
      },
    });
  }
}

function crmSection() {
  const card = el("div", { class: "card space-y-2" },
    el("div", { class: "flex items-center justify-between" },
      el("div", { class: "font-semibold" }, "CRM (Google Sheet)"),
      el("span", { class: "chip", id: "crmHealthChip" }, "Checking…")
    ),
    el("div", { class: "text-sm text-ink-300" },
      "Reads customers from your Google Sheet so you can autofill new jobs from the lookup widget or the ",
      el("a", { href: "#/customers", class: "text-burgundy font-medium" }, "Customers"),
      " tab in the menu."
    ),
    el("div", { class: "text-xs text-ink-400", id: "crmHealthDetail" }, "")
  );
  crmHealth(true).then((h) => {
    const chip = card.querySelector("#crmHealthChip");
    const detail = card.querySelector("#crmHealthDetail");
    if (h.available) {
      chip.textContent = "Connected";
      chip.classList.add("chip-ok");
      detail.textContent = h.range ? `Range: ${h.range}` : "";
    } else {
      chip.textContent = "Not configured";
      chip.classList.add("chip-burgundy");
      detail.textContent = "Set GOOGLE_SHEETS_API_KEY and GOOGLE_SHEET_ID in Vercel, then redeploy.";
    }
  });
  return card;
}

function leadEmailSection() {
  // Build a deep-link template the user can paste into their website's
  // lead-notification email (Contact Form 7, WPForms, Squarespace, etc.).
  const origin = location.origin + location.pathname.replace(/\/$/, "");
  const tmpl =
    `${origin}/#/jobs/new?` +
    [
      "name={{name}}",
      "phone={{phone}}",
      "email={{email}}",
      "address={{address}}",
      "reason=cleaning",
      "notes={{message}}",
      "source=Website%20lead",
    ].join("&");

  const example =
    `${origin}/#/jobs/new?` +
    "name=Jane%20Doe&phone=5551234567&email=jane%40example.com" +
    "&address=123%20Main%20St%20Cincinnati%20OH%2045202" +
    "&reason=cleaning&source=Website%20lead";

  const tmplBox = el("input", { class: "input font-mono text-xs", readonly: true, value: tmpl });

  return el("div", { class: "card space-y-3" },
    el("div", { class: "font-semibold" }, "Lead email → New job link"),
    el("div", { class: "text-sm text-ink-300" },
      "Paste this URL into your website's lead-notification email template. ",
      "Replace the ", el("span", { class: "font-mono" }, "{{name}}"),
      "-style tokens with whatever placeholders your form plugin uses ",
      "(Contact Form 7: ", el("span", { class: "font-mono" }, "[name]"),
      ", WPForms: ", el("span", { class: "font-mono" }, "{field_id=\"1\"}"),
      "). Tap the link on your phone and the New Job form opens prefilled."
    ),
    tmplBox,
    el("div", { class: "grid grid-cols-2 gap-2" },
      el("button", {
        type: "button", class: "btn btn-secondary btn-block",
        onClick: () => copyText(tmpl, "Template copied")
      }, "Copy template"),
      el("a", {
        href: example, target: "_blank", rel: "noopener",
        class: "btn btn-secondary btn-block"
      }, "Try example")
    ),
    el("div", { class: "text-xs text-ink-400" },
      "Tip: the link works as plain text in any email — no app install needed. iOS/Android open it in the browser, which loads the PWA from the home screen if already installed."
    )
  );
}

function copyText(s, msg) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(s).then(() => toast(msg || "Copied"));
  } else {
    const ta = document.createElement("textarea");
    ta.value = s; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
    toast(msg || "Copied");
  }
}

function doExport() {
  const blob = new Blob([exportAll()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tsgc-field-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast("Exported");
}
