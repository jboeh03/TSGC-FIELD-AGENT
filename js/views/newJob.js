import { el, toast } from "../utils.js";
import { createJob } from "../state.js";
import { BRANDS } from "../data.js";
import { customerLookup } from "../customerLookup.js";
import { getCustomerById } from "../crm.js";

// Recognized query params (any subset) — used for deep-links from lead
// emails, the website contact form, or the Customers browse view:
//   #/jobs/new?name=Jane&phone=555-1234&email=jane@example.com
//             &address=123%20Main%20St&reason=cleaning
//             &brand=Weber&model=Genesis%20II&serial=12345
//             &customerId=C001     <- triggers a CRM lookup
//             &notes=Free-form%20text
const REASON_VALUES = new Set(["inspection", "cleaning", "repair", "other"]);

export function viewNewJob(ctx = {}) {
  const query = ctx.query || {};

  const form = el("form", { class: "space-y-4", onsubmit: onSubmit });

  form.appendChild(el("h2", { class: "text-lg font-semibold" }, "New job"));
  form.appendChild(el("p", { class: "text-sm text-ink-300 -mt-2" },
    "Capture the basics now — you can finish details from the job page on-site."
  ));

  // Optional prefill banner so the tech knows where the data came from
  if (query.source) {
    form.appendChild(
      el("div", { class: "card flex items-center justify-between" },
        el("div", null,
          el("div", { class: "font-display uppercase tracking-wider text-[11px] text-burgundy" }, "Prefilled from"),
          el("div", { class: "font-medium" }, decodeURIComponent(query.source))
        ),
        el("span", { class: "chip chip-burgundy" }, "Lead")
      )
    );
  }

  // Customer lookup (from Google Sheet CRM)
  form.appendChild(customerLookup({
    onSelect: (c) => fillFormFromCustomer(form, c),
  }));

  form.appendChild(field("Customer name", input("name", { required: true, placeholder: "Jane Doe" })));
  form.appendChild(
    el("div", { class: "grid grid-cols-2 gap-3" },
      field("Phone", input("phone", { type: "tel", placeholder: "(555) 123-4567" })),
      field("Email", input("email", { type: "email", placeholder: "jane@example.com" }))
    )
  );
  form.appendChild(field("Service address",
    el("textarea", { class: "textarea", name: "address", rows: 2, placeholder: "123 Main St\nTownship, ST 12345" })
  ));

  form.appendChild(el("div", { class: "divider" }));

  form.appendChild(
    el("div", { class: "grid grid-cols-2 gap-3" },
      field("Visit reason", select("visitReason", [
        ["inspection", "Inspection"],
        ["cleaning", "Cleaning"],
        ["repair", "Repair"],
        ["other", "Other"],
      ])),
      field("Grill brand", select("brandId",
        [["", "Select brand…"], ...BRANDS.map((b) => [b.id, b.name])]
      ))
    )
  );

  form.appendChild(
    el("div", { class: "grid grid-cols-2 gap-3" },
      field("Model #", input("model", { placeholder: "e.g. 61014001" })),
      field("Serial #", input("serial", { placeholder: "e.g. 220511…" }))
    )
  );

  form.appendChild(
    el("div", { class: "grid grid-cols-2 gap-3" },
      el("a", { href: "#/jobs", class: "btn btn-secondary btn-block" }, "Cancel"),
      el("button", { type: "submit", class: "btn btn-primary btn-block" }, "Create job")
    )
  );

  // Apply query-param prefills (sync — they're just strings)
  applyQueryPrefill(form, query);

  // If the URL carries a CRM customer ID, async-fetch the canonical record
  // so grill brand / model / serial / notes flow in too.
  if (query.customerId) {
    getCustomerById(query.customerId)
      .then((c) => {
        if (c) {
          fillFormFromCustomer(form, c, { overwrite: false });
          toast(`Loaded ${c.name || c.id}`);
        }
      })
      .catch(() => { /* silent — manual edit still works */ });
  }

  return form;
}

function applyQueryPrefill(form, q) {
  const set = (name, value) => {
    if (!value) return;
    const node = form.elements[name];
    if (node && !node.value) node.value = value;
  };
  set("name",    q.name);
  set("phone",   q.phone);
  set("email",   q.email);
  set("address", q.address);
  set("model",   q.model);
  set("serial",  q.serial);

  if (q.reason && REASON_VALUES.has(q.reason)) {
    if (form.elements.visitReason) form.elements.visitReason.value = q.reason;
  }
  if (q.brand && form.elements.brandId) {
    const brand = BRANDS.find((b) => b.name.toLowerCase() === q.brand.toLowerCase());
    if (brand) form.elements.brandId.value = brand.id;
  }
  if (q.notes) {
    // Stash notes on the form so onSubmit can pick them up; we don't expose
    // a notes field on this form yet, but the job page does.
    form.dataset.prefilledNotes = q.notes;
  }
}

function fillFormFromCustomer(form, c, opts = {}) {
  const overwrite = opts.overwrite !== false;
  const set = (name, value) => {
    if (!value) return;
    const node = form.elements[name];
    if (!node) return;
    if (overwrite || !node.value) node.value = value;
  };
  set("name",    c.name);
  set("phone",   c.phone);
  set("email",   c.email);
  set("address", c.address);
  set("model",   c.grillModel);
  set("serial",  c.grillSerial);
  if (c.grillBrand && form.elements.brandId) {
    const brand = BRANDS.find((b) => b.name.toLowerCase() === c.grillBrand.toLowerCase());
    if (brand && (overwrite || !form.elements.brandId.value)) form.elements.brandId.value = brand.id;
  }
  if (c.notes && !form.dataset.prefilledNotes) {
    form.dataset.prefilledNotes = c.notes;
  }
}

function input(name, attrs = {}) {
  return el("input", { class: "input", name, ...attrs });
}
function select(name, opts) {
  const s = el("select", { class: "select", name });
  for (const [val, label] of opts) s.appendChild(el("option", { value: val }, label));
  return s;
}
function field(label, control) {
  return el("label", { class: "block" },
    el("span", { class: "label" }, label),
    control
  );
}

function onSubmit(e) {
  e.preventDefault();
  const f = e.currentTarget;
  const data = Object.fromEntries(new FormData(f).entries());
  const brand = BRANDS.find((b) => b.id === data.brandId);
  const job = createJob({
    customer: {
      name: data.name?.trim() || "",
      phone: data.phone?.trim() || "",
      email: data.email?.trim() || "",
      address: data.address?.trim() || "",
    },
    grill: {
      brandId: brand?.id || "",
      brandName: brand?.name || "",
      model: data.model?.trim() || "",
      serial: data.serial?.trim() || "",
    },
    visit: {
      reason: data.visitReason || "inspection",
      notes: f.dataset.prefilledNotes ? f.dataset.prefilledNotes.trim() : "",
    },
  });
  toast("Job created");
  location.hash = `#/jobs/${job.id}`;
}
