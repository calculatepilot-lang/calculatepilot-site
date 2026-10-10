import dataclasses
import json
import re
from datetime import date

from pseo import config, db
from pseo.config import Calculator
from pseo.generate import builder
from pseo.qa import gates

TODAY = date(2026, 10, 11)
CALC = Calculator("mortgage-calculator", "Mortgage Calculator", "financial",
                  "/mortgage-calculator.html", formula_id="mortgage")
SIBS = [("Loan Calculator", "https://calculatepilot.com/loan-calculator.html"),
        ("Refinance Calculator", "https://calculatepilot.com/refinance-calculator.html")]
S = {**config.DEFAULTS, "today": TODAY}


def make(canonical="mortgage calculator with extra payments", facts=None, decision="PAGE",
         variants=(), keywords=None, sibs=SIBS):
    conn = db.connect(":memory:")
    conn.execute("INSERT INTO calculators(slug,name,category,url,formula_id) VALUES(?,?,?,?,?)",
                 (CALC.slug, CALC.name, CALC.category, CALC.url, CALC.formula_id))
    cur = conn.execute("INSERT INTO clusters(canonical_keyword,intent,calculator_slug,decision) "
                       "VALUES(?,?,?,?)", (canonical, "calculate", CALC.slug, decision))
    row = builder.ClusterRow(cur.lastrowid, canonical, "calculate", CALC.slug, list(variants),
                             keywords or [canonical], list(sibs))
    page = builder.build_page(row, CALC, facts or {}, None, TODAY)
    pid = conn.execute("INSERT INTO pages(cluster_id,slug,title,html) VALUES(?,?,?,?)",
                       (cur.lastrowid, page.slug, page.title, page.html)).lastrowid
    conn.commit()
    return conn, pid, page


def sibling(canonical="mortgage calculator for first time home buyers"):
    return builder.build_page(
        builder.ClusterRow(9, canonical, "calculate", CALC.slug, [], [canonical], list(SIBS)),
        CALC, {}, None, TODAY)


def result(res, n):
    return next(r for r in res if r.gate == n)


def run(conn, pid, page, sibs=()):
    return gates.run_all(conn, pid, page, list(sibs), S)


def tweak(page, old, new):
    assert old in page.html
    return dataclasses.replace(page, html=page.html.replace(old, new, 1))


def test_clean_page_passes_all_ten_gates():
    conn, pid, page = make(keywords=["mortgage calculator with extra payments",
                                     "how much extra payment saves interest?"])
    res = run(conn, pid, page, [sibling()])
    assert [r.gate for r in res] == list(range(1, 11))
    assert all(r.passed for r in res), [r for r in res if not r.passed]


def test_gate1_passes_for_page_decision():
    conn, pid, page = make()
    assert result(run(conn, pid, page), 1).passed


def test_gate1_fails_when_cluster_not_page():
    conn, pid, page = make(decision="MERGE")
    assert not result(run(conn, pid, page), 1).passed


def test_gate1_fails_when_sibling_shares_slug():
    conn, pid, page = make()
    twin = dataclasses.replace(page)
    assert not result(run(conn, pid, page, [twin]), 1).passed


def test_gate1_fails_when_title_matches_a_top_10_serp_title():
    conn, pid, page = make()
    conn.execute("INSERT INTO serp_checks(keyword,allintitle_count,top_titles_json,top_domains_json,"
                 "checked_at,provider) VALUES(?,?,?,?,?,?)",
                 ("mortgage calculator with extra payments", 10, json.dumps([page.title.upper()]),
                  "[]", "t", "x"))
    assert not result(run(conn, pid, page), 1).passed


def test_gate2_passes_when_numbers_trace():
    conn, pid, page = make()
    assert result(run(conn, pid, page), 2).passed


def test_gate2_untraceable_number_fails():
    conn, pid, page = make()
    bad = tweak(page, '<section id="quick-answer">', '<section id="quick-answer"><p>Costs 987,654 more.</p>')
    r = result(run(conn, pid, bad), 2)
    assert not r.passed and "987,654" in r.detail and r.detail.startswith("BLOCKING")


def test_gate3_needs_two_calculated_modules():
    conn, pid, page = make()
    assert result(run(conn, pid, page), 3).passed
    stripped = re.sub(r'<section id="(worked-example|scenario-table)">.*?</section>', "", page.html, flags=re.S)
    assert not result(run(conn, pid, dataclasses.replace(page, html=stripped)), 3).passed


def test_gate4_similarity_over_40_percent_fails():
    conn, pid, page = make()
    twin = dataclasses.replace(page, slug="other-slug")
    r = result(run(conn, pid, page, [twin]), 4)
    assert not r.passed and r.detail.startswith("BLOCKING")


def test_gate4_passes_for_distinct_sibling():
    conn, pid, page = make()
    r = result(run(conn, pid, page, [sibling()]), 4)
    assert r.passed, r.detail


def test_shingle_similarity_bounds():
    assert gates.shingle_similarity("a b c d e f g", "a b c d e f g") == 1.0
    assert gates.shingle_similarity("a b c d e f g", "h i j k l m n") == 0.0
    assert gates.shingle_similarity("", "") == 0.0


def test_gate5_banned_phrase_fails():
    conn, pid, page = make()
    bad = tweak(page, '<section id="assumptions">', '<section id="assumptions"><p>We tested this.</p>')
    r = result(run(conn, pid, bad), 5)
    assert not r.passed and r.detail.startswith("BLOCKING")
    assert result(run(conn, pid, page), 5).passed


def test_gate5_untraceable_percent_figure_fails():
    conn, pid, page = make()
    bad = tweak(page, '<section id="assumptions">', '<section id="assumptions"><p>Saves 12.5% for most.</p>')
    assert not result(run(conn, pid, bad), 5).passed


def test_gate6_missing_calculator_link_fails():
    conn, pid, page = make()
    bad = dataclasses.replace(page, html=page.html.replace("/mortgage-calculator.html", "/nowhere.html"))
    assert not result(run(conn, pid, bad), 6).passed


def test_gate6_too_few_sibling_links_fails():
    conn, pid, page = make(sibs=SIBS[:1])
    r = result(run(conn, pid, page), 6)
    assert not r.passed and "sibling" in r.detail


def test_gate7_missing_canonical_fails():
    conn, pid, page = make()
    bad = dataclasses.replace(page, html=re.sub(r'<link rel="canonical"[^>]*>', "", page.html))
    assert not result(run(conn, pid, bad), 7).passed


def test_gate7_noindex_fails():
    conn, pid, page = make()
    bad = tweak(page, 'content="index,follow"', 'content="noindex,follow"')
    assert not result(run(conn, pid, bad), 7).passed


def test_gate8_schema_field_not_in_html_fails():
    conn, pid, page = make(keywords=["mortgage calculator with extra payments",
                                     "how much extra payment saves interest?"])
    assert result(run(conn, pid, page), 8).passed
    bad = dataclasses.replace(page, html=re.sub(r"<h3>.*?</p>", "", page.html, count=1, flags=re.S))
    assert not result(run(conn, pid, bad), 8).passed


def test_gate8_rating_markup_fails():
    conn, pid, page = make()
    bad = tweak(page, '"@graph": [', '"@graph": [{"@type":"AggregateRating"},') if '"@graph": [' in page.html \
        else dataclasses.replace(page, html=page.html.replace('"@graph":[', '"@graph":[{"@type":"AggregateRating"},'))
    assert not result(run(conn, pid, bad), 8).passed


def test_gate9_missing_viewport_fails():
    conn, pid, page = make()
    bad = dataclasses.replace(page, html=re.sub(r'<meta name="viewport"[^>]*>', "", page.html))
    assert not result(run(conn, pid, bad), 9).passed


def test_gate9_unwrapped_table_fails():
    conn, pid, page = make()
    bad = dataclasses.replace(page, html=page.html.replace('<div class="table-wrap">', "<div>"))
    assert not result(run(conn, pid, bad), 9).passed


def test_gate9_unbalanced_html_fails():
    conn, pid, page = make()
    bad = tweak(page, "</main>", "")
    assert not result(run(conn, pid, bad), 9).passed


def test_gate10_old_fact_flagged():
    old = {"mortgage_limit": {"value": "see lender", "source_url": "https://e.gov/x", "verified_at": "2024-01-01"}}
    conn, pid, page = make(facts=old)
    r = result(run(conn, pid, page), 10)
    assert not r.passed and "mortgage_limit" in r.detail or "2024-01-01" in r.detail
    fresh = {"mortgage_limit": {"value": "see lender", "source_url": "https://e.gov/x", "verified_at": "2026-09-01"}}
    conn, pid, page = make(facts=fresh)
    assert result(run(conn, pid, page), 10).passed


def test_page_with_no_formula_is_hold_not_crash():
    conn, pid, _ = make()
    res = gates.run_all(conn, pid, None, [], S)
    assert len(res) == 10 and not any(r.passed for r in res if r.gate in (2, 3))
    assert gates.apply_status(conn, pid, res) == "HOLD"


def test_apply_status_pass_only_when_all_pass():
    conn, pid, page = make(keywords=["mortgage calculator with extra payments"])
    ok = gates.apply_status(conn, pid, run(conn, pid, page))
    assert ok == "PASS" or ok == "HOLD"
    res = run(conn, pid, page)
    forced = [gates.GateResult(r.gate, r.name, r.gate != 7, r.detail) for r in res]
    assert gates.apply_status(conn, pid, forced) == "HOLD"
    assert conn.execute("SELECT status FROM pages WHERE id=?", (pid,)).fetchone()[0] == "HOLD"
    assert conn.execute("SELECT COUNT(*) FROM gate_results WHERE page_id=?", (pid,)).fetchone()[0] == 10
    all_ok = [gates.GateResult(r.gate, r.name, True, "ok") for r in res]
    assert gates.apply_status(conn, pid, all_ok) == "PASS"
