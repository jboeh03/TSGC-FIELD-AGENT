import { el, toast } from "../utils.js";
import { getJob } from "../state.js";
import { listFormats, compositeDataUrl, compositeBlob } from "../composite.js";

export function viewShare(jobId) {
  const job = getJob(jobId);
  if (!job) {
    return missing(jobId, "Job not found.");
  }
  if (!job.grill.photoBefore || !job.grill.photoAfter) {
    return missing(jobId, "Need both a BEFORE and an AFTER photo on the job first.");
  }

  const wrap = el("div", { class: "space-y-4 pb-32" });

  wrap.appendChild(pairCard(job));
  wrap.appendChild(el("h2", { class: "text-base font-semibold pt-1" }, "Pick a format"));

  for (const f of listFormats()) {
    wrap.appendChild(formatCard(job, f));
  }

  return wrap;
}

function missing(jobId, msg) {
  return el("div", { class: "empty card" },
    el("div", { class: "font-medium text-ink-200" }, msg),
    el("a", { href: `#/jobs/${jobId}`, class: "btn btn-primary mt-3 inline-flex" }, "Back to job")
  );
}

function pairCard(job) {
  return el("div", { class: "card" },
    el("div", { class: "grid grid-cols-2 gap-2" },
      labeledPhoto("BEFORE", job.grill.photoBefore),
      labeledPhoto("AFTER",  job.grill.photoAfter)
    )
  );
}

function labeledPhoto(label, src) {
  return el("div", { class: "relative" },
    el("img", { src, class: "photo aspect-square object-cover", alt: label }),
    el("span", { class: "absolute top-2 left-2 chip chip-warn", style: "font-weight:700" }, label)
  );
}

function formatCard(job, format) {
  const card = el("div", { class: "card space-y-2" });

  card.appendChild(
    el("div", { class: "flex items-center justify-between" },
      el("div", { class: "min-w-0" },
        el("div", { class: "font-medium" }, format.label),
        el("div", { class: "text-xs text-ink-400" }, `${format.w} × ${format.h}`)
      )
    )
  );

  const previewBox = el("div", { class: "bg-ink-900 rounded-lg overflow-hidden border border-ink-700" });
  const status = el("div", { class: "text-center text-ink-400 text-sm p-6" }, "Rendering preview…");
  previewBox.appendChild(status);
  card.appendChild(previewBox);

  const actionBar = el("div", { class: "grid grid-cols-2 gap-2" });
  card.appendChild(actionBar);

  // Render lazily after attach so the UI paints first.
  queueMicrotask(async () => {
    try {
      const dataUrl = await compositeDataUrl({
        before: job.grill.photoBefore,
        after: job.grill.photoAfter,
        formatId: format.id,
        subtitle: composeSubtitle(job),
      });
      previewBox.innerHTML = "";
      previewBox.appendChild(el("img", { src: dataUrl, class: "block w-full", alt: format.label }));

      const fileName = buildFileName(job, format);
      actionBar.appendChild(
        el("a", {
          href: dataUrl,
          download: fileName,
          class: "btn btn-primary",
        }, "Download")
      );
      actionBar.appendChild(
        el("button", {
          type: "button", class: "btn btn-secondary",
          onClick: () => shareImage(job, format),
        }, "Share")
      );
    } catch (err) {
      console.error(err);
      previewBox.innerHTML = "";
      previewBox.appendChild(
        el("div", { class: "text-sm text-red-400 p-4" },
          "Could not render this format. ",
          el("button", {
            type: "button", class: "underline",
            onClick: () => location.reload(),
          }, "Retry")
        )
      );
    }
  });

  return card;
}

function composeSubtitle(job) {
  const bits = [];
  if (job.customer.name) bits.push(job.customer.name);
  const grill = [job.grill.brandName, job.grill.model].filter(Boolean).join(" ");
  if (grill) bits.push(grill);
  return bits.join("  ·  ");
}

function buildFileName(job, format) {
  const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const parts = ["tsgc", format.id];
  if (job.customer.name) parts.push(slug(job.customer.name));
  parts.push(new Date().toISOString().slice(0, 10));
  return parts.join("-") + ".jpg";
}

async function shareImage(job, format) {
  try {
    const blob = await compositeBlob({
      before: job.grill.photoBefore,
      after: job.grill.photoAfter,
      formatId: format.id,
      subtitle: composeSubtitle(job),
    });
    const fileName = buildFileName(job, format);
    const file = new File([blob], fileName, { type: "image/jpeg" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Tri-State Grill Cleaning",
        text: composeSubtitle(job) || "Before & after — Tri-State Grill Cleaning",
      });
      return;
    }
    // Fallback: trigger download.
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Downloaded");
  } catch (err) {
    if (err && err.name === "AbortError") return; // user cancelled the share sheet
    console.error(err);
    toast("Share failed");
  }
}
