import { el } from "../utils.js";
import { getJob, getSettings } from "../state.js";
import { viewCreate } from "./create.js";

export function viewShare(jobId) {
  const job = getJob(jobId);
  if (!job) return missing(jobId, "Job not found.");
  if (!job.grill.photoBefore || !job.grill.photoAfter) {
    return missing(jobId, "Need both a BEFORE and an AFTER photo on the job first.");
  }

  const settings = getSettings();
  return viewCreate({
    initial: {
      heading:  "Share before & after",
      subhead:  "Auto-filled from this job. Edit any field, switch platform, then download or share.",
      backHref: `#/jobs/${jobId}`,
      before:   job.grill.photoBefore,
      after:    job.grill.photoAfter,
      eyebrow:  composeEyebrow(job, settings),
      title:    composeTitle(job),
      caption:  composeCaption(job),
      formatId: "square",
    },
  });
}

function composeEyebrow(job, settings) {
  const city = settings.serviceCity || "CINCINNATI, OH";
  const d = new Date(job.updatedAt || job.createdAt || Date.now());
  const monthYear = d.toLocaleString("en-US", { month: "short", year: "numeric" }).toUpperCase();
  return `${city.toUpperCase()} · ${monthYear}`;
}

function composeTitle(job) {
  const bits = [job.grill.brandName, job.grill.model].filter(Boolean);
  return bits.join(" ") || (job.customer.name ? job.customer.name : "Before & after");
}

function composeCaption(job) {
  const reasonLabel = ({
    inspection: "Inspection",
    cleaning:   "Deep clean",
    repair:     "Service & repair",
    other:      "Service",
  })[job.visit?.reason] || "Service";
  return reasonLabel;
}

function missing(jobId, msg) {
  return el("div", { class: "empty card" },
    el("div", { class: "font-medium" }, msg),
    el("a", { href: `#/jobs/${jobId}`, class: "btn btn-primary mt-3 inline-flex" }, "Back to job")
  );
}
