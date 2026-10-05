"""Audit hreflang / canonical / lang / sitemap consistency across the whole site."""
import re, glob, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.chdir(ROOT)
BASE = "https://www.calculatepilot.com/"
SEP = chr(92)
files = [f.replace(SEP, "/") for f in glob.glob("**/*.html", recursive=True) if not f.startswith(("tools/", "node_modules/"))]


def url(f):
    return BASE + (f[:-10] if f.endswith("index.html") else f)


info = {}
for f in files:
    s = open(f, encoding="utf-8", errors="replace").read()
    can = re.search(r'<link rel="canonical" href="([^"]*)"', s)
    lang = re.search(r'<html lang="([^"]*)"', s)
    noidx = bool(re.search(r'<meta name="robots" content="[^"]*noindex', s, re.I))
    hl = {m.group(1): m.group(2) for m in re.finditer(r'<link rel="alternate" hreflang="([\w-]+)" href="([^"]*)"', s)}
    info[f] = (can.group(1) if can else None, lang.group(1) if lang else None, noidx, hl)

sm = set()
for x in glob.glob("sitemap*.xml") + glob.glob("*/sitemap.xml"):
    sm |= set(re.findall(r"<loc>([^<]+)</loc>", open(x, encoding="utf-8").read()))
u2f = {url(f): f for f in files}
print("noindex files", sum(1 for v in info.values() if v[2]))
print("noindex in sitemap", [f for f, v in info.items() if v[2] and url(f) in sm][:8])
print("sitemap urls with no file", [u for u in sm if u not in u2f][:8])
mm = []
for f, (can, lang, n, hl) in info.items():
    pre = f.split("/")[0]
    exp = pre if pre in ("es", "fr", "de") else "en"
    if lang != exp:
        mm.append((f, lang, exp))
print("html lang mismatch", len(mm), mm[:6])
nc, ne, nr, sm_ = [], [], [], []
for f, (can, lang, n, hl) in info.items():
    for l, h in hl.items():
        t = u2f.get(h)
        if not t:
            ne.append((f, l, h)); continue
        if info[t][0] != h:
            nc.append((f, l, h, info[t][0]))
        if l != "x-default" and t != f and url(f) not in info[t][3].values():
            nr.append((f, l, h))
    if hl and lang in hl and hl[lang] != can:
        sm_.append((f, lang, hl[lang], can))
print("hreflang to missing page", len(ne), ne[:4])
print("hreflang to non-canonical", len(nc), nc[:4])
print("missing return tag", len(nr), nr[:6])
print("self hreflang != canonical", len(sm_), sm_[:4])
