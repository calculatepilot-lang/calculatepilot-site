import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import pytest

from pseo import cli

NOW = datetime(2026, 10, 11, 12, 0, tzinfo=timezone.utc)
SUGGESTIONS = [
    "mortgage calculator with extra payments for first time buyers",
    "mortgage calculator for veterans",
    "mortgage calculator for self employed borrowers",
    "loan calculator for small business owners",
    "loan calculator with balloon payment at end",
    "how much is a mortgage payment on a 300k house?",
    "bond price calculator with semi annual coupons for beginners",
    "best pizza dough recipe for beginners",
    "free casino bonus mortgage calculator",
]
CALCS = """
- {slug: mortgage-calculator, name: "Mortgage Calculator", category: financial, url: /mortgage-calculator.html, aliases: ["mortgage payment"], formula_id: mortgage}
- {slug: loan-calculator, name: "Loan Calculator", category: financial, url: /loan-calculator.html, aliases: ["personal loan"], formula_id: loan}
- {slug: bond-price-calculator, name: "Bond Price Calculator", category: financial, url: /bond-price-calculator.html, aliases: ["bond"], formula_id: null}
"""
SETTINGS = """
request_delay: 0
harvest_budget: 500
sources: {google: true, bing: false, youtube: false, ddg: false, reddit: false, hn: false, stackexchange: false}
"""


def fake_get(url, params, delay):
    return json.dumps([params.get("q", "x"), SUGGESTIONS])


def posted(url, payload):
    posted.calls.append(payload)
    return 200, "ok"


posted.calls = []


@pytest.fixture
def env(tmp_path, monkeypatch):
    cfg = tmp_path / "config"
    cfg.mkdir()
    (cfg / "calculators.yml").write_text(CALCS)
    (cfg / "settings.yml").write_text(SETTINGS)
    (cfg / "facts.yml").write_text("{}\n")
    monkeypatch.setenv("INDEXNOW_KEY", "testkey123")
    monkeypatch.delenv("GSC_CREDENTIALS", raising=False)
    monkeypatch.delenv("SERPAPI_KEY", raising=False)
    posted.calls = []
    return tmp_path


def args(tmp, *more):
    return ["--config", str(tmp / "config"), "--db", str(tmp / "data" / "pseo.db"),
            "--out", str(tmp / "out"), "--reports", str(tmp / "reports"), *more]


def go(tmp, *more, cmd="run"):
    return cli.main(args(tmp, *more) + [cmd], http_get=fake_get, post=posted, now=NOW)


def counts(tmp):
    c = sqlite3.connect(tmp / "data" / "pseo.db")
    tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
    return {t: c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in tables}


def test_e2e_offline_run(env, capsys):
    assert go(env) == 0
    out = capsys.readouterr().out
    c = sqlite3.connect(env / "data" / "pseo.db")
    c.row_factory = sqlite3.Row
    published = c.execute("SELECT COUNT(*) FROM pages WHERE status='PUBLISHED'").fetchone()[0]
    assert published >= 1 and list((env / "out" / "guides").glob("*.html"))
    held = c.execute("SELECT * FROM pages WHERE status='HOLD'").fetchall()
    assert any("bond" in r["slug"] for r in held)
    why = c.execute("SELECT detail FROM gate_results WHERE page_id=? AND passed=0", (held[0]["id"],)).fetchone()
    assert why and "formula" in why[0]
    rej = c.execute("SELECT reason FROM clusters WHERE decision='REJECT'").fetchall()
    assert any(r[0] == "no matching calculator" for r in rej)
    q = c.execute("SELECT quarantine_reason FROM keywords WHERE quarantine_reason IS NOT NULL").fetchall()
    assert any(r[0] == "gambling" for r in q)
    assert c.execute("SELECT COUNT(*) FROM pings WHERE engine='indexnow'").fetchone()[0] >= 1
    assert (env / "reports" / "dashboard.html").exists() and (env / "out" / "testkey123.txt").exists()
    assert (env / "out" / "sitemap-guides.xml").exists()
    n_kw = c.execute("SELECT COUNT(*) FROM keywords").fetchone()[0]
    for expect in (f"New keywords: {n_kw}", f"Pages published: {published}", "Pages on hold:",
                   "Suspicious keywords set aside: 1", "Dashboard:"):
        assert expect in out, (expect, out)


def test_second_run_changes_nothing(env):
    go(env)
    first = counts(env)
    posted.calls = []
    go(env)
    assert counts(env) == first
    assert posted.calls == []


def test_bad_config_exits_1_with_message(tmp_path, capsys):
    rc = cli.main(["--config", str(tmp_path / "nope"), "--db", str(tmp_path / "d.db"), "run"])
    err = capsys.readouterr().err
    assert rc == 1 and "calculators.yml" in err


def test_broken_yaml_exits_1(tmp_path, capsys):
    (tmp_path / "calculators.yml").write_text("- {slug: a, name: [unclosed")
    rc = cli.main(["--config", str(tmp_path), "--db", str(tmp_path / "d.db"), "run"])
    assert rc == 1 and "calculators.yml" in capsys.readouterr().err


def test_source_failures_do_not_fail_the_run(env):
    rc = cli.main(args(env) + ["run"], http_get=lambda u, p, d: None, post=posted, now=NOW)
    assert rc == 0


def test_offline_flag_makes_no_network_calls(env, capsys):
    def boom(*a):
        raise AssertionError("network used")
    rc = cli.main(args(env, "--offline") + ["run"], http_get=boom, post=boom, now=NOW)
    assert rc == 0 and "Offline" in capsys.readouterr().out


def test_import_command_loads_csv(env):
    csv = env / "ahrefs.csv"
    csv.write_text("Keyword,Volume\nmortgage calculator for nurses buying first home,500\n")
    assert cli.main(args(env) + ["import", str(csv)], now=NOW) == 0
    c = sqlite3.connect(env / "data" / "pseo.db")
    assert c.execute("SELECT est_volume FROM keywords").fetchone()[0] == 500


def test_import_bad_csv_exits_1(env, capsys):
    csv = env / "x.csv"
    csv.write_text("foo,bar\n1,2\n")
    assert cli.main(args(env) + ["import", str(csv)], now=NOW) == 1
    assert "could not recognise" in capsys.readouterr().err


def test_sync_calculators_from_local_sitemap(env):
    html = ('<h2>Financial</h2><a href="/mortgage-calculator.html">Mortgage Calculator</a>'
            '<a href="/new-thing-calculator.html">New Thing Calculator</a><a href="/about.html">About</a>')
    f = env / "sitemap.html"
    f.write_text(html)
    assert cli.main(args(env) + ["sync-calculators", "--file", str(f)], now=NOW) == 0
    text = (env / "config" / "calculators.yml").read_text()
    assert "new-thing-calculator" in text and "about" not in text
    assert "formula_id: mortgage" in text            # kept from the old file


def test_sync_applies_slug_guess_for_known_new_calculator(env):
    f = env / "sitemap.html"
    f.write_text('<h2>Health</h2><a href="/bmi-calculator.html">BMI Calculator</a>')
    assert cli.main(args(env) + ["sync-calculators", "--file", str(f)], now=NOW) == 0
    assert "formula_id: bmi" in (env / "config" / "calculators.yml").read_text()
