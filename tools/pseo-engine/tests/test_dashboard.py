import json
import re
from datetime import datetime, timezone

from pseo import db, dashboard, store
from pseo.config import Calculator

NOW = datetime(2026, 10, 11, 12, 0, tzinfo=timezone.utc)
CALCS = [Calculator("mortgage-calculator", "Mortgage Calculator", "financial", "/m.html", formula_id="mortgage"),
         Calculator("bond-price-calculator", "Bond Price Calculator", "financial", "/b.html")]


def data_of(html):
    block = re.search(r'<script id="pseo-data" type="application/json">(.*?)</script>', html, re.S).group(1)
    return json.loads(block)


def render(conn, tmp_path):
    out = dashboard.render(conn, CALCS, tmp_path / "reports" / "dashboard.html", NOW)
    return out.read_text(encoding="utf-8")


def test_dashboard_renders_with_empty_database(tmp_path):
    html = render(db.connect(":memory:"), tmp_path)
    assert html.startswith("<!DOCTYPE html>") and data_of(html)["overview"]["pages"] == {}


def test_dashboard_is_single_file_without_external_urls(tmp_path):
    html = render(db.connect(":memory:"), tmp_path)
    assert not re.search(r'(?:src|href)="https?:', html) and "@import" not in html
    assert 'src="' not in html


def test_dashboard_contains_all_five_tabs(tmp_path):
    html = render(db.connect(":memory:"), tmp_path)
    for tab in ("Overview", "Content", "Keywords", "Indexing", "Performance"):
        assert f'data-tab="{tab.lower()}"' in html and f">{tab}<" in html
    assert "Formula Coverage" in html and "cannot be forced" in html


def test_dashboard_lists_held_pages_with_reason(tmp_path):
    c = db.connect(":memory:")
    cid = c.execute("INSERT INTO clusters(canonical_keyword,calculator_slug) VALUES('k','mortgage-calculator')").lastrowid
    pid = c.execute("INSERT INTO pages(cluster_id,slug,title,status) VALUES(?,?,?,?)",
                    (cid, "k", "K title", "HOLD")).lastrowid
    c.execute("INSERT INTO gate_results VALUES(?,?,?,?,?,?)", (pid, 4, "Duplication", 0, "BLOCKING: 55% similar to other", "t"))
    c.commit()
    d = data_of(render(c, tmp_path))
    row = d["pages"][0]
    assert row["status"] == "HOLD" and "55% similar" in row["why_held"]


def test_dashboard_shows_calculator_without_formula_in_coverage(tmp_path):
    d = data_of(render(db.connect(":memory:"), tmp_path))
    cov = {r["slug"]: r for r in d["coverage"]}
    assert cov["mortgage-calculator"]["has_formula"] is True
    assert cov["bond-price-calculator"]["has_formula"] is False
    assert "HOLD" in cov["bond-price-calculator"]["note"]


def test_dashboard_escapes_hostile_keyword(tmp_path):
    c = db.connect(":memory:")
    evil = "</script><img src=x onerror=alert(1)>"
    c.execute("INSERT INTO keywords(text,normalized,quarantine_reason) VALUES(?,?,?)", (evil, "evil", "markup"))
    c.commit()
    html = render(c, tmp_path)
    assert "<img src=x" not in html and html.count("</script>") == 2
    d = data_of(html)
    assert d["keywords"][0]["text"] == evil and d["keywords"][0]["status"] == "markup"
    assert "innerHTML" not in html


def test_keywords_include_sources_intent_and_intitle(tmp_path):
    c = db.connect(":memory:")
    kid = store.add_keyword(c, "mortgage calculator with extra payments", "google", "s", "t")
    store.add_keyword(c, "mortgage calculator with extra payments", "bing", "s", "t")
    c.execute("INSERT INTO intent VALUES(?,?,?,?)", (kid, "calculate", 0.9, "calculate:word"))
    cur = c.execute("INSERT INTO clusters(canonical_keyword,intent,calculator_slug) VALUES(?,?,?)",
                    ("mortgage calculator with extra payments", "calculate", "mortgage-calculator"))
    c.execute("INSERT INTO cluster_members VALUES(?,?)", (cur.lastrowid, kid))
    c.execute("INSERT INTO scores(cluster_id,total,band) VALUES(?,?,?)", (cur.lastrowid, 74, "pilot"))
    c.execute("INSERT INTO serp_checks VALUES(?,?,?,?,?,?)",
              ("mortgage calculator with extra payments", 120, "[]", "[]", "t", "SerpApiProvider"))
    c.commit()
    k = data_of(render(c, tmp_path))["keywords"][0]
    assert k["sources"] == ["bing", "google"] and k["intent"] == "calculate" and k["score"] == 74
    assert k["allintitle"] == 120 and k["calculator"] == "mortgage-calculator"
    other = db.connect(":memory:")
    store.add_keyword(other, "x y z w", "google", "s", "t")
    assert data_of(render(other, tmp_path))["keywords"][0]["allintitle"] is None


def test_indexing_and_performance_data(tmp_path):
    c = db.connect(":memory:")
    c.execute("INSERT INTO pings(url,engine,status_code,response,pinged_at) VALUES('u','indexnow',202,'ok','t')")
    c.execute("INSERT INTO gsc_metrics VALUES(?,?,?,?,?,?,?)", ("https://x/p", "d", "q", 3, 100, 0.03, 8.5))
    c.commit()
    d = data_of(render(c, tmp_path))
    assert d["pings"][0]["engine"] == "indexnow" and d["overview"]["ping_health"]["indexnow"]["ok"] == 1
    assert d["performance"][0]["clicks"] == 3
