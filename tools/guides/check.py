"""Pre-publish gate: every guide in guides/ (except index.html) must use the Stitch article template.
Run before committing/publishing any guide:  python tools/guides/check.py   (exit 1 on failure)
Fix a failure by writing the guide in tools/guides/src/<slug>.html and running python tools/guide_build.py <slug>.
"""
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, "guides")
need = ['<div class="cpguide">', 'href="/css/cp-guide.css', 'src="/js/cp-guide.js', 'id="cpgBar"', 'class="cpg-toc', 'rel="author"']
import json
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
    if miss:
        bad.append((f, miss))
for f, m in bad:
    print("NOT IN TEMPLATE:", f, "-> missing", m)
print("guides checked OK" if not bad else "%d guide(s) fail the template check" % len(bad))
sys.exit(1 if bad else 0)
