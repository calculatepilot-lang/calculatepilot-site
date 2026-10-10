"""Command line: `pseo run` does everything; the other commands run one stage."""
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import yaml

from . import config as cfgmod
from . import dashboard as dash
from . import db, formulas, ping, publish, quarantine, store
from .analyze import cluster, intent, intitle, mapping, score
from .harvest import expand, imports
from .harvest.base import http_get as real_get


class ConfigError(Exception):
    pass


def _load(args):
    d = Path(args.config)
    cal_path = d / "calculators.yml"
    if not cal_path.exists():
        raise ConfigError(f"Cannot find {cal_path}. Point --config at the folder that holds "
                          "calculators.yml (or run `pseo sync-calculators` first).")
    try:
        settings = cfgmod.load_settings(d / "settings.yml")
        calculators = cfgmod.load_calculators(cal_path)
        facts = yaml.safe_load((d / "facts.yml").read_text(encoding="utf-8")) if (d / "facts.yml").exists() else {}
        quarantine.load_extra(d / "quarantine_terms.yml")
    except (yaml.YAMLError, KeyError, TypeError, AttributeError) as exc:
        raise ConfigError(f"A file in {d} is not valid ({exc.__class__.__name__}: {exc}). "
                          "Check calculators.yml and settings.yml for typos.") from exc
    if not calculators:
        raise ConfigError(f"{cal_path} has no calculators in it.")
    slugs = [c.slug for c in calculators]
    if len(slugs) != len(set(slugs)):
        raise ConfigError("calculators.yml lists the same slug twice. Remove the duplicate.")
    return settings, calculators, facts or {}


class Ctx:
    def __init__(self, args, http_get, post, now):
        self.args, self.http_get, self.post = args, http_get, post
        self.now = now or datetime.now(timezone.utc)
        self.today = self.now.date()
        self.settings, self.calculators, self.facts = _load(args)
        self.conn = db.connect(args.db)
        self.out = Path(args.out)
        self.template = None
        if args.template:
            p = Path(args.template)
            if p.exists():
                self.template = p.read_text(encoding="utf-8")
            else:
                print(f"Note: template {p} not found; using the built-in page layout.")
        self.summary: dict = {}


def _count(conn, sql, *a):
    return conn.execute(sql, a).fetchone()[0]


# ------------------------------------------------------------------------------ stages --------
def stage_harvest(x: Ctx):
    before = _count(x.conn, "SELECT COUNT(*) FROM keywords")
    if x.args.offline:
        print("Offline mode: no network calls were made; using keywords already in the database.")
    else:
        sources = expand.default_sources(x.settings, http_get=x.http_get)
        res = expand.harvest(x.conn, sources, x.calculators, x.settings, now=x.now.isoformat(timespec="seconds"))
        for name, n in res.items():
            err = next((s.last_error for s in sources if s.name == name and s.last_error), None)
            print(f"  {name}: {n} new" + (f" (last problem: {err})" if err else ""))
    x.summary["new_keywords"] = _count(x.conn, "SELECT COUNT(*) FROM keywords") - before


def stage_analyze(x: Ctx):
    intent.run(x.conn)
    cluster.build(x.conn, x.settings["cluster_threshold"], x.settings["numeric_variant_cap"])
    m = mapping.run(x.conn, x.calculators, x.settings["numeric_variant_cap"])
    score.run(x.conn)
    key = os.environ.get("SERPAPI_KEY")
    prov = intitle.SerpApiProvider(key, http_get=x.http_get) if key and not x.args.offline else None
    x.summary["intitle"] = intitle.run(x.conn, prov, x.settings, now=x.now.isoformat(timespec="seconds"))
    x.summary["rejected"] = m["rejected"]
    x.summary["merged"] = m["merged"]


def stage_generate(x: Ctx):
    ids = publish.generate(x.conn, x.calculators, x.settings, x.today, x.template, x.facts)
    x.summary["generated"] = len(ids)


def stage_publish(x: Ctx):
    key = os.environ.get("INDEXNOW_KEY")
    written = publish.publish(x.conn, x.out, x.settings, x.today)
    if key:
        ping.write_key_file(key, x.out)
    x.summary["written"] = len(written)


def stage_ping(x: Ctx):
    host = urlparse(x.settings["site_url"]).netloc
    key = os.environ.get("INDEXNOW_KEY")
    gdir = x.settings.get("guide_dir", "guides")
    urls = [f"{x.settings['site_url'].rstrip('/')}/{gdir}/{r[0]}.html"
            for r in x.conn.execute("SELECT slug FROM pages WHERE status='PUBLISHED' ORDER BY id")]
    x.summary["pinged"] = 0
    if x.args.offline:
        print("Offline mode: pings skipped.")
        return
    if not key:
        print("IndexNow skipped: set the INDEXNOW_KEY secret to enable it.")
    elif urls:
        x.summary["pinged"] = ping.submit_indexnow(x.conn, urls, host, key, post=x.post,
                                                  now=x.now.isoformat(timespec="seconds"))
    if os.environ.get("GSC_CREDENTIALS") and urls:
        sm = f"{x.settings['site_url'].rstrip('/')}/sitemap-guides.xml"
        if ping.submit_gsc_sitemap(x.conn, sm, x.settings["site_url"].rstrip("/") + "/",
                                   now=x.now.isoformat(timespec="seconds")):
            print("Search Console: sitemap submitted.")
    elif urls:
        print("Search Console sitemap submit skipped: no GSC_CREDENTIALS secret.")


def stage_dashboard(x: Ctx):
    path = dash.render(x.conn, x.calculators, Path(x.args.reports) / "dashboard.html", x.now)
    x.summary["dashboard"] = str(path)


def print_qa(x: Ctx):
    rows = x.conn.execute("SELECT id, slug, status FROM pages ORDER BY id").fetchall()
    for r in rows:
        bad = x.conn.execute("SELECT name, detail FROM gate_results WHERE page_id=? AND passed=0", (r["id"],)).fetchall()
        print(f"{r['status']:>14}  {r['slug']}" + ("".join(f"\n{'':>18}- {b['name']}: {b['detail']}" for b in bad)))
    if not rows:
        print("No pages yet. Run `pseo generate` first.")


def print_summary(x: Ctx):
    c, s = x.conn, x.summary
    q = _count(c, "SELECT COUNT(*) FROM keywords WHERE quarantine_reason IS NOT NULL")
    status = {r[0]: r[1] for r in c.execute("SELECT status, COUNT(*) FROM pages GROUP BY status")}
    held = c.execute("SELECT p.slug, g.detail FROM pages p JOIN gate_results g ON g.page_id=p.id "
                     "WHERE p.status='HOLD' AND g.passed=0 GROUP BY p.id ORDER BY p.id").fetchall()
    print("\n=== Summary ===")
    print(f"New keywords: {s.get('new_keywords', 0)}")
    print(f"Suspicious keywords set aside: {q}")
    print(f"Clusters rejected (no matching calculator): {_count(c, 'SELECT COUNT(*) FROM clusters WHERE decision=?', 'REJECT')}")
    print(f"Pages generated this run: {s.get('generated', 0)}")
    print(f"Pages published: {status.get('PUBLISHED', 0)}")
    print(f"Pages waiting for your approval (health): {status.get('NEEDS_APPROVAL', 0)}")
    print(f"Pages on hold: {status.get('HOLD', 0)}")
    for slug, why in held[:5]:
        print(f"   - {slug}: {why}")
    print(f"URLs pinged this run: {s.get('pinged', 0)}")
    nc = intitle_note = s.get("intitle")
    if nc and nc.get("not_checked"):
        print(f"Intitle competition not checked for {nc['not_checked']} clusters (no SERPAPI_KEY or budget used).")
    if "dashboard" in s:
        print(f"Dashboard: {s['dashboard']}")


def cmd_sync(x: Ctx):
    a = x.args
    if a.file:
        html = Path(a.file).read_text(encoding="utf-8")
    else:
        url = a.sitemap_url or x.settings["site_url"].rstrip("/") + "/sitemap.html"
        html = x.http_get(url, None, 0)
        if html is None:
            raise ConfigError(f"Could not download {url}. Save the page as sitemap.html and run "
                              "`pseo sync-calculators --file sitemap.html`.")
    found = cfgmod.calculators_from_sitemap_html(html, x.settings["site_url"])
    if not found:
        raise ConfigError("No calculator links were found in that sitemap page.")
    old = {c.slug: c for c in x.calculators}
    rows = []
    for c in found:
        o = old.get(c.slug)
        rows.append({"slug": c.slug, "name": o.name if o else c.name, "category": o.category if o else c.category,
                     "url": c.url if not o else o.url, "aliases": (o.aliases if o else []),
                     "formula_id": (o.formula_id if o and o.formula_id else formulas.guess_formula_id(c.slug))})
    path = Path(a.config) / "calculators.yml"
    header = "# Built by `pseo sync-calculators`. formula_id empty = no formula yet (pages are HELD).\n"
    path.write_text(header + "".join(
        "- " + yaml.safe_dump(r, default_flow_style=True, width=10000, sort_keys=False).strip() + "\n" for r in rows),
        encoding="utf-8")
    new = [r["slug"] for r in rows if r["slug"] not in old]
    print(f"Wrote {len(rows)} calculators to {path} ({len(new)} new). Formula coverage: "
          f"{sum(1 for r in rows if formulas.get(r['formula_id']))}/{len(rows)}.")


def build_parser():
    p = argparse.ArgumentParser(prog="pseo", description="CalculatePilot programmatic SEO engine")
    p.add_argument("--config", default="config", help="folder with calculators.yml and settings.yml")
    p.add_argument("--db", default="data/pseo.db")
    p.add_argument("--out", default="out", help="where finished guide pages are written")
    p.add_argument("--reports", default="reports", help="where the dashboard is written")
    p.add_argument("--template", default=None, help="an existing guide .html to copy the site layout from")
    p.add_argument("--offline", action="store_true", help="make no network calls")
    sub = p.add_subparsers(dest="command", required=True)
    for name in ("harvest", "analyze", "generate", "qa", "publish", "ping", "dashboard", "run"):
        sub.add_parser(name)
    imp = sub.add_parser("import")
    imp.add_argument("csv", nargs="+")
    sc = sub.add_parser("sync-calculators")
    sc.add_argument("--file", default=None)
    sc.add_argument("--sitemap-url", default=None)
    return p


def main(argv=None, *, http_get=None, post=None, now=None) -> int:
    args = build_parser().parse_args(argv)
    try:
        x = Ctx(args, http_get or real_get, post, now)
        cmd = args.command
        if cmd == "sync-calculators":
            cmd_sync(x)
        elif cmd == "import":
            for path in args.csv:
                n = imports.import_csv(x.conn, path)
                print(f"Imported {n} rows from {path}.")
        elif cmd == "qa":
            print_qa(x)
        elif cmd == "run":
            for fn in (stage_harvest, stage_analyze, stage_generate, stage_publish, stage_ping, stage_dashboard):
                fn(x)
            print_summary(x)
        else:
            {"harvest": [stage_harvest], "analyze": [stage_analyze], "generate": [stage_analyze, stage_generate],
             "publish": [stage_publish], "ping": [stage_ping], "dashboard": [stage_dashboard]}
            for fn in {"harvest": [stage_harvest], "analyze": [stage_analyze], "generate": [stage_generate],
                       "publish": [stage_publish], "ping": [stage_ping], "dashboard": [stage_dashboard]}[cmd]:
                fn(x)
            print_summary(x)
        return 0
    except ConfigError as exc:
        print(f"Problem: {exc}", file=sys.stderr)
        return 1
    except ValueError as exc:      # e.g. an unreadable CSV
        print(f"Problem: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
