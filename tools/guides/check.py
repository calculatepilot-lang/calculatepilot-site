"""Pre-publish gate: every guide in guides/ (except index.html) must use the Stitch article template.
Run before committing/publishing any guide:  python tools/guides/check.py   (exit 1 on failure)
Fix a failure by writing the guide in tools/guides/src/<slug>.html and running python tools/guide_build.py <slug>
(the builder adds the Article + BreadcrumbList schema and the sitemap-guides.xml entry; python tools/guide_build.py --schema-only
<slug> backfills those two on an already-built guide).
Also required: the guide is listed in sitemap-guides.xml and carries valid Article + BreadcrumbList JSON-LD.
"""
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, "guides")
need = ['class="site-footer cp-footer"', 'href="/css/footer.css', 'href="/css/mobile-fix.css', '<div class="cpguide">', 'href="/css/cp-guide.css', 'src="/js/cp-guide.js', 'id="cpgBar"', 'class="cpg-toc', 'rel="author"']
import json
SITEMAP = open(os.path.join(ROOT, "sitemap-guides.xml"), encoding="utf-8").read()
meta = json.load(open(os.path.join(ROOT, "tools/guides/meta.json"), encoding="utf-8"))
CAT = {"Finance & money": "finance", "Math & conversion": "math", "Health & everyday": "health", "Comparisons": "comparisons"}
index = open(os.path.join(G, "index.html"), encoding="utf-8").read()
bad = []
for f in sorted(os.listdir(G)):
    if not f.endswith(".html") or f == "index.html":
        continue
    slug = f[:-5]
    h = open(os.path.join(G, f), encoding="utf-8").read()
    miss = [n for n in need if n not in h]
    if not os.path.exists(os.path.join(ROOT, "tools/guides/src", f)):
        miss.append("source tools/guides/src/%s.html" % slug)
    imgs = re.findall(r'<img[^>]+src="(/images/guides/[^"]+)"', h)
    if not imgs:
        miss.append("hero image in article")
    for i in imgs:
        if not os.path.exists(os.path.join(ROOT, i.lstrip("/"))):
            miss.append("image file " + i)
    card = re.search(r'<a class="sx-card sx-tool sx-htool" href="/guides/%s\.html"[^>]*>(.*?)</a>' % re.escape(slug), index, re.S)
    if not card:
        miss.append("card in guides/index.html (python tools/guides/index_sync.py %s)" % slug)
    else:
        if "<img" not in card.group(1):
            miss.append("image on its guides/index.html card")
        cat = CAT.get(meta.get(slug, {}).get("group"))
        sec = re.search(r'<section class="sx-hcat" data-cat="%s">(.*?)</section>' % (cat or "x"), index, re.S)
        if not sec or ('href="/guides/%s.html"' % slug) not in sec.group(1):
            miss.append("card in the %s category section" % meta.get(slug, {}).get("group"))
    if h.count("<h1") != 1:
        miss.append("exactly one h1")
    if "<loc>https://www.calculatepilot.com/guides/%s.html</loc>" % slug not in SITEMAP:
        miss.append("entry in sitemap-guides.xml (python tools/guide_build.py --schema-only %s)" % slug)
    blocks, art, crumbs = [], None, None
    for raw in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        try:
            blocks.append(json.loads(raw))
        except ValueError:
            miss.append("valid JSON-LD (a schema block does not parse)")
    flat = []
    for j in blocks:  # schema may be wrapped in {"@graph": [...]}
        flat.extend(j["@graph"] if isinstance(j, dict) and isinstance(j.get("@graph"), list) else [j])
    for j in flat:
        if isinstance(j, dict) and j.get("@type") in ("Article", "BlogPosting"):
            art = j
        if isinstance(j, dict) and j.get("@type") == "BreadcrumbList":
            crumbs = j
    if art is None:
        miss.append("Article JSON-LD schema (python tools/guide_build.py --schema-only %s)" % slug)
    else:
        for k in ("headline", "description", "image", "author", "datePublished", "publisher"):
            if not art.get(k):
                miss.append("Article schema field '%s'" % k)
    if crumbs is None or len(crumbs.get("itemListElement", [])) < 3:
        miss.append("BreadcrumbList JSON-LD schema with Home > Guides > guide")
    if miss:
        bad.append((f, miss))
for f, m in bad:
    print("NOT IN TEMPLATE:", f, "-> missing", m)
print("guides checked OK" if not bad else "%d guide(s) fail the template check" % len(bad))
sys.exit(1 if bad else 0)
