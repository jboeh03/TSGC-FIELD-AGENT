import { $, $$, clear, el } from "./utils.js";
import { viewJobs }      from "./views/jobs.js";
import { viewNewJob }    from "./views/newJob.js";
import { viewJob }       from "./views/job.js";
import { viewParts }     from "./views/parts.js";
import { viewKnowledge } from "./views/knowledge.js";
import { viewManuals }   from "./views/manuals.js";
import { viewScan }      from "./views/scan.js";
import { viewSettings }  from "./views/settings.js";
import { viewShare }     from "./views/share.js";
import { viewCustomers } from "./views/customers.js";

// Hash routing — simple, no build step needed.
// Each view receives ({ params, query }) — params is the regex match array,
// query is a plain object parsed from anything after "?" in the hash.
const routes = [
  { match: /^#\/jobs\/new$/,             tab: "jobs",      title: "New job",          back: "#/jobs",                                  view: (ctx) => viewNewJob(ctx) },
  { match: /^#\/jobs\/([^/]+)\/share$/,  tab: "jobs",      title: "Share before / after", back: (m) => `#/jobs/${m[1]}`,               view: (ctx) => viewShare(ctx.params[1]) },
  { match: /^#\/jobs\/([^/]+)$/,         tab: "jobs",      title: "Job",              back: "#/jobs",                                  view: (ctx) => viewJob(ctx.params[1]) },
  { match: /^#\/jobs\/?$/,               tab: "jobs",      title: "Jobs",                                                              view: () => viewJobs() },
  { match: /^#\/customers\/?$/,      tab: null,        title: "Customers",        back: "#/jobs",      view: () => viewCustomers() },
  { match: /^#\/parts\/?$/,          tab: "parts",     title: "Parts",                                  view: () => viewParts() },
  { match: /^#\/scan\/?$/,           tab: "scan",      title: "Scan grill",                             view: () => viewScan() },
  { match: /^#\/knowledge\/?$/,      tab: "knowledge", title: "Troubleshooting",                        view: () => viewKnowledge() },
  { match: /^#\/manuals\/?$/,        tab: "manuals",   title: "Manuals",                                view: () => viewManuals() },
  { match: /^#\/settings\/?$/,       tab: null,        title: "Settings",         back: "#/jobs",      view: () => viewSettings() },
];

function splitHash(hash) {
  const qIdx = hash.indexOf("?");
  if (qIdx === -1) return { path: hash, query: {} };
  const path = hash.slice(0, qIdx);
  const query = {};
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  for (const [k, v] of params.entries()) query[k] = v;
  return { path, query };
}

function resolve(hash) {
  const { path, query } = splitHash(hash);
  for (const r of routes) {
    const m = path.match(r.match);
    if (m) return { route: r, params: m, query };
  }
  return null;
}

function render() {
  const hash = location.hash || "#/jobs";
  const resolved = resolve(hash) || resolve("#/jobs");
  const { route, params, query } = resolved;

  // Title + back button
  $("#title").textContent = route.title;
  const backBtn = $("#backBtn");
  if (route.back) {
    backBtn.classList.remove("hidden");
    const target = typeof route.back === "function" ? route.back(params) : route.back;
    backBtn.onclick = () => { location.hash = target; };
  } else {
    backBtn.classList.add("hidden");
    backBtn.onclick = null;
  }

  // Active tab
  for (const a of $$("#tabbar .tab")) {
    if (a.dataset.tab === route.tab) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }

  const view = $("#view");
  clear(view);
  try {
    view.appendChild(route.view({ params, query }));
  } catch (err) {
    console.error(err);
    view.appendChild(el("div", { class: "card text-sm" },
      el("div", { class: "font-semibold mb-1" }, "Something went wrong"),
      el("div", { class: "text-ink-300" }, String(err && err.message || err))
    ));
  }

  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

window.addEventListener("hashchange", render);
window.addEventListener("tsgc:rerender", render);
window.addEventListener("DOMContentLoaded", () => {
  // Menu toggle
  const menu = $("#menu");
  $("#menuBtn").addEventListener("click", () => menu.classList.remove("hidden"));
  for (const node of $$("[data-close]")) {
    node.addEventListener("click", (e) => {
      if (e.currentTarget === e.target || node.tagName === "A") menu.classList.add("hidden");
    });
  }

  // First paint
  if (!location.hash) location.hash = "#/jobs";
  render();
});
