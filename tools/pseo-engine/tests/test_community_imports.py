import pytest
from pathlib import Path

from pseo import db
from pseo.harvest import community, imports

FX = Path(__file__).parent / "fixtures"


def _fake_get(name):
    text = (FX / name).read_text()
    return lambda url, params, delay: text


def test_reddit_parses_fixture_titles():
    s = community.RedditSource(http_get=_fake_get("reddit.json"))
    assert s.fetch("mortgage") == [
        "How much mortgage can I afford on a $80k salary?",
        "Is it worth paying extra on my mortgage each month?"]


def test_hn_parses_fixture():
    s = community.HNSource(http_get=_fake_get("hn.json"))
    assert s.fetch("compound interest") == [
        "How do you calculate compound interest on a loan?",
        "Show HN: A tiny mortgage calculator"]


def test_stackexchange_parses_fixture():
    s = community.StackExchangeSource(http_get=_fake_get("stackexchange.json"))
    assert s.fetch("apr") == [
        "How is APR different from interest rate & why?",
        "Calculating monthly payment on a car loan"]


def test_community_drops_overlong_titles():
    s = community.RedditSource(http_get=_fake_get("reddit.json"))
    assert all(3 <= len(t.split()) <= 12 for t in s.fetch("mortgage"))


def test_source_handles_429():
    s = community.RedditSource(http_get=lambda u, p, d: None)
    assert s.fetch("mortgage") == []
    assert s.last_error == "http"


def _conn():
    return db.connect(":memory:")


def test_import_detects_gsc():
    c = _conn()
    n = imports.import_csv(c, FX / "gsc.csv")
    assert n == 2
    assert c.execute("SELECT COUNT(*) FROM gsc_metrics").fetchone()[0] == 2
    assert c.execute("SELECT source FROM keyword_sources").fetchone()[0] == "gsc"


def test_import_detects_ahrefs():
    c = _conn()
    assert imports.import_csv(c, FX / "ahrefs.csv") == 2
    row = c.execute("SELECT est_volume FROM keywords WHERE normalized=?",
                    ("mortgage payment calculator with pmi",)).fetchone()
    assert row[0] == 1200


def test_import_detects_semrush():
    c = _conn()
    assert imports.import_csv(c, FX / "semrush.csv") == 1
    assert c.execute("SELECT source FROM keyword_sources").fetchone()[0] == "semrush"


def test_import_unknown_columns_raises_plain_message(tmp_path):
    p = tmp_path / "x.csv"
    p.write_text("foo,bar\n1,2\n")
    with pytest.raises(ValueError, match="could not recognise"):
        imports.import_csv(_conn(), p)


def test_import_twice_is_idempotent():
    c = _conn()
    imports.import_csv(c, FX / "gsc.csv")
    imports.import_csv(c, FX / "gsc.csv")
    assert c.execute("SELECT COUNT(*) FROM keywords").fetchone()[0] == 2
    assert c.execute("SELECT COUNT(*) FROM gsc_metrics").fetchone()[0] == 2


def test_default_sources_respects_settings():
    from pseo import config
    from pseo.harvest import expand
    s = config.load_settings(None)
    s["sources"]["reddit"] = False
    names = [x.name for x in expand.default_sources(s)]
    assert "google" in names and "hn" in names and "reddit" not in names
