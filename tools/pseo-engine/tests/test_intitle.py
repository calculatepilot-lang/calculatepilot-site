from pathlib import Path

from pseo import config, db, store
from pseo.analyze import intitle, score

FX = Path(__file__).parent / "fixtures"


class FakeProvider(intitle.Provider):
    def __init__(self, count=100, fail=False):
        self.count, self.fail, self.calls = count, fail, []

    def allintitle(self, keyword):
        self.calls.append(keyword)
        if self.fail:
            return None
        return intitle.SerpResult(self.count, ["Some Title"], ["example.com"])


def _clusters(c, n):
    ids = []
    for i in range(n):
        kw = f"mortgage calculator with extra payments scenario {i}"
        kid = store.add_keyword(c, kw, "google", "s", "t")
        cur = c.execute("INSERT INTO clusters(canonical_keyword,intent,calculator_slug) "
                        "VALUES(?,?,?)", (kw, "calculate", "mortgage-calculator"))
        c.execute("INSERT INTO cluster_members VALUES(?,?)", (cur.lastrowid, kid))
        ids.append(cur.lastrowid)
    c.commit()
    for i in ids:
        score.score_cluster(c, i)
    return ids


def _settings(**kw):
    s = config.load_settings(None)
    s.update(kw)
    return s


def test_band_thresholds():
    assert [intitle.band(x) for x in (499, 500, 5000, 5001)] == ["easy", "medium", "medium", "hard"]


def test_serpapi_parses_fixture_count_and_titles():
    text = (FX / "serpapi_allintitle.json").read_text()
    seen = {}

    def fake(url, params, delay):
        seen.update(params)
        return text

    res = intitle.SerpApiProvider("KEY", http_get=fake).allintitle('mortgage "x"')
    assert res.count == 432
    assert res.titles[0].startswith("Mortgage Calculator")
    assert res.domains == ["example.com", "sub.another.org"]
    assert seen["q"] == 'allintitle:"mortgage \\"x\\""' or seen["q"].startswith('allintitle:"')


def test_provider_none_on_http_error():
    assert intitle.SerpApiProvider("K", http_get=lambda u, p, d: None).allintitle("x") is None
    assert intitle.SerpApiProvider("K", http_get=lambda u, p, d: "not json").allintitle("x") is None


def test_run_respects_budget():
    c = db.connect(":memory:")
    _clusters(c, 5)
    p = FakeProvider()
    out = intitle.run(c, p, _settings(intitle_budget=2))
    assert len(p.calls) == 2 and out["checked"] == 2


def test_run_uses_cache_inside_30_days():
    c = db.connect(":memory:")
    _clusters(c, 1)
    p = FakeProvider()
    intitle.run(c, p, _settings(), now="2026-10-11T00:00:00+00:00")
    out = intitle.run(c, p, _settings(), now="2026-10-30T00:00:00+00:00")
    assert len(p.calls) == 1 and out["cached"] == 1


def test_run_rechecks_after_cache_expiry():
    c = db.connect(":memory:")
    _clusters(c, 1)
    p = FakeProvider()
    intitle.run(c, p, _settings(), now="2026-10-11T00:00:00+00:00")
    intitle.run(c, p, _settings(), now="2026-12-01T00:00:00+00:00")
    assert len(p.calls) == 2


def test_run_without_key_skips_and_reports_not_checked():
    c = db.connect(":memory:")
    _clusters(c, 2)
    out = intitle.run(c, None, _settings())
    assert out["checked"] == 0 and out["not_checked"] == 2
    assert c.execute("SELECT COUNT(*) FROM serp_checks").fetchone()[0] == 0


def test_provider_failure_does_not_stop_run():
    c = db.connect(":memory:")
    _clusters(c, 3)
    p = FakeProvider(fail=True)
    out = intitle.run(c, p, _settings())
    assert out["failed"] == 3 and len(p.calls) == 3


def test_provider_exception_does_not_stop_run():
    class Boom(FakeProvider):
        def allintitle(self, keyword):
            raise RuntimeError("boom")
    c = db.connect(":memory:")
    _clusters(c, 2)
    assert intitle.run(c, Boom(), _settings())["failed"] == 2


def test_adjustment_values():
    assert [score.intitle_adjustment(b) for b in ("easy", "medium", "hard")] == [15, 7, -10]


def test_no_check_means_zero_adjustment():
    assert score.intitle_adjustment(None) == 0


def test_run_applies_adjustment_to_score():
    c = db.connect(":memory:")
    (cid,) = _clusters(c, 1)
    before = c.execute("SELECT total FROM scores WHERE cluster_id=?", (cid,)).fetchone()[0]
    intitle.run(c, FakeProvider(count=50), _settings())
    row = c.execute("SELECT total, intitle_adj FROM scores WHERE cluster_id=?", (cid,)).fetchone()
    assert row["intitle_adj"] == 15 and row["total"] == min(100, before + 15)
