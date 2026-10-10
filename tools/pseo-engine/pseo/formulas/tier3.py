"""Tier 3: health formulas. Published formulas only: no invented thresholds or category cut-offs.

Every page built from these carries a medical note and needs manual approval before publishing.
"""
from __future__ import annotations

from datetime import date, timedelta

from . import InputSpec as I, register
from .tier2 import _date, _g, _u

_SEX = I("Sex for the formula (1 = male, 0 = female)", 1, "", variable=False)
_W = I("Weight", 70, "kg", positive=True, variable=False)
_H = I("Height", 175, "cm", positive=True, variable=False)
_AGE = I("Age in years", 30, "", positive=True, variable=False)


def _sex(sex: float) -> int:
    if sex not in (0, 1):
        raise ValueError("Sex must be entered as 1 or 0 (1 = male, 0 = female) for this formula.")
    return int(sex)


def _bmi_run(weight_kg, height_cm):
    return {"bmi": round(weight_kg / (height_cm / 100) ** 2, 2)}


register("bmi", inputs={"weight_kg": _W, "height_cm": _H}, headline="bmi", headline_label="Body mass index (BMI)",
         vary="weight_kg", tier=3, ymyl=True, scenarios=(55, 65, 75, 85, 95), out_units={"bmi": "", "weight_kg": "kg"},
         table=lambda weight_kg, height_cm: [{"weight_kg": w, "bmi": _bmi_run(w, height_cm)["bmi"]}
                                             for w in (50, 60, 70, 80, 90)],
         steps=lambda weight_kg, height_cm: [
             f"BMI = weight in kg / (height in metres)^2 = {_g(weight_kg)} / ({_g(height_cm / 100)})^2.",
             f"BMI = {_g(_bmi_run(weight_kg, height_cm)['bmi'])}. This page does not label ranges; "
             "ask a health professional what a BMI means for you."])(_bmi_run)


def _bmr(sex, weight_kg, height_cm, age):
    return 10 * weight_kg + 6.25 * height_cm - 5 * age + (5 if _sex(sex) == 1 else -161)


def _bmr_run(sex, weight_kg, height_cm, age):
    return {"bmr": round(_bmr(sex, weight_kg, height_cm, age), 2)}


_BM_IN = {"sex": _SEX, "weight_kg": _W, "height_cm": _H, "age": _AGE}
register("bmr", inputs=_BM_IN, headline="bmr", headline_label="Basal metabolic rate (calories a day)",
         vary="weight_kg", tier=3, ymyl=True, scenarios=(55, 70, 85, 100), out_units={"bmr": "kcal/day", "weight_kg": "kg"},
         table=lambda sex, weight_kg, height_cm, age: [
             {"age": a, "bmr": _bmr_run(sex, weight_kg, height_cm, a)["bmr"]} for a in (20, 30, 40, 50, 60)],
         steps=lambda sex, weight_kg, height_cm, age: [
             "Mifflin-St Jeor equation: 10 x weight (kg) + 6.25 x height (cm) - 5 x age + 5 for men or - 161 for women.",
             f"10 x {_g(weight_kg)} + 6.25 x {_g(height_cm)} - 5 x {_g(age)} "
             f"{'+ 5' if sex == 1 else '- 161'} = {_g(_bmr_run(sex, weight_kg, height_cm, age)['bmr'])} calories a day."])(_bmr_run)


def _tdee_run(sex, weight_kg, height_cm, age, activity_factor):
    b = _bmr(sex, weight_kg, height_cm, age)
    return {"bmr": round(b, 2), "tdee": round(b * activity_factor, 2)}


register("tdee", inputs={**_BM_IN, "activity_factor": I("Activity multiplier you choose", 1.55, "", positive=True, variable=False)},
         headline="tdee", headline_label="Estimated daily calories (TDEE)", vary="weight_kg", tier=3, ymyl=True,
         scenarios=(55, 70, 85, 100), out_units={"tdee": "kcal/day", "bmr": "kcal/day", "weight_kg": "kg"},
         table=lambda sex, weight_kg, height_cm, age, activity_factor: [
             {"activity_factor": f, "tdee": _tdee_run(sex, weight_kg, height_cm, age, f)["tdee"]}
             for f in (1.2, 1.375, 1.55, 1.725, 1.9)],
         steps=lambda sex, weight_kg, height_cm, age, activity_factor: [
             f"BMR (Mifflin-St Jeor) = {_g(_tdee_run(sex, weight_kg, height_cm, age, activity_factor)['bmr'])} calories a day.",
             f"TDEE = BMR x the activity multiplier you chose ({_g(activity_factor)}) = "
             f"{_g(_tdee_run(sex, weight_kg, height_cm, age, activity_factor)['tdee'])} calories a day."])(_tdee_run)


def _ideal_run(sex, height_cm):
    inches = height_cm / 2.54
    if inches < 60:
        raise ValueError("The Devine formula is defined for heights of 60 inches (152.4 cm) and above.")
    base = 50 if _sex(sex) == 1 else 45.5
    return {"ideal_kg": round(base + 2.3 * (inches - 60), 2)}


register("ideal_weight", inputs={"sex": _SEX, "height_cm": _H}, headline="ideal_kg",
         headline_label="Devine formula weight (kg)", vary="height_cm", tier=3, ymyl=True, scenarios=(155, 165, 175, 185),
         out_units={"ideal_kg": "kg", "height_cm": "cm"},
         table=lambda sex, height_cm: [{"height_cm": h, "ideal_kg": _ideal_run(sex, h)["ideal_kg"]} for h in (155, 165, 175, 185, 195)],
         steps=lambda sex, height_cm: [
             f"Height = {_g(height_cm)} cm = {_g(round(height_cm / 2.54, 2))} inches.",
             f"Devine formula: {'50' if sex == 1 else '45.5'} kg + 2.3 kg for each inch over 60 inches = "
             f"{_g(_ideal_run(sex, height_cm)['ideal_kg'])} kg. It is one historical formula, not a target."])(_ideal_run)


def _water_run(weight_kg, ml_per_kg):
    ml = weight_kg * ml_per_kg
    return {"ml": round(ml, 1), "litres": round(ml / 1000, 2)}


register("water_intake", inputs={"weight_kg": _W, "ml_per_kg": I("Millilitres per kg (illustrative, you can change it)", 35, "ml", positive=True, variable=False)},
         headline="litres", headline_label="Water for the chosen factor (litres)", vary="weight_kg", tier=3, ymyl=True,
         scenarios=(50, 60, 70, 80, 90), out_units={"ml": "ml", "litres": "litres", "weight_kg": "kg"},
         table=lambda weight_kg, ml_per_kg: [{"weight_kg": w, "litres": _water_run(w, ml_per_kg)["litres"]} for w in (50, 60, 70, 80, 90)],
         steps=lambda weight_kg, ml_per_kg: [
             f"Volume = weight x millilitres per kg = {_g(weight_kg)} x {_g(ml_per_kg)} = {_g(_water_run(weight_kg, ml_per_kg)['ml'])} ml.",
             f"That is {_g(_water_run(weight_kg, ml_per_kg)['litres'])} litres. The factor is an illustrative input, "
             "not a medical recommendation."])(_water_run)


def _due_run(lmp_year, lmp_month, lmp_day):
    lmp = _date("The first day of the last period", lmp_year, lmp_month, lmp_day)
    return {"due_date": (lmp + timedelta(days=280)).isoformat()}


register("due_date", inputs={"lmp_year": I("Year of the first day of the last period", 2026, "", positive=True, variable=False),
                             "lmp_month": I("Month", 6, "", positive=True, variable=False),
                             "lmp_day": I("Day", 15, "", positive=True, variable=False)},
         headline="due_date", headline_label="Estimated due date", vary="lmp_month", tier=3, ymyl=True,
         scenarios=(1, 4, 7, 10), out_units=_u("due_date", "lmp_month"),
         table=lambda lmp_year, lmp_month, lmp_day: [
             {"lmp_month": m, **_due_run(lmp_year, m, min(lmp_day, 28))} for m in (1, 4, 7, 10)],
         steps=lambda lmp_year, lmp_month, lmp_day: [
             f"Naegele's rule: add 280 days to the first day of the last period "
             f"({int(lmp_year)}-{int(lmp_month):02d}-{int(lmp_day):02d}).",
             f"Estimated due date = {_due_run(lmp_year, lmp_month, lmp_day)['due_date']}. Real dates vary; "
             "a health professional confirms timing."])(_due_run)
