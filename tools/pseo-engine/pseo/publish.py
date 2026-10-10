"""Generate draft pages for the best clusters, gate them, and write passing ones to disk."""
from __future__ import annotations

import re
from datetime import date
from pathlib import Path
from types import SimpleNamespace
from xml.sax.saxutils import escape

from . import formulas, store
from .generate import builder
from .qa import gates

APPROVAL_DIR = "needs-approval"


def _as_page(row) -> SimpleNamespace:
    m = re.search(r"<h1>(.*?)</h1>", row["html"] or "", re.S)
    return SimpleNamespace(slug=row["slug"], h1=m.group(1) if m else row["title"], html=row["html"] or "")


def _hold_placeholder(conn, cluster_id: int, cfg: dict) -> None:
    canon = conn.execute("SELECT canonical_keyword FROM clusters WHERE id=?", (cluster_id,)).fetchone()[0]
    try:
        slug = builder.slugify(canon)
    except ValueError:
        return
    if conn.execute("SELECT 1 FROM pages WHERE slug=?", (slug,)).fetchone():
        return
    pid = conn.execute("INSERT INTO pages(cluster_id,slug,title,status,html,created_at) VALUES(?,?,?,?,?,?)",
                       (cluster_id, slug, builder.kw_title(canon), "HOLD", "",
                        cfg["today"].isoformat())).lastrowid
    gates.apply_status(conn, pid, gates.run_all(conn, pid, None, [], cfg))


def generate(conn, calculators, settings, today: date, template_html: str | None = None,
             facts: dict | None = None) -> list[int]:
    """Build, store (DRAFT) and gate up to pilot_cap new pages; returns the new page ids."""
    by_slug = {c.slug: c for c in calculators}
    site = settings.get("site_url", "https://calculatepilot.com")
    gdir = settings.get("guide_dir", builder.GUIDE_DIR)
    cfg = {**settings, "today": today}
    # placeholder HOLD rows (calculator had no formula) are rebuilt every run so a new formula is picked up
    conn.execute("DELETE FROM gate_results WHERE page_id IN (SELECT id FROM pages WHERE html='' AND status='HOLD')")
    conn.execute("DELETE FROM pages WHERE html='' AND status='HOLD'")
    conn.commit()
    rows = conn.execute(
        "SELECT c.id FROM clusters c JOIN scores s ON s.cluster_id=c.id "
        "WHERE c.decision='PAGE' AND c.calculator_slug IS NOT NULL AND s.band!='reject' "
        "AND NOT EXISTS (SELECT 1 FROM pages p WHERE p.cluster_id=c.id) "
        "ORDER BY s.total DESC, c.id").fetchall()
    made: list[int] = []
    cap = int(settings.get("pilot_cap", 25))
    for r in rows:
        if len(made) >= cap:
            break
        calc = by_slug.get(conn.execute("SELECT calculator_slug FROM clusters WHERE id=?",
                                        (r["id"],)).fetchone()[0])
        if calc is None or formulas.get(calc.formula_id) is None:
            _hold_placeholder(conn, r["id"], cfg)
            continue
        cluster = builder.load_cluster(conn, r["id"], calculators, site, gdir)
        page = builder.build_page(cluster, calc, facts or {}, template_html, today, site, gdir)
        if page is None or conn.execute("SELECT 1 FROM pages WHERE slug=?", (page.slug,)).fetchone():
            continue
        pid = store.save_page(conn, r["id"], page)
        sibs = [_as_page(x) for x in conn.execute(
            "SELECT p.* FROM pages p JOIN clusters c ON c.id=p.cluster_id WHERE c.calculator_slug=? "
            "AND p.id!=? AND p.status IN ('DRAFT','PASS','PUBLISHED')", (calc.slug, pid))]
        gates.apply_status(conn, pid, gates.run_all(conn, pid, page, sibs, cfg))
        made.append(pid)
    return made


def _write_if_changed(path: Path, text: str) -> bool:
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return True


def publish(conn, out_dir: Path, settings, today: date) -> list[Path]:
    """Write PASS pages. Health pages go to needs-approval/ and are never marked PUBLISHED."""
    out_dir = Path(out_dir)
    gdir = settings.get("guide_dir", builder.GUIDE_DIR)
    site = settings.get("site_url", "https://calculatepilot.com").rstrip("/")
    written: list[Path] = []
    for p in store.pages_by_status(conn, "PASS"):
        if p["needs_manual_approval"]:
            path = out_dir / APPROVAL_DIR / f"{p['slug']}.html"
            _write_if_changed(path, p["html"])
            store.set_status(conn, p["id"], "NEEDS_APPROVAL")
        else:
            path = out_dir / gdir / f"{p['slug']}.html"
            _write_if_changed(path, p["html"])
            store.set_status(conn, p["id"], "PUBLISHED", today.isoformat())
        written.append(path)
    entries = "".join(
        f"  <url>\n    <loc>{escape(site + '/' + gdir + '/' + r['slug'] + '.html')}</loc>\n"
        f"    <lastmod>{r['published_at']}</lastmod>\n  </url>\n"
        for r in conn.execute("SELECT slug, published_at FROM pages WHERE status='PUBLISHED' ORDER BY slug"))
    if entries:
        xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries + "</urlset>\n")
        _write_if_changed(out_dir / "sitemap-guides.xml", xml)
    return written
