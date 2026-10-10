"""Read/write helpers for keywords and sources."""
from __future__ import annotations

import sqlite3

from . import normalize, quarantine


def add_keyword(conn: sqlite3.Connection, text: str, source: str, seed: str,
                fetched_at: str) -> int:
    norm = normalize.normalize(text)
    if not norm:
        raise ValueError("keyword is empty after normalization")
    why = quarantine.reason(text)
    row = conn.execute("SELECT id FROM keywords WHERE normalized=?", (norm,)).fetchone()
    if row:
        kid = row["id"]
        conn.execute("UPDATE keywords SET last_seen=? WHERE id=?", (fetched_at, kid))
        if why:
            conn.execute("UPDATE keywords SET quarantine_reason=COALESCE(quarantine_reason, ?) "
                         "WHERE id=?", (why, kid))
    else:
        cur = conn.execute(
            "INSERT INTO keywords(text, normalized, first_seen, last_seen, quarantine_reason) "
            "VALUES(?,?,?,?,?)", (text.strip(), norm, fetched_at, fetched_at, why))
        kid = cur.lastrowid
    conn.execute(
        "INSERT OR IGNORE INTO keyword_sources(keyword_id, source, query_seed, fetched_at) "
        "VALUES(?,?,?,?)", (kid, source, seed or "", fetched_at))
    conn.execute(
        "UPDATE keywords SET source_count=(SELECT COUNT(DISTINCT source) FROM keyword_sources "
        "WHERE keyword_id=?) WHERE id=?", (kid, kid))
    conn.commit()
    return kid


def active_keywords(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    """Keywords that passed the quarantine check; every analysis stage reads through this."""
    return conn.execute(
        "SELECT * FROM keywords WHERE quarantine_reason IS NULL ORDER BY id").fetchall()


def save_page(conn: sqlite3.Connection, cluster_id: int, page, status: str = "DRAFT") -> int:
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    cur = conn.execute(
        "INSERT INTO pages(cluster_id,slug,title,status,template_version,method_version,html,"
        "needs_manual_approval,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
        (cluster_id, page.slug, page.title, status, "1", page.method_version, page.html,
         int(page.needs_manual_approval), now))
    conn.commit()
    return cur.lastrowid


def set_status(conn: sqlite3.Connection, page_id: int, status: str, published_at: str | None = None) -> None:
    conn.execute("UPDATE pages SET status=?, published_at=COALESCE(?, published_at) WHERE id=?",
                 (status, published_at, page_id))
    conn.commit()


def pages_by_status(conn: sqlite3.Connection, status: str) -> list[sqlite3.Row]:
    return conn.execute("SELECT * FROM pages WHERE status=? ORDER BY id", (status,)).fetchall()
