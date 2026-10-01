"""Segment extraction and replacement for CalculatePilot HTML pages.

A page is split into tokens (tags, text, comments, scripts). Translatable segments are runs of text plus
inline formatting tags inside one block element, plus selected attribute values and JSON-LD strings.
Elements that carry a class or id (badges, labels, buttons) are treated as block boundaries so the
wrapper tag stays outside the segment. A segment that is entirely wrapped in one inline tag
(<a>, <b>, <code> ...) is unwrapped, so the translation is plain text (or text with inner tags).
"""
import re, json, hashlib, html as _h

TOKEN = re.compile(r"<!--.*?-->|<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<span\b[^>]*class=\"[^\"]*\bmsym\b[^\"]*\"[^>]*>.*?</span>|<[^>]+>|[^<]+", re.S | re.I)
FMT = {"span", "a", "code", "b", "i", "em", "strong", "small", "u", "mark", "abbr", "kbd", "time", "s", "sup", "sub", "q", "cite", "del", "ins"}
INLINE_VOID = {"br", "wbr"}
ATTRS = ("placeholder", "aria-label", "title", "alt")
META_KEYS = ("description", "og:title", "og:description", "twitter:title", "twitter:description")
JSON_KEYS = {"name", "description", "text", "headline", "alternativeHeadline", "abstract", "about", "caption", "featureList"}
LETTERS = re.compile(r"[A-Za-zÀ-ÖØ-öø-ɏ]")
TAGNAME = re.compile(r"<\s*/?\s*([a-zA-Z][a-zA-Z0-9]*)")
NOTRANS = re.compile(r"^(?:[A-Z0-9%\s\-–—/·•:+.,()×÷=<>≥≤$€£¥#&*]|kg|lb|lbs|oz|mph|km|mi|ft|cm|mm|in|g|L|ml|kWh|kW|W|V|A|Hz|°C|°F|USD|EUR|GBP|APR|APY|BMI|BMR|GPA|PDF|CSV|URL|HTML|CSS|JSON|UTC|GMT|ISO|API|ID|N/A|SI|IQR|LCM|GCD|calculatepilot)+$")
WRAP = re.compile(r"^<(%s)\b[^>]*>(.*)</\1>$" % "|".join(sorted(FMT)), re.S | re.I)


def sid(s):
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:10]


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def tagname(tok):
    m = TAGNAME.match(tok)
    return m.group(1).lower() if m else ""


def plain(seg):
    return norm(_h.unescape(re.sub(r"<[^>]+>", "", seg)))


def translatable(seg):
    p = plain(seg)
    if not LETTERS.search(p):
        return False
    if NOTRANS.match(p):
        return False
    if seg.lstrip().startswith("&lt;"):
        return False
    return True


def unwrap(doc, s, e):
    """Strip a single wrapping inline tag pair from doc[s:e] (repeatedly)."""
    while True:
        seg = doc[s:e]
        m = WRAP.match(seg)
        if not m:
            return s, e
        name = m.group(1).lower()
        inner = m.group(2)
        # the inner part must not contain another top-level pair of the same tag closing early
        depth = 0
        ok = True
        for tm in re.finditer(r"<(/?)%s\b[^>]*>" % name, inner, re.I):
            depth += -1 if tm.group(1) else 1
            if depth < 0:
                ok = False
                break
        if not ok:
            return s, e
        open_len = len(seg) - len(inner) - len("</%s>" % name)
        s, e = s + open_len, e - len("</%s>" % name)
        # trim whitespace again
        raw = doc[s:e]
        s += len(raw) - len(raw.lstrip())
        e -= len(raw) - len(raw.rstrip())


def split_segments(doc):
    """Return list of (kind, start, end, content) spans for translatable pieces."""
    spans = []
    toks = [(m.start(), m.end(), m.group(0)) for m in TOKEN.finditer(doc)]
    buf = []
    stack = []  # (name, is_boundary)

    def flush():
        nonlocal buf
        if buf:
            s, e = buf[0][0], buf[-1][1]
            raw = doc[s:e]
            s2 = s + len(raw) - len(raw.lstrip())
            e2 = e - (len(raw) - len(raw.rstrip()))
            if e2 > s2:
                s2, e2 = unwrap(doc, s2, e2)
                if e2 > s2 and translatable(doc[s2:e2]):
                    spans.append(("text", s2, e2, doc[s2:e2]))
        buf = []

    for (s, e, t) in toks:
        low = t[:12].lower()
        if t.startswith("<!--") or low.startswith("<script") or low.startswith("<style"):
            flush()
            if low.startswith("<script") and "ld+json" in t[:120].lower():
                m = re.match(r"(<script\b[^>]*>)(.*?)(</script>)", t, re.S | re.I)
                if m:
                    spans.append(("json", s + len(m.group(1)), s + len(m.group(1)) + len(m.group(2)), m.group(2)))
            continue
        if t.startswith("<span") and "msym" in t[:80]:
            if buf:
                buf.append((s, e, t))
            continue
        if t.startswith("<"):
            name = tagname(t)
            closing = t.startswith("</")
            if not closing:
                if name == "meta":
                    mm = re.search(r'\b(?:name|property)="([^"]*)"', t)
                    if mm and mm.group(1) in META_KEYS:
                        cm = re.search(r'\bcontent="([^"]*)"', t)
                        if cm and translatable(cm.group(1)):
                            spans.append(("attr", s + cm.start(1), s + cm.end(1), cm.group(1)))
                for a in ATTRS:
                    for am in re.finditer(r'\b%s="([^"]*)"' % a, t):
                        if translatable(am.group(1)):
                            spans.append(("attr", s + am.start(1), s + am.end(1), am.group(1)))
                if name == "input":
                    vm = re.search(r'\bvalue="([^"]*)"', t)
                    if vm and re.search(r'\btype="(button|submit|reset)"', t) and translatable(vm.group(1)):
                        spans.append(("attr", s + vm.start(1), s + vm.end(1), vm.group(1)))
            if name in INLINE_VOID:
                buf.append((s, e, t))
                continue
            if name in FMT:
                if not closing:
                    boundary = bool(re.search(r'\b(?:class|id)="', t))
                    stack.append((name, boundary))
                    if boundary:
                        flush()
                    else:
                        buf.append((s, e, t))
                else:
                    boundary = False
                    for i in range(len(stack) - 1, -1, -1):
                        if stack[i][0] == name:
                            boundary = stack[i][1]
                            del stack[i:]
                            break
                    if boundary:
                        flush()
                    else:
                        buf.append((s, e, t))
                continue
            flush()
            continue
        buf.append((s, e, t))
    flush()
    spans.sort(key=lambda x: x[1])
    return spans


def json_strings(text):
    try:
        data = json.loads(text)
    except Exception:
        return []
    out = []

    def walk(x, key=None):
        if isinstance(x, dict):
            for k, v in x.items():
                walk(v, k)
        elif isinstance(x, list):
            for v in x:
                walk(v, key)
        elif isinstance(x, str) and key in JSON_KEYS and translatable(x):
            out.append(x)
    walk(data)
    return out


MSYM = re.compile(r'<span[^>]*class="[^"]*msym[^"]*"[^>]*>.*?</span>', re.S | re.I)
TAGRE = re.compile(r"<msym/>|<(/?)([a-zA-Z][a-zA-Z0-9]*)[^>]*>")


def bare(src):
    """Return (key, tags). Attributes are dropped from tags; icon spans become <msym/>."""
    tags = []

    def r(m):
        tags.append(m.group(0))
        if m.group(0).startswith("<msym/>"):
            return "<msym/>"
        return "<%s%s>" % (m.group(1), m.group(2).lower())
    tmp = MSYM.sub(lambda m: (tags.append(m.group(0)) or "<msym/>"), src)
    # tags already collected for msym tokens (in order); collect the rest in order too
    tags = []
    out = []
    pos = 0
    for m in re.finditer(r'<span[^>]*class="[^"]*msym[^"]*"[^>]*>.*?</span>|<[^>]+>', src, re.S | re.I):
        out.append(src[pos:m.start()])
        tok = m.group(0)
        tags.append(tok)
        if tok.startswith("<span") and "msym" in tok[:100]:
            out.append("<msym/>")
        else:
            nm = TAGRE.match(tok)
            out.append("<%s%s>" % (nm.group(1) or "", nm.group(2).lower()) if nm else tok)
        pos = m.end()
    out.append(src[pos:])
    return norm("".join(out)), tags


def restore(translation, tags):
    """Put the original tags back into a translation written with bare tags. None if the sequences differ."""
    parts = re.split(r"(<msym/>|</?[a-zA-Z][a-zA-Z0-9]*>)", translation)
    it = iter(tags)
    out = []
    want = []
    for part in parts:
        if re.fullmatch(r"<msym/>|</?[a-zA-Z][a-zA-Z0-9]*>", part or ""):
            try:
                orig = next(it)
            except StopIteration:
                return None
            ob, _ = bare(orig)
            if ob != part:
                return None
            out.append(orig)
        else:
            out.append(part)
    if next(it, None) is not None:
        return None
    return "".join(out)


def key_of(kind, src):
    if kind == "attr":
        return norm(_h.unescape(src))
    return bare(src)[0]


def segments_of(doc):
    out = []
    for kind, s, e, c in split_segments(doc):
        if kind == "json":
            for j in json_strings(c):
                out.append(("json", norm(j)))
        else:
            out.append((kind, key_of(kind, c)))
    return out


def tag_signature(s):
    return [re.sub(r"\s+", " ", t) for t in re.findall(r"<[^>]+>", s)]


def apply(doc, tr, on_missing=None):
    """Replace segments using tr(key)->translation or None."""
    spans = split_segments(doc)
    out, last = [], 0
    for kind, s, e, c in spans:
        out.append(doc[last:s])
        if kind == "json":
            try:
                data = json.loads(c)
            except Exception:
                out.append(c)
                last = e
                continue

            def walk(x, key=None):
                if isinstance(x, dict):
                    return {k: walk(v, k) for k, v in x.items()}
                if isinstance(x, list):
                    return [walk(v, key) for v in x]
                if isinstance(x, str) and key in JSON_KEYS and translatable(x):
                    t = tr(norm(x))
                    if t is None:
                        if on_missing:
                            on_missing(norm(x))
                        return x
                    return _h.unescape(t) if "<" not in t else re.sub(r"<[^>]+>", "", t)
                return x
            out.append(json.dumps(walk(data), ensure_ascii=False, indent=1))
        else:
            key = key_of(kind, c)
            t = tr(key)
            if t is not None and kind != "attr":
                t = restore(t, bare(c)[1])
            if t is None:
                if on_missing:
                    on_missing(key)
                out.append(c)
            else:
                if kind == "attr":
                    t = _h.unescape(t).replace('"', "&quot;")
                out.append(t)
        last = e
    out.append(doc[last:])
    return "".join(out)
