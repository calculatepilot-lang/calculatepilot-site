import json
from datetime import date

from pseo import config, db, formulas, publish, store
from pseo.config import Calculator
from pseo.formulas import InputSpec

TODAY = date(2026, 10, 11)
CALCS = [Calculator("mortgage-calculator", "Mortgage Calculator", "financial", "/mortgage-calculator.html",
                    formula_id="mortgage"),
         Calculator("loan-calculator", "Loan Calculator", "financial", "/loan-calculator.html"),
         Calculator("refinance-calculator", "Refinance Calculator", "financial", "/refinance-calculator.html"),
         Calculator("savings-calculator", "Savings Calculator", "financial", "/savings-calculator.html")]
TOPICS = ["extra payments", "first time home buyers", "veterans", "self employed borrowers",
          "second homes", "rental property"]


def seed(n=5, calc=CALCS[0], score=75.0, prefix="mortgage calculator for"):
    c = db.connect(":memory:")
    for x in CALCS:
        c.execute("INSERT OR IGNORE INTO calculators(slug,name,category,url,formula_id) VALUES(?,?,?,?,?)",
                  (x.slug, x.name, x.category, x.url, x.formula_id))
    ids = []
    for i in range(n):
        kw = f"{prefix} {TOPICS[i]}"
        kid = store.add_keyword(c, kw, "google", "s", "t")
        cur = c.execute("INSERT INTO clusters(canonical_keyword,intent,calculator_slug) VALUES(?,?,?)",
                        (kw, "calculate", calc.slug))
        c.execute("INSERT INTO cluster_members VALUES(?,?)", (cur.lastrowid, kid))
        c.execute("INSERT INTO scores(cluster_id,total,band) VALUES(?,?,?)", (cur.lastrowid, score - i, "pilot"))
        ids.append(cur.lastrowid)
    c.commit()
    return c, ids


S = {**config.DEFAULTS}


def test_generate_respects_pilot_cap():
    c, _ = seed(5)
    out = publish.generate(c, CALCS, {**S, "pilot_cap": 3}, TODAY)
    assert len(out) == 3 and c.execute("SELECT COUNT(*) FROM pages").fetchone()[0] == 3


def test_generate_skips_clusters_that_already_have_pages():
    c, _ = seed(5)
    first = publish.generate(c, CALCS, {**S, "pilot_cap": 3}, TODAY)
    second = publish.generate(c, CALCS, {**S, "pilot_cap": 3}, TODAY)
    assert len(second) == 2 and not set(first) & set(second)
    assert publish.generate(c, CALCS, S, TODAY) == []


def test_generate_orders_by_score_and_skips_rejected_bands_and_missing_formula():
    c, ids = seed(3)
    c.execute("UPDATE scores SET band='reject' WHERE cluster_id=?", (ids[0],))
    c.commit()
    out = publish.generate(c, CALCS, S, TODAY)
    assert len(out) == 2
    c2, _ = seed(2, calc=CALCS[1], prefix="loan calculator for")      # loan calc has no formula_id
    assert publish.generate(c2, CALCS, S, TODAY) == []
    held = c2.execute("SELECT status, html FROM pages").fetchall()
    assert [(r[0], r[1]) for r in held] == [("HOLD", "")] * 2
    assert "no formula" in c2.execute("SELECT detail FROM gate_results WHERE gate=2 LIMIT 1").fetchone()[0]


def test_formula_less_hold_rows_are_retried_when_a_formula_arrives():
    c, _ = seed(3, calc=CALCS[1], prefix="loan calculator for")
    assert publish.generate(c, CALCS, S, TODAY) == []
    with_formula = [CALCS[0], Calculator("loan-calculator", "Loan Calculator", "financial", "/loan-calculator.html",
                                         formula_id="loan")] + CALCS[2:]
    out = publish.generate(c, with_formula, S, TODAY)
    assert len(out) == 3 and c.execute("SELECT COUNT(*) FROM pages WHERE html=''").fetchone()[0] == 0


def test_publish_writes_only_pass_pages(tmp_path):
    c, _ = seed(3)
    publish.generate(c, CALCS, S, TODAY)
    states = [r["status"] for r in c.execute("SELECT status FROM pages")]
    assert set(states) <= {"PASS", "HOLD"}, states
    c.execute("UPDATE pages SET status='HOLD' WHERE id=(SELECT MIN(id) FROM pages)")
    c.commit()
    written = publish.publish(c, tmp_path, S, TODAY)
    passed = c.execute("SELECT COUNT(*) FROM pages WHERE status='PUBLISHED'").fetchone()[0]
    assert len(written) == passed and passed == states.count("PASS") - (1 if states[0] == "PASS" else 0)
    assert all(p.exists() for p in written)


def test_hold_pages_are_never_written(tmp_path):
    c, _ = seed(2)
    publish.generate(c, CALCS, S, TODAY)
    c.execute("UPDATE pages SET status='HOLD'")
    c.commit()
    assert publish.publish(c, tmp_path, S, TODAY) == []
    assert not list(tmp_path.rglob("*.html"))


def test_publish_routes_health_pages_to_needs_approval(tmp_path):
    formulas._REGISTRY["test_ymyl"] = formulas.Formula(
        id="test_ymyl", inputs={"x": InputSpec("Amount", 10, "")},
        run=lambda **kw: {"out": kw.get("x", 10) * 2}, table=lambda **kw: [{"year": 1, "out": 20}],
        steps=lambda **kw: ["Double the amount.", "Result is twenty."], headline="out",
        headline_label="Result", vary="x", ymyl=True)
    try:
        health = Calculator("bmi-calculator", "BMI Calculator", "financial", "/bmi.html", formula_id="test_ymyl")
        calcs = CALCS + [health]
        c, _ = seed(1, calc=health, prefix="bmi calculator for")
        c.execute("INSERT OR IGNORE INTO calculators(slug,name,category,url,formula_id) VALUES(?,?,?,?,?)",
                  (health.slug, health.name, health.category, health.url, health.formula_id))
        c.commit()
        ids = publish.generate(c, calcs, S, TODAY)
        assert c.execute("SELECT needs_manual_approval FROM pages WHERE id=?", (ids[0],)).fetchone()[0] == 1
        c.execute("UPDATE pages SET status='PASS' WHERE id=?", (ids[0],))
        c.commit()
        written = publish.publish(c, tmp_path, S, TODAY)
        assert [p.parent.name for p in written] == ["needs-approval"]
        assert store.pages_by_status(c, "PUBLISHED") == []
    finally:
        formulas._REGISTRY.pop("test_ymyl")


def test_publish_twice_is_idempotent(tmp_path):
    c, _ = seed(3)
    publish.generate(c, CALCS, S, TODAY)
    first = publish.publish(c, tmp_path, S, TODAY)
    snap = {p: p.read_text() for p in tmp_path.rglob("*") if p.is_file()}
    second = publish.publish(c, tmp_path, S, TODAY)
    assert first and second == []
    assert snap == {p: p.read_text() for p in tmp_path.rglob("*") if p.is_file()}
    assert c.execute("SELECT COUNT(*) FROM pages").fetchone()[0] == 3


def test_sitemap_lastmod_updated(tmp_path):
    c, _ = seed(2)
    publish.generate(c, CALCS, S, TODAY)
    written = publish.publish(c, tmp_path, S, TODAY)
    xml = (tmp_path / "sitemap-guides.xml").read_text()
    assert xml.count("<url>") == len(written)
    assert "<lastmod>2026-10-11</lastmod>" in xml
    assert f"https://calculatepilot.com/guides/{written[0].stem}.html" in xml
