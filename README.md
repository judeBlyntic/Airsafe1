# AirSafe Reports

A static web app (PWA) for producing AirSafe asbestos clearance certificates and
inspection records. Four report templates — Class A, Class B, Failed Clearance
and Mobile DCU — each exporting to Word (.docx) and PDF.

Reports, photos and attachments are stored locally in the browser (IndexedDB).
Only client contact details are shared, via Supabase.

## Repository layout

```
app/                    the deployed site (everything Vercel serves)
  index.html            entry point
  app.js                application logic, Word/PDF export
  templates.js          the four report definitions
  clients.js            Supabase client directory
  style.css
  logo.png, icons, cover image
  supabase_setup.sql    one-off database setup (not deployed)
vercel.json             hosting configuration
```

## Local development

```bash
python -m http.server 8742 --directory app
```

Then open http://localhost:8742.

### Cache busting — important

`index.html` loads its assets with version query strings:

```html
<link rel="stylesheet" href="style.css?v=22">
<script src="templates.js?v=17"></script>
<script src="app.js?v=25"></script>
```

**Bump the relevant `?v=` number every time you change `app.js`, `style.css` or
`templates.js`.** Browsers cache by full URL, so without a bump returning users
keep running the old file. `vercel.json` also sets HTML, JS and CSS to
revalidate on every request, so a missed bump degrades gracefully rather than
serving stale code for days.

## Deploying to Vercel

The app is static — there is no build step.

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project**, then import the repository.
3. Vercel reads `vercel.json`, so leave the defaults alone:
   - Framework Preset: **Other**
   - Build Command: *(empty)*
   - Output Directory: **app** (already set in `vercel.json`)
4. **Deploy.**

Every push to the default branch redeploys automatically. Pull requests get
their own preview URL.

### What `vercel.json` does

- Serves `app/` as the site root.
- `Cache-Control: max-age=0, must-revalidate` on HTML, the manifest, JS and CSS,
  so a deploy is picked up immediately.
- One-year immutable caching on images and icons.
- Baseline security headers (`nosniff`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`).

## Supabase

`app/clients.js` holds the project URL and the **publishable anon key**. Both are
designed to ship to the browser and are not secrets, but see the security note
below about what the anon key can reach.

Run `app/supabase_setup.sql` once in the Supabase SQL editor to create the
`clients` table and its policies.

> **Security note.** The current policies in `supabase_setup.sql` allow the anon
> key to select, insert and update every row in `clients`. That was reasonable
> while the app ran locally. Once the site is on a public Vercel URL, anyone who
> finds the URL can read the whole client directory — company names, contacts,
> phone numbers and email addresses. Before going live, either put the site
> behind Vercel Authentication (Project → Settings → Deployment Protection), or
> add Supabase Auth and change the policies from `using (true)` to
> `using (auth.role() = 'authenticated')`.

## Third-party scripts

Loaded from jsDelivr at runtime: `docx`, `jspdf`, `html2canvas` and
`@supabase/supabase-js`. The app needs network access on first load; there is no
service worker, so it does not currently work offline.
