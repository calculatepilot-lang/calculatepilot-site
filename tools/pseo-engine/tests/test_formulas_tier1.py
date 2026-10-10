import pytest

from pseo import formulas
from pseo.config import Calculator

TIER1 = ("mortgage loan auto_loan compound_interest simple_interest savings savings_goal "
         "investment retirement roth_ira k401 cd annuity credit_card_payoff debt_payoff "
         "emergency_fund inflation discount sales_tax vat commission dti rental_yield "
         "refinance amortization").split()


def run(fid, **kw):
    return formulas.get(fid).run(**kw)


def test_all_tier1_ids_registered():
    assert set(TIER1) <= set(formulas.all_ids())


def test_mortgage_300k_6pct_30y():
    r = run("mortgage", principal=300000, rate=6, years=30)
    assert r["monthly_payment"] == pytest.approx(1798.65, abs=0.01)
    assert r["total_interest"] == pytest.approx(1798.65 * 360 - 300000, abs=5)


def test_loan_zero_rate_is_principal_over_term():
    assert run("loan", principal=12000, rate=0, months=12)["monthly_payment"] == 1000


def test_compound_interest_known_value():
    r = run("compound_interest", principal=1000, rate=5, years=10, compounds_per_year=12)
    assert r["final_amount"] == pytest.approx(1647.01, abs=0.01)


def test_simple_interest_known_value():
    r = run("simple_interest", principal=1000, rate=5, years=3)
    assert r["interest"] == 150 and r["total"] == 1150


def test_discount_and_sales_tax_known_values():
    d = run("discount", price=80, discount_pct=25)
    assert d["savings"] == 20 and d["final_price"] == 60
    t = run("sales_tax", price=100, tax_rate=8.25)
    assert t["tax"] == 8.25 and t["total"] == 108.25


def test_vat_and_commission_known_values():
    assert run("vat", net_price=200, vat_rate=20)["gross"] == 240
    assert run("commission", sales_amount=50000, commission_rate=5, base_pay=1000)["total_pay"] == 3500


def test_dti_ratio():
    assert run("dti", monthly_debt=1500, gross_monthly_income=5000)["dti_pct"] == 30


def test_zero_term_raises_value_error():
    with pytest.raises(ValueError, match="greater than zero"):
        run("mortgage", principal=300000, rate=6, years=0)
    with pytest.raises(ValueError):
        run("loan", principal=1000, rate=5, months=0)


def test_negative_principal_raises_value_error():
    for fid in ("mortgage", "loan", "compound_interest", "simple_interest", "amortization"):
        with pytest.raises(ValueError, match="negative"):
            run(fid, principal=-1)


def test_unknown_input_raises():
    with pytest.raises(ValueError, match="unknown input"):
        run("mortgage", pricipal=1)


ZERO_RATE = [
    ("mortgage", {"rate": 0}), ("loan", {"rate": 0}), ("auto_loan", {"rate": 0}),
    ("amortization", {"rate": 0}), ("compound_interest", {"rate": 0}), ("savings", {"rate": 0}),
    ("savings_goal", {"rate": 0}), ("investment", {"return_rate": 0}),
    ("retirement", {"return_rate": 0}), ("roth_ira", {"return_rate": 0}), ("k401", {"return_rate": 0}),
    ("cd", {"rate": 0}), ("annuity", {"rate": 0}), ("credit_card_payoff", {"apr": 0}),
    ("debt_payoff", {"rate": 0}), ("refinance", {"current_rate": 0, "new_rate": 0}),
    ("inflation", {"rate": 0}),
]


@pytest.mark.parametrize("fid,over", ZERO_RATE)
def test_zero_rate_all_amortizing_formulas_no_zero_division(fid, over):
    f = formulas.get(fid)
    res = f.run(**over)
    assert all(v is None or v == v for v in res.values())      # no NaN
    f.table(**over)
    assert all(isinstance(s, str) for s in f.steps(**over))


@pytest.mark.parametrize("fid", TIER1)
def test_defaults_run_and_expose_headline_and_steps(fid):
    f = formulas.get(fid)
    res = f.run()
    assert f.headline in res and f.headline_label
    assert f.vary in f.inputs
    assert len(f.steps()) >= 2 and len(f.table()) >= 1


def test_amortization_table_balance_ends_at_zero():
    rows = formulas.get("amortization").table(principal=200000, rate=6.5, years=15)
    assert rows[-1]["balance"] == pytest.approx(0, abs=0.01)
    assert rows[0]["year"] == 1 and len(rows) == 15


def test_amortization_extra_payment_shortens_term():
    base = run("amortization", principal=200000, rate=6, years=30)
    extra = run("amortization", principal=200000, rate=6, years=30, extra_payment=200)
    assert extra["payoff_months"] < base["payoff_months"]
    assert extra["interest_saved"] > 0


def test_refinance_breakeven_and_no_saving_case():
    r = run("refinance", balance=300000, current_rate=7, new_rate=6, remaining_years=30,
            new_years=30, closing_costs=6000)
    assert r["monthly_saving"] > 0 and r["breakeven_months"] == pytest.approx(6000 / r["monthly_saving"], abs=0.1)
    worse = run("refinance", balance=300000, current_rate=6, new_rate=7, remaining_years=30,
                new_years=30, closing_costs=6000)
    assert worse["breakeven_months"] is None


def test_credit_card_payment_too_low_raises_plain_error():
    with pytest.raises(ValueError, match="does not cover"):
        run("credit_card_payoff", balance=10000, apr=24, monthly_payment=100)


def test_credit_card_known_value():
    r = run("credit_card_payoff", balance=5000, apr=18, monthly_payment=200)
    assert r["months"] == 32


def test_savings_goal_inverts_savings():
    need = run("savings_goal", goal=10000, initial=0, rate=4, years=5)["monthly_deposit"]
    got = run("savings", initial=0, monthly_deposit=need, rate=4, years=5)["balance"]
    assert got == pytest.approx(10000, abs=0.5)


def test_steps_substitute_actual_numbers():
    text = " ".join(formulas.get("mortgage").steps(principal=300000, rate=6, years=30))
    assert "$300,000" in text and "1,798.65" in text


def test_registry_returns_none_for_unknown():
    assert formulas.get("no_such") is None and formulas.get(None) is None


def test_coverage_marks_missing():
    calcs = [Calculator("a", "A", "x", "/a", formula_id="mortgage"),
             Calculator("b", "B", "x", "/b", formula_id=None),
             Calculator("c", "C", "x", "/c", formula_id="bogus")]
    assert formulas.coverage(calcs) == {"a": True, "b": False, "c": False}
