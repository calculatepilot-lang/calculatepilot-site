"""Regenerate every sitemap from the HTML files on disk.

A page is listed when it has no robots noindex and its canonical URL is its own URL.
lastmod is the date of the last git commit that touched the file. Pages that exist in
several languages get xhtml:link hreflang alternates. Usage: python tools/i18n/gen_sitemaps.py [--dry]
"""
import os, re, subprocess, sys, collections, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE = "https://www.calculatepilot.com"
LANGS = ("es", "fr", "de")
SKIP_DIRS = ("embed/", "tools/", "node_modules/", "api/", "feed/")
SKIP_FILES = {"404.html"}
DRY = "--dry" in sys.argv


def git_dates():
    out = subprocess.check_output(["git", "log", "--name-only", "--format=@@%cs", "--no-renames"], cwd=ROOT, text=True, encoding="utf-8", errors="replace")
    d, cur = {}, None
    for line in out.splitlines():
        if line.startswith("@@"):
            cur = line[2:]
        elif line.strip() and line not in d:
            d[line.strip()] = cur
    for f in subprocess.check_output(["git", "status", "--porcelain"], cwd=ROOT, text=True, encoding="utf-8", errors="replace").splitlines():
        d[f[3:].strip().strip('"')] = datetime.date.today().isoformat()
    return d


def url_of(rel):
    if rel.endswith("/index.html") or rel == "index.html":
        return BASE + "/" + rel[: -len("index.html")]
    return BASE + "/" + rel


def scan():
    pages = {}
    for dp, dn, fn in os.walk(ROOT):
        rel_dir = os.path.relpath(dp, ROOT).replace("\\", "/")
        if rel_dir.startswith((".git", "node_modules", "tools")):
            dn[:] = []
            continue
        for f in fn:
            if not f.endswith(".html"):
                continue
            rel = f if rel_dir == "." else rel_dir + "/" + f
            if rel in SKIP_FILES or rel.startswith(SKIP_DIRS):
                continue
            h = open(os.path.join(ROOT, rel), encoding="utf-8", errors="replace").read()
            if re.search(r'<meta\s+name="robots"[^>]*noindex', h, re.I):
                continue
            c = re.search(r'<link rel="canonical" href="([^"]*)"', h)
            u = url_of(rel)
            if not c or c.group(1) != u:
                continue
            pages[rel] = u
    return pages


def group(rel):
    p = rel.split("/")
    lang = p[0] if p[0] in LANGS else None
    q = p[1:] if lang else p
    top = q[0] if len(q) > 1 else ""
    return lang, ("/".join(q)), {"financial": "financial", "health": "health", "math": "math", "other": "everyday", "guides": "guides"}.get(top, "core")


def main():
    dates = git_dates()
    pages = scan()
    en = {group(r)[1]: r for r in pages if group(r)[0] is None}
    buckets = collections.defaultdict(list)
    for rel, u in sorted(pages.items()):
        lang, q, g = group(rel)
        buckets[(lang, g)].append(rel)
    alt = {}
    for q, rel in en.items():
        a = {"en": url_of(rel), "x-default": url_of(rel)}
        for lg in LANGS:
            r2 = lg + "/" + q
            if r2 in pages:
                a[lg] = pages[r2]
        alt[q] = a
    for rel in pages:
        lang, q, g = group(rel)
        if lang and q not in en:
            alt[q] = alt.get(q, {})

    def entry(rel):
        lang, q, g = group(rel)
        lm = dates.get(rel) or datetime.date.today().isoformat()
        x = "<url><loc>%s</loc><lastmod>%s</lastmod>" % (pages[rel], lm)
        a = alt.get(q)
        if a and len(a) > 2:
            for k in ("en", "es", "fr", "de", "x-default"):
                if k in a:
                    x += '<xhtml:link rel="alternate" hreflang="%s" href="%s"/>' % (k, a[k])
        return x + "</url>", lm

    NS = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"'
    written = {}
    files = {
        "sitemap-core.xml": buckets[(None, "core")], "sitemap-financial.xml": buckets[(None, "financial")], "sitemap-health.xml": buckets[(None, "health")],
        "sitemap-math.xml": buckets[(None, "math")], "sitemap-everyday.xml": buckets[(None, "everyday")], "sitemap-guides.xml": buckets[(None, "guides")],
    }
    for lg in LANGS:
        files["%s/sitemap.xml" % lg] = [r for (l, g), v in sorted(buckets.items(), key=lambda kv: str(kv[0])) if l == lg for r in v]
    idx = []
    for name, rels in files.items():
        if not rels:
            continue
        ents = [entry(r) for r in rels]
        body = "\n".join(e[0] for e in ents)
        xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset %s>\n%s\n</urlset>\n' % (NS, body)
        written[name] = len(rels)
        if not DRY:
            with open(os.path.join(ROOT, name), "w", encoding="utf-8", newline="\n") as fh:
                fh.write(xml)
        idx.append((name, max(e[1] for e in ents)))
    ix = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
        "  <sitemap>\n    <loc>%s/%s</loc>\n    <lastmod>%s</lastmod>\n  </sitemap>\n" % (BASE, n, lm) for n, lm in idx) + "</sitemapindex>\n"
    if not DRY:
        with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as fh:
            fh.write(ix)
    print(written, "total", sum(written.values()))


main()
