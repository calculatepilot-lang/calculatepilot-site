"""SQLite schema and connection helper."""
from __future__ import annotations

import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS calculators(
  slug TEXT PRIMARY KEY, name TEXT, category TEXT, url TEXT, formula_id TEXT);
CREATE TABLE IF NOT EXISTS keywords(
  id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL, normalized TEXT NOT NULL UNIQUE,
  first_seen TEXT, last_seen TEXT, source_count INTEGER DEFAULT 0, est_volume REAL,
  quarantine_reason TEXT);
CREATE TABLE IF NOT EXISTS keyword_sources(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword_id INTEGER NOT NULL REFERENCES keywords(id),
  source TEXT NOT NULL, query_seed TEXT NOT NULL DEFAULT '', fetched_at TEXT,
  UNIQUE(keyword_id, source, query_seed));
CREATE TABLE IF NOT EXISTS intent(
  keyword_id INTEGER PRIMARY KEY REFERENCES keywords(id),
  label TEXT, confidence REAL, rule TEXT);
CREATE TABLE IF NOT EXISTS clusters(
  id INTEGER PRIMARY KEY AUTOINCREMENT, canonical_keyword TEXT NOT NULL, intent TEXT,
  calculator_slug TEXT, decision TEXT DEFAULT 'PAGE', reason TEXT,
  numeric_variants TEXT DEFAULT '[]');
CREATE TABLE IF NOT EXISTS cluster_members(
  cluster_id INTEGER NOT NULL REFERENCES clusters(id),
  keyword_id INTEGER NOT NULL REFERENCES keywords(id),
  PRIMARY KEY(cluster_id, keyword_id));
CREATE TABLE IF NOT EXISTS scores(
  cluster_id INTEGER PRIMARY KEY REFERENCES clusters(id),
  demand REAL, source_diversity REAL, intent_fit REAL, coverage_gap REAL,
  longtail REAL, intitle_adj REAL DEFAULT 0, total REAL, band TEXT);
CREATE TABLE IF NOT EXISTS pages(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cluster_id INTEGER NOT NULL REFERENCES clusters(id),
  slug TEXT NOT NULL UNIQUE, title TEXT, status TEXT DEFAULT 'DRAFT',
  template_version TEXT, method_version TEXT, html TEXT,
  needs_manual_approval INTEGER DEFAULT 0, index_status TEXT,
  created_at TEXT, published_at TEXT);
CREATE TABLE IF NOT EXISTS gate_results(
  page_id INTEGER NOT NULL REFERENCES pages(id), gate INTEGER NOT NULL,
  name TEXT, passed INTEGER, detail TEXT, checked_at TEXT,
  PRIMARY KEY(page_id, gate));
CREATE TABLE IF NOT EXISTS pings(
  id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL, engine TEXT NOT NULL,
  status_code INTEGER, response TEXT, pinged_at TEXT);
CREATE TABLE IF NOT EXISTS gsc_metrics(
  page_url TEXT, date TEXT, query TEXT, clicks REAL, impressions REAL, ctr REAL, position REAL);
CREATE TABLE IF NOT EXISTS queries_done(
  source TEXT NOT NULL, query TEXT NOT NULL, done_at TEXT, PRIMARY KEY(source, query));
CREATE TABLE IF NOT EXISTS serp_checks(
  keyword TEXT PRIMARY KEY, allintitle_count INTEGER, top_titles_json TEXT,
  top_domains_json TEXT, checked_at TEXT, provider TEXT);
"""


def connect(path: str | Path) -> sqlite3.Connection:
    p = Path(path)
    if str(p) != ":memory:":
        p.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(p))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    conn.executescript(SCHEMA)
    conn.commit()
    return conn
