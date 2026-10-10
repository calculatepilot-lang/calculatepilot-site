from pseo import db, store
from pseo.analyze import cluster, intent, mapping, score
from pseo.config import Calculator

CALCS = [
    Calculator("mortgage-calculator", "Mortgage Calculator", "loans", "/mortgage-calculator.html"),
    Calculator("mortgage-payoff-calculator", "Mortgage Payoff Calculator", "loans",
               "/mortgage-payoff-calculator.html", aliases=["pay off mortgage early"]),
    Calculator("car-loan-calculator", "Car Loan Calculator", "loans", "/car-loan-calculator.html",
               aliases=["auto loan"]),
]


def _cluster(c, canonical, sources=("google",), label="calculate", slug="mortgage-calculator"):
    kid = None
    for s in sources:
        kid = store.add_keyword(c, canonical, s, "seed", "t")
    cur = c.execute("INSERT INTO clusters(canonical_keyword,intent,calculator_slug) VALUES(?,?,?)",
                    (canonical, label, slug))
    c.execute("INSERT INTO cluster_members VALUES(?,?)", (cur.lastrowid, kid))
    c.commit()
    return cur.lastrowid


def test_maps_specific_calculator():
    got = mapping.map_cluster("mortgage payoff calculator with extra payments", CALCS)
    assert got.slug == "mortgage-payoff-calculator"
    assert mapping.map_cluster("auto loan calculator no down payment", CALCS).slug == "car-loan-calculator"
    assert mapping.map_cluster("mortgage calculator with taxes", CALCS).slug == "mortgage-calculator"


def test_unmapped_is_rejected_with_reason():
    c = db.connect(":memory:")
    store.add_keyword(c, "best pizza dough recipe for beginners", "google", "s", "t")
    intent.run(c)
    cluster.build(c)
    out = mapping.run(c, CALCS)
    assert out["rejected"] == 1
    row = c.execute("SELECT decision, reason FROM clusters").fetchone()
    assert (row["decision"], row["reason"]) == ("REJECT", "no matching calculator")


def test_run_sets_slug_for_mapped():
    c = db.connect(":memory:")
    store.add_keyword(c, "mortgage calculator with extra payments", "google", "s", "t")
    intent.run(c)
    cluster.build(c)
    assert mapping.run(c, CALCS)["mapped"] == 1
    assert c.execute("SELECT calculator_slug FROM clusters").fetchone()[0] == "mortgage-calculator"


def test_long_tail_scores_above_head_term():
    c = db.connect(":memory:")
    lt = _cluster(c, "mortgage calculator with extra payments for first time buyers")
    head = _cluster(c, "mortgage calculator")
    assert score.score_cluster(c, lt) > score.score_cluster(c, head)


def test_head_term_penalized():
    c = db.connect(":memory:")
    head = _cluster(c, "mortgage rate")
    score.score_cluster(c, head)
    assert c.execute("SELECT longtail FROM scores").fetchone()[0] < 0


def test_band_thresholds():
    assert [score.band(x) for x in (80, 79.9, 70, 60, 59.9)] == [
        "strong", "pilot", "pilot", "needs-moat", "reject"]


def test_existing_guide_lowers_coverage_gap():
    c = db.connect(":memory:")
    a = _cluster(c, "mortgage calculator with extra payments for first time buyers")
    before = score.score_cluster(c, a)
    c.execute("INSERT INTO pages(cluster_id, slug) VALUES(?,?)", (a, "x"))
    assert score.score_cluster(c, a) < before


def test_intitle_adjustment_is_included_and_survives_rescore():
    c = db.connect(":memory:")
    a = _cluster(c, "mortgage calculator with extra payments for first time buyers")
    base = score.score_cluster(c, a)
    c.execute("UPDATE scores SET intitle_adj=15 WHERE cluster_id=?", (a,))
    assert score.score_cluster(c, a) == min(100, base + 15)


def test_more_sources_raise_demand():
    c = db.connect(":memory:")
    one = _cluster(c, "mortgage calculator with extra payments for seniors")
    many = _cluster(c, "mortgage calculator with extra payments for veterans",
                    sources=("google", "bing", "reddit"))
    assert score.score_cluster(c, many) > score.score_cluster(c, one)


def test_run_scores_only_page_clusters_and_sets_band():
    c = db.connect(":memory:")
    a = _cluster(c, "mortgage calculator with extra payments for first time buyers")
    b = _cluster(c, "mortgage calculator extra")
    c.execute("UPDATE clusters SET decision='REJECT' WHERE id=?", (b,))
    assert score.run(c) == 1
    assert c.execute("SELECT band FROM scores WHERE cluster_id=?", (a,)).fetchone()[0] in (
        "strong", "pilot", "needs-moat", "reject")
