from pseo import db, store
from pseo.analyze import intent


def test_calculate():
    assert intent.classify("mortgage calculator with extra payments")[0] == "calculate"
    assert intent.classify("how much house can i afford on 80k")[0] == "calculate"


def test_compare():
    assert intent.classify("fixed vs variable mortgage")[0] == "compare"
    assert intent.classify("difference between apr and apy")[0] == "compare"


def test_learn():
    assert intent.classify("what is apr")[0] == "learn"
    assert intent.classify("compound interest formula explained")[0] == "learn"


def test_convert():
    assert intent.classify("inches to cm")[0] == "convert"
    assert intent.classify("convert kg")[0] == "convert"


def test_navigational():
    assert intent.classify("calculatepilot mortgage calculator")[0] == "navigational"


def test_other_default():
    assert intent.classify("blue shoes")[0] == "other"


def test_rule_name_is_returned():
    label, conf, rule = intent.classify("what is apr")
    assert rule == "learn:what_is" and 0 < conf <= 1


def test_run_skips_already_classified():
    c = db.connect(":memory:")
    a = store.add_keyword(c, "mortgage calculator", "google", "s", "t")
    store.add_keyword(c, "what is apr", "google", "s", "t")
    c.execute("INSERT INTO intent(keyword_id,label,confidence,rule) VALUES(?,?,?,?)",
              (a, "other", 0.1, "manual"))
    assert intent.run(c) == 1
    assert c.execute("SELECT label FROM intent WHERE keyword_id=?", (a,)).fetchone()[0] == "other"


def test_run_skips_quarantined():
    c = db.connect(":memory:")
    store.add_keyword(c, "free casino calculator", "google", "s", "t")
    assert intent.run(c) == 0
