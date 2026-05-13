# TSGC Field Agent

A mobile-first web app for **Tri-State Grill Cleaning** technicians. On every
inspection, cleaning, or repair job, open the app on your phone to:

- 📸 **Scan the grill** — take a photo of the rating plate (brand / model /
  serial), then jump straight to the service manual.
- 🔧 **Find parts** — a curated catalog of common burner tubes, flavorizer
  bars, igniters, regulators, kamado gaskets, pellet hot rods, etc.
- 🩺 **Troubleshoot symptoms** — pick a problem ("won't light", "low heat",
  "ErH on pellet grill") and the app lists the fixes plus the parts most
  likely needed.
- 💵 **Build the quote on-site** — one tap adds suggested parts and labor
  presets to an estimate. Edit qty / price. Text, email, or share the quote
  before you leave the driveway.
- 📚 **Save jobs** — every customer, photo, note, and estimate stays on the
  device (offline-first PWA, backed by `localStorage`).

Every "Buy" or "Find part" link routes through our affiliate at
**[grillpartsreplacement.com](https://grillpartsreplacement.com/?ref=zsgtagbs)**
with the `ref=zsgtagbs` parameter preserved — so any part a tech buys for a
job earns us commission.

---

## Run it locally

It's a static PWA — no build step.

```bash
# from the repo root, any static server works
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` on your laptop, or — for camera + PWA
install — visit your phone over your LAN (e.g. `http://192.168.x.x:8080`)
or deploy and use HTTPS.

> **Note:** the camera, "Add to home screen", and the service-worker offline
> cache all require **HTTPS** (or `localhost`). Plain HTTP on a LAN IP will
> let you browse but block the camera input.

## Deploy

Drop the repo into any of these — no config needed:

- **Vercel** — import the repo, framework "Other", output dir `.`.
- **Netlify** — drag-and-drop the folder or connect the repo.
- **GitHub Pages** — enable Pages on `main` (or this branch) at the root.
- **Cloudflare Pages** — connect the repo, build command empty, output `/`.

After deploying once, your team installs it on their phones:

1. Open the deployed URL in Safari (iOS) or Chrome (Android).
2. Share → **Add to Home Screen** (iOS) or **Install app** (Android).
3. It now launches full-screen with its own icon — works on driveway 4G.

## Using it in the field

1. **Tap Scan** (the camera button in the middle of the tab bar).
2. Snap the rating plate, type the brand / model / serial.
3. Tap **Find manual** or **Create new job from scan**.
4. On the job page:
   - The **Likely parts** card pre-suggests parts for the customer's brand.
   - Tap **Add** to drop one onto the estimate, or **Buy** to open the
     affiliate store with that part pre-searched.
   - **Troubleshoot symptoms** adds whole part bundles in one tap (e.g.
     "Grill won't light" adds igniter kit + regulator).
   - Adjust qty / price, set tax %, then **Text quote** or **Email quote**
     straight to the customer.

## Settings (gear icon in side menu)

- Company name & technician name (appear on the quote)
- Default tax %, labor $/hr, trip fee
- **Export / Import JSON** — quick backup, or move a job from one device to
  another by emailing the JSON.

## Adding parts / brands / FAQs

Everything in `js/data.js`. To add a new brand:

```js
{
  id: "memphis",
  name: "Memphis Wood Fire",
  manualSearch: "https://memphisgrills.com/support",
  notes: "Model plate inside hopper lid.",
  common: ["hot-rod-igniter", "induction-fan", "rtd-probe"]
}
```

Then append to the `BRANDS` array. New parts go in `PARTS`, new
troubleshooting entries in `FAQS`.

## Affiliate links

The `affiliateLink({ query })` helper in `js/utils.js` always emits

```
https://grillpartsreplacement.com/?s=<query>&ref=zsgtagbs
```

so the `ref` is preserved on every outbound link. When we add a second
affiliate (e.g. AppliancePartsPros, a brand's direct affiliate program),
extend that helper to route by part category.

## Tech stack

- Plain HTML / ES modules / CSS — no build step, no framework.
- [Tailwind CSS via CDN](https://tailwindcss.com/) for utility classes.
- Service worker (`sw.js`) for offline app-shell caching.
- `localStorage` (key `tsgc.field.v1`) for all job data.

## File map

```
.
├── index.html              app shell, tab bar, side menu
├── manifest.webmanifest    PWA install metadata
├── sw.js                   offline app-shell cache
├── icon.svg                app icon
├── styles.css              custom styles on top of Tailwind
└── js/
    ├── app.js              hash router + boot
    ├── data.js             brands, parts, FAQs, affiliate config
    ├── state.js            jobs + settings, localStorage persistence
    ├── utils.js            DOM helpers, money, photo compression, affiliate URL builder
    └── views/
        ├── jobs.js         list of jobs
        ├── newJob.js       create-job form
        ├── job.js          job detail + estimate builder
        ├── parts.js        searchable parts catalog
        ├── knowledge.js    troubleshooting FAQs
        ├── manuals.js      brand → service-manual lookup
        ├── scan.js         camera capture + attach-to-job flow
        └── settings.js     company / labor / tax / backup
```
