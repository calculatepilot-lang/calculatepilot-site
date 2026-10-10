"""Seed + long-tail modifier expansion and the harvest loop."""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone

from .. import normalize, store

log = logging.getLogger("pseo.harvest")

MODIFIERS = ["for seniors", "for students", "for self employed", "after tax",
             "with extra payments", "if rate changes"]
PREFIXES = ["how", "what", "why", "can", "is", "best"]
LETTERS = "abcdefghijklmnopqrstuvwxyz"
MAX_CONSECUTIVE_ERRORS = 5


def expand_levels(seed: str, letters: bool = False) -> list[list[str]]:
    levels = [[seed], [f"{seed} {m}" for m in MODIFIERS], [f"{p} {seed}" for p in PREFIXES]]
    if letters:
        levels.append([f"{seed} {c}" for c in LETTERS])
    return levels


def expand_seed(seed: str, letters: bool = False) -> list[str]:
    return [q for level in expand_levels(seed, letters) for q in level]


def seeds_for(calc) -> list[str]:
    seen: list[str] = []
    for s in [calc.name.lower(), *[a.lower() for a in calc.aliases]]:
        if s and s not in seen:
            seen.append(s)
    return seen


def _ordered_queries(calculators, letters: bool) -> list[str]:
    """Breadth first: every calculator's base seeds, then modifiers, then prefixes, then letters."""
    per_calc = [[lv for seed in seeds_for(c) for lv in [expand_levels(seed, letters)]]
                for c in calculators]
    out: list[str] = []
    seen: set[str] = set()
    for depth in range(4 if letters else 3):
        for seed_levels in per_calc:
            for levels in seed_levels:
                if depth < len(levels):
                    for q in levels[depth]:
                        if q not in seen:
                            seen.add(q)
                            out.append(q)
    return out


def _done_recently(conn, source: str, query: str, cutoff: str) -> bool:
    row = conn.execute("SELECT done_at FROM queries_done WHERE source=? AND query=?",
                       (source, query)).fetchone()
    return bool(row and row["done_at"] and row["done_at"] >= cutoff)


def harvest(conn, sources, calculators, settings, now: str | None = None) -> dict[str, int]:
    """Run every enabled source over the expanded seeds. Returns new keywords per source."""
    now = now or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cutoff = (date.fromisoformat(now[:10]) - timedelta(days=int(settings["requery_days"]))).isoformat()
    queries = _ordered_queries(calculators, bool(settings.get("letters")))
    result = {s.name: 0 for s in sources}
    for source in sources:
        if not settings["sources"].get(source.name, True):
            continue
        budget, errors = int(settings["harvest_budget"]), 0
        for q in queries:
            if budget <= 0 or errors >= MAX_CONSECUTIVE_ERRORS:
                if errors >= MAX_CONSECUTIVE_ERRORS:
                    log.warning("%s switched off for this run after %d errors", source.name, errors)
                break
            if _done_recently(conn, source.name, q, cutoff):
                continue
            budget -= 1
            try:
                suggestions = source.fetch(q)
            except Exception as exc:
                log.warning("%s failed on %r: %s", source.name, q, exc)
                errors += 1
                continue
            if getattr(source, "last_error", None):
                errors += 1
                continue
            errors = 0
            for text in suggestions:
                norm = normalize.normalize(text)
                if not norm:
                    continue
                existed = conn.execute("SELECT 1 FROM keywords WHERE normalized=?", (norm,)).fetchone()
                kid = store.add_keyword(conn, text, source.name, q, now)
                quarantined = conn.execute("SELECT quarantine_reason FROM keywords WHERE id=?",
                                           (kid,)).fetchone()["quarantine_reason"]
                if not existed and not quarantined:
                    result[source.name] += 1
            conn.execute("INSERT OR REPLACE INTO queries_done(source, query, done_at) VALUES(?,?,?)",
                         (source.name, q, now))
            conn.commit()
    return result


def default_sources(settings, http_get=None) -> list:
    """All enabled keyword sources, built with the configured request delay."""
    from . import autocomplete, community
    classes = [autocomplete.GoogleAC, autocomplete.BingAC, autocomplete.YouTubeAC,
               autocomplete.DDGAC, community.RedditSource, community.HNSource,
               community.StackExchangeSource]
    delay = settings.get("request_delay", 1.0)
    return [c(http_get=http_get, delay=delay) for c in classes if settings["sources"].get(c.name, True)]
