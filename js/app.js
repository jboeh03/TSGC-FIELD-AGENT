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

// Hash routing — simple, no build step needed.
const routes = [
  { match: /^#\/jobs\/new$/,             tab: "jobs",      title: "New job",          back: "#/jobs",                                  view: () => viewNewJob() },
  { match: /^#\/jobs\/([^/]+)\/share$/,  tab: "jobs",      title: "Share before / after", back: (m) => `#/jobs/${m[1]}`,               view: (m) => viewShare(m[1]) },
  { match: /^#\/jobs\/([^/]+)$/,         tab: "jobs",      title: "Job",              back: "#/jobs",                                  view: (m) => viewJob(m[1]) },
  { match: /^#\/jobs\/?$/,               tab: "jobs",      title: "Jobs",                                                              view: () => viewJobs() },
  { match: /^#\/parts\/?$/,          tab: "parts",     title: "Parts",                                  view: () => viewParts() },
  { match: /^#\/scan\/?$/,           tab: "scan",      title: "Scan grill",                             view: () => viewScan() },
  { match: /^#\/knowledge\/?$/,      tab: "knowledge", title: "Troubleshooting",                        view: () => viewKnowledge() },
  { match: /^#\/manuals\/?$/,        tab: "manuals",   title: "Manuals",                                view: () => viewManuals() },
  { match: /^#\/settings\/?$/,       tab: null,        title: "Settings",         back: "#/jobs",      view: () => viewSettings() },
];

function resolve(hash) {
  for (const r of routes) {
    const m = hash.match(r.match);
    if (m) return { route: r, params: m };
  }
  return null;
}

function render() {
  const hash = location.hash || "#/jobs";
  const resolved = resolve(hash) || resolve("#/jobs");
  const { route, params } = resolved;

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
    view.appendChild(route.view(params));
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
