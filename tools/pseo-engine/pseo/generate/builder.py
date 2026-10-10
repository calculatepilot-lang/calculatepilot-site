"""Build one guide page from a cluster and its calculator's formula (no AI, no invented data)."""
from __future__ import annotations

import hashlib
import json
import re
import sqlite3
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import NamedTuple

from jinja2 import Environment, FileSystemLoader

from .. import formulas, normalize
from ..config import Calculator
from . import htmltext, schema

AUTHOR = "Suhaib Hassan"
GUIDE_DIR = "guides"
QUESTION = re.compile(r"^(what|how|why|when|where|which|who|can|could|should|is|are|does|do|will|would)\b")
ACRONYMS = {"apr", "apy", "heloc", "dti", "roi", "vat", "cd", "ira", "hsa", "fha", "va", "usda",
            "bmi", "bmr", "tdee", "gpa", "ev", "usd", "uk", "us"}
SMALL = {"a", "an", "and", "as", "at", "for", "in", "of", "on", "or", "the", "to", "vs", "with"}
FACTORS = {
    "$": (1.0, 0.5, 0.6, 0.7, 0.8, 0.9, 1.1, 1.2, 1.3, 1.5),
    "%": (1.0, 0.5, 0.6, 0.7, 0.8, 0.9, 1.1, 1.2, 1.3, 1.5),
    "years": (1.0, 0.5, 0.67, 0.83),
    "months": (1.0, 0.5, 0.67, 0.83),
}
MEDICAL_NOTE = ("Informational only. This page is not medical advice; speak to a qualified health "
                "professional about your own situation.")

_env = Environment(loader=FileSystemLoader(str(Path(__file__).parent / "templates")),
                   autoescape=True, trim_blocks=False)


class DataPoint(NamedTuple):
    value: str
    origin: str          # formula:<id> | fact:<key> | keyword:<canonical>


@dataclass
class ClusterRow:
    id: int
    canonical_keyword: str
    intent: str
    calculator_slug: str
    numeric_variants: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)
    siblings: list[tuple[str, str]] = field(default_factory=list)   # (label, absolute url)


@dataclass
class Page:
    slug: str
    title: str
    html: str
    sections: list[str]
    data_points: list[DataPoint]
    needs_manual_approval: bool
    h1: str
    description: str
    faq: list[tuple[str, str]]
    breadcrumbs: list[tuple[str, str]]
    date_iso: str
    author: str = AUTHOR
    url: str = ""
    formula_id: str = ""
    method_version: str = ""


# ------------------------------------------------------------------ small helpers -------------
def slugify(text: str) -> str:
    t = re.sub(r"[^a-z0-9]+", "-", text.lower().replace("%", " percent ")).strip("-")
    if not t:
        raise ValueError("keyword has no usable characters for a URL")
    if len(t) > 80:
        t = t[:80].rsplit("-", 1)[0] or t[:80]
    return t


def kw_title(text: str) -> str:
    words = normalize.normalize(text).split()
    if not words:
        raise ValueError("keyword is empty")
    out = []
    for i, w in enumerate(words):
        if w in ACRONYMS:
            out.append(w.upper())
        elif w[0] in "$0123456789":
            out.append(w)
        elif i and w in SMALL:
            out.append(w)
        else:
            out.append(w.capitalize())
    return " ".join(out)


def abs_url(site_url: str, path: str) -> str:
    return path if path.startswith("http") else site_url.rstrip("/") + "/" + path.lstrip("/")


def _label(key: str) -> str:
    return key.replace("_", " ").capitalize()


def _fmt_input(spec, v: float) -> str:
    if spec.unit == "$":
        return f"${v:,.0f}" if abs(v - round(v)) < 1e-9 else f"${v:,.2f}"
    if spec.unit == "%":
        return f"{v:g}%"
    if spec.unit in ("years", "months"):
        return f"{v:g} {spec.unit}"
    if spec.unit:
        return f"{v:g} {spec.unit}"
    return f"{v:,.0f}" if abs(v) >= 1e6 else f"{v:g}"


def _fmt_out(formula, key: str, v) -> str:
    if v is None:
        return "n/a"
    if isinstance(v, str):
        return v
    unit = formula.out_units.get(key)
    if unit is not None:
        if unit == "$":
            return f"${v:,.2f}"
        if unit == "%":
            return f"{v:g}%"
        return f"{v:g}" + (f" {unit}" if unit else "")
    if key in ("year", "age") or key.endswith("months") or key.startswith("months") or "years" in key:
        return f"{v:g}"
    if "pct" in key or key.endswith("rate") or key == "apr":
        return f"{v:g}%"
    return f"${v:,.2f}"


class _Reg:
    def __init__(self):
        self.points: list[DataPoint] = []
        self._seen: set[tuple[str, str]] = set()

    def text(self, text: str, origin: str) -> str:
        for tok in htmltext.NUM.findall(text):
            if (tok, origin) not in self._seen:
                self._seen.add((tok, origin))
                self.points.append(DataPoint(tok, origin))
        return text


# --------------------------------------------------------------- scenario inputs ---------------
def _keyword_values(texts: list[str], unit: str) -> list[float]:
    out: list[float] = []
    for t in texts:
        if unit == "$":
            for m in re.finditer(r"(\$)?(\d[\d,]*(?:\.\d+)?)\s*([kKmM])?(?![\w%])", t):
                dollar, num, suf = m.groups()
                v = float(num.replace(",", ""))
                if suf:
                    v *= 1000 if suf.lower() == "k" else 1_000_000
                if dollar or suf or v >= 1000:
                    out.append(v)
        elif unit == "%":
            out += [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)\s*%", t)]
    seen, uniq = set(), []
    for v in out:
        if v > 0 and v not in seen:
            seen.add(v)
            uniq.append(v)
    return uniq


def _seeded_inputs(formula, canonical: str) -> dict[str, float]:
    digest = hashlib.sha256(canonical.encode("utf-8")).digest()
    out = {}
    for i, (key, spec) in enumerate(formula.inputs.items()):
        v = spec.default
        if key != formula.vary and spec.variable and spec.unit in ("$", "%", "years", "months") and v:
            pool = FACTORS[spec.unit]
            v = spec.default * pool[int.from_bytes(digest[2 * i:2 * i + 2], "big") % len(pool)]
            if spec.unit == "%":
                v = round(v * 4) / 4
            elif spec.unit in ("years", "months"):
                v = max(1, round(v))
            else:
                v = round(v / 50) * 50 if v >= 500 else round(v)
            if spec.positive and v <= 0:
                v = spec.default
        out[key] = v
    return out


def _pick_base(formula, canonical: str, kw_vals: list[float]):
    """First input set the formula accepts: seeded + keyword amount, defaults + keyword amount, defaults."""
    seeded = _seeded_inputs(formula, canonical)
    defaults = formula.defaults()
    attempts = []
    for base in (seeded, defaults):
        if kw_vals:
            attempts.append({**base, formula.vary: kw_vals[0]})
    attempts += [seeded, defaults]
    for inputs in attempts:
        try:
            return inputs, formula.run(**inputs)
        except ValueError:
            continue
    return None, None


# ---------------------------------------------------------------------- site shell ------------
DEFAULT_SHELL = ("<!--PSEO-HEAD-->\n<!--PSEO-HEADER-->\n"
                 '<header class="site-header"><a href="/">CalculatePilot</a></header>\n'
                 "<!--PSEO-FOOTER-->\n"
                 '<footer class="site-footer"><p>CalculatePilot &middot; free online calculators</p></footer>\n')


def load_site_shell(guide_html: str) -> str:
    """Keep the live site's styles, header and footer from an existing guide; drop its page-specific head."""
    head = re.search(r"<head\b[^>]*>(.*?)</head>", guide_html, re.S | re.I)
    head_html = head.group(1) if head else ""
    keep = re.findall(r"<style\b.*?</style>", head_html, re.S | re.I)
    for link in re.findall(r"<link\b[^>]*>", head_html, re.I):
        if re.search(r'rel=["\']?(?:stylesheet|preconnect|preload|icon|shortcut icon)', link, re.I):
            keep.append(link)
    header = re.search(r"<header\b.*?</header>", guide_html, re.S | re.I) or \
        re.search(r"<nav\b.*?</nav>", guide_html, re.S | re.I)
    footer = re.search(r"<footer\b.*?</footer>", guide_html, re.S | re.I)
    return ("<!--PSEO-HEAD-->\n" + "\n".join(keep) + "\n<!--PSEO-HEADER-->\n" +
            (header.group(0) if header else "") + "\n<!--PSEO-FOOTER-->\n" +
            (footer.group(0) if footer else "") + "\n")


def _split_shell(shell: str) -> tuple[str, str, str]:
    default = DEFAULT_SHELL
    parts = {}
    for name, nxt in (("HEAD", "HEADER"), ("HEADER", "FOOTER"), ("FOOTER", None)):
        m = re.search(rf"<!--PSEO-{name}-->\n(.*?)(?=<!--PSEO-{nxt}-->|\Z)" if nxt else
                      rf"<!--PSEO-{name}-->\n(.*)\Z", shell, re.S)
        parts[name] = m.group(1).strip() if m else ""
    d_header = re.search(r"<header.*?</header>", default, re.S).group(0)
    d_footer = re.search(r"<footer.*?</footer>", default, re.S).group(0)
    return parts["HEAD"], parts["HEADER"] or d_header, parts["FOOTER"] or d_footer


# ------------------------------------------------------------------------- build -------------
def _relevant_facts(facts: dict, formula_id: str) -> list[dict]:
    out = []
    for key, f in sorted((facts or {}).items()):
        if (key.startswith(formula_id + "_") and isinstance(f, dict)
                and f.get("value") not in (None, "") and f.get("source_url") and f.get("verified_at")):
            out.append({"key": key, "label": _label(key[len(formula_id) + 1:]), "value": str(f["value"]),
                        "source_url": str(f["source_url"]), "verified_at": str(f["verified_at"])})
    return out


def _questions(keywords: list[str]) -> list[str]:
    seen, out = set(), []
    for k in keywords:
        n = normalize.normalize(k)
        if QUESTION.match(n) and n not in seen:
            seen.add(n)
            q = k.strip()
            out.append((q[0].upper() + q[1:]) if q.endswith("?") else (q[0].upper() + q[1:]) + "?")
    return out[:4]


def build_page(cluster: ClusterRow, calc: Calculator, facts: dict, template_html: str | None,
               today: date, site_url: str = "https://calculatepilot.com",
               guide_dir: str = GUIDE_DIR) -> Page | None:
    formula = formulas.get(calc.formula_id)
    if formula is None:
        return None
    canonical = cluster.canonical_keyword
    reg = _Reg()
    origin_f, origin_k = f"formula:{formula.id}", f"keyword:{canonical}"
    vary_spec = formula.inputs[formula.vary]

    kw_vals = _keyword_values([canonical] + list(cluster.numeric_variants), vary_spec.unit)
    inputs, result = _pick_base(formula, canonical, kw_vals)
    if inputs is None:
        return None

    slug = slugify(canonical)
    h1 = reg.text(kw_title(canonical), origin_k)
    title = f"{h1}: Worked Example and Scenario Table"
    if len(title) > 70:
        title = f"{h1}: Worked Example"
    description = reg.text(f"{h1}: a worked example with the formula shown step by step, a scenario "
                           f"table and the assumptions behind it.", origin_k)
    page_url = abs_url(site_url, f"{guide_dir}/{slug}.html")
    calc_url = abs_url(site_url, calc.url)

    # quick answer
    summary = "; ".join(f"{spec.label.lower()} {_fmt_input(spec, inputs[k])}" for k, spec in formula.inputs.items())
    headline_val = _fmt_out(formula, formula.headline, result[formula.headline])
    quick = reg.text(f"With these example inputs ({summary}), the {formula.headline_label.lower()} comes to "
                     f"{headline_val}.", origin_f)
    also = [reg.text(k, origin_k) for k in cluster.keywords if normalize.normalize(k) != normalize.normalize(canonical)][:5]

    # worked example + breakdown
    steps = [reg.text(s, origin_f) for s in formula.steps(**inputs)]
    rows = formula.table(**inputs)
    if len(rows) > 10:
        rows = rows[:9] + [rows[-1]]
    head_keys = list(rows[0].keys()) if rows else []
    breakdown_rows = [[reg.text(_fmt_out(formula, k, r[k]), origin_f) for k in head_keys] for r in rows]
    breakdown_head = [_label(k) for k in head_keys]

    # scenario table
    others = [k for k, v in result.items() if k != formula.headline and v is not None][:2]
    base_v = inputs[formula.vary]
    cands = list(kw_vals[:5])
    fill = [base_v] + list(formula.scenarios) if formula.scenarios else [base_v * m for m in (0.5, 1, 1.5, 2)]
    for v in fill:
        if len(cands) >= 3:
            break
        if v not in cands:
            cands.append(v)
    if formula.scenarios and len(cands) < 3:
        cands += [v for v in formula.scenarios if v not in cands]
    scenario_rows = []
    for v in sorted(set(cands))[:5]:
        try:
            res = formula.run(**{**inputs, formula.vary: v})
        except ValueError:
            continue
        scenario_rows.append([reg.text(_fmt_input(vary_spec, v), origin_f),
                              reg.text(_fmt_out(formula, formula.headline, res[formula.headline]), origin_f)] +
                             [reg.text(_fmt_out(formula, k, res[k]), origin_f) for k in others])
    scenario_head = [vary_spec.label, formula.headline_label] + [_label(k) for k in others]

    # assumptions
    assumptions = ["Every input on this page is an example, not a quote, rate or offer.",
                   "Results are estimates from the formula shown; figures from your own provider may differ.",
                   "Example values other than amounts taken from the search phrase were picked for illustration only.",
                   "Not for anyone who needs a binding quote, or tax, legal or medical advice for their own case; "
                   "ask a qualified professional for that."]
    medical = MEDICAL_NOTE if formula.ymyl else ""
    if medical:
        assumptions.append(MEDICAL_NOTE)

    fact_rows = _relevant_facts(facts, formula.id)
    for f in fact_rows:
        reg.text(f"{f['value']} {f['verified_at']}", f"fact:{f['key']}")
        f["key"] = f["key"]

    # faq (only questions that were actually harvested for this cluster)
    qs = _questions(cluster.keywords)
    faq = []
    for q in qs:
        reg.text(q, origin_k)
        a = reg.text(f"The worked example above answers this for the example inputs: the "
                     f"{formula.headline_label.lower()} is {headline_val}. Change the inputs in the "
                     f"{calc.name} to see your own numbers.", origin_f)
        faq.append((q, a))

    # related
    related = [(f"Use the {calc.name}", calc_url)] + list(cluster.siblings)[:5]

    date_iso = today.isoformat()
    how_made = (f"This page was generated from the {formula.id} formula (method version "
                f"{formula.method_version}) on {date_iso}. The inputs shown are examples and every figure "
                f"is calculated by that formula. Author: {AUTHOR}.")

    breadcrumbs = [("Home", site_url.rstrip("/") + "/"), (calc.name, calc_url), (h1, page_url)]
    sections = ["quick-answer", "worked-example", "scenario-table", "assumptions"] + \
        (["facts"] if fact_rows else []) + (["faq"] if faq else []) + ["related", "how-made"]

    page = Page(slug=slug, title=title, html="", sections=sections, data_points=reg.points,
                needs_manual_approval=formula.ymyl, h1=h1, description=description, faq=faq,
                breadcrumbs=breadcrumbs, date_iso=date_iso, url=page_url, formula_id=formula.id,
                method_version=formula.method_version)
    shell_head, shell_header, shell_footer = _split_shell(load_site_shell(template_html) if template_html else DEFAULT_SHELL)
    page.html = _env.get_template("guide.html.j2").render(
        title=title, description=description, canonical=page_url, shell_head=shell_head,
        shell_header=shell_header, shell_footer=shell_footer, jsonld=schema.jsonld(page, page_url),
        breadcrumbs=breadcrumbs, h1=h1, author=AUTHOR, date_iso=date_iso, medical_note=medical,
        quick=quick, also=also, calc_name=calc.name, steps=steps, breakdown_rows=breakdown_rows,
        breakdown_head=breakdown_head, breakdown_caption=f"Year-by-year view for the example inputs",
        vary_label=vary_spec.label.lower(), scenario_head=scenario_head, scenario_rows=scenario_rows,
        assumptions=assumptions, facts=fact_rows, faq=faq, related=related, how_made=how_made)
    return page


# ----------------------------------------------------------------------- load from DB ---------
def load_cluster(conn: sqlite3.Connection, cluster_id: int, calculators: list[Calculator],
                 site_url: str = "https://calculatepilot.com", guide_dir: str = GUIDE_DIR) -> ClusterRow:
    c = conn.execute("SELECT * FROM clusters WHERE id=?", (cluster_id,)).fetchone()
    keywords = [r[0] for r in conn.execute(
        "SELECT k.text FROM keywords k JOIN cluster_members m ON m.keyword_id=k.id "
        "WHERE m.cluster_id=? AND k.quarantine_reason IS NULL ORDER BY k.id", (cluster_id,))]
    siblings: list[tuple[str, str]] = []
    for r in conn.execute(
            "SELECT p.title, p.slug FROM pages p JOIN clusters c ON c.id=p.cluster_id "
            "WHERE c.calculator_slug=? AND c.id!=? AND p.status IN ('DRAFT','PASS','PUBLISHED') "
            "ORDER BY p.id LIMIT 2", (c["calculator_slug"], cluster_id)):
        siblings.append((r["title"], abs_url(site_url, f"{guide_dir}/{r['slug']}.html")))
    mine = next((x for x in calculators if x.slug == c["calculator_slug"]), None)
    if mine:
        peers = sorted((x for x in calculators if x.category == mine.category and x.slug != mine.slug),
                       key=lambda x: x.slug)
        if peers:
            start = hashlib.sha256(c["canonical_keyword"].encode()).digest()[0] % len(peers)
            peers = peers[start:] + peers[:start]
        for x in peers[: max(0, 5 - len(siblings))]:
            siblings.append((x.name, abs_url(site_url, x.url)))
    return ClusterRow(id=cluster_id, canonical_keyword=c["canonical_keyword"], intent=c["intent"],
                      calculator_slug=c["calculator_slug"],
                      numeric_variants=json.loads(c["numeric_variants"] or "[]"),
                      keywords=keywords, siblings=siblings)
