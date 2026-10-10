"""Group keywords into clusters (one page per cluster) with a numeric-variant guard."""
from __future__ import annotations

import json
import re

from .. import normalize, store

_NUM = re.compile(r"\$?\d[\d.]*[kmb%]?(?=\s|$)")


def jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    return len(a & b) / len(a | b)


def strip_numbers(text: str) -> str:
    return _NUM.sub("#", normalize.normalize(text))


def _has_number(text: str) -> bool:
    return "#" in strip_numbers(text)


def _tokens(stripped: str) -> set[str]:
    return {t for t in stripped.split() if t not in normalize.STOP_WORDS and t != "#"}


def build(conn, threshold: float = 0.6, numeric_cap: int = 5) -> int:
    """Rebuild clusters from active, classified keywords. Clusters that already have a page are kept."""
    locked = {r[0] for r in conn.execute("SELECT DISTINCT cluster_id FROM pages")}
    keep_members = {r[0] for r in conn.execute(
        "SELECT keyword_id FROM cluster_members WHERE cluster_id IN (%s)"
        % ",".join(str(i) for i in locked))} if locked else set()
    drop = [r[0] for r in conn.execute("SELECT id FROM clusters") if r[0] not in locked]
    for cid in drop:
        conn.execute("DELETE FROM scores WHERE cluster_id=?", (cid,))
        conn.execute("DELETE FROM cluster_members WHERE cluster_id=?", (cid,))
        conn.execute("DELETE FROM clusters WHERE id=?", (cid,))

    rows = conn.execute(
        "SELECT k.id, k.text, i.label FROM keywords k JOIN intent i ON i.keyword_id=k.id "
        "WHERE k.quarantine_reason IS NULL ORDER BY k.id").fetchall()
    # 1) numeric-only variants collapse into one group per (intent, stripped text)
    groups: dict[tuple[str, str], list] = {}
    for r in rows:
        if r["id"] in keep_members:
            continue
        groups.setdefault((r["label"], strip_numbers(r["text"])), []).append(r)

    # 2) greedy merge of groups with the same intent; longest long-tail group seeds a cluster
    def rank(item):
        (label, stripped), members = item
        toks = _tokens(stripped)
        return (-int(normalize.is_long_tail(stripped)), -len(toks), stripped)

    clusters: list[dict] = []
    for (label, stripped), members in sorted(groups.items(), key=rank):
        toks = _tokens(stripped)
        target = next((c for c in clusters
                       if c["intent"] == label and jaccard(c["tokens"], toks) >= threshold), None)
        if target is None:
            canon = sorted(members, key=lambda m: m["text"])[0]["text"]
            target = {"intent": label, "tokens": toks, "canonical": canon, "members": []}
            clusters.append(target)
        target["members"].extend(members)

    for c in clusters:
        numeric = sorted({m["text"] for m in c["members"] if _has_number(m["text"])})
        cur = conn.execute(
            "INSERT INTO clusters(canonical_keyword, intent, numeric_variants) VALUES(?,?,?)",
            (c["canonical"], c["intent"], json.dumps(numeric[:numeric_cap])))
        for m in c["members"]:
            conn.execute("INSERT OR IGNORE INTO cluster_members(cluster_id, keyword_id) VALUES(?,?)",
                         (cur.lastrowid, m["id"]))
    conn.commit()
    return len(clusters)


def cap_numeric(conn, cap: int = 5) -> int:
    """Per calculator, keep `cap` number-driven clusters as pages; the rest become MERGE (doorway guard)."""
    merged = 0
    rows = conn.execute(
        "SELECT id, calculator_slug, numeric_variants FROM clusters "
        "WHERE decision='PAGE' AND calculator_slug IS NOT NULL ORDER BY id").fetchall()
    seen: dict[str, int] = {}
    for r in rows:
        if not json.loads(r["numeric_variants"] or "[]"):
            continue
        seen[r["calculator_slug"]] = seen.get(r["calculator_slug"], 0) + 1
        if seen[r["calculator_slug"]] > cap:
            conn.execute("UPDATE clusters SET decision='MERGE', reason=? WHERE id=?",
                         ("numeric variant cap reached for this calculator", r["id"]))
            merged += 1
    conn.commit()
    return merged
