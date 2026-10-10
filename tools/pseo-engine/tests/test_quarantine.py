import pytest

from pseo import db, quarantine, store


@pytest.mark.parametrize("text,rule", [
    ("free porn mortgage calculator", "adult"),
    ("windows 11 keygen crack download", "piracy"),
    ("get rich quick calculator", "scam"),
    ("visit http://evil.example/loan calculator", "url_or_email"),
    ("loan calculator www.evil.example", "url_or_email"),
    ("contact me@evil.example loan", "url_or_email"),
    ("<script>alert(1)</script> mortgage", "markup"),
    ("mortgageeeeeeee calculator", "char_spam"),
    ("a b c d e f g h i j k l m mortgage", "too_long"),
    ("casino bonus roi calculator", "gambling"),
    ("ransomware payment calculator", "malware"),
    ("miracle cure guaranteed returns calculator", "miracle_claim"),
    ("nerdwallet mortgage calculator", "brand_hijack"),
])
def test_rule_names(text, rule):
    assert quarantine.reason(text) == rule


def test_clean_keyword_passes():
    assert quarantine.reason("mortgage payment for first time buyer") is None


def test_big_number_is_not_char_spam():
    assert quarantine.reason("what is 1000000 at 5% interest for 10 years") is None


def test_lottery_payout_calculator_is_allowed():
    assert quarantine.reason("lottery payout lump sum vs annuity") is None


def test_extra_terms_file_extends_rules(tmp_path):
    f = tmp_path / "q.yml"
    f.write_text("scam: [moneyfast]\n")
    quarantine.load_extra(f)
    try:
        assert quarantine.reason("moneyfast loan") == "scam"
    finally:
        quarantine.load_extra(None)


def test_quarantined_still_stored_with_reason(tmp_path):
    conn = db.connect(tmp_path / "q.db")
    kid = store.add_keyword(conn, "<script>x</script> mortgage", "reddit", "m", "2026-10-11")
    row = conn.execute("SELECT quarantine_reason FROM keywords WHERE id=?", (kid,)).fetchone()
    assert row["quarantine_reason"] == "markup"


def test_quarantined_excluded_from_active_keywords(tmp_path):
    conn = db.connect(tmp_path / "q.db")
    store.add_keyword(conn, "mortgage payment for first time buyer", "google", "m", "2026-10-11")
    store.add_keyword(conn, "get rich quick calculator", "google", "m", "2026-10-11")
    active = [r["normalized"] for r in store.active_keywords(conn)]
    assert active == ["mortgage payment for first time buyer"]
