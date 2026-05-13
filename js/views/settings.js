import { el, toast } from "../utils.js";
import { getSettings, updateSettings, exportAll, importAll, wipeAll } from "../state.js";

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
