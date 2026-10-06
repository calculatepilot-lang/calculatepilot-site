"""Pre-publish gate: every guide in guides/ (except index.html) must use the Stitch article template.
Run before committing/publishing any guide:  python tools/guides/check.py   (exit 1 on failure)
Fix a failure by writing the guide in tools/guides/src/<slug>.html and running python tools/guide_build.py <slug>.
"""
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, "guides")
need = ['<div class="cpguide">', 'href="/css/cp-guide.css', 'src="/js/cp-guide.js', 'id="cpgBar"', 'class="cpg-toc', 'rel="author"']
bad = []
for f in sorted(os.listdir(G)):
    if not f.endswith(".html") or f == "index.html":
        continue
    slug = f[:-5]
    h = open(os.path.join(G, f), encoding="utf-8").read()
    miss = [n for n in need if n not in h]
    if not os.path.exists(os.path.join(ROOT, "tools/guides/src", f)):
        miss.append("source tools/guides/src/%s.html" % slug)
    if h.count("<h1") != 1:
        miss.append("exactly one h1")
    if miss:
        bad.append((f, miss))
for f, m in bad:
    print("NOT IN TEMPLATE:", f, "-> missing", m)
print("guides checked OK" if not bad else "%d guide(s) fail the template check" % len(bad))
sys.exit(1 if bad else 0)
