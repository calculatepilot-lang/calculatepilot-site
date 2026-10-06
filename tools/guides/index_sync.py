"""Keep guides/index.html in sync with the guides: every guide needs an image card in its category section.

  python tools/guides/index_sync.py            # sync every guide (adds missing cards, adds missing images, moves cards to the
                                               # category in tools/guides/meta.json, refreshes all counts)
  python tools/guides/index_sync.py <slug> ..  # same, only for these slugs

Categories = meta.json "group": Finance & money | Math & conversion | Health & everyday | Comparisons
(Comparisons = "X vs Y" / site-vs-site / tool-vs-tool articles.) A new category is added automatically from CATS below.
"""
import html as H
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INDEX = os.path.join(ROOT, "guides", "index.html")
CATS = {  # group -> (data-cat, icon, section blurb)
    "Finance & money": ("finance", "account_balance", "Mortgages, debt, student loans and saving. Each guide explains the formula in words, works an example and points to the matching calculator."),
    "Math & conversion": ("math", "calculate", None),
    "Health & everyday": ("health", "health_and_safety", None),
    "Comparisons": ("comparisons", "compare_arrows", "Side-by-side comparisons of CalculatePilot with other calculator sites and tools: what each does best, with sources you can check."),
}
IMG_STYLE = "width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:10px;margin-bottom:12px"


def esc(s):
    return H.escape(s, quote=True)


def hero_of(slug):
    src = open(os.path.join(ROOT, "tools/guides/src", slug + ".html"), encoding="utf-8").read()
    m = re.search(r'<img[^>]*src="(/images/guides/[^"]+)"[^>]*alt="([^"]*)"', src) or re.search(r'<img[^>]*alt="([^"]*)"[^>]*src="(/images/guides/[^"]+)"', src)
    if not m:
        return None, ""
    a, b = m.groups()
    return (a, b) if a.startswith("/") else (b, a)


def desc_of(slug):
    src = open(os.path.join(ROOT, "tools/guides/src", slug + ".html"), encoding="utf-8").read()
    m = re.search(r'<meta name="description" content="([^"]*)"', src)
    d = H.unescape(m.group(1)) if m else ""
    return d if len(d) <= 170 else d[:167].rsplit(" ", 1)[0] + "..."


def card(slug, meta, existing=None):
    m = meta[slug]
    src, alt = hero_of(slug)
    if not src:
        raise SystemExit("no /images/guides/ hero image in tools/guides/src/%s.html - every guide needs an image card" % slug)
    img = '<img src="%s" alt="%s" width="1200" height="675" loading="lazy" style="%s">' % (esc(src), esc(alt), IMG_STYLE)
    if existing:  # keep the existing copy, add the image
        return re.sub(r'(<a class="sx-card sx-tool sx-htool"[^>]*>)(?:<img[^>]*>)?', lambda mo: mo.group(1) + img, existing, count=1)
    title = H.unescape(m["title"])
    q = " ".join([title, m["tag"], desc_of(slug), m["group"]]).lower()
    return ('<a class="sx-card sx-tool sx-htool" href="/guides/%s.html" data-q="%s">%s<div class="t"><em>%s</em><small>%d min read</small></div>'
            '<b>%s</b><span class="d">%s</span><span class="f">Read the guide<span class="msym" aria-hidden="true">arrow_forward</span></span></a>') % (
        slug, esc(q), img, esc(m["tag"]), m["read"], esc(title), esc(desc_of(slug)))


CARD_RE = re.compile(r'<a class="sx-card sx-tool sx-htool" href="/guides/([^"]+)\.html"[^>]*>.*?</a>', re.S)


def main(argv):
    meta = json.load(open(os.path.join(ROOT, "tools/guides/meta.json"), encoding="utf-8"))
    slugs = argv or sorted(meta)
    h = open(INDEX, encoding="utf-8", newline="").read()
    for slug in slugs:
        cat = CATS[meta[slug]["group"]][0]
        mm = None
        for mo in CARD_RE.finditer(h):
            if mo.group(1) == slug:
                mm = mo
                break
        existing = mm.group(0) if mm else None
        sec_re = r'<section class="sx-hcat" data-cat="%s">(.*?)</section>' % cat
        if mm:
            in_cat = any(mo.group(0) == existing for mo in CARD_RE.finditer(re.search(sec_re, h, re.S).group(1))) if re.search(sec_re, h, re.S) else False
            if in_cat:  # right place: only make sure it has its image
                h = h[:mm.start()] + card(slug, meta, existing) + h[mm.end():]
                continue
            h = h[:mm.start()] + h[mm.end():]
        new = card(slug, meta, existing)
        sec = re.search(r'<section class="sx-hcat" data-cat="%s">.*?<div class="sx-hgrid">' % cat, h, re.S)
        if not sec:
            h = add_section(h, meta[slug]["group"])
            sec = re.search(r'<section class="sx-hcat" data-cat="%s">.*?<div class="sx-hgrid">' % cat, h, re.S)
        h = h[:sec.end()] + new + h[sec.end():]
    h = recount(h)
    open(INDEX, "w", encoding="utf-8", newline="").write(h)
    print("index synced:", len(CARD_RE.findall(h)), "cards")


def add_section(h, group):
    cat, icon, blurb = CATS[group]
    sec = ('<section class="sx-hcat" data-cat="%s"><div class="ch"><span class="ic"><span class="msym" aria-hidden="true">%s</span></span><h2>%s</h2><em>0 guides</em></div>'
           '<p style="margin:0 0 14px;font-size:14px;color:var(--sx-muted)">%s</p><div class="sx-hgrid"></div></section>') % (cat, icon, esc(group if group == "Comparisons" else group + " guides"), esc(blurb or ""))
    last = [m for m in re.finditer(r"</section>", h[h.index('<section class="sx-hcat"'):])][-1]
    pos = h.index('<section class="sx-hcat"') + last.end()
    h = h[:pos] + sec + h[pos:]
    chip = '<button type="button" data-cat="%s">%s (0)</button>' % (cat, esc(group))
    if 'data-cat="%s">' % cat not in h.split('class="sx-hchips"')[1].split("</div>")[0]:
        h = re.sub(r'(class="sx-hchips"[^>]*>.*?)(</div>)', lambda m: m.group(1) + chip + m.group(2), h, count=1, flags=re.S)
    if icon not in h.split("icon_names=")[1].split("&")[0]:
        names = sorted(set(h.split("icon_names=")[1].split("&")[0].split(",")) | {icon})
        h = re.sub(r"icon_names=[^&\"]+", "icon_names=" + ",".join(names), h, count=1)
    return h


def recount(h):
    total = 0
    for group, (cat, _, _) in CATS.items():
        sec = re.search(r'<section class="sx-hcat" data-cat="%s">(.*?)</section>' % cat, h, re.S)
        if not sec:
            continue
        n = len(CARD_RE.findall(sec.group(1)))
        total += n
        h = re.sub(r'(<section class="sx-hcat" data-cat="%s">.*?<em>)\d+ guides(</em>)' % cat, lambda m, n=n: "%s%d guides%s" % (m.group(1), n, m.group(2)), h, count=1, flags=re.S)
        h = re.sub(r'(<button type="button" data-cat="%s">[^<(]*\()\d+(\)</button>)' % cat, lambda m, n=n: m.group(1) + str(n) + m.group(2), h, count=1)
    h = re.sub(r'(<button type="button" data-cat="all">All \()\d+(\)</button>)', lambda m: m.group(1) + str(total) + m.group(2), h, count=1)
    h = re.sub(r'Search \d+ guides', "Search %d guides" % total, h)
    h = re.sub(r'\d+ guides( •)', lambda m: "%d guides%s" % (total, m.group(1)), h, count=1)
    h = re.sub(r'(<em>)(\d+) guides(</em>)', lambda m: "%s%s guide%s%s" % (m.group(1), m.group(2), "" if m.group(2) == "1" else "s", m.group(3)), h)
    h = re.sub(r'"numberOfItems": \d+', '"numberOfItems": %d' % total, h, count=1)
    return h


if __name__ == "__main__":
    main(sys.argv[1:])
