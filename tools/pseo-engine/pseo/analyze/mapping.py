"""Map clusters to calculators by topic terms; unmappable clusters are rejected."""
from __future__ import annotations

from .. import normalize
from ..config import Calculator
from . import cluster as cluster_mod

GENERIC = frozenset({"calculator", "calculators", "calc", "converter", "tool", "online", "free"})


def _stem(w: str) -> str:
    return w[:-1] if len(w) > 3 and w.endswith("s") and not w.endswith("ss") else w


def _terms(text: str) -> frozenset[str]:
    return frozenset(_stem(t) for t in normalize.tokens(text) if t not in GENERIC)


def _phrases(calc: Calculator) -> list[frozenset[str]]:
    out = [_terms(calc.name)] + [_terms(a) for a in calc.aliases]
    return [p for p in out if p]


def map_cluster(canonical: str, calculators: list[Calculator]) -> Calculator | None:
    """Best calculator: the one whose topic phrase (all words present) is longest; ties go to the
    calculator with the longer name (more specific)."""
    kw = _terms(canonical)
    best: tuple[int, int] | None = None
    winner: Calculator | None = None
    for calc in calculators:
        hit = max((len(p) for p in _phrases(calc) if p <= kw), default=0)
        if not hit:
            continue
        key = (hit, len(_terms(calc.name)))
        if best is None or key > best:
            best, winner = key, calc
    return winner


def run(conn, calculators: list[Calculator], numeric_cap: int = 5) -> dict:
    """Assign calculator_slug to unmapped PAGE clusters; reject the rest. Also records calculators."""
    for c in calculators:
        conn.execute(
            "INSERT INTO calculators(slug,name,category,url,formula_id) VALUES(?,?,?,?,?) "
            "ON CONFLICT(slug) DO UPDATE SET name=excluded.name, category=excluded.category, "
            "url=excluded.url, formula_id=excluded.formula_id",
            (c.slug, c.name, c.category, c.url, c.formula_id))
    mapped = rejected = 0
    rows = conn.execute("SELECT id, canonical_keyword FROM clusters "
                        "WHERE decision='PAGE' AND calculator_slug IS NULL").fetchall()
    for r in rows:
        calc = map_cluster(r["canonical_keyword"], calculators)
        if calc:
            conn.execute("UPDATE clusters SET calculator_slug=? WHERE id=?", (calc.slug, r["id"]))
            mapped += 1
        else:
            conn.execute("UPDATE clusters SET decision='REJECT', reason='no matching calculator' "
                         "WHERE id=?", (r["id"],))
            rejected += 1
    conn.commit()
    merged = cluster_mod.cap_numeric(conn, numeric_cap)
    return {"mapped": mapped, "rejected": rejected, "merged": merged}
