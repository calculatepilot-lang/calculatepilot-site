"""Indexing-speed helpers. These ask search engines to look; they cannot force Google to index.

Not built on purpose: the Google Indexing API for ordinary pages (unsupported by Google).
"""
from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

log = logging.getLogger("pseo.ping")
INDEXNOW_URL = "https://api.indexnow.org/indexnow"
BATCH = 10000
OK = (200, 202)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def indexnow_payload(urls: list[str], host: str, key: str) -> dict:
    return {"host": host, "key": key, "keyLocation": f"https://{host}/{key}.txt", "urlList": list(urls)}


def write_key_file(key: str, out_dir: Path) -> Path:
    path = Path(out_dir) / f"{key}.txt"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(key, encoding="utf-8")
    return path


def _default_post(url: str, payload: dict) -> tuple[int, str]:
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="POST",
                                 headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")[:300]
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", "replace")[:300]


def _needs_ping(conn, url: str) -> bool:
    last = conn.execute("SELECT MAX(pinged_at) FROM pings WHERE url=? AND engine='indexnow' "
                        "AND status_code IN (200,202)", (url,)).fetchone()[0]
    if last is None:
        return True
    slug = url.rsplit("/", 1)[-1].removesuffix(".html")
    pub = conn.execute("SELECT published_at FROM pages WHERE slug=?", (slug,)).fetchone()
    return bool(pub and pub[0] and last < pub[0])


def submit_indexnow(conn, urls: list[str], host: str, key: str, post=None, now: str | None = None) -> int:
    """Submit new or changed URLs; returns how many were accepted. Never raises."""
    post = post or _default_post
    todo = [u for u in dict.fromkeys(urls) if _needs_ping(conn, u)]
    accepted = 0
    for i in range(0, len(todo), BATCH):
        batch = todo[i:i + BATCH]
        try:
            code, text = post(INDEXNOW_URL, indexnow_payload(batch, host, key))
        except Exception as exc:
            code, text = 0, f"error: {exc}"
            log.warning("IndexNow request failed: %s", exc)
        conn.executemany("INSERT INTO pings(url,engine,status_code,response,pinged_at) VALUES(?,?,?,?,?)",
                         [(u, "indexnow", code, text, now or _now()) for u in batch])
        if code in OK:
            accepted += len(batch)
    conn.commit()
    return accepted


def _default_token() -> str | None:
    raw = os.environ.get("GSC_CREDENTIALS")
    if not raw:
        return None
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request
        creds = service_account.Credentials.from_service_account_info(
            json.loads(raw), scopes=["https://www.googleapis.com/auth/webmasters"])
        creds.refresh(Request())
        return creds.token
    except Exception as exc:
        log.warning("Could not get a Search Console token (is google-auth installed?): %s", exc)
        return None


def _default_request(method: str, url: str, headers: dict) -> int:
    req = urllib.request.Request(url, method=method, headers={**headers, "Content-Length": "0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status
    except urllib.error.HTTPError as exc:
        return exc.code


def submit_gsc_sitemap(conn, sitemap_url: str, site_url: str, token_provider=None, request=None,
                       now: str | None = None) -> bool:
    """Tell Search Console the sitemap changed (sitemaps.submit). Returns False if it could not."""
    token = (token_provider or _default_token)()
    if not token:
        reason = ("Search Console credentials are missing, so the sitemap was not submitted. "
                  "Add the GSC_CREDENTIALS secret to enable this step.")
        log.warning(reason)
        conn.execute("INSERT INTO pings(url,engine,status_code,response,pinged_at) VALUES(?,?,?,?,?)",
                     (sitemap_url, "gsc", 0, reason, now or _now()))
        conn.commit()
        return False
    api = ("https://www.googleapis.com/webmasters/v3/sites/" + urllib.parse.quote(site_url, safe="") +
           "/sitemaps/" + urllib.parse.quote(sitemap_url, safe=""))
    try:
        code = (request or _default_request)("PUT", api, {"Authorization": f"Bearer {token}"})
    except Exception as exc:
        log.warning("Search Console sitemap submit failed: %s", exc)
        code = 0
    conn.execute("INSERT INTO pings(url,engine,status_code,response,pinged_at) VALUES(?,?,?,?,?)",
                 (sitemap_url, "gsc", code, "", now or _now()))
    conn.commit()
    return 200 <= code < 300


def manual_queue(conn, limit: int = 10, site_url: str = "https://calculatepilot.com",
                 guide_dir: str = "guides") -> list[str]:
    """Highest-scoring published pages not confirmed as indexed: request these by hand in Search Console."""
    rows = conn.execute(
        "SELECT p.slug FROM pages p LEFT JOIN scores s ON s.cluster_id=p.cluster_id "
        "WHERE p.status='PUBLISHED' AND COALESCE(p.index_status,'')!='indexed' "
        "ORDER BY COALESCE(s.total,0) DESC, p.id LIMIT ?", (limit,)).fetchall()
    return [f"{site_url.rstrip('/')}/{guide_dir}/{r[0]}.html" for r in rows]
