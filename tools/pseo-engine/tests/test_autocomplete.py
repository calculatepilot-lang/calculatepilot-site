from pathlib import Path

from pseo import config, db
from pseo.config import Calculator
from pseo.harvest import autocomplete, expand
from pseo.harvest.base import Source

FX = Path(__file__).parent / "fixtures"


def _fake_get(name):
    text = (FX / name).read_text()
    return lambda url, params, delay: text


def test_google_parses_fixture():
    s = autocomplete.GoogleAC(http_get=_fake_get("google_ac.json"))
    assert s.fetch("mortgage calculator") == [
        "mortgage calculator", "mortgage calculator with taxes and insurance",
        "mortgage calculator extra payments"]


def test_bing_parses_fixture():
    s = autocomplete.BingAC(http_get=_fake_get("bing_ac.json"))
    assert s.fetch("mortgage calculator") == [
        "mortgage calculator with pmi", "mortgage calculator for first time buyers"]


def test_youtube_parses_fixture():
    s = autocomplete.YouTubeAC(http_get=_fake_get("youtube_ac.txt"))
    assert s.fetch("mortgage calculator") == [
        "mortgage calculator excel", "how to use a mortgage calculator"]


def test_ddg_parses_fixture():
    s = autocomplete.DDGAC(http_get=_fake_get("ddg_ac.json"))
    assert s.fetch("mortgage calculator") == [
        "mortgage calculator", "mortgage calculator with extra payments"]


def test_source_returns_empty_on_http_none():
    for cls in (autocomplete.GoogleAC, autocomplete.BingAC, autocomplete.YouTubeAC,
                autocomplete.DDGAC):
        assert cls(http_get=lambda u, p, d: None).fetch("x") == []


def test_source_returns_empty_on_html_error_page():
    html = "<html><body>429 Too Many Requests</body></html>"
    for cls in (autocomplete.GoogleAC, autocomplete.BingAC, autocomplete.YouTubeAC,
                autocomplete.DDGAC):
        assert cls(http_get=lambda u, p, d: html).fetch("x") == []


def test_expand_seed_includes_modifiers_and_prefixes():
    qs = expand.expand_seed("mortgage calculator")
    assert qs[0] == "mortgage calculator"
    assert "mortgage calculator for seniors" in qs
    assert "mortgage calculator with extra payments" in qs
    assert "how mortgage calculator" in qs
    assert "mortgage calculator a" not in qs          # letters are opt-in
    assert "mortgage calculator a" in expand.expand_seed("mortgage calculator", letters=True)


class Fake(Source):
    def __init__(self, name, mapping=None, raises=False):
        self.name, self.mapping, self.raises, self.calls = name, mapping or {}, raises, []

    def fetch(self, query):
        self.calls.append(query)
        if self.raises:
            raise RuntimeError("blocked")
        return self.mapping.get(query, [])


CALC = [Calculator("mortgage-calculator", "Mortgage Calculator", "financial", "/m", ["home loan"], "mortgage")]


def _settings(**kw):
    s = config.load_settings(None)
    s.update({"request_delay": 0, "harvest_budget": 50, "letters": False})
    s.update(kw)
    return s


def test_harvest_stores_keywords_per_source(tmp_path):
    conn = db.connect(tmp_path / "h.db")
    g = Fake("google", {"mortgage calculator": ["mortgage calculator for seniors", "home loan x"]})
    out = expand.harvest(conn, [g], CALC, _settings(), now="2026-10-11")
    assert out == {"google": 2}
    assert conn.execute("SELECT COUNT(*) FROM keywords").fetchone()[0] == 2


def test_harvest_continues_when_one_source_raises(tmp_path):
    conn = db.connect(tmp_path / "h.db")
    bad = Fake("bing", raises=True)
    good = Fake("google", {"mortgage calculator": ["mortgage calculator for seniors"]})
    out = expand.harvest(conn, [bad, good], CALC, _settings(), now="2026-10-11")
    assert out == {"bing": 0, "google": 1}


def test_failing_source_is_switched_off_after_five_errors(tmp_path):
    conn = db.connect(tmp_path / "h.db")
    bad = Fake("bing", raises=True)
    expand.harvest(conn, [bad], CALC, _settings(), now="2026-10-11")
    assert len(bad.calls) == 5


def test_harvest_respects_request_budget(tmp_path):
    conn = db.connect(tmp_path / "h.db")
    g = Fake("google")
    expand.harvest(conn, [g], CALC, _settings(harvest_budget=4), now="2026-10-11")
    assert len(g.calls) == 4


def test_harvest_rerun_adds_no_duplicates_and_no_requests(tmp_path):
    conn = db.connect(tmp_path / "h.db")
    g = Fake("google", {"mortgage calculator": ["mortgage calculator for seniors"]})
    expand.harvest(conn, [g], CALC, _settings(), now="2026-10-11")
    n_calls = len(g.calls)
    out = expand.harvest(conn, [g], CALC, _settings(), now="2026-10-12")
    assert out == {"google": 0}
    assert len(g.calls) == n_calls
    assert conn.execute("SELECT COUNT(*) FROM keywords").fetchone()[0] == 1


def test_harvest_skips_empty_suggestions(tmp_path):
    conn = db.connect(tmp_path / "h.db")
    g = Fake("google", {"mortgage calculator": ["  ", "!!!", "valid mortgage keyword"]})
    out = expand.harvest(conn, [g], CALC, _settings(), now="2026-10-11")
    assert out == {"google": 1}


def test_source_flags_last_error_on_http_failure_and_clears_on_success():
    s = autocomplete.GoogleAC(http_get=lambda u, p, d: None)
    assert s.fetch("x") == [] and s.last_error == "http"
    s = autocomplete.GoogleAC(http_get=lambda u, p, d: "<html>blocked</html>")
    assert s.fetch("x") == [] and s.last_error == "parse"
    s = autocomplete.GoogleAC(http_get=_fake_get("google_ac.json"))
    assert s.fetch("x") and s.last_error is None


def test_http_failure_is_not_marked_done_and_counts_toward_breaker(tmp_path):
    conn = db.connect(tmp_path / "h.db")
    s = autocomplete.GoogleAC(http_get=lambda u, p, d: None)
    expand.harvest(conn, [s], CALC, _settings(), now="2026-10-11")
    assert conn.execute("SELECT COUNT(*) FROM queries_done").fetchone()[0] == 0
