"""Segment extraction and replacement for CalculatePilot HTML pages.

A page is split into tokens (tags, text, comments, scripts). Translatable segments are
runs of text plus inline tags inside one block element, plus selected attribute values and
JSON-LD string values. Replacement rebuilds the page with translated segments.
"""
import re, json, hashlib, html as _h

TOKEN = re.compile(r"<!--.*?-->|<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<span\b[^>]*class=\"[^\"]*\bmsym\b[^\"]*\"[^>]*>.*?</span>|<[^>]+>|[^<]+", re.S | re.I)
INLINE = {"a", "b", "i", "em", "strong", "span", "small", "sup", "sub", "code", "u", "mark", "abbr", "br", "kbd", "time", "s", "del", "ins", "q", "cite", "wbr"}
ATTRS = ("placeholder", "aria-label", "title", "alt")
META_KEYS = ("description", "og:title", "og:description", "twitter:title", "twitter:description")
JSON_KEYS = {"name", "description", "text", "headline", "alternativeHeadline", "abstract", "about", "caption", "featureList"}
LETTERS = re.compile(r"[A-Za-zÀ-ɏ]")
TAGNAME = re.compile(r"<\s*/?\s*([a-zA-Z][a-zA-Z0-9]*)")
SKIP_BLOCKS = re.compile(r"^<(pre|textarea)\b", re.I)
# tokens that never need a translation
NOTRANS = re.compile(r"^(?:[A-Z0-9%\s\-–—/·•:+.,()×÷=<>≥≤$€£¥#&*]|kg|lb|lbs|oz|mph|km|mi|ft|cm|mm|in|g|L|ml|kWh|kW|W|V|A|Hz|°C|°F|USD|EUR|GBP|APR|APY|BMI|BMR|GPA|PDF|CSV|URL|HTML|CSS|JSON|UTC|GMT|ISO|API|ID|N/A|SI|IQR|LCM|GCD)+$")


def sid(s):
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:10]


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def tagname(tok):
    m = TAGNAME.match(tok)
    return m.group(1).lower() if m else ""


def has_text(s):
    return bool(LETTERS.search(re.sub(r"<[^>]+>", "", s)))


def translatable(seg):
    plain = norm(_h.unescape(re.sub(r"<[^>]+>", "", seg)))
    if not LETTERS.search(plain):
        return False
    if NOTRANS.match(plain):
        return False
    return True


def split_segments(doc):
    """Return list of ('text'|'attr'|'json', start, end, content) spans for translatable pieces."""
    spans = []
    toks = []
    pos = 0
    for m in TOKEN.finditer(doc):
        toks.append((m.start(), m.end(), m.group(0)))
    buf = []  # (start,end,text)

    def flush():
        nonlocal buf
        if buf:
            s, e = buf[0][0], buf[-1][1]
            raw = doc[s:e]
            # trim outer whitespace
            lead = len(raw) - len(raw.lstrip())
            trail = len(raw) - len(raw.rstrip())
            s2, e2 = s + lead, e - trail
            if e2 > s2 and translatable(doc[s2:e2]):
                spans.append(("text", s2, e2, doc[s2:e2]))
        buf = []

    skip_depth = 0
    in_head = False
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
            # icon ligature: opaque, but part of an inline run so it does not break segments
            buf.append((s, e, t)) if buf else None
            continue
        if t.startswith("<"):
            name = tagname(t)
            closing = t.startswith("</")
            # attributes
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
                    # button-like inputs only
                    if vm and re.search(r'\btype="(button|submit|reset)"', t) and translatable(vm.group(1)):
                        spans.append(("attr", s + vm.start(1), s + vm.end(1), vm.group(1)))
            if name in INLINE:
                buf.append((s, e, t))
            else:
                flush()
                if name == "title" and not closing:
                    pass
            continue
        # text node
        buf.append((s, e, t))
    flush()
    # <title> text was captured as a normal text segment (title is not inline -> flushed) - fine
    spans.sort(key=lambda x: x[1])
    return spans


def json_strings(text):
    """Yield translatable string values in a JSON-LD document."""
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


def segments_of(doc):
    """Ordered list of (kind, source_string) with duplicates kept."""
    out = []
    for kind, s, e, c in split_segments(doc):
        if kind == "json":
            for j in json_strings(c):
                out.append(("json", j))
        else:
            out.append((kind, c))
    return out


def tag_signature(s):
    return [re.sub(r"\s+", " ", t) for t in re.findall(r"<[^>]+>", s)]


def apply(doc, tr, on_missing=None):
    """Replace segments using tr(source_norm)->translation or None."""
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
                            on_missing(x)
                        return x
                    return t
                return x
            out.append(json.dumps(walk(data), ensure_ascii=False, indent=1))
        else:
            src = c
            key = norm(_h.unescape(src)) if kind == "attr" else norm(src)
            t = tr(key)
            if t is None:
                if on_missing:
                    on_missing(src)
                out.append(src)
            else:
                if kind == "attr":
                    t = t.replace('"', "&quot;")
                # keep original leading/trailing whitespace inside the span (none: trimmed)
                out.append(t)
        last = e
    out.append(doc[last:])
    return "".join(out)
