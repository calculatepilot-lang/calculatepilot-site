"""Build localized (es/fr/de) copies of the English calculator pages.

python tools/i18n/build_i18n.py <lang|all> [--pages a,b,c] [--todo out.json] [--limit N]

Reads English HTML pages and js/calc/*.js, translates text segments with the dictionaries in
tools/i18n/tr/<lang>/*.json, rewrites links / canonical / hreflang, and writes <lang>/<path>.html
and js/calc/<lang>/<slug>.js. A page is only written when every segment has a translation.
With --todo the missing segments are dumped for translation.
"""
import os, re, sys, json, glob, html as _h
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import seg, jsseg

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
BASE = "https://www.calculatepilot.com"
LANGS = ("es", "fr", "de")
LOCALE = {"es": "es_ES", "fr": "fr_FR", "de": "de_DE"}
HUBS = ["index.html", "financial-calculators.html", "health-calculators.html", "math-calculators.html", "other-calculators.html", "guides/index.html"]


def scope_pages():
    pages = list(HUBS)
    for sec in ("financial", "health", "math", "other"):
        for f in sorted(glob.glob(os.path.join(ROOT, sec, "*.html"))):
            pages.append(sec + "/" + os.path.basename(f))
    return pages


def load_dict(lang):
    d = {}
    for f in sorted(glob.glob(os.path.join(ROOT, "tools", "i18n", "tr", lang, "*.json"))):
        d.update(json.load(open(f, encoding="utf-8")))
    return d


def read(rel):
    return open(os.path.join(ROOT, rel), encoding="utf-8", newline="").read()


def write(rel, s):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8", newline="\n").write(s)


def page_url(rel, lang=None):
    r = rel
    if r.endswith("index.html"):
        r = r[: -len("index.html")]
    return BASE + "/" + ((lang + "/") if lang else "") + r


def localize_links(doc, lang, scope):
    """Point internal links at the localized page when it is part of the build scope."""
    scoped = set(scope)

    def sub(m):
        attr, url = m.group(1), m.group(2)
        if not url.startswith("/") or url.startswith("//"):
            return m.group(0)
        path = re.split(r"[?#]", url)[0]
        rest = url[len(path):]
        key = path.lstrip("/")
        if key == "":
            return '%s="/%s/%s"' % (attr, lang, rest)
        if key.endswith("/"):
            key += "index.html"
        if key in scoped:
            new = "/" + lang + "/" + (path.lstrip("/"))
            return '%s="%s%s"' % (attr, new, rest)
        return m.group(0)

    return re.sub(r'\b(href)="([^"]*)"', sub, doc)


def head_rewrite(doc, rel, lang):
    en = page_url(rel)
    loc = page_url(rel, lang)
    doc = re.sub(r'<html lang="en"', '<html lang="%s"' % lang, doc, count=1)
    doc = re.sub(r'(<link rel="canonical" href=")[^"]*"', r'\g<1>' + loc + '"', doc, count=1)
    doc = re.sub(r'(<meta property="og:url" content=")[^"]*"', r'\g<1>' + loc + '"', doc, count=1)
    doc = re.sub(r'(<meta property="og:locale" content=")[^"]*"', r'\g<1>' + LOCALE[lang] + '"', doc)
    # hreflang: replace the whole block with a canonical set
    alts = ['<link rel="alternate" hreflang="en" href="%s">' % en] + ['<link rel="alternate" hreflang="%s" href="%s">' % (l, page_url(rel, l)) for l in LANGS] + ['<link rel="alternate" hreflang="x-default" href="%s">' % en]
    doc = re.sub(r'(?:<link rel="alternate" hreflang="[^"]*" href="[^"]*">\s*)+', "\n".join(alts) + "\n", doc, count=1)
    if 'hreflang="x-default"' not in doc:
        doc = doc.replace('<link rel="canonical"', "\n".join(alts) + '\n<link rel="canonical"', 1)
    # JSON-LD urls
    doc = doc.replace('"url": "%s"' % en, '"url": "%s"' % loc).replace('"item": "%s"' % en, '"item": "%s"' % loc)
    return doc


def js_rewrite(doc, lang, slug_js):
    return re.sub(r'/js/calc/([A-Za-z0-9_\-]+)\.js', lambda m: "/js/calc/%s/%s.js" % (lang, m.group(1)) if m.group(1) in slug_js else m.group(0), doc)


def build_page(rel, lang, tr, scope, slug_js, missing):
    doc = read(rel)
    miss = []

    def lookup(key):
        return tr.get(key)

    out = seg.apply(doc, lookup, on_missing=lambda k: miss.append(k))
    if miss:
        missing.setdefault(rel, []).extend(miss)
        return None
    out = head_rewrite(out, rel, lang)
    out = localize_links(out, lang, scope)
    out = js_rewrite(out, lang, slug_js)
    return out


def build_js(slug, lang, tr, missing):
    src = read("js/calc/%s.js" % slug)
    fx = os.path.join(ROOT, "tools", "i18n", "jsfix", slug + ".json")
    if os.path.exists(fx):
        for a, b in json.load(open(fx, encoding="utf-8")):
            if a not in src:
                print("jsfix not found in", slug, a[:50])
            src = src.replace(a, b)
    miss = []
    out = jsseg.apply(src, lambda core: tr.get(core), on_missing=lambda c: miss.append(c))
    if miss:
        missing.setdefault("js/calc/%s.js" % slug, []).extend(miss)
        return None
    loc = {"es": "es-ES", "fr": "fr-FR", "de": "de-DE"}[lang]
    out = out.replace("'en-US'", "'%s'" % loc).replace('"en-US"', '"%s"' % loc)
    # trailing-zero / decimal-point regexes must accept a decimal comma
    for a, b in ((r"/\.?0+$/", r"/[.,]?0+$/"), (r"/\.0$/", r"/[.,]0$/"), (r"/\.$/", r"/[.,]$/")):
        out = out.replace(a, b)
    return out


def main():
    args = sys.argv[1:]
    lang = args[0]
    langs = LANGS if lang == "all" else (lang,)
    only = None
    todo_path = None
    for i, a in enumerate(args):
        if a == "--pages":
            only = args[i + 1].split(",")
        if a == "--todo":
            todo_path = args[i + 1]
    scope = scope_pages()
    pages = [p for p in scope if (not only or p in only or os.path.splitext(os.path.basename(p))[0] in only)]
    slug_js = {os.path.splitext(os.path.basename(f))[0] for f in glob.glob(os.path.join(ROOT, "js", "calc", "*.js"))}
    report = {}
    for lg in langs:
        tr = load_dict(lg)
        missing = {}
        built = 0
        needed_js = set()
        outputs = {}
        for rel in pages:
            o = build_page(rel, lg, tr, scope, slug_js, missing)
            if o is not None:
                outputs[rel] = o
            for m in re.finditer(r'/js/calc/([A-Za-z0-9_\-]+)\.js', read(rel)):
                if m.group(1) in slug_js:
                    needed_js.add(m.group(1))
        # js for pages built (or all js of scope for todo)
        js_out = {}
        for slug in sorted(needed_js):
            o = build_js(slug, lg, tr, missing)
            if o is not None:
                js_out[slug] = o
        # a page is publishable only if its js files are complete too
        final = {}
        for rel, o in outputs.items():
            slugs = set(re.findall(r'/js/calc/%s/([A-Za-z0-9_\-]+)\.js' % lg, o))
            if all(s in js_out for s in slugs if s in slug_js):
                final[rel] = o
            else:
                missing.setdefault(rel, []).append("<js incomplete>")
        if not todo_path:
            for rel, o in final.items():
                write(lg + "/" + rel, o)
            for slug, o in js_out.items():
                if any(("/js/calc/%s/%s.js" % (lg, slug)) in v for v in final.values()):
                    write("js/calc/%s/%s.js" % (lg, slug), o)
        report[lg] = {"built": len(final), "pages": len(pages), "missing_segments": len({k for v in missing.values() for k in v})}
        print(lg, report[lg])
        if todo_path:
            uniq = {}
            for rel, ks in missing.items():
                for k in ks:
                    if k != "<js incomplete>":
                        uniq.setdefault(k, []).append(rel)
            json.dump({seg.sid(k): {"en": k, "n": len(v)} for k, v in uniq.items()}, open(todo_path.replace("{lang}", lg), "w", encoding="utf-8"), ensure_ascii=False, indent=0)


main()
