"""The ten quality gates (spec section 10). Gates 2, 4 and 5 failures are marked BLOCKING."""
from __future__ import annotations

import json
import re
from datetime import date, datetime, timezone
from html.parser import HTMLParser
from typing import NamedTuple
from urllib.parse import urlparse

from .. import formulas, normalize
from ..generate import htmltext

NAMES = {1: "Intent distinct", 2: "Verified data", 3: "Page-level value", 4: "Duplication",
         5: "Truth", 6: "Internal links", 7: "Index controls", 8: "Schema match",
         9: "Mobile/render", 10: "Freshness"}
BLOCKING = {2, 4, 5}
BANNED = ["we tested", "we reviewed", "our testing", "guaranteed", "best in class", "proven",
          "experts agree", "rated #1", "5-star", "five-star"]
CHECKED = ("quick-answer", "worked-example", "scenario-table", "assumptions", "facts", "faq")
UNIQUE = ("quick-answer", "worked-example", "scenario-table", "faq")
VOID = {"meta", "link", "br", "hr", "img", "input"}


class GateResult(NamedTuple):
    gate: int
    name: str
    passed: bool
    detail: str


def _r(gate: int, ok: bool, detail: str = "ok") -> GateResult:
    if not ok and gate in BLOCKING:
        detail = "BLOCKING: " + detail
    return GateResult(gate, NAMES[gate], ok, detail)


def shingle_similarity(a: str, b: str, k: int = 5) -> float:
    def sh(t):
        w = normalize.words(t)
        return {tuple(w[i:i + k]) for i in range(max(0, len(w) - k + 1))}
    x, y = sh(a), sh(b)
    return len(x & y) / len(x | y) if (x | y) else 0.0


def _unique_text(html: str) -> str:
    return " ".join(htmltext.section_text(html, s) for s in UNIQUE)


def _numbers(page, sections=CHECKED) -> list[str]:
    return [t for s in sections for t in htmltext.NUM.findall(htmltext.section_text(page.html, s))]


def _ld(html: str):
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    return json.loads(m.group(1)) if m else None


def _g1(conn, pid, page, siblings):
    row = conn.execute("SELECT c.decision, c.canonical_keyword FROM pages p JOIN clusters c "
                       "ON c.id=p.cluster_id WHERE p.id=?", (pid,)).fetchone()
    if not row or row["decision"] != "PAGE":
        return _r(1, False, f"cluster decision is {row['decision'] if row else 'missing'}, not PAGE")
    for s in siblings:
        if s.slug == page.slug or normalize.normalize(s.h1) == normalize.normalize(page.h1):
            return _r(1, False, f"sibling page already targets this keyword ({s.slug})")
    serp = conn.execute("SELECT top_titles_json FROM serp_checks WHERE keyword=?",
                        (row["canonical_keyword"],)).fetchone()
    if serp:
        tops = {t.strip().lower() for t in json.loads(serp[0] or "[]")}
        if page.title.strip().lower() in tops:
            return _r(1, False, "title equals a current top-10 result title")
    return _r(1, True)


def _g2(page):
    if formulas.get(page.formula_id) is None:
        return _r(2, False, "no formula for this page")
    known = {dp.value for dp in page.data_points}
    bad_origin = [dp.origin for dp in page.data_points
                  if dp.origin.split(":")[0] not in ("formula", "fact", "keyword")]
    if bad_origin:
        return _r(2, False, f"data point with unknown origin: {bad_origin[0]}")
    missing = sorted({t for t in _numbers(page) if t not in known})
    if missing:
        return _r(2, False, "numbers with no formula/fact origin: " + ", ".join(missing[:5]))
    return _r(2, True)


def _g3(page):
    html = page.html
    mods = 0
    if re.search(r"\d", htmltext.section_text(html, "quick-answer")):
        mods += 1
    if htmltext.section_html(html, "worked-example").count("<li>") >= 2:
        mods += 1
    if htmltext.section_html(html, "scenario-table").count("<tr>") >= 4:
        mods += 1
    if htmltext.section_html(html, "worked-example").count("<table") >= 1:
        mods += 1
    return _r(3, mods >= 2, f"{mods} calculated modules" if mods < 2 else "ok")


def _g4(page, siblings, limit):
    mine = _unique_text(page.html)
    for s in siblings:
        sim = shingle_similarity(mine, _unique_text(s.html))
        if sim >= limit:
            return _r(4, False, f"{sim:.0%} similar to {s.slug} (limit {limit:.0%}); merge candidate")
    return _r(4, True)


def _g5(page):
    text = htmltext.visible_text(page.html).lower()
    for b in BANNED:
        if re.search(rf"(?<![a-z]){re.escape(b)}(?![a-z])", text):
            return _r(5, False, f"banned phrase: {b}")
    known = {dp.value for dp in page.data_points}
    for fig in re.findall(r"(\d+(?:\.\d+)?)\s*%", text):
        if fig not in known:
            return _r(5, False, f"percent figure {fig}% has no data-point origin")
    return _r(5, True)


def _g6(conn, pid, page):
    row = conn.execute("SELECT k.url FROM pages p JOIN clusters c ON c.id=p.cluster_id "
                       "JOIN calculators k ON k.slug=c.calculator_slug WHERE p.id=?", (pid,)).fetchone()
    if not row:
        return _r(6, False, "calculator not recorded")
    want = urlparse(row["url"]).path
    hrefs = htmltext.links(htmltext.section_html(page.html, "related"))
    calc = [h for h in hrefs if urlparse(h).path == want]
    sibs = [h for h in hrefs if urlparse(h).path != want]
    if not calc:
        return _r(6, False, "no link to the parent calculator")
    if not 2 <= len(sibs) <= 5:
        return _r(6, False, f"{len(sibs)} sibling links (need 2 to 5)")
    return _r(6, True)


def _g7(page, site_url):
    m = re.search(r'<link rel="canonical" href="([^"]*)"', page.html)
    if not m or m.group(1) != page.url:
        return _r(7, False, "missing or wrong self-canonical")
    if re.search(r'<meta name="robots"[^>]*noindex', page.html, re.I):
        return _r(7, False, "noindex present")
    if urlparse(page.url).netloc != urlparse(site_url).netloc or not page.url.startswith("https://"):
        return _r(7, False, "URL is not an https URL on the site")
    return _r(7, True)


def _g8(page):
    data = _ld(page.html)
    if data is None:
        return _r(8, False, "no JSON-LD")
    raw = json.dumps(data)
    if re.search(r"rating|review", raw, re.I):
        return _r(8, False, "rating/review markup is not allowed")
    vis = htmltext.visible_text(page.html)
    need = []
    for n in data["@graph"]:
        if n["@type"] == "Article":
            need += [n["headline"], n["description"], n["author"]["name"], n["datePublished"]]
        elif n["@type"] == "FAQPage":
            for q in n["mainEntity"]:
                need += [q["name"], q["acceptedAnswer"]["text"]]
        elif n["@type"] == "BreadcrumbList":
            need += [i["name"] for i in n["itemListElement"]]
    gone = [x for x in need if x not in vis]
    return _r(8, not gone, "not visible on page: " + gone[0][:60] if gone else "ok")


class _Balance(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.ok, self.bad_table = [], True, False

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        if tag == "table" and not any(t == "div.table-wrap" for t in self.stack):
            self.bad_table = True
        cls = dict(attrs).get("class") or ""
        self.stack.append("div.table-wrap" if tag == "div" and "table-wrap" in cls.split() else tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        top = self.stack.pop() if self.stack else None
        if top is None or top.split(".")[0] != tag:
            self.ok = False


def _g9(page):
    if not re.search(r'<meta name="viewport"[^>]*width=device-width', page.html):
        return _r(9, False, "missing viewport meta")
    p = _Balance()
    p.feed(page.html)
    if not p.ok or p.stack:
        return _r(9, False, "unbalanced HTML tags")
    if p.bad_table:
        return _r(9, False, "table not wrapped in table-wrap")
    if re.search(r"(?<!max-)width:\s*\d{3,}px|<table[^>]*width=[\"']?\d{3,}", page.html):
        return _r(9, False, "fixed-width pattern can overflow on mobile")
    return _r(9, True)


def _g10(page, settings):
    today = settings.get("today") or datetime.now(timezone.utc).date()
    sla = int(settings.get("facts_sla_days", 180))
    try:
        d = date.fromisoformat(page.date_iso)
    except ValueError:
        return _r(10, False, "page date missing or invalid")
    if (today - d).days > 365:
        return _r(10, False, f"page date {d} is more than a year old")
    for m in re.finditer(r'<li>(.*?)</li>', htmltext.section_html(page.html, "facts"), re.S):
        t = re.search(r'<time datetime="([^"]+)"', m.group(1))
        if not t:
            return _r(10, False, "fact without verified date")
        age = (today - date.fromisoformat(t.group(1))).days
        if age > sla:
            return _r(10, False, f"fact verified {t.group(1)} is older than {sla} days: "
                                 f"{re.sub('<[^>]+>', '', m.group(1))[:40]}")
    return _r(10, True)


def run_all(conn, page_id: int, page, siblings: list, settings: dict) -> list[GateResult]:
    if page is None:
        return [_r(g, False, "no page could be built (calculator has no formula yet)") for g in range(1, 11)]
    site = settings.get("site_url", "https://calculatepilot.com")
    return [_g1(conn, page_id, page, siblings), _g2(page), _g3(page),
            _g4(page, siblings, settings.get("similarity_max", 0.40)), _g5(page),
            _g6(conn, page_id, page), _g7(page, site), _g8(page), _g9(page), _g10(page, settings)]


def apply_status(conn, page_id: int, results: list[GateResult]) -> str:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    for r in results:
        conn.execute("INSERT OR REPLACE INTO gate_results(page_id,gate,name,passed,detail,checked_at) "
                     "VALUES(?,?,?,?,?,?)", (page_id, r.gate, r.name, int(r.passed), r.detail, now))
    status = "PASS" if all(r.passed for r in results) else "HOLD"
    conn.execute("UPDATE pages SET status=? WHERE id=?", (status, page_id))
    conn.commit()
    return status
