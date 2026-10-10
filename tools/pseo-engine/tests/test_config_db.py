import sqlite3
from pathlib import Path

from pseo import config, db

TABLES = {"calculators", "keywords", "keyword_sources", "intent", "clusters",
          "scores", "pages", "gate_results", "pings", "gsc_metrics", "serp_checks"}


def _tables(conn):
    rows = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    return {r[0] for r in rows}


def test_schema_creates_all_tables(tmp_path):
    conn = db.connect(tmp_path / "x.db")
    assert TABLES <= _tables(conn)


def test_connect_is_idempotent(tmp_path):
    p = tmp_path / "x.db"
    db.connect(p).close()
    conn = db.connect(p)
    assert TABLES <= _tables(conn)


def test_foreign_keys_enabled(tmp_path):
    conn = db.connect(tmp_path / "x.db")
    assert conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1


def test_load_calculators_reads_aliases(tmp_path):
    f = tmp_path / "calculators.yml"
    f.write_text(
        "- slug: mortgage-calculator\n  name: Mortgage Calculator\n  category: financial\n"
        "  url: /mortgage-calculator.html\n  aliases: [home loan, mortgage payment]\n  formula_id: mortgage\n"
        "- slug: bmi-calculator\n  name: BMI Calculator\n  category: health\n"
        "  url: /bmi-calculator.html\n"
    )
    calcs = config.load_calculators(f)
    assert [c.slug for c in calcs] == ["mortgage-calculator", "bmi-calculator"]
    assert calcs[0].aliases == ["home loan", "mortgage payment"]
    assert calcs[0].formula_id == "mortgage"
    assert calcs[1].aliases == [] and calcs[1].formula_id is None


def test_load_settings_merges_defaults(tmp_path):
    f = tmp_path / "settings.yml"
    f.write_text("pilot_cap: 5\n")
    s = config.load_settings(f)
    assert s["pilot_cap"] == 5
    assert s["numeric_variant_cap"] == 5
    assert s["similarity_max"] == 0.40
    assert s["intitle_budget"] == 100


def test_sitemap_html_parser_extracts_slug_name_and_category():
    html = (
        "<h2>Financial</h2>"
        '<a href="/mortgage-calculator.html">Mortgage Calculator</a>'
        '<a href="/loan-calculator">Loan Calculator</a>'
        "<h2>Health</h2>"
        '<a href="/bmi-calculator.html">BMI Calculator</a>'
        '<a href="/about.html">About</a>'
    )
    calcs = config.calculators_from_sitemap_html(html, "https://calculatepilot.com")
    assert [c.slug for c in calcs] == ["mortgage-calculator", "loan-calculator", "bmi-calculator"]
    assert calcs[0].name == "Mortgage Calculator"
    assert calcs[0].category == "financial"
    assert calcs[2].category == "health"
    assert calcs[0].url == "https://calculatepilot.com/mortgage-calculator.html"
