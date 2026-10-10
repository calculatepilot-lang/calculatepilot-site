import json

from pseo import db, store
from pseo.analyze import cluster, intent


def _kw(c, *texts):
    for t in texts:
        store.add_keyword(c, t, "google", "s", "t")
    intent.run(c)


def _clusters(c):
    return c.execute("SELECT * FROM clusters ORDER BY id").fetchall()


def test_jaccard_basic():
    assert cluster.jaccard({"a", "b"}, {"b", "c"}) == 1 / 3
    assert cluster.jaccard(set(), set()) == 0.0


def test_strip_numbers():
    assert cluster.strip_numbers("$250k mortgage payment 30 year") == "# mortgage payment # year"


def test_same_intent_variants_merge():
    c = db.connect(":memory:")
    _kw(c, "best home mortgage calculator", "mortgage calculator for home")
    assert cluster.build(c) == 1
    row = _clusters(c)[0]
    assert row["canonical_keyword"] == "best home mortgage calculator"
    assert c.execute("SELECT COUNT(*) FROM cluster_members").fetchone()[0] == 2


def test_different_intent_stays_separate():
    c = db.connect(":memory:")
    _kw(c, "mortgage calculator home loan", "mortgage vs home loan calculator")
    assert cluster.build(c) == 2


def test_numeric_only_variants_become_one_cluster_with_variants():
    c = db.connect(":memory:")
    _kw(c, "$250k mortgage payment calculator", "$300k mortgage payment calculator")
    assert cluster.build(c) == 1
    row = _clusters(c)[0]
    assert sorted(json.loads(row["numeric_variants"])) == [
        "$250k mortgage payment calculator", "$300k mortgage payment calculator"]


def test_numeric_variants_stored_are_capped():
    c = db.connect(":memory:")
    _kw(c, *[f"${n}k mortgage payment calculator" for n in range(100, 800, 100)])
    cluster.build(c, numeric_cap=5)
    assert len(json.loads(_clusters(c)[0]["numeric_variants"])) == 5


def test_numeric_cap_forces_merge():
    c = db.connect(":memory:")
    for i in range(7):
        c.execute("INSERT INTO clusters(canonical_keyword,intent,calculator_slug,numeric_variants) "
                  "VALUES(?,?,?,?)", (f"loan {i}", "calculate", "loan-calculator",
                                      json.dumps([f"${i}k loan", f"${i}0k loan"])))
    c.commit()
    assert cluster.cap_numeric(c, cap=5) == 2
    merged = c.execute("SELECT COUNT(*) FROM clusters WHERE decision='MERGE'").fetchone()[0]
    assert merged == 2


def test_rebuild_is_idempotent():
    c = db.connect(":memory:")
    _kw(c, "best home mortgage calculator", "mortgage calculator for home", "what is apr")
    cluster.build(c)
    first = [(r["canonical_keyword"], r["intent"]) for r in _clusters(c)]
    cluster.build(c)
    assert [(r["canonical_keyword"], r["intent"]) for r in _clusters(c)] == first
    assert c.execute("SELECT COUNT(*) FROM cluster_members").fetchone()[0] == 3
