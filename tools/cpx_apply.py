"""Apply a Stitch-based redesign to a calculator page.

Keeps the page's <head> metadata, shared site header and footer untouched.
Replaces only <main>...</main>, adds the shared design-system CSS/JS, swaps
the legacy page script for the redesigned one, and (optionally) replaces the
JSON-LD blocks and title/description.

Usage: python tools/cpx_apply.py financial/compound-interest-calculator.html
Reads:  tools/redesign/<slug>.main.html   (required, the new <main> inner HTML)
        tools/redesign/<slug>.head.json   (optional: title, description, jsonld[])
        js/calc/<slug>.js                 (required, page logic)
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS_VER = "20260929q"


def main(rel):
    path = os.path.join(ROOT, rel)
    slug = re.sub(r"-calculator$", "", os.path.splitext(os.path.basename(rel))[0])
    red = os.path.join(ROOT, "tools", "redesign")
    main_html = open(os.path.join(red, slug + ".main.html"), encoding="utf-8").read().strip()
    if not os.path.exists(os.path.join(ROOT, "js", "calc", slug + ".js")):
        sys.exit("missing js/calc/%s.js" % slug)
    html = open(path, encoding="utf-8").read()

    # 0. optional per-page cleanup of legacy assets (regexes in head.json "strip")
    hp0 = os.path.join(red, slug + ".head.json")
    if os.path.exists(hp0):
        for pat in json.load(open(hp0, encoding="utf-8")).get("strip", []):
            html = re.sub(pat, "", html, flags=re.S)

    # 1. main
    html, n = re.subn(r"<main>.*?</main>", "<main>\n" + main_html + "\n</main>", html, flags=re.S)
    assert n == 1, "expected exactly one <main>"

    # 2. stylesheet: drop tailwind/legacy page css, add cp-calc.css after styles.css
    html = re.sub(r'\s*<link rel="stylesheet" href="/css/(calc-workspace|chip-contrast|cp-calc)\.css[^"]*">', "", html)
    html = re.sub(r'(<link rel="stylesheet" href="/css/styles\.css[^"]*">)',
                  r'\1\n<link rel="stylesheet" href="/css/cp-calc.css?v=%s">' % CSS_VER, html, count=1)

    # 3. scripts: keep currency-format + nav, replace page-specific scripts
    body_scripts = re.findall(r'<script src="/js/([^"?]+)[^"]*"></script>', html.split("</main>")[1])
    for s in body_scripts:
        if s not in ("currency-format.js", "nav.js"):
            html = re.sub(r'\s*<script src="/js/%s[^"]*"></script>' % re.escape(s), "", html)
    html = html.replace('<script src="/js/cp-calc.js', '<script data-old src="/js/cp-calc.js')
    html = re.sub(r'\s*<script data-old src="/js/cp-calc\.js[^"]*"></script>', "", html)
    html = re.sub(r'\s*<script src="/js/calc/[^"]*"></script>', "", html)
    html = re.sub(r'(<script src="/js/nav\.js[^"]*"></script>)',
                  '<script src="/js/cp-calc.js?v=%s"></script>\n<script src="/js/calc/%s.js?v=%s"></script>\n\\1'
                  % (CSS_VER, slug, CSS_VER), html, count=1)

    # 4. optional head updates
    hp = os.path.join(red, slug + ".head.json")
    if os.path.exists(hp):
        head = json.load(open(hp, encoding="utf-8"))
        if head.get("title"):
            t = head["title"]
            html = re.sub(r"<title>.*?</title>", "<title>%s</title>" % t, html, count=1, flags=re.S)
            html = re.sub(r'(<meta property="og:title" content=")[^"]*', r"\g<1>" + t.replace("\\", "\\\\"), html)
            html = re.sub(r'(<meta name="twitter:title" content=")[^"]*', r"\g<1>" + t.replace("\\", "\\\\"), html)
        if head.get("description"):
            d = head["description"].replace("\\", "\\\\")
            for pat in (r'(<meta name="description" content=")[^"]*', r'(<meta property="og:description" content=")[^"]*',
                        r'(<meta name="twitter:description" content=")[^"]*'):
                html = re.sub(pat, r"\g<1>" + d, html)
        # extra <head> tags (e.g. icon font), wrapped in markers so re-runs replace them
        html = re.sub(r"\s*<!-- cpx-head-extra -->.*?<!-- /cpx-head-extra -->", "", html, flags=re.S)
        if head.get("head_extra"):
            html = html.replace("</head>", "<!-- cpx-head-extra -->\n%s\n<!-- /cpx-head-extra -->\n</head>" % head["head_extra"], 1)
        if head.get("jsonld"):
            html = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', "", html, flags=re.S)
            blocks = "".join('\n<script type="application/ld+json">\n%s\n</script>' % json.dumps(b, ensure_ascii=False, indent=1)
                             for b in head["jsonld"])
            html = html.replace("</head>", blocks + "\n</head>", 1)

    open(path, "w", encoding="utf-8", newline="\n").write(html)
    print("updated", rel)


if __name__ == "__main__":
    for a in sys.argv[1:]:
        main(a)
