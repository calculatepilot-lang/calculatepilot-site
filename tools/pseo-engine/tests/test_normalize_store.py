import pytest

from pseo import db, normalize, store


def test_normalize_collapses_case_and_space():
    assert normalize.normalize("  Mortgage   CALCULATOR!! ") == "mortgage calculator"


def test_normalize_keeps_dollar_percent_and_decimals():
    assert normalize.normalize("$250,000 at 6.5% rate.") == "$250000 at 6.5% rate"


def test_tokens_remove_stop_words():
    assert normalize.tokens("how to calculate the mortgage") == ["calculate", "mortgage"]


def test_is_long_tail_true_for_situation():
    assert normalize.is_long_tail("mortgage payment for first time buyer")


def test_is_long_tail_true_for_four_tokens():
    assert normalize.is_long_tail("extra mortgage payment savings estimate")


def test_is_long_tail_false_for_head_term():
    assert not normalize.is_long_tail("mortgage calculator")


def test_add_keyword_dedupes_and_counts_sources(tmp_path):
    conn = db.connect(tmp_path / "k.db")
    a = store.add_keyword(conn, "Mortgage Calculator", "google", "mortgage", "2026-10-11")
    b = store.add_keyword(conn, "mortgage calculator!", "bing", "mortgage", "2026-10-11")
    assert a == b
    row = conn.execute("SELECT source_count FROM keywords WHERE id=?", (a,)).fetchone()
    assert row["source_count"] == 2
    assert conn.execute("SELECT COUNT(*) FROM keywords").fetchone()[0] == 1


def test_add_keyword_twice_same_source_is_idempotent_for_count(tmp_path):
    conn = db.connect(tmp_path / "k.db")
    store.add_keyword(conn, "loan payment", "google", "loan", "2026-10-11")
    store.add_keyword(conn, "loan payment", "google", "loan", "2026-10-12")
    assert conn.execute("SELECT source_count FROM keywords").fetchone()[0] == 1
    assert conn.execute("SELECT COUNT(*) FROM keyword_sources").fetchone()[0] == 1
    assert conn.execute("SELECT last_seen FROM keywords").fetchone()[0] == "2026-10-12"


def test_add_keyword_rejects_empty(tmp_path):
    conn = db.connect(tmp_path / "k.db")
    with pytest.raises(ValueError):
        store.add_keyword(conn, " !!! ", "google", "x", "2026-10-11")
