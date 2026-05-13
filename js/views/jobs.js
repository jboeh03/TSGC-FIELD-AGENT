import { el, dateShort, timeAgo } from "../utils.js";
import { getJobs } from "../state.js";

function jobCard(job) {
  const name = job.customer.name || "(no customer name)";
  const grill = [job.grill.brandName, job.grill.model].filter(Boolean).join(" ") || "Grill TBD";
  const statusChip = el("span", { class: `chip ${statusClass(job.status)}` }, statusLabel(job.status));
  return el(
    "a",
    { href: `#/jobs/${job.id}`, class: "card card-hover block" },
    el("div", { class: "flex items-start justify-between gap-3" },
      el("div", { class: "min-w-0" },
        el("div", { class: "font-semibold text-ink-100 truncate" }, name),
        el("div", { class: "text-sm text-ink-300 truncate" }, grill),
        el("div", { class: "text-xs text-ink-400 mt-1" },
          job.customer.address ? job.customer.address.split("\n")[0] : "No address yet"
        ),
      ),
      el("div", { class: "text-right shrink-0" },
        statusChip,
        el("div", { class: "text-[11px] text-ink-400 mt-1" }, timeAgo(job.updatedAt))
      )
    )
  );
}

function statusLabel(s) {
  return { open: "Open", quoted: "Quoted", scheduled: "Scheduled", complete: "Complete" }[s] || s;
}
function statusClass(s) {
  return { open: "chip-warn", quoted: "chip-info", scheduled: "chip-info", complete: "chip-ok" }[s] || "";
}

export function viewJobs() {
  const jobs = getJobs();
  const wrap = el("div", { class: "space-y-3" });

  wrap.appendChild(
    el("div", { class: "flex items-center justify-between" },
      el("h2", { class: "text-lg font-semibold" }, `Jobs`),
      el("a", { href: "#/jobs/new", class: "btn btn-primary btn-sm" },
        el("span", { html: "+" }), "New job"
      )
    )
  );

  if (!jobs.length) {
    wrap.appendChild(
      el("div", { class: "empty card" },
        el("div", { html: `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M3 12h18M3 17h18"/></svg>` }),
        el("div", { class: "font-medium text-ink-200" }, "No jobs yet"),
        el("div", { class: "text-sm" }, "Start a job when you arrive on-site."),
        el("a", { href: "#/jobs/new", class: "btn btn-primary mt-3 inline-flex" }, "Start a job")
      )
    );
    return wrap;
  }

  const list = el("div", { class: "space-y-3" }, ...jobs.map(jobCard));
  wrap.appendChild(list);
  return wrap;
}
