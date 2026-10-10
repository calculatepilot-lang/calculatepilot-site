"""Score clusters 0-100 (spec section 7). Long-tail and uncovered clusters rank highest."""
from __future__ import annotations

import math

from .. import normalize
from . import cluster as cluster_mod

INTENT_FIT = {"calculate": 20.0, "compare": 15.0, "learn": 15.0, "convert": 15.0,
              "other": 4.0, "navigational": 0.0}


def band(total: float) -> str:
    if total >= 80:
        return "strong"
    if total >= 70:
        return "pilot"
    if total >= 60:
        return "needs-moat"
    return "reject"


def _longtail(canonical: str) -> float:
    n = len(normalize.tokens(canonical))
    if n >= 4:
        return 20.0
    if normalize.is_long_tail(canonical):
        return 14.0
    if n == 3:
        return 8.0
    return -5.0 if n == 2 else -10.0


def _demand(conn, members: list) -> tuple[float, float]:
    ids = [m["id"] for m in members]
    marks = ",".join("?" * len(ids))
    src_total = sum(m["source_count"] or 0 for m in members)
    distinct = conn.execute(
        f"SELECT COUNT(DISTINCT source) FROM keyword_sources WHERE keyword_id IN ({marks})",
        ids).fetchone()[0]
    signal = max([m["est_volume"] or 0 for m in members] + [
        (conn.execute("SELECT COALESCE(SUM(impressions),0) FROM gsc_metrics WHERE query=?",
                      (m["text"],)).fetchone()[0] or 0) for m in members])
    demand = min(15.0, 4 * math.log2(1 + src_total)) + min(10.0, 2.5 * math.log10(1 + signal))
    diversity = min(15.0, 5.0 * max(distinct, 1))
    return min(25.0, demand), diversity


def _coverage(conn, cl) -> float:
    gap = 0.0 if conn.execute(
        "SELECT 1 FROM pages WHERE cluster_id=? AND NOT (status='HOLD' AND COALESCE(html,'')='')", (cl["id"],)).fetchone() else 20.0
    mine = {t for t in normalize.tokens(cl["canonical_keyword"])}
    clash = 0
    for o in conn.execute(
            "SELECT canonical_keyword FROM clusters WHERE id!=? AND decision='PAGE' AND intent=? "
            "AND calculator_slug IS ?", (cl["id"], cl["intent"], cl["calculator_slug"])):
        if cluster_mod.jaccard(mine, set(normalize.tokens(o["canonical_keyword"]))) >= 0.5:
            clash += 1
    return gap - min(10.0, 5.0 * clash)  # cannibalization penalty folded into the gap column


def score_cluster(conn, cluster_id: int) -> float:
    cl = conn.execute("SELECT * FROM clusters WHERE id=?", (cluster_id,)).fetchone()
    members = conn.execute(
        "SELECT k.* FROM keywords k JOIN cluster_members m ON m.keyword_id=k.id "
        "WHERE m.cluster_id=?", (cluster_id,)).fetchall()
    demand, diversity = _demand(conn, members) if members else (0.0, 0.0)
    fit = INTENT_FIT.get(cl["intent"], 4.0)
    lt = _longtail(cl["canonical_keyword"])
    gap = _coverage(conn, cl)
    prev = conn.execute("SELECT intitle_adj FROM scores WHERE cluster_id=?", (cluster_id,)).fetchone()
    adj = (prev["intitle_adj"] if prev else 0) or 0
    total = max(0.0, min(100.0, demand + diversity + fit + lt + gap + adj))
    conn.execute(
        "INSERT INTO scores(cluster_id,demand,source_diversity,intent_fit,coverage_gap,longtail,"
        "intitle_adj,total,band) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(cluster_id) DO UPDATE SET "
        "demand=excluded.demand, source_diversity=excluded.source_diversity, "
        "intent_fit=excluded.intent_fit, coverage_gap=excluded.coverage_gap, "
        "longtail=excluded.longtail, intitle_adj=excluded.intitle_adj, total=excluded.total, "
        "band=excluded.band",
        (cluster_id, demand, diversity, fit, gap, lt, adj, total, band(total)))
    conn.commit()
    return total


def run(conn) -> int:
    ids = [r[0] for r in conn.execute(
        "SELECT id FROM clusters WHERE decision='PAGE' AND calculator_slug IS NOT NULL")]
    for cid in ids:
        score_cluster(conn, cid)
    return len(ids)


def intitle_adjustment(competition_band: str | None) -> float:
    """Score change for allintitle competition; 0 when the keyword was never checked."""
    return {"easy": 15.0, "medium": 7.0, "hard": -10.0}.get(competition_band, 0.0)
