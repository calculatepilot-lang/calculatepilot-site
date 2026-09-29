"""Extract / replace translatable string literals in calculator JS files.

Tokenizes JS (strings, template literals without ${}, comments, regex literals) with a small state machine.
A literal is translatable if it looks like human text (letters + a space, or a capitalised word) and is not
used as a key/comparison/selector. Replacement keeps original quotes and surrounding whitespace.
"""
import re

LETTERS = re.compile(r"[A-Za-zÀ-ɏ]")
SELECTORISH = re.compile(r"^[#.\[][\w\-\[\]=\"'.# >:,*]*$")
IDISH = re.compile(r"^[a-z][a-zA-Z0-9_\-:.]*$")
CODEWORDS = re.compile(r"^(?:function|return|true|false|null|undefined|number|string|object|input|change|click|submit|div|span|tr|td|th|tbody|thead|table|button|option|select|checked|disabled|hidden|value|text|none|block|flex|grid|auto|px|em|rem|%|en-US|de-DE|fr-FR|es-ES|USD|EUR|GBP|Content-Type)$")


def tokenize(src):
    """Yield (kind, start, end) for 'str' (with quote char) tokens only; skips comments and regex."""
    i, n = 0, len(src)
    out = []
    prev_sig = ""  # previous significant char (for regex detection)
    while i < n:
        c = src[i]
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            j = src.find("\n", i)
            i = n if j < 0 else j
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "'\"":
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            out.append(("str", i, j + 1))
            i = j + 1
            prev_sig = c
            continue
        if c == "`":
            j = i + 1
            depth = 0
            while j < n and not (src[j] == "`" and depth == 0):
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == "$" and j + 1 < n and src[j + 1] == "{":
                    depth += 1
                    j += 2
                    continue
                if src[j] == "}" and depth:
                    depth -= 1
                j += 1
            out.append(("tpl", i, j + 1))
            i = j + 1
            prev_sig = "`"
            continue
        if c == "/":
            # regex literal if previous significant char is one of ( , = : [ ! & | ? { } ; or start
            if prev_sig in ("", "(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "<", ">", "~", "^"):
                j = i + 1
                incls = False
                while j < n:
                    if src[j] == "\\":
                        j += 2
                        continue
                    if src[j] == "[":
                        incls = True
                    elif src[j] == "]":
                        incls = False
                    elif src[j] == "/" and not incls:
                        break
                    elif src[j] == "\n":
                        break
                    j += 1
                i = j + 1
                while i < n and src[i].isalpha():
                    i += 1
                prev_sig = ")"
                continue
        if not c.isspace():
            prev_sig = c
        i += 1
    return out


def literal_value(tok):
    return tok[1:-1]


def context_ok(src, start, end):
    """False when the literal is used as code (comparison, case label, object key, selector arg, index)."""
    before = src[max(0, start - 14):start]
    after = src[end:end + 3]
    b = before.rstrip()
    if re.search(r"(===|!==|==|!=|case|typeof\s*\w*\s*===?)$", b):
        return False
    if re.match(r"\s*(===|!==|==|!=)", src[end:end + 5]):
        return False
    if re.match(r"\s*:", after) and re.search(r"[{,]\s*$", b):  # object key
        return False
    if re.search(r"\[\s*$", b) and re.match(r"\s*\]", after):  # obj['key']
        return False
    # calls that take identifiers/selectors
    if re.search(r"(\$|getElementById|querySelector(All)?|getAttribute|setAttribute|hasAttribute|addEventListener|closest|matches|contains|classList\.\w+|\.style\.\w+|dataset|getItem|setItem|createElement|removeAttribute|set|val|num|money|symbol|esc)\s*\(\s*$", b):
        # C.text('id','value') second arg is text: handled below by checking comma position
        return False
    return True


def is_text(v):
    if not LETTERS.search(re.sub(r"<[^>]+>", "", v)):
        return False
    s = v.strip()
    if not s or CODEWORDS.match(s):
        return False
    if SELECTORISH.match(s) and " " not in s:
        return False
    if re.search(r"^(https?:|/|#|\.|data:|[a-z]+://)", s):
        return False
    if re.match(r"^[a-z][a-zA-Z0-9_\-]*$", s):  # bare lowercase identifier
        return False
    if re.match(r"^[A-Z0-9_]+$", s) and len(s) <= 6:  # constants like JFK, USD
        return False
    if re.match(r"^[a-z]+(-[a-z]+)+$", s):  # kebab-case ids / css classes
        return False
    if " " not in s and not re.match(r"^[A-ZÀ-Þ][a-zß-ɏ]{2,}[.,!:;)?]*$", s) and "<" not in s:
        # single token: only capitalised words
        return False
    if re.match(r"^[\w\-\s]+$", s) and re.search(r"\b(px|rem|em|flex|grid|block|none)\b", s) and len(s.split()) <= 3:
        return False
    return True


def literals(src):
    """List of dicts {start,end,quote,value} of translatable literals (strings and no-${} templates)."""
    out = []
    for kind, s, e in tokenize(src):
        raw = src[s:e]
        if kind == "tpl" and "${" in raw:
            continue
        v = literal_value(raw)
        if not is_text(v):
            continue
        # C.text('id', 'value'): value in second arg position is text -> allow
        b = src[max(0, s - 40):s]
        second_arg = re.search(r"C\.(?:text|set)\(\s*(?:'[^']*'|\"[^\"]*\")\s*,\s*$", b) is not None
        if not second_arg and not context_ok(src, s, e):
            continue
        out.append({"start": s, "end": e, "quote": raw[0], "value": v})
    return out


def unescape_js(v, q):
    v = v.replace("\\" + q, q).replace("\\n", "\n").replace("\\\\", "\\")
    return v


def escape_js(v, q):
    return v.replace("\\", "\\\\").replace(q, "\\" + q).replace("\n", "\\n")


def key_of(v, q):
    """Dictionary key: unescaped text without outer whitespace."""
    return unescape_js(v, q).strip()


def apply(src, tr, on_missing=None):
    lits = literals(src)
    out, last = [], 0
    for L in lits:
        out.append(src[last:L["start"]])
        q = L["quote"]
        val = unescape_js(L["value"], q)
        lead = val[:len(val) - len(val.lstrip())]
        trail = val[len(val.rstrip()):]
        core = val.strip()
        t = tr(core)
        if t is None:
            if on_missing:
                on_missing(core)
            out.append(src[L["start"]:L["end"]])
        else:
            out.append(q + escape_js(lead + t + trail, q) + q)
        last = L["end"]
    out.append(src[last:])
    return "".join(out)
