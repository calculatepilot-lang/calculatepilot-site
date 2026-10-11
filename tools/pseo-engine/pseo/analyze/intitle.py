"""allintitle competition check through a pluggable SERP provider (no scraping of Google)."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import NamedTuple
from urllib.parse import urlparse

from ..harvest import base
from . import score

log = logging.getLogger("pseo.intitle")


class SerpResult(NamedTuple):
    count: int
    titles: list
    domains: list


def band(count: int) -> str:
    if count < 500:
        return "easy"
    return "medium" if count <= 5000 else "hard"


class Provider:
    def allintitle(self, keyword: str) -> SerpResult | None:  # pragma: no cover - interface
        raise NotImplementedError


class SerpApiProvider(Provider):
    url = "https://serpapi.com/search.json"

    def __init__(self, api_key: str, http_get=None):
        self.api_key = api_key
        self._get = http_get or base.http_get

    def allintitle(self, keyword: str) -> SerpResult | None:
        safe = keyword.replace('"', " ")
        text = self._get(self.url, {"engine": "google", "q": f'allintitle:"{safe}"',
                                    "api_key": self.api_key, "num": 10}, 1.0)
        if text is None:
            return None
        try:
            data = json.loads(text)
            count = int(data["search_information"]["total_results"])
            organic = data.get("organic_results") or []
            titles = [str(o.get("title", "")) for o in organic][:10]
            domains = [urlparse(o.get("link", "")).netloc.removeprefix("www.") for o in organic][:10]
            return SerpResult(count, titles, domains)
        except (ValueError, KeyError, TypeError):
            return None


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def run(conn, provider: Provider | None, settings: dict, now: str | None = None) -> dict:
    """Check the highest pre-score clusters within budget; cached keywords cost nothing."""
    now = now or datetime.now(timezone.utc).isoformat(timespec="seconds")
    rows = conn.execute(
        "SELECT c.id, c.canonical_keyword, s.total - COALESCE(s.intitle_adj,0) AS pre "
        "FROM clusters c JOIN scores s ON s.cluster_id=c.id WHERE c.decision='PAGE' "
        "ORDER BY pre DESC, c.id").fetchall()
    out = {"checked": 0, "cached": 0, "failed": 0, "not_checked": 0}
    if provider is None:
        out["not_checked"] = len(rows)
        return out
    budget = int(settings.get("intitle_budget", 100))
    cutoff = _parse(now) - timedelta(days=int(settings.get("intitle_cache_days", 30)))
    streak = 0   # consecutive provider failures; 5 in a row switches the provider off for this run
    for r in rows:
        kw = r["canonical_keyword"]
        cached = conn.execute("SELECT * FROM serp_checks WHERE keyword=?", (kw,)).fetchone()
        count = None
        if cached and _parse(cached["checked_at"]) >= cutoff:
            count = cached["allintitle_count"]
            out["cached"] += 1
        elif budget <= 0 or streak >= 5:
            out["not_checked"] += 1
            continue
        else:
            budget -= 1
            try:
                res = provider.allintitle(kw)
            except Exception as exc:  # a provider must never stop the run
                log.warning("intitle provider error for %r: %s", kw, exc)
                res = None
            if res is None:
                out["failed"] += 1
                streak += 1
                continue
            streak = 0
            conn.execute(
                "INSERT OR REPLACE INTO serp_checks(keyword,allintitle_count,top_titles_json,"
                "top_domains_json,checked_at,provider) VALUES(?,?,?,?,?,?)",
                (kw, res.count, json.dumps(res.titles), json.dumps(res.domains), now,
                 type(provider).__name__))
            count = res.count
            out["checked"] += 1
        conn.execute("UPDATE scores SET intitle_adj=? WHERE cluster_id=?",
                     (score.intitle_adjustment(band(count)), r["id"]))
        score.score_cluster(conn, r["id"])
    conn.commit()
    return out
