import { el, toast } from "../utils.js";
import { createJob } from "../state.js";
import { BRANDS } from "../data.js";
import { customerLookup } from "../customerLookup.js";

export function viewNewJob() {
  const form = el("form", { class: "space-y-4", onsubmit: onSubmit });

  form.appendChild(el("h2", { class: "text-lg font-semibold" }, "New job"));
  form.appendChild(el("p", { class: "text-sm text-ink-300 -mt-2" },
    "Capture the basics now — you can finish details from the job page on-site."
  ));

  // Customer lookup (from Google Sheet CRM)
  form.appendChild(customerLookup({
    onSelect: (c) => {
      if (form.elements.name)    form.elements.name.value    = c.name    || form.elements.name.value;
      if (form.elements.phone)   form.elements.phone.value   = c.phone   || form.elements.phone.value;
      if (form.elements.email)   form.elements.email.value   = c.email   || form.elements.email.value;
      if (form.elements.address) form.elements.address.value = c.address || form.elements.address.value;
      if (c.grillBrand && form.elements.brandId) {
        const brand = BRANDS.find((b) => b.name.toLowerCase() === c.grillBrand.toLowerCase());
        if (brand) form.elements.brandId.value = brand.id;
      }
      if (c.grillModel && form.elements.model)   form.elements.model.value  = c.grillModel;
      if (c.grillSerial && form.elements.serial) form.elements.serial.value = c.grillSerial;
    }
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

  return form;
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
    visit: { reason: data.visitReason || "inspection" },
  });
  toast("Job created");
  location.hash = `#/jobs/${job.id}`;
}
