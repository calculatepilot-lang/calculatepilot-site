"""Split css/cp-calc.css into one self-contained stylesheet per calculator category.

Every calculator page used to load the whole 326 KB css/cp-calc.css, although most rules style
one family of calculators (mortgage, 401k, UK tax ...). This script keeps, for each category
(financial, health, math, other), only the rules whose class/id names can occur on that
category's pages, and writes css/cp-calc.<category>.css.

It is deliberately conservative: a rule is kept when every class and id in at least one of its
selectors appears anywhere in the category's HTML (all languages and embeds) or its page scripts.
Class names built in JS by concatenation ('step-' + n) are covered by a prefix check. Tag-only,
attribute-only, @keyframes and @font-face rules are always kept. css/cp-calc.css itself is left
untouched for the hub pages and anything else that still loads it.

Usage: python tools/css_split.py            # (re)generate css/cp-calc.<category>.css
       python tools/css_split.py --report   # sizes only, write nothing
       python tools/css_split.py --apply    # also point each category page and embed at its file

Run it again whenever css/cp-calc.css changes or a calculator page gains new markup/classes, and
bump VER so browsers fetch the new files. cpx_apply.py links new pages to their category file.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VER = "20261008b"
CATS = ("financial", "health", "math", "other")
LANGS = ("", "de/", "es/", "fr/")
WORD = re.compile(r"[A-Za-z0-9_-]+")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


# ---------------------------------------------------------------- corpus
def category_slugs(cat):
    return sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ROOT, cat, "*.html")))


def corpus_files(cat):
    files = []
    for lang in LANGS:
        files += glob.glob(os.path.join(ROOT, lang + cat, "*.html"))
    slugs = category_slugs(cat)
    for slug in slugs:
        emb = os.path.join(ROOT, "embed", slug + ".html")
        if os.path.exists(emb):
            files.append(emb)
    files.append(os.path.join(ROOT, "js", "cp-calc.js"))
    for slug in slugs:
        base = re.sub(r"-calculator$", "", slug)
        for cand in (os.path.join(ROOT, "js", "calc", base + ".js"), os.path.join(ROOT, "js", base + ".js")):
            if os.path.exists(cand):
                files.append(cand)
    return files


def build_corpus(cat):
    text = "\n".join(read(p) for p in corpus_files(cat))
    words = set(WORD.findall(text))
    # prefixes of class names assembled in JS: 'step-' + n, "bar-" + i, `row-${i}`
    prefixes = set()
    for m in re.finditer(r"""['"`]([A-Za-z][\w-]*)['"`]\s*\+""", text):
        prefixes.add(m.group(1))
    for m in re.finditer(r"([A-Za-z][\w-]*)\$\{", text):
        prefixes.add(m.group(1))
    prefixes = {p for p in prefixes if len(p) >= 2}
    return words, prefixes


# ---------------------------------------------------------------- css parsing
def strip_comments(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def split_top(css):
    """Yield (prelude, body_or_None) pairs at one nesting level. body is None for `@x ...;`."""
    i, n = 0, len(css)
    while i < n:
        while i < n and css[i] in " \t\r\n":
            i += 1
        if i >= n:
            return
        start = i
        depth_paren = 0
        quote = None
        while i < n:
            c = css[i]
            if quote:
                if c == "\\":
                    i += 1
                elif c == quote:
                    quote = None
            elif c in "\"'":
                quote = c
            elif c == "(":
                depth_paren += 1
            elif c == ")":
                depth_paren -= 1
            elif depth_paren == 0 and c in "{;":
                break
            i += 1
        prelude = css[start:i].strip()
        if i >= n:
            if prelude:
                yield prelude, None
            return
        if css[i] == ";":
            i += 1
            yield prelude, None
            continue
        # block: find the matching brace
        depth = 0
        j = i
        quote = None
        while j < n:
            c = css[j]
            if quote:
                if c == "\\":
                    j += 1
                elif c == quote:
                    quote = None
            elif c in "\"'":
                quote = c
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        yield prelude, css[i + 1:j]
        i = j + 1


def split_selectors(prelude):
    out, depth, quote, cur = [], 0, None, []
    for c in prelude:
        if quote:
            cur.append(c)
            if c == quote:
                quote = None
            continue
        if c in "\"'":
            quote = c
        elif c in "([":
            depth += 1
        elif c in ")]":
            depth -= 1
        if c == "," and depth == 0:
            out.append("".join(cur).strip())
            cur = []
        else:
            cur.append(c)
    if cur:
        out.append("".join(cur).strip())
    return [s for s in out if s]


def drop_functional(sel):
    """Remove :not(...), :is(...), :where(...), :has(...) arguments (their tokens are not required)."""
    out, i = [], 0
    pat = re.compile(r":(not|is|where|has|matches)\(")
    while i < len(sel):
        m = pat.match(sel, i)
        if not m:
            out.append(sel[i])
            i += 1
            continue
        depth, j = 1, m.end()
        while j < len(sel) and depth:
            depth += {"(": 1, ")": -1}.get(sel[j], 0)
            j += 1
        i = j
    return "".join(out)


def selector_needed(sel):
    s = drop_functional(sel)
    s = re.sub(r"\[[^\]]*\]", "", s)  # attribute selectors
    classes = re.findall(r"\.(-?[A-Za-z_][\w-]*)", s)
    ids = re.findall(r"#(-?[A-Za-z_][\w-]*)", s)
    return classes + ids


def keep_selector(sel, words, prefixes):
    for tok in selector_needed(sel):
        if tok in words:
            continue
        if any(tok.startswith(p) for p in prefixes):
            continue
        return False
    return True


def filter_css(css, words, prefixes):
    out = []
    for prelude, body in split_top(css):
        if body is None:
            out.append(prelude + ";")
            continue
        low = prelude.lower()
        if low.startswith(("@media", "@supports", "@layer", "@container")):
            inner = filter_css(body, words, prefixes)
            if inner.strip():
                out.append(prelude + "{" + inner + "}")
        elif low.startswith("@"):
            out.append(prelude + "{" + body + "}")  # @keyframes, @font-face ...
        else:
            keep = [s for s in split_selectors(prelude) if keep_selector(s, words, prefixes)]
            if keep:
                out.append(",".join(keep) + "{" + body.strip() + "}")
    return "\n".join(out)


def html_files(cat):
    return [p for p in corpus_files(cat) if p.endswith(".html")]


def apply_links():
    pat = re.compile(r'/css/cp-calc(?:\.[a-z]+)?\.css\?v=[^"]*')
    changed = 0
    for cat in CATS:
        new = "/css/cp-calc.%s.css?v=%s" % (cat, VER)
        for p in html_files(cat):
            s = read(p)
            t = pat.sub(new, s)
            if t != s:
                with open(p, "w", encoding="utf-8") as f:
                    f.write(t)
                changed += 1
    print("pages re-linked: %d" % changed)


def main():
    report = "--report" in sys.argv
    src = strip_comments(read(os.path.join(ROOT, "css", "cp-calc.css")))
    print("cp-calc.css: %d bytes (comments stripped: %d)" % (os.path.getsize(os.path.join(ROOT, "css", "cp-calc.css")), len(src)))
    for cat in CATS:
        words, prefixes = build_corpus(cat)
        css = filter_css(src, words, prefixes) + "\n"
        path = os.path.join(ROOT, "css", "cp-calc.%s.css" % cat)
        print("  %-9s %7d bytes  (%d pages)" % (cat, len(css.encode()), len(category_slugs(cat))))
        if not report:
            with open(path, "w", encoding="utf-8") as f:
                f.write("/* Generated by tools/css_split.py from css/cp-calc.css. Do not edit by hand. */\n" + css)
    if "--apply" in sys.argv and not report:
        apply_links()


if __name__ == "__main__":
    main()
