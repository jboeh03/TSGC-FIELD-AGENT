# TSGC Field Agent

A mobile-first web app for **Tri-State Grill Cleaning** technicians. On every
inspection, cleaning, or repair job, open the app on your phone to:

- 📸 **Scan the grill** — snap the rating plate, tap **Auto-extract** and
  Claude vision pulls brand / model / serial / BTU off the photo. Jump
  straight to the service manual.
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

## Deploy to Vercel (recommended — gets you live in ~3 minutes)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjboeh03%2FTSGC-FIELD-AGENT&env=ANTHROPIC_API_KEY&envDescription=Anthropic+API+key+used+by+the+%2Fapi%2Fvision+endpoint&envLink=https%3A%2F%2Fconsole.anthropic.com%2Faccount%2Fkeys&project-name=tsgc-field-agent&repository-name=tsgc-field-agent)

1. Click the button above (signs you in to Vercel with GitHub).
2. Pick the **`claude/grill-parts-mobile-app-C65jJ`** branch when prompted —
   or merge it to `main` first.
3. Paste your **`ANTHROPIC_API_KEY`** when Vercel asks for env vars
   (grab one at [console.anthropic.com/account/keys](https://console.anthropic.com/account/keys)).
4. Click **Deploy**. ~60 seconds later you have a URL like
   `https://tsgc-field-agent.vercel.app`.
5. Open that URL on your phone, tap **Share → Add to Home Screen** (iOS) or
   **Install app** (Android). Done.

### CLI alternative

```bash
npm i -g vercel
vercel login
vercel link        # link this repo to a new Vercel project
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview
vercel --prod      # deploy
```

### Env vars

| Name                       | Required | Default            | Purpose                                  |
| -------------------------- | -------- | ------------------ | ---------------------------------------- |
| `ANTHROPIC_API_KEY`        | ✅       | —                  | Used by `/api/vision` to call Claude.    |
| `ANTHROPIC_VISION_MODEL`   |          | `claude-sonnet-4-6`| Override to use a cheaper / faster model. |

### Other hosts

The app is a static PWA + one serverless function. Anywhere that runs both
will work:

- **Netlify** — move `api/vision.js` to `netlify/functions/vision.js` and add
  a redirect from `/api/vision` → that function.
- **Cloudflare Pages** — `functions/api/vision.js` (rename the file).
- **GitHub Pages / S3 / any static host** — works fine, but the AI extract
  button will show "endpoint unavailable" because there's no server.

After deploying once, your team installs it on their phones:

1. Open the deployed URL in Safari (iOS) or Chrome (Android).
2. Share → **Add to Home Screen** (iOS) or **Install app** (Android).
3. It now launches full-screen with its own icon — works on driveway 4G.

## Using it in the field

1. **Tap Scan** (the camera button in the middle of the tab bar).
2. Snap the rating plate, then tap **Auto-extract with AI** — Claude reads
   the brand / model / serial / BTU off the photo and fills the form.
   (Manual entry still works if the photo is unreadable.)
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
├── vercel.json             cache headers + (optional) edge config
├── api/
│   └── vision.js           Claude vision OCR endpoint (Vercel Edge function)
└── js/
    ├── app.js              hash router + boot
    ├── data.js             brands, parts, FAQs, affiliate config
    ├── state.js            jobs + settings, localStorage persistence
    ├── utils.js            DOM helpers, money, photo compression, affiliate URL builder
    ├── vision.js           client wrapper around /api/vision
    └── views/
        ├── jobs.js         list of jobs
        ├── newJob.js       create-job form
        ├── job.js          job detail + estimate builder
        ├── parts.js        searchable parts catalog
        ├── knowledge.js    troubleshooting FAQs
        ├── manuals.js      brand → service-manual lookup
        ├── scan.js         camera capture + AI extract + attach-to-job flow
        └── settings.js     company / labor / tax / backup
```
