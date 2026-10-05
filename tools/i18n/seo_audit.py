"""Audit titles, descriptions, social tags and JSON-LD across indexable pages."""
import re, glob, os, json, collections
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.chdir(ROOT)
SEP = chr(92)
files = [f for f in (x.replace(SEP, "/") for x in glob.glob("**/*.html", recursive=True)) if not f.startswith(("tools/", "node_modules/", "embed/"))]
stat = collections.Counter()
ex = collections.defaultdict(list)
for f in files:
    s = open(f, encoding="utf-8", errors="replace").read()
    if re.search(r'<meta name="robots" content="[^"]*noindex', s, re.I):
        continue
    lang = f.split("/")[0] if f.split("/")[0] in ("es", "fr", "de") else "en"
    t = re.search(r"<title>(.*?)</title>", s, re.S)
    d = re.search(r'<meta name="description" content="([^"]*)"', s)
    tl = len(re.sub(r"&amp;", "&", t.group(1))) if t else 0
    dl = len(d.group(1)) if d else 0
    def add(k, v=None):
        stat[(k, lang)] += 1
        if len(ex[k]) < 4:
            ex[k].append(f + (" " + str(v) if v else ""))
    if tl > 60: add("title>60", tl)
    if tl > 70: add("title>70", tl)
    if dl > 160: add("desc>160", dl)
    if dl > 200: add("desc>200", dl)
    if 0 < dl < 70: add("desc<70", dl)
    if not d: add("desc missing")
    if not re.search(r'property="og:image"', s): add("og:image missing")
    for p in ("og:title", "og:description", "og:url", "og:type"):
        if "property=\"%s\"" % p not in s: add(p + " missing")
    if 'name="twitter:card"' not in s: add("twitter:card missing")
    for p in ("twitter:title", "twitter:description", "twitter:image"):
        if 'name="%s"' % p not in s: add(p + " missing")
    # json-ld
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            j = json.loads(m.group(1))
        except Exception as e:
            add("jsonld parse error", str(e)[:60]); continue
        items = j.get("@graph", [j]) if isinstance(j, dict) else j
        for it in items:
            ty = it.get("@type") if isinstance(it, dict) else None
            if ty == "FAQPage":
                for q in it.get("mainEntity", []):
                    if not q.get("name") or not q.get("acceptedAnswer", {}).get("text"): add("faq empty q/a")
            if ty == "Organization" or ty == "WebSite":
                pass
            if ty in ("WebApplication", "SoftwareApplication"):
                for k in ("name", "applicationCategory", "operatingSystem", "offers"):
                    if k not in it: add("app missing " + k)
                if "offers" in it and isinstance(it["offers"], dict) and "price" not in it["offers"]: add("offer no price")
                if "aggregateRating" in it: add("has aggregateRating")
            if ty == "BreadcrumbList":
                for i, li in enumerate(it.get("itemListElement", [])):
                    if "item" not in li and i < len(it["itemListElement"]) - 1: add("breadcrumb no item")
            if ty == "Article" or ty == "BlogPosting":
                for k in ("headline", "datePublished", "author", "image"):
                    if k not in it: add("article missing " + k)
for (k, l), n in sorted(stat.items()):
    print("%-28s %-3s %d" % (k, l, n))
print()
for k, v in ex.items():
    print(k, v[:3])
