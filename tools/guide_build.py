"""Build CalculatePilot guides in the Stitch "Guide Article" template.

Authoring (also how every NEW guide is published):
  1. Write the guide in the simple source format and save it as tools/guides/src/<slug>.html
     (a normal page: <head> with title/meta/schema, <main> with calc-page-head breadcrumb + h1 + p.lede and a
     div.prose holding p / h2 / h3 / ul / ol / table / img / div.formula-box / div.faq-item / div.tool-grid;
     start the prose with <p><a href="/financial/x.html">-> Use the free X</a></p>; a paragraph starting with
     <strong>Short answer:</strong> becomes the top "Short answer" callout).
  2. python tools/guide_build.py            (all guides)   or   python tools/guide_build.py <slug> [<slug> ...]
  3. Rebuild CSS only if you add new Tailwind classes to this file: see tools/guides/css/rebuild.sh

Output: guides/<slug>.html. <head> and site header/footer are kept from the existing page (so site-wide edits survive
a rebuild); only <main> is regenerated. Page metadata (category, read time, publish date, sandbox) lives in
tools/guides/meta.json and is filled automatically for new guides.
"""
import html as H
import json
import os
import re
import subprocess
import sys
from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "guides", "src")
META_PATH = os.path.join(ROOT, "tools", "guides", "meta.json")
TAKE_PATH = os.path.join(ROOT, "tools", "guides", "takeaways.json")
TAKEAWAYS = json.load(open(TAKE_PATH, encoding="utf-8")) if os.path.exists(TAKE_PATH) else {}  # slug -> [[bold, text] x3]
VER = "20261006a"
SITE = "https://www.calculatepilot.com"
AUTHOR = {"@type": "Person", "name": "Suhaib Hassan", "url": SITE + "/author/suhaib-hassan.html"}

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap">\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=%s&display=block">')

GROUPS = {"financial": "Finance & money", "health": "Health & everyday", "other": "Health & everyday", "math": "Math & conversion"}
FOLDER_LABEL = {"financial": "Financial", "health": "Health", "math": "Math", "other": "Everyday"}
ICONS = set()


def esc(s):
    return H.escape(s, quote=True)


def ic(name, cls="", fill=False):
    ICONS.add(name)
    st = ' style="font-variation-settings: \'FILL\' 1;"' if fill else ""
    return '<span class="material-symbols-outlined %s"%s>%s</span>' % (cls, st, name)


def plain(el):
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True) if hasattr(el, "get_text") else str(el)).strip()


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:48] or "section"


def month_year(d):
    import datetime
    y, m, dd = [int(x) for x in d.split("-")]
    return datetime.date(y, m, dd).strftime("%-d %B %Y") if os.name != "nt" else datetime.date(y, m, dd).strftime("%d %B %Y").lstrip("0")


# ---------------------------------------------------------------- inline html
def inline(node):
    """Inner HTML of a node with site-style attributes removed and links restyled."""
    out = []
    for c in node.children:
        if isinstance(c, NavigableString):
            out.append(H.escape(re.sub(r"\\u([0-9a-fA-F]{4})", lambda m_: chr(int(m_.group(1), 16)), str(c)), quote=False))
        elif isinstance(c, Tag):
            if c.name == "br":
                out.append("<br>")
                continue
            if c.name == "img":
                continue
            inner = inline(c)
            if c.name == "a":
                href = c.get("href", "#")
                ext = href.startswith("http") and "calculatepilot.com" not in href
                rel = ' target="_blank" rel="noopener"' if ext else ""
                out.append('<a class="gl" href="%s"%s>%s</a>' % (esc(href), rel, inner))
            elif c.name in ("strong", "b"):
                out.append("<strong>%s</strong>" % inner)
            elif c.name in ("em", "i"):
                out.append("<em>%s</em>" % inner)
            elif c.name in ("sup", "sub", "code", "kbd", "mark", "abbr", "small", "span"):
                n = "span" if c.name in ("span", "small") else c.name
                out.append("<%s>%s</%s>" % (n, inner, n))
            else:
                out.append(inner)
    return "".join(out)


# ---------------------------------------------------------------- components
P = "text-body-default font-body-default text-on-surface-variant leading-relaxed"


def c_p(el):
    return '<p class="%s">%s</p>' % (P, inline(el))


def c_note(el):
    return '<p class="text-body-sm font-body-sm text-outline">%s</p>' % inline(el)


def c_h3(el):
    return '<h3 class="text-headline-sm font-headline-sm text-primary pt-space-xs">%s</h3>' % inline(el)


def c_ul(el):
    items = []
    for li in el.find_all("li", recursive=False):
        items.append('<li class="flex items-start gap-3"><span class="mt-[9px] w-1.5 h-1.5 rounded-sm bg-secondary shrink-0"></span><span>%s</span></li>' % inline(li))
    return '<ul class="space-y-2 text-body-default font-body-default text-on-surface-variant leading-relaxed">%s</ul>' % "".join(items)


def c_ol(el):
    items = []
    for i, li in enumerate(el.find_all("li", recursive=False), 1):
        items.append('<li class="flex items-start gap-3"><span class="w-6 h-6 rounded bg-emerald-tint text-secondary font-label-mono text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">%d</span><span>%s</span></li>' % (i, inline(li)))
    return '<ol class="space-y-3 text-body-default font-body-default text-on-surface-variant leading-relaxed">%s</ol>' % "".join(items)


NUMERIC = re.compile(r"^[\s$€£¥~≈\-–—+±0-9.,%()kKmMbBxX×/:·−]+$|^(?:n/a|none|free|—|-)$", re.I)


def c_table(el):
    rows = el.find_all("tr")
    if not rows:
        return ""
    head, body = [], []
    for tr in rows:
        cells = tr.find_all(["th", "td"], recursive=False)
        if tr.find("th") and not body and not head:
            head = cells
        else:
            body.append(cells)
    if not head and body:
        head = body.pop(0)
    ncol = max(len(head), max([len(r) for r in body] or [0]))
    right = []
    for ci in range(ncol):
        vals = [plain(r[ci]) for r in body if ci < len(r) and plain(r[ci])]
        right.append(ci > 0 and bool(vals) and all(NUMERIC.match(v) and len(v) < 30 for v in vals))
    th = []
    for ci, c in enumerate(head):
        th.append('<th class="py-3 px-4 text-label-mono font-label-mono uppercase text-outline text-xs%s">%s</th>' % (" text-right" if right[ci] else "", inline(c)))
    trs = []
    for r in body:
        tds = []
        for ci, c in enumerate(r):
            if ci == 0:
                tds.append('<td class="py-3 px-4 font-body-medium font-semibold text-primary align-top">%s</td>' % inline(c))
            elif right[ci]:
                tds.append('<td class="py-3 px-4 text-right font-label-mono text-xs tabular-nums text-on-surface align-top">%s</td>' % inline(c))
            else:
                tds.append('<td class="py-3 px-4 text-body-sm font-body-sm text-on-surface-variant align-top">%s</td>' % inline(c))
        trs.append('<tr class="hover:bg-surface-subtle transition-colors">%s</tr>' % "".join(tds))
    return ('<div class="overflow-x-auto border border-border-hairline rounded-lg bg-surface-pure shadow-sm"><table class="w-full text-left border-collapse">'
            '<thead><tr class="border-b border-border-hairline bg-surface-subtle">%s</tr></thead>'
            '<tbody class="divide-y divide-border-hairline">%s</tbody></table></div>') % ("".join(th), "".join(trs))


def c_img(el, first=False):
    src = el.get("src", "")
    attrs = 'src="%s" alt="%s"' % (esc(src), esc(el.get("alt", "")))
    if el.get("width") and el.get("height"):
        attrs += ' width="%s" height="%s"' % (esc(el["width"]), esc(el["height"]))
    if not first:
        attrs += ' loading="lazy"'
    return '<figure class="rounded-xl overflow-hidden border border-border-hairline bg-surface-pure shadow-sm"><img class="w-full h-auto block" %s></figure>' % attrs


LEGEND = [("bg-surface-pure/10 text-surface-pure", ""), ("bg-emerald-vivid/20 text-emerald-vivid", ""), ("bg-on-tertiary-container/20 text-on-tertiary-container", "")]


def c_formula(el):
    raw = el.decode_contents()
    segs = [s for s in re.split(r"<br\s*/?>", raw, flags=re.I) if s.strip()]
    flines, desc = [], []
    for s in segs:
        t = s.strip()
        m = re.fullmatch(r"<strong>(.*)</strong>", t, flags=re.S | re.I)
        has_strong = bool(re.search(r"<strong>", t, flags=re.I))
        (flines if (m or has_strong) else desc).append(m.group(1) if m else t)
    if not flines:
        flines, desc = desc, []
    ptxt = []
    for f in flines:
        t = re.sub(r"<sup>(.*?)</sup>", r"^\1", f)
        ptxt.append(H.unescape(re.sub(r"<[^>]+>", "", t)).strip())
    lines_html = "".join('<div class="text-formula-display font-formula-display text-surface-pure tracking-wider leading-9">%s</div>' % f for f in flines)
    legend = ""
    if desc:
        dtxt = H.unescape(re.sub(r"<[^>]+>", "", " ".join(desc))).strip()
        body = re.sub(r"^(?:where|with)\s+", "", dtxt, flags=re.I).rstrip(".")
        toks = [t for t in re.split(r",\s*(?:and\s+)?(?=\S{1,6}\s*=\s)|\s+and\s+(?=\S{1,6}\s*=\s)", body) if t.strip()]
        chips = []
        for t in toks:
            m = re.match(r"^(\S{1,6})\s*=\s*(.+)$", t.strip())
            if not m:
                chips = []
                break
            chips.append(m.groups())
        if len(chips) >= 2:
            cells = []
            for i, (sym, txt) in enumerate(chips):
                cells.append('<div class="flex items-center gap-2"><span class="min-w-5 h-5 px-1 rounded %s font-bold flex items-center justify-center">%s</span><span class="text-outline-variant">%s</span></div>' % (LEGEND[i % 3][0], esc(sym), esc(txt)))
            legend = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-primary-container text-label-mono font-label-mono text-xs">%s</div>' % "".join(cells)
        else:
            legend = '<div class="pt-3 border-t border-primary-container text-label-mono font-label-mono text-xs text-outline-variant leading-relaxed">%s</div>' % "<br>".join(desc)
    return ('<div class="bg-formula-bg border border-secondary/40 rounded-lg p-space-md text-on-primary shadow-lg relative overflow-hidden">'
            '<div class="flex items-center justify-between pb-3 border-b border-primary-container">'
            '<span class="text-label-mono font-label-mono text-emerald-vivid uppercase tracking-wider">Formula</span>'
            '<button type="button" class="cpg-noprint inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary-container hover:bg-secondary text-label-mono font-label-mono text-surface-pure transition-colors text-xs" data-cpg-copy="%s">%s<span data-label>Copy formula</span></button></div>'
            '<div class="py-5 px-2 text-center overflow-x-auto"><div class="inline-block text-left">%s</div></div>%s</div>') % (
        esc("\n".join(ptxt)), ic("content_copy", "text-[14px]"), lines_html, legend)


def c_faq(items):
    out = []
    for it in items:
        q = it.find("h3")
        a = "".join('<p class="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">%s</p>' % inline(p) for p in it.find_all("p"))
        out.append('<details class="group bg-surface-pure border border-border-hairline rounded-lg p-4 open:border-border-strong transition-colors cursor-pointer">'
                   '<summary class="flex justify-between items-center gap-4 font-headline-sm text-body-medium font-semibold text-primary list-none"><span>%s</span>%s</summary>'
                   '<div class="mt-3 pt-3 border-t border-border-hairline space-y-2">%s</div></details>' % (inline(q), ic("expand_more", "text-outline group-open:rotate-180 transition-transform shrink-0"), a))
    return '<div class="space-y-3">%s</div>' % "".join(out)


def c_grid(items):
    cells = []
    for href, name in items:
        cells.append('<a class="flex items-center justify-between gap-2 p-3 bg-surface-pure border border-border-hairline hover:border-secondary hover:bg-surface-subtle rounded-lg transition-all group" href="%s"><span class="text-body-medium font-body-medium font-semibold text-primary group-hover:text-secondary">%s</span>%s</a>' % (esc(href), esc(name), ic("arrow_forward", "text-[16px] text-outline group-hover:text-secondary shrink-0")))
    return '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">%s</div>' % "".join(cells)


def c_sources(ul):
    items = "".join('<li class="flex items-start gap-2">%s<span>%s</span></li>' % (ic("menu_book", "text-[16px] text-outline mt-0.5 shrink-0"), inline(li)) for li in ul.find_all("li", recursive=False))
    return '<ul class="bg-surface-pure border border-border-hairline rounded-lg p-space-md space-y-2 text-body-sm font-body-sm text-on-surface-variant">%s</ul>' % items


def c_cta(href, label):
    return ('<a class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary text-body-medium font-body-medium font-semibold hover:bg-secondary transition-colors" href="%s"><span>%s</span>%s</a>' % (esc(href), esc(label), ic("arrow_forward", "text-[18px]")))


def c_sandbox(sid, cfg):
    p, r, y = cfg.get("principal", 240000), cfg.get("rate", 6.5), cfg.get("years", 30)
    rr, n = r / 100 / 12, y * 12
    m = p * (rr * (1 + rr) ** n) / ((1 + rr) ** n - 1) if rr else p / n
    tot = m * n
    intr = tot - p
    pp, ip = p / tot * 100, intr / tot * 100
    opts = "".join('<option value="%d"%s>%d years</option>' % (t, " selected" if t == y else "", t) for t in (30, 25, 20, 15, 10))
    fm = lambda v, d=2: "${:,.{d}f}".format(v, d=d)
    inp = "w-full pr-3 py-2 bg-surface-pure border border-border-strong rounded font-label-mono text-table-data text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
    return ('<section class="scroll-mt-24 space-y-space-sm" id="%s" data-cpg-sandbox>'
            '<div class="flex items-center justify-between gap-3"><div><h2 class="text-headline-md font-headline-md text-primary">%s</h2><p class="text-body-sm font-body-sm text-on-surface-variant">Change the loan below and watch the payment update. Principal and interest only.</p></div>'
            '<span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary-container text-on-secondary-container text-label-mono font-label-mono text-xs font-semibold shrink-0">Live</span></div>'
            '<div class="bg-surface-pure border border-border-strong rounded-xl p-space-md sm:p-space-lg shadow-[0_4px_16px_-2px_rgba(11,59,44,0.06)]">'
            '<div class="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-md">'
            '<div><label class="block text-label-mono font-label-mono text-xs text-on-surface-variant uppercase mb-1">Loan amount (P)</label><div class="relative"><span class="absolute inset-y-0 left-0 pl-3 flex items-center font-label-mono text-outline">$</span><input class="%s pl-7" data-p type="number" step="5000" min="0" value="%d"></div><input class="w-full mt-2 accent-secondary" data-pr type="range" min="50000" max="1000000" step="5000" value="%d" aria-label="Loan amount"></div>'
            '<div><label class="block text-label-mono font-label-mono text-xs text-on-surface-variant uppercase mb-1">Annual interest rate</label><div class="relative"><input class="%s pl-3 pr-8" data-r type="number" step="0.1" min="0" value="%s"><span class="absolute inset-y-0 right-0 pr-3 flex items-center font-label-mono text-outline">%%</span></div><input class="w-full mt-2 accent-secondary" data-rr type="range" min="1" max="12" step="0.1" value="%s" aria-label="Interest rate"></div>'
            '<div><label class="block text-label-mono font-label-mono text-xs text-on-surface-variant uppercase mb-1">Term</label><select class="w-full py-2 px-3 bg-surface-pure border border-border-strong rounded font-label-mono text-table-data text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary transition-all" data-t>%s</select><div class="flex justify-between items-center mt-2 text-[11px] font-label-mono text-outline"><span>Fixed rate, monthly payments</span></div></div></div>'
            '<div class="pt-space-md border-t border-border-hairline bg-surface-subtle -mx-space-md sm:-mx-space-lg -mb-space-md sm:-mb-space-lg p-space-md sm:p-space-lg rounded-b-xl">'
            '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">'
            '<div class="p-3 bg-surface-pure border border-border-hairline rounded"><span class="text-label-mono font-label-mono text-xs text-outline block">Monthly payment</span><span class="text-headline-md font-headline-md font-bold text-primary block mt-1 tabular-nums" data-o-m>%s</span><span class="text-[11px] text-outline">Principal + interest only</span></div>'
            '<div class="p-3 bg-surface-pure border border-border-hairline rounded"><span class="text-label-mono font-label-mono text-xs text-outline block">Total interest</span><span class="text-headline-md font-headline-md font-bold text-danger-crimson block mt-1 tabular-nums" data-o-i>%s</span><span class="text-[11px] text-outline" data-o-ip>%.1f%% of borrowed principal</span></div>'
            '<div class="p-3 bg-surface-pure border border-border-hairline rounded"><span class="text-label-mono font-label-mono text-xs text-outline block">Total repaid</span><span class="text-headline-md font-headline-md font-bold text-on-surface block mt-1 tabular-nums" data-o-t>%s</span><span class="text-[11px] text-outline">Principal + all interest</span></div></div>'
            '<div><div class="flex justify-between gap-2 text-label-mono font-label-mono text-xs mb-1"><span class="text-secondary font-semibold" data-l-p>Principal: %s (%.1f%%)</span><span class="text-danger-crimson font-semibold" data-l-i>Interest: %s (%.1f%%)</span></div>'
            '<div class="w-full h-3 bg-border-hairline rounded-full overflow-hidden flex"><div class="h-full bg-secondary transition-all duration-300" data-b-p style="width:%.1f%%"></div><div class="h-full bg-danger-crimson transition-all duration-300" data-b-i style="width:%.1f%%"></div></div></div>'
            '</div></div></section>') % (
        sid, esc(cfg.get("title", "Try the numbers yourself")), inp, p, p, inp, r, r, opts, fm(m), fm(intr), intr / p * 100, fm(tot), fm(p, 0), pp, fm(intr, 0), ip, pp, ip)


# ---------------------------------------------------------------- parsing
def parse_source(path):
    soup = BeautifulSoup(open(path, encoding="utf-8").read(), "html.parser")
    main = soup.find("main")
    d = {"soup": soup}
    h1 = main.find("h1")
    d["h1"] = plain(h1)
    lede = main.find("p", class_="lede")
    d["lede"] = inline(lede) if lede else ""
    bc = main.find(class_="breadcrumb")
    d["crumb"] = re.split(r"\s/\s", plain(bc))[-1] if bc else d["h1"]
    prose = main.find("div", class_="prose")
    d["prose"] = prose
    return d


def build_model(prose):
    """Walk the prose and return ordered blocks + side info."""
    tool, cta, short, tools_grid, blocks = None, None, None, [], []
    children = [c for c in prose.children if isinstance(c, Tag)]
    # unwrap single wrappers (e.g. <div class="container" style=...> around a gauge)
    first_img = True
    for el in children:
        n = el.name
        cls = " ".join(el.get("class", []))
        txt = plain(el)
        a_only = el.find("a") and plain(el.find("a")) == txt
        if n == "p" and a_only and el.find("a", class_="btn"):
            cta = (el.find("a")["href"], re.sub(r"\s*[→&].*$", "", txt).strip() or txt, txt.replace("→", "").strip())
            continue
        if n == "p" and a_only and txt.startswith("→") and tool is None and not blocks:
            a = el.find("a")
            tool = (a["href"], re.sub(r"^→\s*(Use the free\s*)?", "", txt).strip(), txt)
            continue
        if n == "p" and short is None and re.match(r"^(short answer|quick answer|bottom line)\s*:", txt, re.I):
            mm = re.match(r"^(short answer|quick answer|bottom line)", txt, re.I)
            lab = mm.group(1).capitalize()
            body = inline(el)
            body = re.sub(r"^\s*(?:<strong>\s*)?(?:short answer|quick answer|bottom line)\s*:\s*(?:</strong>)?\s*", "", body, flags=re.I)
            if "<strong>" in body[:0] or (body.count("</strong>") > body.count("<strong>")):
                body = body.replace("</strong>", "", 1)
            body = body[:1].upper() + body[1:] if not body.startswith("<") else body
            short = (lab, body)
            continue
        if n == "div" and "formula-box" in cls and re.match(r"^(short answer|quick answer|bottom line)\s*:", txt, re.I):
            segs = [s.strip() for s in re.split(r"<br\s*/?>", el.decode_contents(), flags=re.I) if s.strip()]
            first = re.sub(r"^\s*(?:<strong>\s*)?(?:short answer|quick answer|bottom line)\s*:?\s*(?:</strong>)?\s*:?\s*", "", segs[0], flags=re.I)
            first = re.sub(r"</?strong>", "", first).strip()
            lab = re.match(r"^(short answer|quick answer|bottom line)", txt, re.I).group(1).capitalize()
            body = ([first] if first else []) + segs[1:]
            short = (lab, "list:" + "\n".join(body))
            continue
        if n in ("h2", "h3", "p", "ul", "ol", "table", "img", "figure"):
            if n == "img":
                blocks.append(("img", el, first_img)); first_img = False
            elif n == "figure":
                im = el.find("img")
                if im: blocks.append(("img", im, False))
            else:
                blocks.append((n, el))
        elif n == "div":
            if "faq-item" in cls:
                if blocks and blocks[-1][0] == "faq":
                    blocks[-1][1].append(el)
                else:
                    blocks.append(("faq", [el]))
            elif "formula-box" in cls:
                blocks.append(("formula", el))
            elif "tool-grid" in cls:
                items = []
                for a in el.find_all("a"):
                    nm = re.sub(r"\s*→\s*$", "", plain(a))
                    tools_grid.append((a["href"], nm))
                    items.append((a["href"], nm))
                blocks.append(("grid", items))
            elif el.find("table") and not el.find(["h2", "p"]):
                blocks.append(("table", el.find("table")))
            else:
                blocks.append(("raw", el))
        elif n in ("script", "style"):
            blocks.append(("raw", el))
    return {"tool": tool, "cta": cta, "short": short, "grid": tools_grid, "blocks": blocks}


def sections(blocks):
    """Split blocks into [intro_blocks, [(h2 el, blocks)...]]."""
    intro, secs = [], []
    for b in blocks:
        if b[0] == "h2":
            secs.append([b[1], []])
        elif secs:
            secs[-1][1].append(b)
        else:
            intro.append(b)
    return intro, secs


def first_sentence(html_str, limit=210):
    t = H.unescape(re.sub(r"<[^>]+>", "", html_str)).strip()
    m = re.match(r"(.+?[.!?])(\s|$)", t)
    s = m.group(1) if m else t
    if len(s) > limit:
        s = s[:limit].rsplit(" ", 1)[0] + "…"
    return s


def derive_takeaways(secs):
    out = []
    for h2, bl in secs:
        title = re.sub(r"^\d+\.\s*", "", plain(h2))
        if re.search(r"faq|frequently|sources|related|references|common questions|common mistakes|worked example|^example|disclaimer|final thoughts|conclusion", title, re.I):
            continue
        p = next((b for b in bl if b[0] == "p"), None)
        if not p or bl[0][0] not in ("p",):
            continue
        s = first_sentence(inline(p[1]))
        if len(s) < 40:
            continue
        out.append((title, s))
        if len(out) == 3:
            break
    return out


# ---------------------------------------------------------------- meta
def run_git(args):
    try:
        return subprocess.run(["git"] + args, cwd=ROOT, capture_output=True, text=True, encoding="utf-8").stdout.strip()
    except Exception:
        return ""


def index_cards():
    path = os.path.join(ROOT, "guides", "index.html")
    cards = {}
    if not os.path.exists(path):
        return cards
    h = open(path, encoding="utf-8").read()
    pos = []
    for m in re.finditer(r"<h2[^>]*>([^<]*?) guides</h2>", h):
        pos.append((m.start(), H.unescape(m.group(1))))
    for m in re.finditer(r'<a class="sx-card[^"]*" href="/guides/([^"]+)\.html"[^>]*>.*?<div class="t"><em>([^<]*)</em><small>(\d+) min read</small>', h, re.S):
        g = ""
        for p, name in pos:
            if p < m.start():
                g = name
        cards[m.group(1)] = {"group": g, "tag": H.unescape(m.group(2)), "read": int(m.group(3))}
    return cards


def load_meta(slugs, srcs):
    meta = json.load(open(META_PATH, encoding="utf-8")) if os.path.exists(META_PATH) else {}
    cards = index_cards()
    changed = False
    for s in slugs:
        m = meta.get(s, {})
        d = srcs[s]
        m.setdefault("title", d["h1"])
        c = cards.get(s, {})
        if "group" not in m:
            folder = (d.get("tool_href") or "").strip("/").split("/")[0]
            m["group"] = "Comparisons" if re.search(r"(^|-)vs(-|$)", s) or re.search(r"vs\.?\s", d["h1"], re.I) else (c.get("group") or GROUPS.get(folder, "Finance & money"))
        if "tag" not in m:
            m["tag"] = c.get("tag") or "Guide"
        if "read" not in m:
            words = len(d["prose"].get_text(" ").split())
            m["read"] = c.get("read") or max(2, round(words / 230))
        if "date" not in m:
            out = run_git(["log", "--diff-filter=A", "--format=%ad", "--date=short", "--", "guides/%s.html" % s]).splitlines()
            m["date"] = out[-1] if out else __import__("datetime").date.today().isoformat()
        if meta.get(s) != m:
            meta[s] = m
            changed = True
    if changed:
        json.dump(meta, open(META_PATH, "w", encoding="utf-8", newline="\n"), indent=1, ensure_ascii=False, sort_keys=True)
        open(META_PATH, "a", encoding="utf-8").write("\n")
    return meta


# ---------------------------------------------------------------- page
_calc_cache = {}


def calc_info(href):
    href = href.split("#")[0]
    if href in _calc_cache:
        return _calc_cache[href]
    path = os.path.join(ROOT, href.lstrip("/"))
    name, desc = None, ""
    if os.path.isfile(path):
        h = open(path, encoding="utf-8", errors="ignore").read()
        m = re.search(r"<h1[^>]*>(.*?)</h1>", h, re.S)
        name = H.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else None
        if name:
            name = re.split(r"\s+[—–]\s+|:\s+", name)[0].strip()
        m = re.search(r'<meta name="description" content="([^"]*)"', h)
        if m:
            desc = first_sentence(H.unescape(m.group(1)), 105)
    _calc_cache[href] = (name, desc)
    return _calc_cache[href]


def tool_card(href, name=None):
    parts = href.strip("/").split("/")
    label = FOLDER_LABEL.get(parts[0], "Calculator")
    n, desc = calc_info(href)
    name = name or n or "Calculator"
    return ('<a class="block p-3 rounded-lg border border-border-hairline hover:border-secondary hover:bg-surface-subtle transition-all group" href="%s">'
            '<div class="flex items-center justify-between"><span class="text-badge-label font-badge-label text-secondary uppercase text-[10px]">%s</span>%s</div>'
            '<h5 class="text-body-medium font-body-medium font-semibold text-primary mt-1">%s</h5>%s</a>') % (
        esc(href), esc(label), ic("arrow_forward", "text-[14px] text-outline group-hover:text-secondary"), esc(name),
        '<p class="text-body-sm font-body-sm text-outline mt-0.5">%s</p>' % esc(desc) if desc else "")


def guide_card(slug, meta):
    m = meta[slug]
    return ('<a class="block p-3 rounded-lg border border-border-hairline hover:border-secondary hover:bg-surface-subtle transition-all group" href="/guides/%s.html">'
            '<div class="flex items-center justify-between"><span class="text-badge-label font-badge-label text-secondary uppercase text-[10px]">%s</span>%s</div>'
            '<h5 class="text-body-medium font-body-medium font-semibold text-primary mt-1">%s</h5>'
            '<p class="text-body-sm font-body-sm text-outline mt-0.5">%d min read</p></a>') % (
        slug, esc(m["tag"]), ic("arrow_forward", "text-[14px] text-outline group-hover:text-secondary"), esc(m["title"]), m["read"])


def render_main(slug, d, model, meta, order):
    m = meta[slug]
    url = "%s/guides/%s.html" % (SITE, slug)
    intro, secs = sections(model["blocks"])
    sandbox = m.get("sandbox")
    short = model["short"]
    take = []
    if not short:
        take = [tuple(x) for x in TAKEAWAYS.get(slug, [])] or derive_takeaways(secs)

    # --- numbered sections
    toc = []
    if short or take:
        toc.append(("takeaways", "Short answer" if short else "Key takeaways", False))
    body = []

    def render_blocks(bl):
        out = []
        for b in bl:
            k = b[0]
            if k == "p": out.append(c_p(b[1]))
            elif k == "h3": out.append(c_h3(b[1]))
            elif k == "ul": out.append(c_ul(b[1]))
            elif k == "ol": out.append(c_ol(b[1]))
            elif k == "table": out.append(c_table(b[1]))
            elif k == "img": out.append(c_img(b[1], b[2] if len(b) > 2 else False))
            elif k == "formula": out.append(c_formula(b[1]))
            elif k == "faq": out.append(c_faq(b[1]))
            elif k == "grid": out.append(c_grid(b[1]))
            elif k == "raw": out.append('<div class="gmod">%s</div>' % b[1].decode() if isinstance(b[1], Tag) else "")
        return out

    # intro blocks (before first h2): hero image first
    intro_html = render_blocks(intro)
    sec_html = []
    n = 0
    sandbox_done = not sandbox
    for h2, bl in secs:
        n += 1
        title = re.sub(r"^\d+\.\s*", "", plain(h2))
        sid = "s%d-%s" % (n, slugify(title))
        toc.append((sid, "%d. %s" % (n, title), True))
        is_src = re.search(r"^sources?$|references", title, re.I)
        is_faq = any(b[0] == "faq" for b in bl)
        inner = []
        for b in bl:
            if b[0] == "ul" and is_src:
                inner.append(c_sources(b[1]))
            else:
                inner.extend(render_blocks([b]))
        sec_html.append('<section class="scroll-mt-24 space-y-%s" id="%s"><h2 class="text-headline-md font-headline-md text-primary">%d. %s</h2>%s</section>' % (
            "space-sm" if is_faq else "space-md", sid, n, esc(title), "".join(inner)))
        if not sandbox_done and any(b[0] == "formula" for b in bl):
            n += 1
            sid2 = "s%d-try-it" % n
            cfg = dict(sandbox)
            cfg["title"] = "%d. %s" % (n, cfg.get("title", "Try the numbers yourself"))
            toc.append((sid2, cfg["title"], True))
            sec_html.append(c_sandbox(sid2, cfg))
            sandbox_done = True

    # tools related section from tool-grid
    grid = model["grid"]

    # --- takeaways box
    tk = ""
    if short:
        lab, bodyhtml = short
        if bodyhtml.startswith("list:"):
            lines = [l for l in bodyhtml[5:].split("\n") if l.strip()]
            lis = "".join('<li class="flex items-start gap-2">%s<span>%s</span></li>' % (ic("check_circle", "text-emerald-vivid text-[18px] mt-1 shrink-0", True), l) for l in lines)
            content = '<ul class="space-y-2 text-body-default font-body-default text-on-surface-variant">%s</ul>' % lis
        else:
            content = '<p class="text-body-default font-body-default text-on-surface-variant leading-relaxed">%s</p>' % bodyhtml
        tk = ('<section class="scroll-mt-24 p-space-md bg-emerald-tint border-l-4 border-secondary border-t border-r border-b border-border-strong rounded-lg shadow-sm" id="takeaways">'
              '<div class="flex items-center gap-2 mb-3">%s<h2 class="text-headline-sm font-headline-sm text-primary">%s</h2></div>%s</section>') % (ic("lightbulb", "text-secondary", True), esc(lab), content)
    elif take:
        lis = "".join('<li class="flex items-start gap-2">%s<span><strong>%s:</strong> %s</span></li>' % (ic("check_circle", "text-emerald-vivid text-[18px] mt-1 shrink-0", True), esc(t), esc(s)) for t, s in take)
        tk = ('<section class="scroll-mt-24 p-space-md bg-emerald-tint border-l-4 border-secondary border-t border-r border-b border-border-strong rounded-lg shadow-sm" id="takeaways">'
              '<div class="flex items-center gap-2 mb-3">%s<h2 class="text-headline-sm font-headline-sm text-primary">Key takeaways</h2></div>'
              '<ul class="space-y-2 text-body-default font-body-default text-on-surface-variant">%s</ul></section>') % (ic("lightbulb", "text-secondary", True), lis)

    # --- toc
    toc_links = []
    for i, (sid, label, _) in enumerate(toc):
        on = i == 0
        toc_links.append('<a class="block pl-6 py-1.5 text-body-sm font-body-sm %s border-l-2 %s -ml-[1px] transition-colors hover:text-secondary" href="#%s">%s</a>' % (
            "text-secondary font-semibold" if on else "text-on-surface-variant", "border-secondary" if on else "border-transparent", sid, esc(label)))
    toc_nav = '<nav class="cpg-toc space-y-1 relative"><div class="absolute left-2 top-2 bottom-2 w-[2px] bg-border-hairline"></div>%s</nav>' % "".join(toc_links)
    mob_toc = '<details class="lg:hidden cpg-noprint bg-surface-pure border border-border-hairline rounded-lg p-space-sm"><summary class="flex items-center justify-between text-label-mono font-label-mono uppercase text-outline cursor-pointer list-none"><span>On this page</span>%s</summary><div class="mt-2 space-y-1">%s</div></details>' % (
        ic("expand_more", "text-[18px]"), "".join('<a class="block py-1.5 text-body-sm font-body-sm text-on-surface-variant hover:text-secondary" href="#%s">%s</a>' % (sid, esc(l)) for sid, l, _ in toc))

    # --- tool for sidebar
    tool = model["tool"]
    cta = model["cta"]
    tool_href = tool[0] if tool else (cta[0] if cta else None)
    tool_name = None
    if tool_href:
        tool_name = calc_info(tool_href)[0] or (tool[1] if tool else "calculator")
    side_cta = ""
    if tool_href:
        side_cta = ('<div class="mt-space-md pt-space-md border-t border-border-hairline bg-surface-subtle -mx-space-md -mb-space-md p-space-md rounded-b-lg">'
                    '<p class="text-label-mono font-label-mono text-primary font-semibold mb-1">Run your own numbers</p>'
                    '<p class="text-body-sm font-body-sm text-outline mb-3">Open the free calculator that goes with this guide.</p>'
                    '<a class="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-primary-container text-on-primary rounded text-body-sm font-body-sm hover:bg-secondary transition-all" href="%s">%s<span>%s</span></a></div>') % (
            esc(tool_href), ic("open_in_new", "text-[16px]"), esc(tool_name))

    # --- related tools
    seen, rel_tools = set(), []
    def add_tool(h, nm=None):
        h = h.split("#")[0]
        if h in seen or not re.match(r"^/(financial|health|math|other)/[^/]+\.html$", h):
            return
        seen.add(h); rel_tools.append((h, nm))
    if tool_href: add_tool(tool_href)
    for h, nm in grid: add_tool(h, nm)
    for a in d["prose"].find_all("a"):
        add_tool(a.get("href", ""))
    rel_tools = rel_tools[:3]

    # --- related guides
    linked = []
    for a in d["prose"].find_all("a"):
        mm = re.match(r"^/guides/([^/#]+)\.html", a.get("href", ""))
        if mm and mm.group(1) in meta and mm.group(1) != slug and mm.group(1) not in linked:
            linked.append(mm.group(1))
    same = [s for s in order if s != slug and meta[s]["group"] == m["group"] and s not in linked]
    idx = order.index(slug)
    same.sort(key=lambda s: abs(order.index(s) - idx))
    rel_guides = (linked + same)[:3]

    # --- prev/next (chronological)
    grp = [s_ for s_ in order if meta[s_]["group"] == m["group"]]
    gi = grp.index(slug)
    prev = grp[gi - 1] if gi > 0 else None
    nxt = grp[gi + 1] if gi + 1 < len(grp) else None
    def pn(s, label, right):
        if not s:
            return ('<a class="p-4 bg-surface-pure border border-border-hairline hover:border-border-strong rounded-lg%s transition-all group" href="/guides/"><span class="text-label-mono font-label-mono text-outline text-xs block mb-1">Browse</span><span class="text-body-medium font-body-medium font-semibold text-primary group-hover:text-secondary transition-colors block">All CalculatePilot guides</span></a>' % (" text-right" if right else ""))
        return ('<a class="p-4 bg-surface-pure border border-border-hairline hover:border-border-strong rounded-lg%s transition-all group" href="/guides/%s.html"><span class="text-label-mono font-label-mono text-outline text-xs block mb-1">%s</span><span class="text-body-medium font-body-medium font-semibold text-primary group-hover:text-secondary transition-colors block">%s</span></a>') % (
            " text-right" if right else "", s, label, esc(meta[s]["title"]))

    cta_html = ""
    if cta:
        cta_html = '<div class="pt-space-md border-t border-border-hairline cpg-noprint">%s</div>' % c_cta(cta[0], cta[2])

    hero_img = "".join(c_img(b[1], True) for b in intro if b[0] == "img" and b[2])
    intro_rest = render_blocks([b for b in intro if not (b[0] == "img" and b[2])])

    v = {
        "crumb": esc(d["crumb"]), "pub": month_year(m["date"]),
        "tag": esc(m["tag"]), "group": esc(m["group"]), "read": m["read"],
        "h1": esc(d["h1"]), "lede": d["lede"],
        "i_print": ic("print", "text-[18px]"), "i_link": ic("link", "text-[18px]"),
        "nsec": len(toc), "toc": toc_nav, "side_cta": side_cta, "i_fact": ic("fact_check", "text-[20px] text-tertiary-container mt-0.5"),
        "mob_toc": mob_toc, "hero_img": hero_img, "takeaways": tk, "intro": "".join(intro_rest), "sections": "".join(sec_html),
        "cta": cta_html,
        "subject": urllib_quote("Correction: " + m["title"]), "i_flag": ic("flag", "text-[18px] text-outline"), "i_gavel": ic("rule", "text-[18px] text-secondary"),
        "prev": pn(prev, "← Previous guide", False), "next": pn(nxt, "Next guide →", True),
        "rel_tools": "".join(tool_card(h, nm) for h, nm in rel_tools), "i_calc": ic("calculate", "text-[18px] text-outline"),
        "rel_guides": "".join(guide_card(s_, meta) for s_ in rel_guides), "i_menu": ic("menu_book", "text-[18px] text-outline"),
        "i_arrow": ic("arrow_forward", "text-[16px]"),
    }
    tools_block = ""
    if rel_tools:
        tools_block = ('<div class="bg-surface-pure border border-border-hairline rounded-lg p-space-md shadow-sm"><div class="flex items-center justify-between pb-space-xs border-b border-border-hairline mb-space-sm">'
                       '<span class="text-label-mono font-label-mono uppercase text-outline">Related tools</span>%(i_calc)s</div><div class="space-y-3">%(rel_tools)s</div></div>') % v
    guides_block = ""
    if rel_guides:
        guides_block = ('<div class="bg-surface-pure border border-border-hairline rounded-lg p-space-md shadow-sm"><div class="flex items-center justify-between pb-space-xs border-b border-border-hairline mb-space-sm">'
                        '<span class="text-label-mono font-label-mono uppercase text-outline">Keep reading</span>%(i_menu)s</div><div class="space-y-3">%(rel_guides)s</div></div>') % v
    v["tools_block"], v["guides_block"] = tools_block, guides_block
    return PAGE % v


def urllib_quote(s):
    import urllib.parse
    return urllib.parse.quote(s)


PAGE = (
    '<div class="cpguide">'
    '<div id="cpgProgress" class="fixed top-0 left-0 w-full h-[3px] bg-border-hairline z-[60] pointer-events-none"><div class="h-full bg-secondary w-0 transition-all duration-100 ease-out" id="cpgBar"></div></div>'
    '<section class="border-b border-border-hairline bg-surface-pure"><div class="max-w-7xl mx-auto px-margin py-3 flex items-center justify-between gap-4">'
    '<nav class="flex items-center gap-2 text-body-sm font-body-sm text-outline min-w-0" aria-label="Breadcrumb"><a class="hover:text-secondary transition-colors" href="/">Home</a><span class="text-border-strong">/</span><a class="hover:text-secondary transition-colors" href="/guides/">Guides</a><span class="text-border-strong">/</span><span class="text-on-surface font-medium truncate">%(crumb)s</span></nav>'
    '<div class="hidden sm:flex items-center gap-3 text-label-mono font-label-mono text-outline shrink-0"><span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-vivid"></span>Estimates, not advice</span><span class="text-border-hairline">|</span><span>Published %(pub)s</span></div></div></section>'
    '<header class="bg-surface-pure border-b border-border-hairline pt-space-xl pb-space-xl"><div class="max-w-7xl mx-auto px-margin"><div class="max-w-4xl">'
    '<div class="flex flex-wrap items-center gap-2 mb-space-sm">'
    '<span class="px-2.5 py-1 rounded bg-emerald-tint text-secondary border border-border-strong text-badge-label font-badge-label">%(tag)s</span>'
    '<span class="px-2.5 py-1 rounded bg-surface-subtle text-on-surface-variant border border-border-hairline text-badge-label font-badge-label">%(group)s</span>'
    '<span class="px-2.5 py-1 rounded bg-surface-subtle text-outline text-badge-label font-badge-label">%(read)s min read</span></div>'
    '<h1 class="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary tracking-tight mb-space-sm">%(h1)s</h1>'
    '<p class="text-body-lead font-body-lead text-on-surface-variant mb-space-lg leading-relaxed">%(lede)s</p>'
    '<div class="pt-space-md border-t border-border-hairline flex flex-wrap items-center justify-between gap-4">'
    '<div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full border border-border-strong bg-surface-subtle flex items-center justify-center font-headline-sm text-primary font-bold">SH</div>'
    '<div><span class="text-body-medium font-body-medium font-semibold text-on-surface"><a href="/author/suhaib-hassan.html" rel="author" class="hover:text-secondary transition-colors">Suhaib Hassan</a></span><p class="text-body-sm font-body-sm text-outline">Founder, CalculatePilot</p></div></div>'
    '<div class="cpg-noprint flex items-center gap-3"><button type="button" class="p-2 border border-border-hairline rounded-lg text-on-surface-variant hover:text-secondary hover:border-border-strong transition-colors" title="Print guide" aria-label="Print guide" data-cpg-print>%(i_print)s</button>'
    '<button type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-strong bg-surface-pure hover:bg-surface-subtle text-body-sm font-body-sm text-on-surface transition-colors" id="cpgCopyUrl" title="Copy guide link">%(i_link)s<span data-label>Copy link</span></button></div>'
    '</div></div></div></header>'
    '<div class="max-w-7xl mx-auto px-margin py-space-xl"><div class="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">'
    '<aside class="hidden lg:block lg:col-span-3 sticky top-24 space-y-space-md cpg-noprint max-h-[calc(100vh-7rem)] overflow-y-auto"><div class="bg-surface-pure border border-border-hairline rounded-lg p-space-md shadow-sm">'
    '<div class="flex items-center justify-between pb-space-xs border-b border-border-hairline mb-space-sm"><span class="text-label-mono font-label-mono uppercase text-outline">Guide contents</span><span class="text-label-mono font-label-mono text-secondary">%(nsec)s sections</span></div>%(toc)s%(side_cta)s</div></aside>'
    '<article class="lg:col-span-6 space-y-space-xl min-w-0">%(mob_toc)s%(hero_img)s%(takeaways)s%(intro)s%(sections)s%(cta)s'
    '<section class="p-space-md bg-surface-subtle border border-border-hairline rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cpg-noprint"><div><p class="text-body-medium font-body-medium font-semibold text-primary">Spotted a mistake or a number that looks off?</p><p class="text-body-sm font-body-sm text-outline">We fix errors quickly and note the change.</p></div>'
    '<div class="flex flex-wrap items-center gap-2"><a class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-pure border border-border-strong rounded hover:bg-emerald-tint hover:border-secondary text-body-sm font-body-sm text-on-surface transition-colors" href="mailto:hello@calculatepilot.com?subject=%(subject)s">%(i_flag)s<span>Report a correction</span></a>'
    '<a class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-pure border border-border-strong rounded hover:bg-emerald-tint hover:border-secondary text-body-sm font-body-sm text-on-surface transition-colors" href="/corrections-policy.html">%(i_gavel)s<span>Corrections policy</span></a></div></section>'
    '<nav class="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-md border-t border-border-hairline cpg-noprint" aria-label="More guides">%(prev)s%(next)s</nav></article>'
    '<aside class="lg:col-span-3 space-y-space-md cpg-noprint">%(tools_block)s%(guides_block)s'
        '<div class="p-3 bg-cobalt-subtle border border-[#bfdbfe] rounded-lg"><div class="flex items-start gap-2.5">%(i_fact)s<div><p class="text-body-sm font-body-sm font-semibold text-tertiary">How we check numbers</p><p class="text-[12px] text-on-surface-variant mt-0.5">Each guide shows the formula in words and a worked example. See our <a class="gl" href="/methodology.html">methodology</a> and <a class="gl" href="/corrections-policy.html">corrections policy</a>.</p></div></div></div>'
    '<div class="bg-primary-container text-on-primary rounded-lg p-space-md shadow-md"><span class="text-label-mono font-label-mono text-emerald-vivid uppercase text-[11px] font-semibold">Free, no sign-up</span><h4 class="text-headline-sm font-headline-sm text-surface-pure mt-1">Every guide has a calculator</h4><p class="text-body-sm font-body-sm text-outline-variant mt-1 mb-4">Calculators run in your browser, and the formula is explained on every result.</p><a class="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-secondary hover:bg-emerald-vivid text-on-primary font-body-sm font-semibold rounded transition-colors text-sm" href="/guides/">%(i_arrow)s<span>Browse all guides</span></a></div>'
    '</aside></div></div></div>'
)


# ---------------------------------------------------------------- head / shell
def augment_schema(head, slug, m, d):
    def fix(mo):
        try:
            j = json.loads(mo.group(2))
        except Exception:
            return mo.group(0)
        if isinstance(j, dict) and j.get("@type") == "Article":
            j["author"] = AUTHOR
            j.setdefault("datePublished", m["date"])
            j.setdefault("dateModified", m["date"])
        return mo.group(1) + json.dumps(j, indent=1, ensure_ascii=False) + mo.group(3)
    head = re.sub(r'(<script type="application/ld\+json">\s*)(\{.*?\})(\s*</script>)', fix, head, flags=re.S)
    if "BreadcrumbList" not in head:
        bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Guides", "item": SITE + "/guides/"},
            {"@type": "ListItem", "position": 3, "name": d["crumb"], "item": "%s/guides/%s.html" % (SITE, slug)}]}
        head = head.replace("</head>", '<script type="application/ld+json">\n%s\n</script>\n</head>' % json.dumps(bc, indent=1, ensure_ascii=False), 1)
    return head


def build(slug, srcs, meta, order):
    d = srcs[slug]
    out_path = os.path.join(ROOT, "guides", slug + ".html")
    src_html = open(os.path.join(SRC, slug + ".html"), encoding="utf-8").read()
    shell = open(out_path, encoding="utf-8").read() if os.path.exists(out_path) else src_html
    if not re.search(r'<img[^>]+src="/images/guides/', src_html):
        raise SystemExit("%s: every guide needs a hero image card (<img src=\"/images/guides/...\"> in the source)" % slug)
    model = build_model(d["prose"])
    main_html = "<main>\n" + render_main(slug, d, model, meta, order) + "\n</main>"
    mm = re.search(r"<main>.*?</main>", shell, re.S)
    assert mm, "no <main> in " + slug
    page = shell[:mm.start()] + main_html + shell[mm.end():]
    head_end = page.index("</head>")
    head = page[:head_end]
    head = re.sub(r"\s*<!-- cp-guide-head -->.*?<!-- /cp-guide-head -->", "", head, flags=re.S)
    head = augment_schema(head, slug, meta[slug], d)
    sheet = '<link rel="stylesheet" href="/css/cp-guide.css?v=%s">' % VER
    block = "<!-- cp-guide-head -->\n%s\n%s\n<!-- /cp-guide-head -->" % (sheet, FONTS % ",".join(sorted(ICONS)))
    head = re.sub(r'(<link rel="stylesheet" href="/css/styles\.css[^"]*">)', lambda m_: m_.group(1) + "\n" + block, head, count=1)
    assert "cp-guide-head" in head, "styles.css link not found in " + slug
    page = head + page[head_end:]
    page = re.sub(r'\s*<script src="/js/cp-guide\.js[^"]*" defer></script>', "", page)
    page = page.replace("</body>", '<script src="/js/cp-guide.js?v=%s" defer></script>\n</body>' % VER, 1)
    open(out_path, "w", encoding="utf-8", newline="\n").write(page)
    return out_path


def main(argv):
    slugs_all = sorted(f[:-5] for f in os.listdir(SRC) if f.endswith(".html"))
    want = argv or slugs_all
    srcs = {}
    for s in slugs_all:
        srcs[s] = parse_source(os.path.join(SRC, s + ".html"))
        t = srcs[s]["prose"].find("a")
        srcs[s]["tool_href"] = t["href"] if t is not None and t.get("href", "").startswith("/") and t.parent.name == "p" else ""
    meta = load_meta(slugs_all, srcs)
    order = sorted(slugs_all, key=lambda s: (meta[s]["date"], s))
    for s in want:
        ICONS.clear()
        build(s, srcs, meta, order)
        print("built", s)


if __name__ == "__main__":
    main(sys.argv[1:])
