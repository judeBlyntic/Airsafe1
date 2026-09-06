"""Build a single self-contained index.html (for Hostinger or any static host).

Inlines style.css, templates.js, app.js and embeds logo/signature/icons as data URIs.
The docx/jspdf/html2canvas libraries stay on CDN (they need internet anyway).

Usage:  python build_single.py       ->  ../hostinger/index.html
"""
import base64, json, pathlib, re

APP = pathlib.Path(__file__).parent
OUT_DIR = APP.parent / "hostinger"
OUT_DIR.mkdir(exist_ok=True)

def b64(name, mime="image/png"):
    return f"data:{mime};base64," + base64.b64encode((APP / name).read_bytes()).decode()

logo = b64("logo.png")
signature = b64("signature.png")
icon192 = b64("icon-192.png")
icon512 = b64("icon-512.png")

css = (APP / "style.css").read_text(encoding="utf-8")
templates_js = (APP / "templates.js").read_text(encoding="utf-8")
app_js = (APP / "app.js").read_text(encoding="utf-8")

# ---- rewire asset references in app.js ----
app_js = app_js.replace('fetch("logo.png")', "fetch(ASSETS.logo)")
app_js = app_js.replace('fetch("signature.png")', "fetch(ASSETS.signature)")
app_js = app_js.replace('sig.src = "signature.png";', "sig.src = ASSETS.signature;")
# these occur inside template literals, so ${...} interpolation is valid
app_js = app_js.replace('src="logo.png"', 'src="${ASSETS.logo}"')
app_js = app_js.replace('src="signature.png"', 'src="${ASSETS.signature}"')

leftover = [m for m in re.findall(r'(?:logo|signature)\.png', app_js + templates_js)]
if leftover:
    raise SystemExit(f"Unhandled asset references remain: {leftover}")

manifest = {
    "name": "AirSafe Reports",
    "short_name": "AirSafe",
    "description": "Create, review and email AirSafe asbestos clearance certificates and inspection records.",
    "start_url": "./",
    "scope": "./",
    "display": "standalone",
    "orientation": "any",
    "background_color": "#f2f5f9",
    "theme_color": "#1b1b6f",
    "icons": [
        {"src": icon192, "sizes": "192x192", "type": "image/png", "purpose": "any"},
        {"src": icon512, "sizes": "512x512", "type": "image/png", "purpose": "any"},
    ],
}
manifest_uri = "data:application/manifest+json," + json.dumps(manifest).replace("#", "%23")

# ---- body markup: reuse the dev index.html body, minus its script tags ----
src_html = (APP / "index.html").read_text(encoding="utf-8")
body = re.search(r"<body>(.*)</body>", src_html, re.S).group(1)
body = re.sub(r'<script src="templates\.js[^"]*"></script>\s*', "", body)
body = re.sub(r'<script src="app\.js[^"]*"></script>\s*', "", body)
body = body.replace('src="logo.png"', f'src="{logo}"')

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#1b1b6f">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="AirSafe">
<title>AirSafe Reports</title>
<link rel="manifest" href='{manifest_uri}'>
<link rel="icon" href="{icon192}">
<link rel="apple-touch-icon" href="{icon192}">
<style>
{css}
</style>
<script src="https://cdn.jsdelivr.net/npm/docx@9/dist/index.iife.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
</head>
<body>
{body}
<script>
const ASSETS = {{
  logo: "{logo}",
  signature: "{signature}"
}};
{templates_js}
{app_js}
</script>
</body>
</html>
"""

out = OUT_DIR / "index.html"
out.write_text(html, encoding="utf-8")
print(f"Wrote {out}  ({out.stat().st_size / 1024:.0f} KB)")
