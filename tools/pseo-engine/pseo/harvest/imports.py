"""CSV imports: Search Console, Ahrefs and Semrush exports."""
from __future__ import annotations

import csv
from datetime import datetime, timezone
from pathlib import Path

from .. import store

_KINDS = {
    "gsc": ("Query", "Clicks", "Impressions"),
    "ahrefs": ("Keyword", "Volume"),
    "semrush": ("Keyword", "Search Volume"),
}


def _detect(columns: list[str]) -> str:
    cols = {c.strip() for c in columns}
    for kind in ("gsc", "semrush", "ahrefs"):  # semrush before ahrefs: both have Keyword
        if set(_KINDS[kind]) <= cols:
            return kind
    raise ValueError(
        "I could not recognise this CSV. Expected a Search Console export (Query, Clicks, "
        "Impressions), an Ahrefs export (Keyword, Volume) or a Semrush export (Keyword, "
        f"Search Volume). Columns found: {', '.join(columns) or 'none'}.")


def _num(v) -> float | None:
    try:
        return float(str(v).replace(",", "").replace("%", "").strip())
    except ValueError:
        return None


def import_csv(conn, path, kind: str | None = None) -> int:
    """Import one export; returns rows read. Safe to run twice on the same file."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with open(Path(path), newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        kind = kind or _detect(reader.fieldnames or [])
        count = 0
        for row in reader:
            text = (row.get("Query") if kind == "gsc" else row.get("Keyword")) or ""
            if not text.strip():
                continue
            try:
                kid = store.add_keyword(conn, text, kind, "import", now)
            except ValueError:
                continue
            count += 1
            if kind == "gsc":
                conn.execute(
                    "DELETE FROM gsc_metrics WHERE query=? AND page_url IS NULL", (text,))
                conn.execute(
                    "INSERT INTO gsc_metrics(page_url, date, query, clicks, impressions, ctr, position) "
                    "VALUES(NULL,?,?,?,?,?,?)",
                    (now[:10], text, _num(row.get("Clicks")), _num(row.get("Impressions")),
                     _num(row.get("CTR")), _num(row.get("Position"))))
            else:
                vol = _num(row.get("Volume" if kind == "ahrefs" else "Search Volume"))
                conn.execute("UPDATE keywords SET est_volume=? WHERE id=?", (vol, kid))
        conn.commit()
    return count
