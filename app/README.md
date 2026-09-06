# AirSafe Reports — Clearance Certificate Web App

A mobile- and PC-friendly web app for creating, reviewing, and emailing AirSafe reports,
built from the AirSafe Word templates. Supports four report types:

1. **Clearance Certificate — Class A** (ACC 2026 Class A)
2. **Clearance Certificate — Class B** (ACC 2026 Class B)
3. **Failed Clearance Inspection Record**
4. **Mobile DCU Clearance Report**

## How to run

The app is static files (`index.html`, `style.css`, `templates.js`, `app.js`) — no install needed.

**Option 1 — quick local run (PC):**
```
cd app
python -m http.server 8742
```
Then open http://localhost:8742 in any browser.

**Option 2 — use on your phone:**
Host the `app` folder on any static host (Netlify, GitHub Pages, your own server, or
a shared drive server on your office network), then open the URL on the phone.

> Note: generating the Word file uses the `docx` library loaded from a CDN, so the
> device needs internet access when exporting/sending.

## What it does

- **Home screen** — your report history as tiles showing the report type, site address,
  report number, and last-edited date/time. Tap a tile to continue editing; tap ✕ to delete.
  **+ New Report** opens a picker with the four report types.
- **Edit tab** — every section of the chosen template is editable (with spellcheck);
  all section titles are fixed. Checklists have Yes/No/N-A dropdowns plus comment fields.
- **Photos (Appendix A)** — add photos from camera or gallery; each photo is auto-numbered
  with its own comment box. Photos are compressed automatically.
- **Review tab** — a paginated A4 preview: cover page (logo, title, date of issue, report
  number, site address) and a running header (logo + report number) and footer
  (Page N of M + date of issue) on every page. "Print / Save as PDF" via the browser.
- **Send tab** — generates the report as a .docx. On a phone, "Share / Email with
  attachment" attaches the file directly in your email app; on a PC the file downloads
  and your email app opens pre-filled.
- **Autosave & history** — every report is saved automatically in the browser
  (IndexedDB), so you can close the page and continue later on the same device.
