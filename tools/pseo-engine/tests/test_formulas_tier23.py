from datetime import date, timedelta

import pytest

from pseo import formulas
from pseo.formulas import tier2


def run(fid, **kw):
    return formulas.get(fid).run(**kw)


TIER2 = "percentage fraction ratio average tip bill_split age date_difference area volume unit_convert".split()
TIER3 = "bmi bmr tdee ideal_weight water_intake due_date".split()


def test_all_registered():
    assert set(TIER2 + TIER3) <= set(formulas.all_ids())


@pytest.mark.parametrize("fid", TIER2 + TIER3 + ["temperature_convert", "weight_convert"])
def test_defaults_run_with_headline_steps_and_table(fid):
    f = formulas.get(fid)
    res = f.run()
    assert f.headline in res and f.headline_label and f.vary in f.inputs
    assert len(f.steps()) >= 2 and len(f.table()) >= 1
    for v in f.scenarios:
        f.run(**{f.vary: v})


def test_percentage_of():
    r = run("percentage", percent=15, amount=80)
    assert r["result"] == 12 and r["increased"] == 92 and r["decreased"] == 68


def test_fraction_simplifies():
    r = run("fraction", numerator=6, denominator=8)
    assert (r["simplified_numerator"], r["simplified_denominator"]) == (3, 4) and r["decimal"] == 0.75


def test_ratio_split():
    r = run("ratio", a=3, b=1, total=100)
    assert r["share_a"] == 75 and r["share_b"] == 25
    with pytest.raises(ValueError):
        run("ratio", a=0, b=0, total=10)


def test_average_values():
    r = run("average", v1=4, v2=8, v3=15, v4=16, v5=23)
    assert r["mean"] == 13.2 and r["median"] == 15 and r["range"] == 19


def test_tip_split_rounding():
    r = run("tip", bill=100, tip_pct=15, people=3)
    assert r["tip"] == 15 and r["total"] == 115 and r["per_person"] == 38.33


def test_bill_split():
    r = run("bill_split", total=240, people=4, service_charge_pct=10)
    assert r["extra"] == 24 and r["per_person"] == 66


def test_age_leap_day():
    r = run("age", birth_year=2000, birth_month=2, birth_day=29, on_year=2001, on_month=2, on_day=28)
    assert (r["years"], r["months"], r["days"]) == (0, 11, 30)
    r = run("age", birth_year=2000, birth_month=2, birth_day=29, on_year=2024, on_month=2, on_day=29)
    assert (r["years"], r["months"], r["days"]) == (24, 0, 0)


def test_age_invalid_dates_and_order():
    with pytest.raises(ValueError, match="real calendar date"):
        run("age", birth_year=2001, birth_month=2, birth_day=29)
    with pytest.raises(ValueError, match="before"):
        run("age", birth_year=2030, on_year=2026)


def test_date_difference():
    r = run("date_difference", from_year=2026, from_month=1, from_day=1, to_year=2026, to_month=3, to_day=1)
    assert (r["days"], r["weeks"], r["extra_days"]) == (59, 8, 3)


def test_area_and_volume():
    assert run("area", length=12, width=8)["area"] == 96
    assert run("volume", length=2, width=3, height=4)["volume"] == 24
    assert run("volume", length=2, width=3, height=4)["surface_area"] == 52


def test_unit_convert_known_values():
    assert tier2.convert(10, "miles", "km") == pytest.approx(16.0934, abs=0.001)
    assert tier2.convert(212, "f", "c") == pytest.approx(100, abs=0.001)
    assert tier2.convert(1, "kg", "lb") == pytest.approx(2.20462, abs=0.0001)
    assert run("unit_convert", value=10)["converted"] == pytest.approx(16.09, abs=0.01)


def test_unit_convert_unknown_unit_raises():
    with pytest.raises(ValueError, match="Unknown unit"):
        tier2.convert(1, "parsecs", "km")
    with pytest.raises(ValueError, match="same kind"):
        tier2.convert(1, "km", "kg")


def test_bmi_70kg_175cm():
    assert run("bmi", weight_kg=70, height_cm=175)["bmi"] == pytest.approx(22.86, abs=0.01)


def test_bmr_and_tdee_known_values():
    assert run("bmr", sex=1, weight_kg=70, height_cm=175, age=30)["bmr"] == pytest.approx(1648.75, abs=0.01)
    assert run("bmr", sex=0, weight_kg=70, height_cm=175, age=30)["bmr"] == pytest.approx(1482.75, abs=0.01)
    assert run("tdee", sex=1, weight_kg=70, height_cm=175, age=30, activity_factor=1.55)["tdee"] == pytest.approx(2555.56, abs=0.01)


def test_ideal_weight_devine():
    assert run("ideal_weight", sex=1, height_cm=175)["ideal_kg"] == pytest.approx(70.46, abs=0.01)
    with pytest.raises(ValueError, match="152.4"):
        run("ideal_weight", sex=1, height_cm=140)


def test_water_intake():
    r = run("water_intake", weight_kg=70, ml_per_kg=35)
    assert r["ml"] == 2450 and r["litres"] == 2.45


def test_due_date_280_days():
    r = run("due_date", lmp_year=2026, lmp_month=1, lmp_day=1)
    assert r["due_date"] == (date(2026, 1, 1) + timedelta(days=280)).isoformat() == "2026-10-08"


def test_negative_height_raises_value_error():
    with pytest.raises(ValueError, match="negative"):
        run("bmi", weight_kg=70, height_cm=-175)
    with pytest.raises(ValueError, match="greater than zero"):
        run("bmi", weight_kg=70, height_cm=0)


def test_sex_must_be_zero_or_one():
    with pytest.raises(ValueError, match="1 or 0"):
        run("bmr", sex=2)


def test_health_formulas_flag_category():
    for fid in TIER3:
        f = formulas.get(fid)
        assert f.ymyl is True and f.tier == 3
    for fid in TIER2:
        assert formulas.get(fid).ymyl is False and formulas.get(fid).tier == 2


def test_guess_formula_id_only_for_registered_exact_slugs():
    assert formulas.guess_formula_id("bmi-calculator") == "bmi"
    assert formulas.guess_formula_id("mortgage-calculator") == "mortgage"
    assert formulas.guess_formula_id("totally-new-calculator") is None
