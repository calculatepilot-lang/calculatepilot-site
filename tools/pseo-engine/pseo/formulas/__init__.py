"""Formula library: pure, unit-tested calculators the page generator reads numbers from.

Every number on a generated page must come from a formula run (origin `formula:<id>`) or from
config/facts.yml (origin `fact:<key>`). Nothing here guesses rates, limits or thresholds.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

METHOD_VERSION = "1.0"


@dataclass(frozen=True)
class InputSpec:
    label: str
    default: float
    unit: str = ""            # "$", "%", "years", "months", "" ...
    positive: bool = False    # True: must be > 0 (terms, divisors); otherwise must be >= 0
    variable: bool = True     # False: page builder never varies it (ages, compounding periods, body size)


@dataclass(frozen=True)
class Formula:
    id: str
    inputs: dict[str, InputSpec]
    run: Callable[..., dict]
    table: Callable[..., list[dict]]
    steps: Callable[..., list[str]]
    method_version: str = METHOD_VERSION
    headline: str = ""         # key in run() output used for the quick answer
    headline_label: str = ""
    vary: str = ""             # input the scenario table varies
    tier: int = 1
    ymyl: bool = False         # health: medical note + manual approval
    out_units: dict = field(default_factory=dict)   # output key -> "$", "%", "" or a unit word
    scenarios: tuple = ()      # explicit scenario values for `vary` when x0.5..x2 makes no sense

    def defaults(self) -> dict[str, float]:
        return {k: v.default for k, v in self.inputs.items()}


_REGISTRY: dict[str, Formula] = {}


def validate(inputs: dict[str, InputSpec], values: dict) -> dict[str, float]:
    """Fill defaults and reject anything outside the allowed range with a plain-English error."""
    unknown = set(values) - set(inputs)
    if unknown:
        raise ValueError(f"unknown input(s): {', '.join(sorted(unknown))}")
    out: dict[str, float] = {}
    for key, spec in inputs.items():
        v = float(values.get(key, spec.default))
        if v != v or v in (float("inf"), float("-inf")):
            raise ValueError(f"{spec.label} must be a real number")
        if v < 0:
            raise ValueError(f"{spec.label} cannot be negative")
        if spec.positive and v == 0:
            raise ValueError(f"{spec.label} must be greater than zero")
        out[key] = v
    return out


def register(formula_id: str, *, inputs: dict[str, InputSpec], headline: str,
             headline_label: str, vary: str, table: Callable, steps: Callable,
             tier: int = 1, ymyl: bool = False, out_units: dict | None = None, scenarios: tuple = (),
             method_version: str = METHOD_VERSION):
    """Decorator for a formula's run function; wraps run/table/steps with input validation."""
    def wrap(fn: Callable) -> Callable:
        def checked(raw):
            def call(**kw):
                return raw(**validate(inputs, kw))
            return call
        _REGISTRY[formula_id] = Formula(
            id=formula_id, inputs=inputs, run=checked(fn), table=checked(table),
            steps=checked(steps), method_version=method_version, headline=headline,
            headline_label=headline_label, vary=vary, tier=tier, ymyl=ymyl,
            out_units=dict(out_units or {}), scenarios=tuple(scenarios))
        return fn
    return wrap


def get(formula_id: str | None) -> Formula | None:
    return _REGISTRY.get(formula_id) if formula_id else None


def all_ids() -> list[str]:
    return sorted(_REGISTRY)


def coverage(calculators) -> dict[str, bool]:
    return {c.slug: get(c.formula_id) is not None for c in calculators}


# Exact-slug guesses used by `pseo sync-calculators` for calculators without a formula_id yet.
SLUG_FORMULAS = {
    "mortgage-calculator": "mortgage", "loan-calculator": "loan", "auto-loan-calculator": "auto_loan",
    "car-loan-calculator": "auto_loan", "compound-interest-calculator": "compound_interest",
    "simple-interest-calculator": "simple_interest", "savings-calculator": "savings",
    "savings-goal-calculator": "savings_goal", "investment-calculator": "investment",
    "retirement-calculator": "retirement", "roth-ira-calculator": "roth_ira", "401k-calculator": "k401",
    "cd-calculator": "cd", "annuity-calculator": "annuity", "credit-card-payoff-calculator": "credit_card_payoff",
    "debt-payoff-calculator": "debt_payoff", "emergency-fund-calculator": "emergency_fund",
    "inflation-calculator": "inflation", "discount-calculator": "discount", "sales-tax-calculator": "sales_tax",
    "vat-calculator": "vat", "commission-calculator": "commission", "debt-to-income-calculator": "dti",
    "rental-yield-calculator": "rental_yield", "refinance-calculator": "refinance",
    "amortization-calculator": "amortization",
    "percentage-calculator": "percentage", "fraction-calculator": "fraction", "ratio-calculator": "ratio",
    "average-calculator": "average", "tip-calculator": "tip", "bill-split-calculator": "bill_split",
    "split-bill-calculator": "bill_split", "age-calculator": "age", "date-difference-calculator": "date_difference",
    "days-between-dates-calculator": "date_difference", "area-calculator": "area", "volume-calculator": "volume",
    "unit-converter": "unit_convert", "length-converter": "unit_convert", "temperature-converter": "temperature_convert",
    "weight-converter": "weight_convert", "bmi-calculator": "bmi", "bmr-calculator": "bmr", "tdee-calculator": "tdee",
    "ideal-weight-calculator": "ideal_weight", "water-intake-calculator": "water_intake",
    "due-date-calculator": "due_date", "pregnancy-due-date-calculator": "due_date",
}


def guess_formula_id(slug: str) -> str | None:
    fid = SLUG_FORMULAS.get(slug)
    return fid if fid in _REGISTRY else None


from . import tier1  # noqa: E402,F401  (registers Tier 1)
from . import tier2  # noqa: E402,F401  (Tier 2: math and everyday)
from . import tier3  # noqa: E402,F401  (Tier 3: health, flagged for manual approval)
