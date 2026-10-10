"""Private, self-contained dashboard (reports/dashboard.html). Harvested text is untrusted."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from . import formulas, ping
from .analyze import intitle

MAX_KEYWORDS = 20000
_env = Environment(loader=FileSystemLoader(str(Path(__file__).parent / "templates")), autoescape=True)


def _json(obj) -> str:
    return (json.dumps(obj, ensure_ascii=True).replace("<", "\\u003c")
            .replace(">", "\\u003e").replace("&", "\\u0026"))


def _rows(conn, sql, args=()):
    return [dict(r) for r in conn.execute(sql, args)]


def collect(conn, calculators, now: datetime) -> dict:
    pages_by_status = {r[0]: r[1] for r in conn.execute("SELECT status, COUNT(*) FROM pages GROUP BY status")}
    health: dict[str, dict] = {}
    for r in conn.execute("SELECT engine, status_code, MAX(pinged_at) AS last, COUNT(*) AS n FROM pings "
                          "GROUP BY engine, status_code"):
        h = health.setdefault(r["engine"], {"ok": 0, "failed": 0, "last": ""})
        h["ok" if 200 <= (r["status_code"] or 0) < 300 else "failed"] += r["n"]
        h["last"] = max(h["last"], r["last"] or "")
    overview = {
        "generated_at": now.isoformat(timespec="seconds"),
        "pages": pages_by_status,
        "keywords_total": conn.execute("SELECT COUNT(*) FROM keywords").fetchone()[0],
        "keywords_quarantined": conn.execute(
            "SELECT COUNT(*) FROM keywords WHERE quarantine_reason IS NOT NULL").fetchone()[0],
        "clusters": {r[0]: r[1] for r in conn.execute("SELECT decision, COUNT(*) FROM clusters GROUP BY decision")},
        "last_keyword_seen": conn.execute("SELECT MAX(last_seen) FROM keywords").fetchone()[0],
        "ping_health": health,
    }
    calc_names = {c.slug: c.name for c in calculators}
    pages = []
    for p in _rows(conn, "SELECT p.id, p.slug, p.title, p.status, p.needs_manual_approval, p.published_at, "
                         "p.index_status, c.canonical_keyword AS keyword, c.calculator_slug AS calculator, "
                         "s.total AS score, s.band AS band, "
                         "(SELECT MAX(pinged_at) FROM pings g WHERE g.url LIKE '%/' || p.slug || '.html') AS last_ping "
                         "FROM pages p JOIN clusters c ON c.id=p.cluster_id LEFT JOIN scores s ON s.cluster_id=c.id "
                         "ORDER BY p.id"):
        gates = _rows(conn, "SELECT gate, name, passed, detail FROM gate_results WHERE page_id=? ORDER BY gate", (p["id"],))
        p["gates"] = gates
        p["why_held"] = "; ".join(f"{g['name']}: {g['detail']}" for g in gates if not g["passed"])
        folder = "needs-approval" if p["needs_manual_approval"] else "guides"
        p["file"] = f"{folder}/{p['slug']}.html" if p["status"] in ("PUBLISHED", "NEEDS_APPROVAL") else ""
        p["calculator_name"] = calc_names.get(p["calculator"], p["calculator"])
        pages.append(p)

    serp = {r["keyword"]: r["allintitle_count"] for r in conn.execute("SELECT keyword, allintitle_count FROM serp_checks")}
    keywords = _rows(
        conn,
        "SELECT k.id, k.text, k.quarantine_reason, k.est_volume AS volume, k.source_count, i.label AS intent, "
        "c.canonical_keyword AS cluster, c.calculator_slug AS calculator, c.decision AS decision, c.reason AS reason, "
        "s.total AS score, (SELECT GROUP_CONCAT(DISTINCT source) FROM keyword_sources ks WHERE ks.keyword_id=k.id) AS srcs "
        "FROM keywords k LEFT JOIN intent i ON i.keyword_id=k.id "
        "LEFT JOIN cluster_members m ON m.keyword_id=k.id LEFT JOIN clusters c ON c.id=m.cluster_id "
        "LEFT JOIN scores s ON s.cluster_id=c.id GROUP BY k.id "
        "ORDER BY COALESCE(s.total,0) DESC, k.source_count DESC, k.id LIMIT ?", (MAX_KEYWORDS,))
    for k in keywords:
        k["sources"] = sorted(filter(None, (k.pop("srcs") or "").split(",")))
        k["status"] = k.pop("quarantine_reason") or k["reason"] or k["decision"] or "new"
        k["allintitle"] = serp.get(k["cluster"])
        k["competition"] = intitle.band(k["allintitle"]) if k["allintitle"] is not None else "intitle not checked"
        k.pop("decision"), k.pop("reason")

    pings = _rows(conn, "SELECT url, engine, status_code, substr(response,1,120) AS response, pinged_at "
                        "FROM pings ORDER BY id DESC LIMIT 500")
    performance = _rows(conn, "SELECT page_url, SUM(clicks) AS clicks, SUM(impressions) AS impressions, "
                              "ROUND(AVG(position),1) AS position FROM gsc_metrics GROUP BY page_url "
                              "ORDER BY clicks DESC, impressions DESC LIMIT 500")
    queries = _rows(conn, "SELECT query, SUM(clicks) AS clicks, SUM(impressions) AS impressions, "
                          "ROUND(AVG(position),1) AS position FROM gsc_metrics GROUP BY query "
                          "ORDER BY impressions DESC LIMIT 500")
    cov = formulas.coverage(calculators)
    per_calc = {r[0]: r[1] for r in conn.execute(
        "SELECT calculator_slug, COUNT(*) FROM clusters WHERE decision='PAGE' GROUP BY calculator_slug")}
    coverage = [{"slug": c.slug, "name": c.name, "category": c.category, "formula_id": c.formula_id,
                 "has_formula": cov[c.slug], "clusters": per_calc.get(c.slug, 0),
                 "note": "ready" if cov[c.slug] else "no formula yet: pages stay on HOLD"}
                for c in calculators]
    return {"overview": overview, "pages": pages, "keywords": keywords, "pings": pings,
            "queue": ping.manual_queue(conn), "performance": performance, "queries": queries,
            "coverage": coverage, "keywords_truncated": overview["keywords_total"] > MAX_KEYWORDS}


def render(conn, calculators, out_path: Path, now: datetime) -> Path:
    html = _env.get_template("dashboard.html.j2").render(data=_json(collect(conn, calculators, now)))
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    return out
