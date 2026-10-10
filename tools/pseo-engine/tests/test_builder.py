import json
import re
from datetime import date

import pytest

from pseo import db, formulas, store
from pseo.config import Calculator
from pseo.formulas import InputSpec
from pseo.generate import builder, htmltext, schema

TODAY = date(2026, 10, 11)
CALC = Calculator("mortgage-calculator", "Mortgage Calculator", "financial",
                  "/mortgage-calculator.html", formula_id="mortgage")
SIBS = [("Loan Calculator", "https://calculatepilot.com/loan-calculator.html"),
        ("Refinance Calculator", "https://calculatepilot.com/refinance-calculator.html")]
NUM = htmltext.NUM
CHECKED = ("quick-answer", "worked-example", "scenario-table", "faq")


def cluster(canonical="mortgage calculator with extra payments", variants=(), keywords=None,
            slug="mortgage-calculator", sibs=SIBS):
    return builder.ClusterRow(
        id=1, canonical_keyword=canonical, intent="calculate", calculator_slug=slug,
        numeric_variants=list(variants), keywords=keywords or [canonical], siblings=list(sibs))


def build(c=None, calc=CALC, facts=None, shell=None):
    return builder.build_page(c or cluster(), calc, facts or {}, shell, TODAY)


FAQ_KW = ["mortgage calculator with extra payments", "how much is a mortgage on 300k?",
          "mortgage rates today"]


def test_page_has_all_required_sections():
    page = build(cluster(keywords=FAQ_KW))
    assert page.sections == ["quick-answer", "worked-example", "scenario-table", "assumptions",
                             "faq", "related", "how-made"]
    for sid in page.sections:
        assert f'id="{sid}"' in page.html


def test_every_number_has_formula_or_fact_origin():
    page = build(cluster(keywords=FAQ_KW, variants=["$250k mortgage payment"]))
    known = {dp.value for dp in page.data_points}
    for sid in CHECKED:
        for tok in NUM.findall(htmltext.section_text(page.html, sid)):
            assert tok in known, (sid, tok)
    assert all(dp.origin.split(":")[0] in ("formula", "fact", "keyword") for dp in page.data_points)


def test_scenario_table_uses_numeric_variants():
    page = build(cluster(variants=["$250k mortgage payment", "$400k mortgage payment"]))
    text = htmltext.section_text(page.html, "scenario-table")
    assert "$250,000" in text and "$400,000" in text
    assert 3 <= text.count("$") and len(re.findall(r"<tr>", page.html.split('id="scenario-table"')[1].split("</section>")[0])) >= 4


def test_scenario_table_has_at_least_three_rows_without_variants():
    page = build()
    block = page.html.split('id="scenario-table"')[1].split("</section>")[0]
    assert 3 <= block.count("<tr>") - 1 <= 5


def test_faq_only_from_harvested_questions():
    page = build(cluster(keywords=FAQ_KW))
    faq = htmltext.section_text(page.html, "faq")
    assert "How much is a mortgage on 300k?" in faq
    assert "rates today" not in faq
    assert "FAQPage" in schema.jsonld(page, "https://x.test/a.html")


def test_no_questions_means_no_faq_section_and_no_faqpage():
    page = build(cluster(keywords=["mortgage calculator with extra payments"]))
    assert "faq" not in page.sections and 'id="faq"' not in page.html
    assert "FAQPage" not in schema.jsonld(page, "https://x.test/a.html")


def test_howmade_note_present_with_method_version_and_date():
    page = build()
    note = htmltext.section_text(page.html, "how-made")
    assert "mortgage" in note and "1.0" in note and "2026-10-11" in note
    assert "Suhaib Hassan" in htmltext.visible_text(page.html)


def test_jsonld_has_no_aggregate_rating():
    page = build(cluster(keywords=FAQ_KW))
    raw = schema.jsonld(page, "https://x.test/a.html")
    data = json.loads(raw)
    assert "AggregateRating" not in raw and "ratingValue" not in raw and "review" not in raw.lower()
    types = {d["@type"] for d in data["@graph"]}
    assert types == {"Article", "FAQPage", "BreadcrumbList"}


def test_jsonld_fields_appear_in_visible_html():
    page = build(cluster(keywords=FAQ_KW))
    vis = htmltext.visible_text(page.html)
    data = json.loads(schema.jsonld(page, "https://x.test/a.html"))
    art = next(d for d in data["@graph"] if d["@type"] == "Article")
    for field in (art["headline"], art["description"], art["author"]["name"], art["datePublished"]):
        assert field in vis
    faq = next(d for d in data["@graph"] if d["@type"] == "FAQPage")
    for q in faq["mainEntity"]:
        assert q["name"] in vis and q["acceptedAnswer"]["text"] in vis
    crumbs = next(d for d in data["@graph"] if d["@type"] == "BreadcrumbList")
    for item in crumbs["itemListElement"]:
        assert item["name"] in vis


def test_keyword_with_html_is_escaped():
    evil = "<script>alert(1)</script> mortgage"
    page = build(cluster(canonical=evil, keywords=[evil, "what is <b>x</b> mortgage?"]))
    raw = schema.jsonld(page, "https://x.test/a.html")
    assert "<script>alert(1)</script>" not in page.html
    assert "<script>alert(1)" not in raw and "<" not in raw
    assert page.html.count("<script") == 1                      # only our JSON-LD block
    assert "<b>x</b>" not in page.html


def test_health_page_flags_manual_approval_and_note():
    formulas._REGISTRY["test_ymyl"] = formulas.Formula(
        id="test_ymyl", inputs={"x": InputSpec("Amount", 10, "")},
        run=lambda **kw: {"out": kw.get("x", 10) * 2}, table=lambda **kw: [{"year": 1, "out": 20}],
        steps=lambda **kw: ["Double the amount."], headline="out", headline_label="Result",
        vary="x", ymyl=True)
    try:
        calc = Calculator("t", "Test Calc", "health", "/t.html", formula_id="test_ymyl")
        page = build(cluster(canonical="test calc for adults", slug="t"), calc)
        assert page.needs_manual_approval is True
        assert "not medical advice" in htmltext.visible_text(page.html)
    finally:
        formulas._REGISTRY.pop("test_ymyl")


def test_financial_page_does_not_need_manual_approval():
    assert build().needs_manual_approval is False


def test_missing_formula_returns_none():
    calc = Calculator("x", "X", "financial", "/x.html", formula_id=None)
    assert build(calc=calc) is None
    assert build(calc=Calculator("x", "X", "financial", "/x.html", formula_id="nope")) is None


def test_slug_from_canonical_keyword():
    assert builder.slugify("Mortgage Calculator with Extra Payments!") == "mortgage-calculator-with-extra-payments"
    assert builder.slugify("$250k home loan") == "250k-home-loan"
    with pytest.raises(ValueError):
        builder.slugify("!!!")


def test_related_links_include_calculator_and_siblings():
    page = build()
    block = page.html.split('id="related"')[1].split("</section>")[0]
    assert 'href="/mortgage-calculator.html"' in block or "calculatepilot.com/mortgage-calculator.html" in block
    assert block.count("<a ") == 3


def test_sibling_pages_differ_in_worked_example():
    a = build(cluster("mortgage calculator with extra payments"))
    b = build(cluster("mortgage calculator for first time home buyers"))
    assert htmltext.section_text(a.html, "worked-example") != htmltext.section_text(b.html, "worked-example")


def test_unusable_keyword_amount_falls_back_to_defaults():
    calc = Calculator("auto-loan-calculator", "Auto Loan Calculator", "financial",
                      "/auto-loan-calculator.html", formula_id="auto_loan")
    page = build(cluster("$4k auto loan calculator", slug="auto-loan-calculator"), calc)
    assert page is not None


def test_facts_with_source_and_date_are_shown_with_fact_origin():
    facts = {"mortgage_example_limit": {"value": "see lender", "source_url": "https://example.gov/x",
                                        "verified_at": "2026-09-01"},
             "k401_other": {"value": "x", "source_url": "https://e.gov", "verified_at": "2026-09-01"},
             "mortgage_bad": {"value": "y"}}
    page = build(facts=facts)
    assert "facts" in page.sections
    txt = htmltext.section_text(page.html, "facts")
    assert "see lender" in txt and "2026-09-01" in txt
    assert "https://example.gov/x" in page.html
    assert "k401" not in page.html and "mortgage bad" not in page.html.lower()
    assert any(dp.origin == "fact:mortgage_example_limit" and dp.value == "2026" for dp in page.data_points)


GUIDE = """<!doctype html><html><head><title>Old</title><meta name="description" content="old">
<link rel="canonical" href="https://calculatepilot.com/old.html"><link rel="stylesheet" href="/site.css">
<style>body{color:#0F6B5C}</style><script type="application/ld+json">{"x":1}</script></head>
<body><header><a href="/">SITE-HEADER</a></header><main>old</main><footer>SITE-FOOTER</footer></body></html>"""


def test_load_site_shell_extracts_parts():
    shell = builder.load_site_shell(GUIDE)
    assert "SITE-HEADER" in shell and "SITE-FOOTER" in shell and "/site.css" in shell
    assert "color:#0F6B5C" in shell
    assert "Old" not in shell and "canonical" not in shell and "ld+json" not in shell


def test_page_uses_site_shell_and_keeps_own_canonical():
    page = build(shell=GUIDE)
    assert "SITE-HEADER" in page.html and "SITE-FOOTER" in page.html and "/site.css" in page.html
    assert page.html.count('rel="canonical"') == 1 and "old.html" not in page.html
    assert page.html.count("<title>") == 1


def test_default_shell_is_valid_mobile_page():
    h = build().html
    assert h.startswith("<!DOCTYPE html>") and 'name="viewport"' in h and 'rel="canonical"' in h
    assert 'name="robots" content="index,follow"' in h and "table-wrap" in h


def test_load_cluster_reads_members_questions_and_siblings():
    c = db.connect(":memory:")
    for t in ["mortgage calculator with extra payments", "how much extra payment saves interest?"]:
        store.add_keyword(c, t, "google", "s", "t")
    cur = c.execute("INSERT INTO clusters(canonical_keyword,intent,calculator_slug,numeric_variants) "
                    "VALUES(?,?,?,?)", ("mortgage calculator with extra payments", "calculate",
                                        "mortgage-calculator", json.dumps(["$250k mortgage"])))
    for r in c.execute("SELECT id FROM keywords"):
        c.execute("INSERT INTO cluster_members VALUES(?,?)", (cur.lastrowid, r[0]))
    c.commit()
    calcs = [CALC, Calculator("loan-calculator", "Loan Calculator", "financial", "/loan-calculator.html"),
             Calculator("refinance-calculator", "Refinance Calculator", "financial", "/refinance-calculator.html"),
             Calculator("bmi-calculator", "BMI Calculator", "health", "/bmi.html")]
    row = builder.load_cluster(c, cur.lastrowid, calcs, "https://calculatepilot.com")
    assert row.numeric_variants == ["$250k mortgage"] and len(row.keywords) == 2
    assert [s[0] for s in row.siblings] == ["Loan Calculator", "Refinance Calculator"]
    assert row.siblings[0][1] == "https://calculatepilot.com/loan-calculator.html"
