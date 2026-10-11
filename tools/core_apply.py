"""Apply the Stitch "Core Pages" redesign (about, methodology, privacy, terms, embed, pricing).

Replaces only <main>...</main> with tools/redesign/core/<slug>.main.html, keeps the
site header/footer/analytics, adds css/cp-core.css (scoped Tailwind build of the Stitch
markup), the Plus Jakarta Sans + Material Symbols subset and js/cp-core.js (js/cp-pricing.js
+ css/cp-pricing.css for the pricing page).

Usage: python tools/core_apply.py about.html methodology.html privacy.html terms.html embed/index.html pricing.html
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VER = "20261001a"
SLUG = {"about.html": "about", "methodology.html": "methodology", "privacy.html": "privacy",
        "terms.html": "terms", "embed/index.html": "embed", "pricing.html": "pricing"}
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap">\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=%s&display=block">')
NAV = '<script src="/js/nav.js?v=3d1747f9"></script>'


def read(*p):
    return open(os.path.join(ROOT, *p), encoding="utf-8").read()


def icons(frag):
    names = set(re.findall(r'<span[^>]*material-symbols-outlined[^>]*>\s*([a-z0-9_]+)\s*</span>', frag))
    return ",".join(sorted(names))


def main(rel):
    path = os.path.join(ROOT, rel)
    slug = SLUG[rel]
    frag = read("tools", "redesign", "core", slug + ".main.html").strip()
    if slug == "methodology":
        frag = frag.replace("<aside ", "<aside data-toc ")
    html = open(path, encoding="utf-8").read()

    html, n = re.subn(r"<main>.*?</main>", lambda m: "<main>\n" + frag + "\n</main>", html, flags=re.S)
    assert n == 1, "expected one <main>"

    def drop_inline(m):
        body = m.group(0)
        return body if ("gtag" in body or "dataLayer" in body or "application/ld+json" in body) else ""

    if slug == "embed":
        # legacy page-specific CSS, preview modal and inline scripts
        html = re.sub(r"\s*<style>.*?</style>", "", html, count=1, flags=re.S)
        html = re.sub(r'\s*<!-- Preview modal -->\s*<div class="modal-overlay" id="previewModal">.*?</div>\s*</div>\s*</div>', "", html, count=1, flags=re.S)
        html = re.sub(r"\s*<script>(?!</script>).*?</script>", drop_inline, html, flags=re.S)
        n_cards = frag.count('class="calc-card')
        html = re.sub(r"CalculatePilot's \d+ free calculators", "CalculatePilot's %d free calculators" % n_cards, html)

    if slug == "pricing":
        html = re.sub(r"\s*<style>.*?</style>", "", html, count=1, flags=re.S)
        html = re.sub(r"\s*<script>(?!</script>).*?</script>", drop_inline, html, flags=re.S)
        html = re.sub(r"Embed \d+ free calculators", "Embed %d free calculators" % read("tools", "redesign", "core", "embed.main.html").count('class="calc-card'), html)

    if slug in ("privacy", "pricing"):  # same footer + nav as every other page
        foot = read("tools", "redesign", "core", "_footer.html")
        if slug == "pricing":
            foot = foot.replace('<div class="footer-bottom">', '<div class="footer-bottom" style="flex-wrap:wrap; gap:10px 20px; align-items:center;">')
            foot = foot.replace("All calculations are estimates — consult a professional for financial or medical decisions.", "Estimates only — for guidance, not professional advice.")
        html = re.sub(r'<footer class="site-footer[^"]*"[^>]*>.*?</footer>', lambda m: foot, html, count=1, flags=re.S)  # then run tools/footer_build.py
        if "/js/nav.js" not in html:
            html = html.replace("</body>", NAV + "\n</body>", 1)
    if slug == "pricing":
        head = read("tools", "redesign", "core", "_header.html")
        html = re.sub(r'<header class="site-header">.*?</header>', lambda m: head, html, count=1, flags=re.S)

    # head: stylesheets + fonts (replace on re-run)
    html = re.sub(r'\s*<link rel="stylesheet" href="/css/cp-(core|pricing)\.css[^"]*">', "", html)
    html = re.sub(r"\s*<!-- cp-core-head -->.*?<!-- /cp-core-head -->", "", html, flags=re.S)
    css = '\n<link rel="stylesheet" href="/css/cp-core.css?v=%s">' % VER
    if slug == "pricing":
        css += '\n<link rel="stylesheet" href="/css/cp-pricing.css?v=%s">' % VER
    html = re.sub(r'(<link rel="stylesheet" href="/css/styles\.css[^"]*">)', lambda m: m.group(1) + css, html, count=1)
    icon_list = icons(frag)
    if slug == "pricing":  # icons set by js/cp-pricing.js
        icon_list = ",".join(sorted(set(icon_list.split(",")) | {"error"}))
    fonts = FONTS % icon_list
    if slug == "pricing":  # filled check icons need the FILL axis
        fonts = fonts.replace("FILL,GRAD@24,400,0,0", "FILL,GRAD@24,400,0..1,0")
    html = html.replace("</head>", "<!-- cp-core-head -->\n%s\n<!-- /cp-core-head -->\n</head>" % fonts, 1)

    # script
    html = re.sub(r'\s*<script src="/js/cp-(core|pricing)\.js[^"]*" defer></script>', "", html)
    js = "cp-pricing.js" if slug == "pricing" else "cp-core.js"
    html = html.replace("</body>", '<script src="/js/%s?v=%s" defer></script>\n</body>' % (js, VER), 1)

    open(path, "w", encoding="utf-8", newline="\n").write(html)
    print("updated", rel)


if __name__ == "__main__":
    for a in sys.argv[1:]:
        main(a)
