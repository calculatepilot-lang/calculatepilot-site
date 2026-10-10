"""Tier 2: math and everyday formulas. Inputs are plain numbers; dates are year/month/day numbers."""
from __future__ import annotations

import math
from datetime import date, timedelta
from statistics import median

from . import InputSpec as I, register
from .tier1 import _m


def _g(x) -> str:
    return f"{x:g}"


def _u(*keys, unit=""):
    return {k: unit for k in keys}


def _date(label: str, y: float, m: float, d: float) -> date:
    try:
        if any(float(v) != int(v) for v in (y, m, d)):
            raise ValueError
        return date(int(y), int(m), int(d))
    except ValueError:
        raise ValueError(f"{label} is not a real calendar date.") from None


# ------------------------------------------------------------------ percentage ----------------
_IN = {"percent": I("Percent", 15, "%"), "amount": I("Amount", 80, "")}


def _pct_run(percent, amount):
    r = amount * percent / 100
    return {"result": round(r, 4), "increased": round(amount + r, 4), "decreased": round(amount - r, 4)}


register("percentage", inputs=_IN, headline="result", headline_label="Percent of the amount", vary="amount",
         tier=2, out_units={"result": "", "increased": "", "decreased": "", "percent": "%"},
         table=lambda percent, amount: [{"percent": p, **_pct_run(p, amount)} for p in (5, 10, 15, 20, 25)],
         steps=lambda percent, amount: [
             f"Result = amount x percent / 100 = {_g(amount)} x {_g(percent)} / 100 = {_g(_pct_run(percent, amount)['result'])}.",
             f"Increased by {_g(percent)}%: {_g(_pct_run(percent, amount)['increased'])}; "
             f"decreased by {_g(percent)}%: {_g(_pct_run(percent, amount)['decreased'])}."])(_pct_run)


# -------------------------------------------------------------------- fraction ----------------
def _frac_run(numerator, denominator):
    n, d = int(round(numerator)), int(round(denominator))
    g = math.gcd(n, d) or 1
    return {"decimal": round(numerator / denominator, 6), "percent_value": round(numerator / denominator * 100, 4),
            "simplified_numerator": n // g, "simplified_denominator": d // g}


register("fraction", inputs={"numerator": I("Numerator", 3, ""), "denominator": I("Denominator", 8, "", positive=True)},
         headline="decimal", headline_label="Decimal value", vary="denominator", tier=2, scenarios=(4, 8, 12, 16),
         out_units={"decimal": "", "percent_value": "%", "simplified_numerator": "", "simplified_denominator": "",
                    "denominator": ""},
         table=lambda numerator, denominator: [
             {"denominator": d, "decimal": round(numerator / d, 6)} for d in (2, 4, 5, 8, 10)],
         steps=lambda numerator, denominator: [
             f"Decimal = numerator / denominator = {_g(numerator)} / {_g(denominator)} = {_g(_frac_run(numerator, denominator)['decimal'])}.",
             f"Divide both by their greatest common divisor to simplify: "
             f"{_frac_run(numerator, denominator)['simplified_numerator']} / {_frac_run(numerator, denominator)['simplified_denominator']}."])(_frac_run)


# ----------------------------------------------------------------------- ratio ----------------
def _ratio_run(a, b, total):
    if a + b <= 0:
        raise ValueError("At least one side of the ratio must be greater than zero.")
    return {"share_a": round(total * a / (a + b), 4), "share_b": round(total * b / (a + b), 4),
            "a_fraction_pct": round(a / (a + b) * 100, 4)}


register("ratio", inputs={"a": I("Ratio part A", 3, ""), "b": I("Ratio part B", 1, ""), "total": I("Total to split", 100, "")},
         headline="share_a", headline_label="Share for part A", vary="total", tier=2,
         out_units={"share_a": "", "share_b": "", "a_fraction_pct": "%", "total": ""},
         table=lambda a, b, total: [{"total": t, **{k: v for k, v in _ratio_run(a, b, t).items() if k != "a_fraction_pct"}}
                                    for t in (50, 100, 200, 500)],
         steps=lambda a, b, total: [
             f"Parts in total = {_g(a)} + {_g(b)} = {_g(a + b)}.",
             f"Share A = total x A / parts = {_g(total)} x {_g(a)} / {_g(a + b)} = {_g(_ratio_run(a, b, total)['share_a'])}.",
             f"Share B = {_g(_ratio_run(a, b, total)['share_b'])}."])(_ratio_run)


# --------------------------------------------------------------------- average ----------------
_AVG_IN = {f"v{i}": I(f"Value {i}", v, "") for i, v in enumerate((4, 8, 15, 16, 23), 1)}


def _avg_run(**v):
    xs = sorted(v.values())
    return {"mean": round(sum(xs) / len(xs), 4), "median": median(xs), "minimum": xs[0], "maximum": xs[-1],
            "range": xs[-1] - xs[0]}


register("average", inputs=_AVG_IN, headline="mean", headline_label="Mean (average)", vary="v5", tier=2,
         scenarios=(10, 23, 40, 60), out_units={k: "" for k in ("mean", "median", "minimum", "maximum", "range", "item", "value")},
         table=lambda **v: [{"item": i, "value": x} for i, x in enumerate(sorted(v.values()), 1)],
         steps=lambda **v: [
             f"Mean = sum / count = {_g(sum(v.values()))} / {len(v)} = {_g(_avg_run(**v)['mean'])}.",
             f"Median = middle value of the sorted list = {_g(_avg_run(**v)['median'])}; "
             f"range = {_g(_avg_run(**v)['maximum'])} - {_g(_avg_run(**v)['minimum'])} = {_g(_avg_run(**v)['range'])}."])(_avg_run)


# ------------------------------------------------------------------- tip & split --------------
def _tip_run(bill, tip_pct, people):
    tip = bill * tip_pct / 100
    total = bill + tip
    return {"tip": round(tip, 2), "total": round(total, 2), "per_person": round(total / people, 2),
            "tip_per_person": round(tip / people, 2)}


register("tip", inputs={"bill": I("Bill", 80, "$"), "tip_pct": I("Tip", 18, "%"), "people": I("People", 2, "", positive=True)},
         headline="total", headline_label="Total with tip", vary="bill", tier=2,
         out_units={"people": "", "tip_pct": "%"},
         table=lambda bill, tip_pct, people: [{"tip_pct": p, **{k: v for k, v in _tip_run(bill, p, people).items()
                                                               if k in ("tip", "total", "per_person")}} for p in (10, 15, 18, 20, 25)],
         steps=lambda bill, tip_pct, people: [
             f"Tip = bill x tip% = {_m(bill)} x {_g(tip_pct)}% = {_m(_tip_run(bill, tip_pct, people)['tip'])}.",
             f"Total = {_m(bill)} + tip = {_m(_tip_run(bill, tip_pct, people)['total'])}.",
             f"Split {_g(people)} ways = {_m(_tip_run(bill, tip_pct, people)['per_person'])} each (rounded to the cent)."])(_tip_run)


def _split_run(total, people, service_charge_pct):
    extra = total * service_charge_pct / 100
    return {"extra": round(extra, 2), "grand_total": round(total + extra, 2),
            "per_person": round((total + extra) / people, 2)}


register("bill_split", inputs={"total": I("Bill total", 240, "$"), "people": I("People", 4, "", positive=True),
                               "service_charge_pct": I("Service charge", 10, "%")},
         headline="per_person", headline_label="Each person pays", vary="total", tier=2, out_units={"people": ""},
         table=lambda total, people, service_charge_pct: [
             {"people": n, "per_person": _split_run(total, n, service_charge_pct)["per_person"]} for n in (2, 3, 4, 5, 6)],
         steps=lambda total, people, service_charge_pct: [
             f"Service charge = {_m(total)} x {_g(service_charge_pct)}% = {_m(_split_run(total, people, service_charge_pct)['extra'])}.",
             f"Grand total = {_m(_split_run(total, people, service_charge_pct)['grand_total'])}; "
             f"divided by {_g(people)} people = {_m(_split_run(total, people, service_charge_pct)['per_person'])} each."])(_split_run)


# ------------------------------------------------------------------------ dates ---------------
def _month_len(y: int, m: int) -> int:
    nxt = date(y + (m == 12), m % 12 + 1, 1)
    return (nxt - date(y, m, 1)).days


def _age_parts(b: date, on: date) -> tuple[int, int, int]:
    y, m, d = on.year - b.year, on.month - b.month, on.day - b.day
    if d < 0:
        m -= 1
        pm = on.month - 1 or 12
        d += _month_len(on.year - (on.month == 1), pm)
    if m < 0:
        y -= 1
        m += 12
    return y, m, d


_AGE_IN = {"birth_year": I("Birth year", 1990, "", positive=True), "birth_month": I("Birth month", 6, "", positive=True),
           "birth_day": I("Birth day", 15, "", positive=True), "on_year": I("Year to measure at", 2026, "", positive=True),
           "on_month": I("Month to measure at", 10, "", positive=True), "on_day": I("Day to measure at", 11, "", positive=True)}
for _k in _AGE_IN:
    _AGE_IN[_k] = I(_AGE_IN[_k].label, _AGE_IN[_k].default, "", positive=True, variable=False)


def _age_run(birth_year, birth_month, birth_day, on_year, on_month, on_day):
    b = _date("The birth date", birth_year, birth_month, birth_day)
    on = _date("The measuring date", on_year, on_month, on_day)
    if on < b:
        raise ValueError("The measuring date must not be before the birth date.")
    y, m, d = _age_parts(b, on)
    return {"years": y, "months": m, "days": d, "total_days": (on - b).days}


register("age", inputs=_AGE_IN, headline="years", headline_label="Age in years", vary="birth_year", tier=2,
         scenarios=(1960, 1975, 1990, 2005),
         out_units=_u("years", "months", "days", "total_days", "year", "age", "birth_year"),
         table=lambda **k: [{"year": k["on_year"] + n, "age": _age_run(**k)["years"] + n} for n in range(0, 5)],
         steps=lambda **k: [
             f"From {int(k['birth_year'])}-{int(k['birth_month']):02d}-{int(k['birth_day']):02d} to "
             f"{int(k['on_year'])}-{int(k['on_month']):02d}-{int(k['on_day']):02d}: "
             f"{_age_run(**k)['years']} years, {_age_run(**k)['months']} months, {_age_run(**k)['days']} days.",
             f"That is {_age_run(**k)['total_days']} days in total. Days are borrowed from the previous month "
             f"when the day of the month is earlier."])(_age_run)

_DD_IN = {f"{p}_{u}": I(f"{p.capitalize()} {u}", v, "", positive=True, variable=False)
          for p, vals in (("from", (2026, 1, 1)), ("to", (2026, 10, 11))) for u, v in zip(("year", "month", "day"), vals)}


def _dd_run(from_year, from_month, from_day, to_year, to_month, to_day):
    a = _date("The start date", from_year, from_month, from_day)
    b = _date("The end date", to_year, to_month, to_day)
    if b < a:
        raise ValueError("The end date must not be before the start date.")
    days = (b - a).days
    return {"days": days, "weeks": days // 7, "extra_days": days % 7}


register("date_difference", inputs=_DD_IN, headline="days", headline_label="Days between the dates", vary="from_month",
         tier=2, scenarios=(1, 3, 6, 9), out_units=_u("days", "weeks", "extra_days", "from_month"),
         table=lambda **k: [_dd_run(**k)],
         steps=lambda **k: [
             f"Days between = end date - start date = {_dd_run(**k)['days']}.",
             f"That is {_dd_run(**k)['weeks']} weeks and {_dd_run(**k)['extra_days']} days."])(_dd_run)


# ------------------------------------------------------------------ area / volume -------------
def _area_run(length, width):
    return {"area": round(length * width, 4), "perimeter": round(2 * (length + width), 4)}


register("area", inputs={"length": I("Length", 12, "", positive=True), "width": I("Width", 8, "", positive=True)},
         headline="area", headline_label="Area of the rectangle", vary="length", tier=2,
         out_units=_u("area", "perimeter", "width", "length"),
         table=lambda length, width: [{"width": w, **_area_run(length, w)} for w in (2, 4, 8, 12, 16)],
         steps=lambda length, width: [
             f"Area = length x width = {_g(length)} x {_g(width)} = {_g(_area_run(length, width)['area'])}.",
             f"Perimeter = 2 x (length + width) = {_g(_area_run(length, width)['perimeter'])}."])(_area_run)


def _vol_run(length, width, height):
    return {"volume": round(length * width * height, 4),
            "surface_area": round(2 * (length * width + length * height + width * height), 4)}


register("volume", inputs={"length": I("Length", 10, "", positive=True), "width": I("Width", 5, "", positive=True),
                           "height": I("Height", 4, "", positive=True)},
         headline="volume", headline_label="Volume of the box", vary="length", tier=2,
         out_units=_u("volume", "surface_area", "height", "length", "width"),
         table=lambda length, width, height: [{"height": h, **_vol_run(length, width, h)} for h in (1, 2, 4, 8, 10)],
         steps=lambda length, width, height: [
             f"Volume = length x width x height = {_g(length)} x {_g(width)} x {_g(height)} = {_g(_vol_run(length, width, height)['volume'])}.",
             f"Surface area = 2 x (lw + lh + wh) = {_g(_vol_run(length, width, height)['surface_area'])}."])(_vol_run)


# -------------------------------------------------------------------------- units ------------
_LINEAR = {  # name -> (kind, factor to the kind's base unit)
    **{n: ("length", f) for n, f in {"m": 1, "meter": 1, "meters": 1, "metre": 1, "metres": 1, "km": 1000,
                                     "kilometer": 1000, "kilometers": 1000, "cm": 0.01, "mm": 0.001,
                                     "mi": 1609.344, "mile": 1609.344, "miles": 1609.344, "ft": 0.3048,
                                     "foot": 0.3048, "feet": 0.3048, "in": 0.0254, "inch": 0.0254,
                                     "inches": 0.0254, "yd": 0.9144, "yard": 0.9144, "yards": 0.9144}.items()},
    **{n: ("mass", f) for n, f in {"kg": 1, "kilogram": 1, "kilograms": 1, "g": 0.001, "gram": 0.001,
                                   "grams": 0.001, "lb": 0.45359237, "lbs": 0.45359237, "pound": 0.45359237,
                                   "pounds": 0.45359237, "oz": 0.028349523125, "ounce": 0.028349523125,
                                   "ounces": 0.028349523125}.items()},
    **{n: ("volume", f) for n, f in {"l": 1, "litre": 1, "litres": 1, "liter": 1, "liters": 1, "ml": 0.001,
                                     "gal": 3.785411784, "gallon": 3.785411784, "gallons": 3.785411784}.items()},
}
_TEMPS = {"c": "c", "celsius": "c", "f": "f", "fahrenheit": "f", "k": "k", "kelvin": "k"}


def convert(value: float, from_unit: str, to_unit: str) -> float:
    a, b = from_unit.strip().lower(), to_unit.strip().lower()
    if a in _TEMPS or b in _TEMPS:
        if a not in _TEMPS or b not in _TEMPS:
            raise ValueError("Both units must be of the same kind (temperature with temperature).")
        c = {"c": value, "f": (value - 32) * 5 / 9, "k": value - 273.15}[_TEMPS[a]]
        return {"c": c, "f": c * 9 / 5 + 32, "k": c + 273.15}[_TEMPS[b]]
    for u in (a, b):
        if u not in _LINEAR:
            raise ValueError(f"Unknown unit '{u}'.")
    (ka, fa), (kb, fb) = _LINEAR[a], _LINEAR[b]
    if ka != kb:
        raise ValueError(f"Both units must be of the same kind ({ka} vs {kb}).")
    return value * fa / fb


def _conversion(fid: str, a: str, b: str, default: float, label: str, scen: tuple):
    def run(value):
        return {"converted": round(convert(value, a, b), 6)}

    register(fid, inputs={"value": I(f"Value in {a}", default, a if len(a) > 1 else a)},
             headline="converted", headline_label=f"Value in {b}", vary="value", tier=2, scenarios=scen,
             out_units={"converted": b, "value": a},
             table=lambda value: [{"value": v, "converted": round(convert(v, a, b), 6)} for v in (1, 5, 10, 50, 100)],
             steps=lambda value: [
                 f"1 {a} = {_g(round(convert(1, a, b), 6))} {b}.",
                 f"{_g(value)} {a} x {_g(round(convert(1, a, b), 6))} = {_g(round(convert(value, a, b), 6))} {b}."])(run)


_conversion("unit_convert", "miles", "km", 10, "length", (1, 10, 26.2, 100))
_conversion("weight_convert", "lb", "kg", 150, "weight", (10, 50, 150, 200))
_conversion("temperature_convert", "f", "c", 98.6, "temperature", (32, 68, 98.6, 212))
