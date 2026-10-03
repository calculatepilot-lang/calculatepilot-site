"""Second SEO pass (idempotent):
 1. localized pages: /guides/index.html -> /<lang>/guides/
 2. localized pages: JSON-LD site URLs point at the localized page when it exists; inLanguage on WebApplication/Article
 3. fill missing og:* / twitter:* tags (from title, description, canonical)
 4. trim titles > 60 (drop brand suffix, then cut at a separator) and meta descriptions > 160 (at a clause boundary)
python tools/i18n/fix_seo2.py
"""
import re, glob, os, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.chdir(ROOT)
SEP = chr(92)
BASE = "https://www.calculatepilot.com"
LANGS = ("es", "fr", "de")
OGIMG = BASE + "/images/og-share.png"
LOCALE = {"en": "en_US", "es": "es_ES", "fr": "fr_FR", "de": "de_DE"}
files = [f for f in (x.replace(SEP, "/") for x in glob.glob("**/*.html", recursive=True)) if not f.startswith(("tools/", "node_modules/", "embed/"))]


def trim_title(t):
    if len(t) <= 60:
        return t
    t2 = re.sub(r"\s*[|—\-]\s*CalculatePilot\s*$", "", t)
    if len(t2) >= 25:
        t = t2
    if len(t) > 60:
        for sep in (" — ", " - ", ": ", " | ", ", ", " & ", " y ", " et ", " und "):
            i = t.rfind(sep, 0, 61)
            if i >= 28:
                t = t[:i]
                break
    return t.rstrip(" :;,—-|")


def trim_desc(d):
    if len(d) <= 160:
        return d
    # whole sentences first
    sent = re.split(r"(?<=[.!?])\s+", d)
    out = ""
    for s in sent:
        if len((out + " " + s).strip()) <= 160:
            out = (out + " " + s).strip()
        else:
            break
    if len(out) >= 90:
        return out
    cut = d[:158]
    for sep in ("; ", ", ", ": ", " — ", " - ", " "):
        i = cut.rfind(sep)
        if i >= 90:
            cut = cut[:i]
            break
    cut = re.sub(r"\s+(and|or|with|the|a|an|of|to|for|in|y|o|con|de|la|el|et|ou|avec|du|des|le|les|und|oder|mit|der|die|das|zu|von|para|en|e|um)$", "", cut.rstrip(" ,;:—-"), flags=re.I)
    return cut.rstrip(" ,;:—-") + "."


def local_url(url, lang):
    """Return the localized equivalent of a site URL if that localized page exists."""
    if not url.startswith(BASE):
        return url
    path = url[len(BASE):]
    if path.startswith(("/es/", "/fr/", "/de/")):
        return url
    key = path.lstrip("/")
    if key == "":
        return BASE + "/" + lang + "/"
    k = key + "index.html" if key.endswith("/") else key
    if os.path.exists(os.path.join(lang, k)):
        return BASE + "/" + lang + "/" + key
    return url


def fix_jsonld(block, lang):
    try:
        j = json.loads(block)
    except Exception:
        return block

    def walk(o, parent=None):
        if isinstance(o, dict):
            for k, v in list(o.items()):
                if k in ("item", "url", "@id") and isinstance(v, str) and lang != "en":
                    o[k] = local_url(v, lang)
                else:
                    walk(v, o)
            if o.get("@type") in ("WebApplication", "SoftwareApplication", "Article", "BlogPosting", "FAQPage", "WebPage") and "inLanguage" not in o:
                o["inLanguage"] = lang
        elif isinstance(o, list):
            for x in o:
                walk(x, parent)

    walk(j)
    return json.dumps(j, ensure_ascii=False, indent=1)


changed = 0
for f in files:
    s = open(f, encoding="utf-8", newline="").read()
    o = s
    pre = f.split("/")[0]
    lang = pre if pre in LANGS else "en"
    noindex = bool(re.search(r'<meta name="robots" content="[^"]*noindex', s, re.I))
    # 1
    if lang != "en":
        s = s.replace('href="/guides/index.html"', 'href="/%s/guides/"' % lang)
    # 2
    if not noindex:
        s = re.sub(r'(<script type="application/ld\+json">)(.*?)(</script>)', lambda m: m.group(1) + "\n" + fix_jsonld(m.group(2), lang) + "\n" + m.group(3), s, flags=re.S)
    # 3
    t = re.search(r"<title>(.*?)</title>", s, re.S)
    d = re.search(r'<meta name="description" content="([^"]*)"', s)
    c = re.search(r'<link rel="canonical" href="([^"]*)"', s)
    if t and d and c and not noindex:
        add = []
        def need(attr, name):
            return not re.search(r'<meta %s="%s"' % (attr, re.escape(name)), s)
        title, desc, can = t.group(1).strip(), d.group(1), c.group(1)
        if need("property", "og:type"): add.append('<meta property="og:type" content="website">')
        if need("property", "og:title"): add.append('<meta property="og:title" content="%s">' % title.replace('"', "&quot;"))
        if need("property", "og:description"): add.append('<meta property="og:description" content="%s">' % desc)
        if need("property", "og:url"): add.append('<meta property="og:url" content="%s">' % can)
        if need("property", "og:image"): add.append('<meta property="og:image" content="%s">' % OGIMG)
        if need("property", "og:locale"): add.append('<meta property="og:locale" content="%s">' % LOCALE[lang])
        if need("name", "twitter:card"): add.append('<meta name="twitter:card" content="summary_large_image">')
        if need("name", "twitter:title"): add.append('<meta name="twitter:title" content="%s">' % title.replace('"', "&quot;"))
        if need("name", "twitter:description"): add.append('<meta name="twitter:description" content="%s">' % desc)
        if need("name", "twitter:image"): add.append('<meta name="twitter:image" content="%s">' % OGIMG)
        if add:
            s = s.replace(c.group(0), c.group(0) + "\n" + "\n".join(add), 1)
        # 4
        nt = trim_title(title)
        if nt != title:
            s = s.replace("<title>%s</title>" % t.group(1), "<title>%s</title>" % nt, 1)
        nd = trim_desc(desc)
        if nd != desc:
            s = s.replace('<meta name="description" content="%s"' % desc, '<meta name="description" content="%s"' % nd, 1)
    if s != o:
        open(f, "w", encoding="utf-8", newline="").write(s)
        changed += 1
print("pages updated", changed)
