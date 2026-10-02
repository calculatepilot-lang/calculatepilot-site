"""Site-wide consistency pass: html lang, static hreflang blocks (with return tags), dead references.
Idempotent. Run after build_i18n.py:  python tools/i18n/fix_seo.py
"""
import re, glob, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.chdir(ROOT)
BASE = "https://www.calculatepilot.com/"
LANGS = ("es", "fr", "de")
SEP = chr(92)
files = [f.replace(SEP, "/") for f in glob.glob("**/*.html", recursive=True) if not f.startswith(("tools/", "node_modules/"))]


def rd(f):
    return open(f, encoding="utf-8", newline="").read()


def url(f):
    return BASE + (f[:-10] if f.endswith("index.html") else f)


def split(f):
    pre = f.split("/")[0]
    return (pre, f[len(pre) + 1:]) if pre in LANGS else ("en", f)


def indexable(f):
    s = rd(f)
    if re.search(r'<meta name="robots" content="[^"]*noindex', s, re.I):
        return False
    c = re.search(r'<link rel="canonical" href="([^"]*)"', s)
    return bool(c) and c.group(1) == url(f)


idx = {f: indexable(f) for f in files}
group = {}
for f in files:
    lang, base = split(f)
    group.setdefault(base, {})[lang] = f

n_lang = n_hl = n_ref = 0
for f in files:
    s = rd(f)
    o = s
    lang, base = split(f)
    # 1. html lang
    s = re.sub(r'<html lang="[^"]*"', '<html lang="%s"' % lang, s, count=1)
    # 2. dead references
    s = s.replace('<script src="/js/site.js?v=20260903"></script>\n', "").replace('<script src="/js/site.js?v=20260903"></script>', "")
    if f.endswith("word-counter.html") and not f.startswith("embed/"):
        s = re.sub(r'<a href="/embed/word-counter\.html"[^>]*>[^<]*</a>\s*(?:&nbsp;\s*·\s*&nbsp;\s*)?', "", s)
    # 3. hreflang block (only for indexable pages that have at least one other-language version)
    g = group[base]
    if idx[f]:
        alts = [(l, g[l]) for l in ("en",) + LANGS if l in g and idx[g[l]]]
        if len(alts) > 1:
            tags = ["<link rel=\"alternate\" hreflang=\"%s\" href=\"%s\">" % (l, url(x)) for l, x in alts]
            if "en" in g and idx[g["en"]]:
                tags.append('<link rel="alternate" hreflang="x-default" href="%s">' % url(g["en"]))
            block = "\n".join(tags) + "\n"
            pat = r'(?:<link rel="alternate" hreflang="[^"]*" href="[^"]*">\s*)+'
            if re.search(pat, s):
                s = re.sub(pat, lambda m: block, s, count=1)
            else:
                s = s.replace('<link rel="canonical"', block + '<link rel="canonical"', 1)
    if s != o:
        open(f, "w", encoding="utf-8", newline="").write(s)
        n_lang += 1
print("pages updated", n_lang)
