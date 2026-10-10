"""Tier 1: financial formulas. Rates are annual percentages; money has two decimals.

No rate, limit or threshold is assumed on a reader's behalf: every default is an input the
reader can change, and the page labels defaults as illustrative.
"""
from __future__ import annotations

import math

from . import InputSpec as I, register


def _m(x: float) -> str:
    x = float(x)
    return f"${x:,.0f}" if abs(x - round(x)) < 1e-9 else f"${x:,.2f}"


def _p(x: float) -> str:
    return f"{x:g}%"


def _n(years: float) -> int:
    return max(1, round(years * 12))


def _pmt(principal: float, rate: float, n: int) -> float:
    r = rate / 1200
    return principal / n if r == 0 else principal * r / (1 - (1 + r) ** -n)


def _fv(initial: float, deposit: float, rate: float, n: int) -> float:
    r = rate / 1200
    if r == 0:
        return initial + deposit * n
    g = (1 + r) ** n
    return initial * g + deposit * (g - 1) / r


def _schedule(principal: float, rate: float, n: int, extra: float = 0.0) -> list[tuple]:
    """Monthly rows (month, interest, principal_paid, balance)."""
    r, pay, bal, rows = rate / 1200, _pmt(principal, rate, n), principal, []
    for month in range(1, n + 1):
        interest = bal * r
        paid = min(bal, pay + extra - interest)
        bal = max(0.0, bal - paid)
        rows.append((month, interest, paid, bal))
        if bal < 0.005:
            break
    return rows


def _yearly(rows: list[tuple]) -> list[dict]:
    out: dict[int, dict] = {}
    for month, interest, paid, bal in rows:
        y = (month - 1) // 12 + 1
        d = out.setdefault(y, {"year": y, "interest": 0.0, "principal": 0.0, "balance": 0.0})
        d["interest"] += interest
        d["principal"] += paid
        d["balance"] = bal
    return [{k: (v if k == "year" else round(v, 2)) for k, v in d.items()} for d in out.values()]


def _payoff(balance: float, apr: float, pay: float) -> list[tuple]:
    r = apr / 1200
    if balance * r >= pay and balance > 0:
        raise ValueError("The monthly payment does not cover the monthly interest, so the "
                         "balance would never fall. Raise the payment.")
    rows, bal, month = [], balance, 0
    while bal > 0.005:
        month += 1
        if month > 12000:
            raise ValueError("This payoff would take more than 1,000 years. Raise the payment.")
        interest = bal * r
        paid = min(bal, pay - interest)
        bal -= paid
        rows.append((month, interest, paid, max(0.0, bal)))
    return rows


# ---------------------------------------------------------------- loans -----------------------
def _loan_outputs(p, rate, n):
    pay = _pmt(p, rate, n)
    return {"monthly_payment": round(pay, 2), "total_paid": round(pay * n, 2),
            "total_interest": round(pay * n - p, 2)}


_MORTGAGE_IN = {"principal": I("Loan amount", 300000, "$"), "rate": I("Interest rate", 6, "%"),
                "years": I("Term in years", 30, "years", positive=True)}


def _mortgage_run(principal, rate, years):
    return _loan_outputs(principal, rate, _n(years))


def _mortgage_table(principal, rate, years):
    return _yearly(_schedule(principal, rate, _n(years)))


def _mortgage_steps(principal, rate, years):
    n, out = _n(years), _mortgage_run(principal, rate, years)
    return [f"Loan amount {_m(principal)} at {_p(rate)} a year over {years:g} years = {n} monthly payments.",
            "Monthly payment = loan x r / (1 - (1 + r)^-n), where r is the annual rate / 12 "
            "(with a 0% rate it is simply loan / n).",
            f"Monthly payment = {_m(out['monthly_payment'])}.",
            f"Total paid = {_m(out['monthly_payment'])} x {n} = {_m(out['total_paid'])}, of which "
            f"{_m(out['total_interest'])} is interest."]


register("mortgage", inputs=_MORTGAGE_IN, headline="monthly_payment",
         headline_label="Monthly payment (principal and interest)", vary="principal",
         table=_mortgage_table, steps=_mortgage_steps)(_mortgage_run)

_LOAN_IN = {"principal": I("Loan amount", 10000, "$"), "rate": I("Interest rate", 8, "%"),
            "months": I("Term in months", 36, "months", positive=True)}


def _loan_run(principal, rate, months):
    return _loan_outputs(principal, rate, max(1, round(months)))


def _loan_table(principal, rate, months):
    return _yearly(_schedule(principal, rate, max(1, round(months))))


def _loan_steps(principal, rate, months):
    n, out = max(1, round(months)), _loan_run(principal, rate, months)
    return [f"Loan amount {_m(principal)} at {_p(rate)} a year over {n} months.",
            "Monthly payment = loan x r / (1 - (1 + r)^-n), where r is the annual rate / 12 "
            "(with a 0% rate it is loan / n).",
            f"Monthly payment = {_m(out['monthly_payment'])}; total interest = {_m(out['total_interest'])}."]


register("loan", inputs=_LOAN_IN, headline="monthly_payment", headline_label="Monthly payment",
         vary="principal", table=_loan_table, steps=_loan_steps)(_loan_run)

_AUTO_IN = {"price": I("Vehicle price", 30000, "$"), "down_payment": I("Down payment", 5000, "$"),
            "rate": I("Interest rate", 7, "%"), "months": I("Term in months", 60, "months", positive=True)}


def _auto_run(price, down_payment, rate, months):
    if down_payment > price:
        raise ValueError("The down payment cannot be larger than the vehicle price.")
    amount = price - down_payment
    out = _loan_outputs(amount, rate, max(1, round(months)))
    return {"loan_amount": round(amount, 2), **out}


def _auto_table(price, down_payment, rate, months):
    return _yearly(_schedule(price - down_payment, rate, max(1, round(months))))


def _auto_steps(price, down_payment, rate, months):
    out = _auto_run(price, down_payment, rate, months)
    return [f"Amount financed = {_m(price)} price - {_m(down_payment)} down = {_m(out['loan_amount'])}.",
            f"Payment over {round(months)} months at {_p(rate)} a year uses the standard loan formula.",
            f"Monthly payment = {_m(out['monthly_payment'])}; total interest = {_m(out['total_interest'])}."]


register("auto_loan", inputs=_AUTO_IN, headline="monthly_payment", headline_label="Monthly car payment",
         vary="price", table=_auto_table, steps=_auto_steps)(_auto_run)

_AMORT_IN = {**_MORTGAGE_IN, "principal": I("Loan amount", 200000, "$"),
             "extra_payment": I("Extra monthly payment", 0, "$")}


def _amort_run(principal, rate, years, extra_payment):
    n = _n(years)
    base = _schedule(principal, rate, n)
    rows = _schedule(principal, rate, n, extra_payment)
    base_int, int_ = sum(r[1] for r in base), sum(r[1] for r in rows)
    return {"monthly_payment": round(_pmt(principal, rate, n), 2), "payoff_months": len(rows),
            "total_interest": round(int_, 2), "interest_saved": round(base_int - int_, 2),
            "months_saved": len(base) - len(rows)}


def _amort_table(principal, rate, years, extra_payment):
    return _yearly(_schedule(principal, rate, _n(years), extra_payment))


def _amort_steps(principal, rate, years, extra_payment):
    out = _amort_run(principal, rate, years, extra_payment)
    lines = [f"Each month, interest = balance x ({_p(rate)} / 12); the rest of the payment reduces the balance.",
             f"Scheduled payment = {_m(out['monthly_payment'])} on {_m(principal)} over {years:g} years."]
    if extra_payment:
        lines.append(f"Adding {_m(extra_payment)} a month pays the loan off in {out['payoff_months']} months "
                     f"and saves {_m(out['interest_saved'])} of interest.")
    else:
        lines.append(f"Total interest over the full term = {_m(out['total_interest'])}.")
    return lines


register("amortization", inputs=_AMORT_IN, headline="total_interest", headline_label="Total interest",
         vary="principal", table=_amort_table, steps=_amort_steps)(_amort_run)

# ----------------------------------------------------------- interest & growth ---------------
_CI_IN = {"principal": I("Starting amount", 10000, "$"), "rate": I("Interest rate", 5, "%"),
          "years": I("Years", 10, "years", positive=True),
          "compounds_per_year": I("Compounding periods per year", 12, "", positive=True, variable=False)}


def _ci_value(principal, rate, years, m):
    return principal * (1 + rate / 100 / m) ** (m * years)


def _ci_run(principal, rate, years, compounds_per_year):
    final = _ci_value(principal, rate, years, compounds_per_year)
    return {"final_amount": round(final, 2), "interest_earned": round(final - principal, 2)}


def _ci_table(principal, rate, years, compounds_per_year):
    rows, prev = [], principal
    for y in range(1, max(1, math.ceil(years)) + 1):
        bal = _ci_value(principal, rate, min(y, years), compounds_per_year)
        rows.append({"year": y, "balance": round(bal, 2), "interest": round(bal - prev, 2)})
        prev = bal
    return rows


def _ci_steps(principal, rate, years, compounds_per_year):
    out = _ci_run(principal, rate, years, compounds_per_year)
    return [f"Final amount = P x (1 + r/m)^(m x t) with P = {_m(principal)}, r = {_p(rate)}, "
            f"m = {compounds_per_year:g} periods a year, t = {years:g} years.",
            f"Final amount = {_m(out['final_amount'])}.",
            f"Interest earned = {_m(out['final_amount'])} - {_m(principal)} = {_m(out['interest_earned'])}."]


register("compound_interest", inputs=_CI_IN, headline="final_amount", headline_label="Final amount",
         vary="principal", table=_ci_table, steps=_ci_steps)(_ci_run)

_SI_IN = {"principal": I("Principal", 10000, "$"), "rate": I("Interest rate", 5, "%"),
          "years": I("Years", 3, "years", positive=True)}


def _si_run(principal, rate, years):
    interest = principal * rate / 100 * years
    return {"interest": round(interest, 2), "total": round(principal + interest, 2)}


def _si_table(principal, rate, years):
    return [{"year": y, "interest": round(principal * rate / 100 * y, 2),
             "total": round(principal * (1 + rate / 100 * y), 2)}
            for y in range(1, max(1, math.ceil(years)) + 1)]


def _si_steps(principal, rate, years):
    out = _si_run(principal, rate, years)
    return [f"Simple interest = principal x rate x time = {_m(principal)} x {_p(rate)} x {years:g} years.",
            f"Interest = {_m(out['interest'])}; total = {_m(out['total'])}."]


register("simple_interest", inputs=_SI_IN, headline="interest", headline_label="Interest earned",
         vary="principal", table=_si_table, steps=_si_steps)(_si_run)


def _growth_table(initial, deposit, rate, years):
    return [{"year": y, "balance": round(_fv(initial, deposit, rate, 12 * y), 2),
             "contributed": round(initial + deposit * 12 * y, 2)}
            for y in range(1, max(1, math.ceil(years)) + 1)]


_SAV_IN = {"initial": I("Starting balance", 1000, "$"), "monthly_deposit": I("Monthly deposit", 200, "$"),
           "rate": I("Interest rate", 4, "%"), "years": I("Years", 5, "years", positive=True)}


def _sav_run(initial, monthly_deposit, rate, years):
    n = _n(years)
    bal = _fv(initial, monthly_deposit, rate, n)
    put = initial + monthly_deposit * n
    return {"balance": round(bal, 2), "total_deposited": round(put, 2), "interest_earned": round(bal - put, 2)}


def _sav_table(initial, monthly_deposit, rate, years):
    return _growth_table(initial, monthly_deposit, rate, years)


def _sav_steps(initial, monthly_deposit, rate, years):
    out = _sav_run(initial, monthly_deposit, rate, years)
    return [f"Start with {_m(initial)} and add {_m(monthly_deposit)} each month for {years:g} years at "
            f"{_p(rate)} a year, compounded monthly.",
            f"Balance = start x (1 + r)^n + deposit x ((1 + r)^n - 1) / r, with r = rate / 12 and n = months.",
            f"Balance = {_m(out['balance'])}: {_m(out['total_deposited'])} deposited plus "
            f"{_m(out['interest_earned'])} interest."]


register("savings", inputs=_SAV_IN, headline="balance", headline_label="Balance at the end",
         vary="monthly_deposit", table=_sav_table, steps=_sav_steps)(_sav_run)

_GOAL_IN = {"goal": I("Savings goal", 10000, "$"), "initial": I("Starting balance", 0, "$"),
            "rate": I("Interest rate", 4, "%"), "years": I("Years", 5, "years", positive=True)}


def _goal_run(goal, initial, rate, years):
    n, r = _n(years), rate / 1200
    if r == 0:
        dep = (goal - initial) / n
    else:
        g = (1 + r) ** n
        dep = (goal - initial * g) * r / (g - 1)
    dep = max(0.0, dep)
    return {"monthly_deposit": round(dep, 2), "total_deposited": round(dep * n + initial, 2),
            "interest_earned": round(max(0.0, goal - initial - dep * n), 2)}


def _goal_table(goal, initial, rate, years):
    dep = _goal_run(goal, initial, rate, years)["monthly_deposit"]
    return _growth_table(initial, dep, rate, years)


def _goal_steps(goal, initial, rate, years):
    out = _goal_run(goal, initial, rate, years)
    return [f"Goal {_m(goal)} in {years:g} years from {_m(initial)} at {_p(rate)} a year, compounded monthly.",
            "Monthly deposit = (goal - start x (1 + r)^n) x r / ((1 + r)^n - 1); with a 0% rate it is "
            "(goal - start) / n.",
            f"Monthly deposit = {_m(out['monthly_deposit'])}."]


register("savings_goal", inputs=_GOAL_IN, headline="monthly_deposit", headline_label="Monthly deposit needed",
         vary="goal", table=_goal_table, steps=_goal_steps)(_goal_run)

_INV_IN = {"initial": I("Starting amount", 10000, "$"), "monthly_contribution": I("Monthly contribution", 500, "$"),
           "return_rate": I("Assumed annual return", 7, "%"), "years": I("Years", 20, "years", positive=True)}


def _inv_run(initial, monthly_contribution, return_rate, years):
    n = _n(years)
    fv = _fv(initial, monthly_contribution, return_rate, n)
    put = initial + monthly_contribution * n
    return {"future_value": round(fv, 2), "contributions": round(put, 2), "growth": round(fv - put, 2)}


def _inv_table(initial, monthly_contribution, return_rate, years):
    return _growth_table(initial, monthly_contribution, return_rate, years)


def _inv_steps(initial, monthly_contribution, return_rate, years):
    out = _inv_run(initial, monthly_contribution, return_rate, years)
    return [f"Assumed (illustrative) return {_p(return_rate)} a year, compounded monthly; real returns vary.",
            f"{_m(initial)} start + {_m(monthly_contribution)} a month for {years:g} years.",
            f"Future value = {_m(out['future_value'])}: {_m(out['contributions'])} contributed plus "
            f"{_m(out['growth'])} growth."]


register("investment", inputs=_INV_IN, headline="future_value", headline_label="Future value",
         vary="monthly_contribution", table=_inv_table, steps=_inv_steps)(_inv_run)

# ------------------------------------------------------------------ retirement --------------
_RET_IN = {"current_age": I("Current age", 30, "years", variable=False), "retirement_age": I("Retirement age", 65, "years", variable=False),
           "current_savings": I("Current savings", 20000, "$"),
           "monthly_contribution": I("Monthly contribution", 500, "$"),
           "return_rate": I("Assumed annual return", 6, "%"),
           "withdrawal_rate": I("Illustrative withdrawal rate", 4, "%")}


def _ret_years(current_age, retirement_age):
    if retirement_age <= current_age:
        raise ValueError("Retirement age must be greater than current age.")
    return retirement_age - current_age


def _ret_run(current_age, retirement_age, current_savings, monthly_contribution, return_rate, withdrawal_rate):
    years = _ret_years(current_age, retirement_age)
    n = _n(years)
    bal = _fv(current_savings, monthly_contribution, return_rate, n)
    put = current_savings + monthly_contribution * n
    annual = bal * withdrawal_rate / 100
    return {"balance_at_retirement": round(bal, 2), "total_contributed": round(put, 2),
            "growth": round(bal - put, 2), "annual_withdrawal": round(annual, 2),
            "monthly_withdrawal": round(annual / 12, 2)}


def _ret_table(current_age, retirement_age, current_savings, monthly_contribution, return_rate, withdrawal_rate):
    years = _ret_years(current_age, retirement_age)
    return [{"age": int(current_age) + y, **row}
            for y, row in enumerate(_growth_table(current_savings, monthly_contribution, return_rate, years), 1)]


def _ret_steps(current_age, retirement_age, current_savings, monthly_contribution, return_rate, withdrawal_rate):
    out = _ret_run(current_age, retirement_age, current_savings, monthly_contribution, return_rate, withdrawal_rate)
    years = _ret_years(current_age, retirement_age)
    return [f"Years to retirement = {retirement_age:g} - {current_age:g} = {years:g}.",
            f"Savings grow at an assumed {_p(return_rate)} a year, compounded monthly, with "
            f"{_m(monthly_contribution)} added each month.",
            f"Balance at retirement = {_m(out['balance_at_retirement'])}.",
            f"At an illustrative {_p(withdrawal_rate)} withdrawal rate that is {_m(out['annual_withdrawal'])} a year "
            f"({_m(out['monthly_withdrawal'])} a month). This is an assumption, not a safe-withdrawal guarantee."]


register("retirement", inputs=_RET_IN, headline="balance_at_retirement", headline_label="Savings at retirement",
         vary="monthly_contribution", table=_ret_table, steps=_ret_steps)(_ret_run)

_ROTH_IN = {"current_balance": I("Current balance", 5000, "$"),
            "annual_contribution": I("Contribution per year", 3000, "$"),
            "return_rate": I("Assumed annual return", 7, "%"), "years": I("Years", 30, "years", positive=True)}


def _roth_run(current_balance, annual_contribution, return_rate, years):
    n = _n(years)
    bal = _fv(current_balance, annual_contribution / 12, return_rate, n)
    put = current_balance + annual_contribution / 12 * n
    return {"balance": round(bal, 2), "contributions": round(put, 2), "growth": round(bal - put, 2)}


def _roth_table(current_balance, annual_contribution, return_rate, years):
    return _growth_table(current_balance, annual_contribution / 12, return_rate, years)


def _roth_steps(current_balance, annual_contribution, return_rate, years):
    out = _roth_run(current_balance, annual_contribution, return_rate, years)
    return [f"{_m(annual_contribution)} a year is added as {_m(annual_contribution / 12)} each month for "
            f"{years:g} years at an assumed {_p(return_rate)} a year.",
            f"Balance = {_m(out['balance'])}: {_m(out['contributions'])} contributed plus {_m(out['growth'])} growth.",
            "This calculation does not apply contribution limits, income limits or tax rules."]


register("roth_ira", inputs=_ROTH_IN, headline="balance", headline_label="Projected balance",
         vary="annual_contribution", table=_roth_table, steps=_roth_steps)(_roth_run)

_K401_IN = {"salary": I("Annual salary", 60000, "$"), "contribution_pct": I("Your contribution", 6, "%"),
            "employer_match_pct": I("Employer contribution", 3, "%"),
            "return_rate": I("Assumed annual return", 6, "%"), "years": I("Years", 30, "years", positive=True),
            "current_balance": I("Current balance", 0, "$")}


def _k401_run(salary, contribution_pct, employer_match_pct, return_rate, years, current_balance):
    n = _n(years)
    mine, theirs = salary * contribution_pct / 1200, salary * employer_match_pct / 1200
    bal = _fv(current_balance, mine + theirs, return_rate, n)
    put = current_balance + (mine + theirs) * n
    return {"balance": round(bal, 2), "employee_total": round(mine * n, 2),
            "employer_total": round(theirs * n, 2), "growth": round(bal - put, 2),
            "annual_total": round((mine + theirs) * 12, 2)}


def _k401_table(salary, contribution_pct, employer_match_pct, return_rate, years, current_balance):
    return _growth_table(current_balance, salary * (contribution_pct + employer_match_pct) / 1200,
                         return_rate, years)


def _k401_steps(salary, contribution_pct, employer_match_pct, return_rate, years, current_balance):
    out = _k401_run(salary, contribution_pct, employer_match_pct, return_rate, years, current_balance)
    return [f"You add {_p(contribution_pct)} of {_m(salary)} and the employer adds {_p(employer_match_pct)}: "
            f"{_m(out['annual_total'])} a year in total.",
            f"Contributions grow at an assumed {_p(return_rate)} a year, compounded monthly, for {years:g} years.",
            f"Balance = {_m(out['balance'])}. Salary growth and plan limits are not modelled."]


register("k401", inputs=_K401_IN, headline="balance", headline_label="Projected 401(k) balance",
         vary="salary", table=_k401_table, steps=_k401_steps)(_k401_run)

_CD_IN = {"deposit": I("Deposit", 10000, "$"), "rate": I("Interest rate", 4.5, "%"),
          "months": I("Term in months", 24, "months", positive=True)}


def _cd_value(deposit, rate, months):
    return deposit * (1 + rate / 1200) ** months


def _cd_run(deposit, rate, months):
    v = _cd_value(deposit, rate, months)
    return {"maturity_value": round(v, 2), "interest_earned": round(v - deposit, 2)}


def _cd_table(deposit, rate, months):
    ends = list(range(12, int(months), 12)) + [months]
    return [{"months": m, "balance": round(_cd_value(deposit, rate, m), 2),
             "interest": round(_cd_value(deposit, rate, m) - deposit, 2)} for m in ends]


def _cd_steps(deposit, rate, months):
    out = _cd_run(deposit, rate, months)
    return [f"Value at maturity = deposit x (1 + rate/12)^months = {_m(deposit)} x (1 + {_p(rate)}/12)^{months:g}.",
            f"Maturity value = {_m(out['maturity_value'])}; interest = {_m(out['interest_earned'])}.",
            "Monthly compounding is assumed; banks may compound differently."]


register("cd", inputs=_CD_IN, headline="maturity_value", headline_label="Value at maturity",
         vary="deposit", table=_cd_table, steps=_cd_steps)(_cd_run)

_ANN_IN = {"payment": I("Payment per month", 1000, "$"), "rate": I("Interest rate", 5, "%"),
           "years": I("Years", 20, "years", positive=True)}


def _ann_run(payment, rate, years):
    n, r = _n(years), rate / 1200
    fv = _fv(0, payment, rate, n)
    pv = payment * n if r == 0 else payment * (1 - (1 + r) ** -n) / r
    return {"future_value": round(fv, 2), "present_value": round(pv, 2), "total_paid": round(payment * n, 2)}


def _ann_table(payment, rate, years):
    return _growth_table(0, payment, rate, years)


def _ann_steps(payment, rate, years):
    out = _ann_run(payment, rate, years)
    return [f"Payments of {_m(payment)} at the end of each month for {years:g} years at {_p(rate)} a year.",
            "Future value = payment x ((1 + r)^n - 1) / r; present value = payment x (1 - (1 + r)^-n) / r.",
            f"Future value = {_m(out['future_value'])}; present value = {_m(out['present_value'])}."]


register("annuity", inputs=_ANN_IN, headline="future_value", headline_label="Future value",
         vary="payment", table=_ann_table, steps=_ann_steps)(_ann_run)

# ------------------------------------------------------------------------ debt ---------------
_CC_IN = {"balance": I("Balance", 5000, "$", positive=True), "apr": I("APR", 18, "%"),
          "monthly_payment": I("Monthly payment", 200, "$", positive=True)}


def _cc_run(balance, apr, monthly_payment):
    rows = _payoff(balance, apr, monthly_payment)
    interest = sum(r[1] for r in rows)
    return {"months": len(rows), "payoff_years": round(len(rows) / 12, 1),
            "total_interest": round(interest, 2), "total_paid": round(balance + interest, 2)}


def _cc_table(balance, apr, monthly_payment):
    return _yearly(_payoff(balance, apr, monthly_payment))


def _cc_steps(balance, apr, monthly_payment):
    out = _cc_run(balance, apr, monthly_payment)
    return [f"Each month interest = balance x ({_p(apr)} / 12), then {_m(monthly_payment)} is paid.",
            f"The balance of {_m(balance)} reaches zero after {out['months']} months.",
            f"Total interest = {_m(out['total_interest'])}; total paid = {_m(out['total_paid'])}."]


register("credit_card_payoff", inputs=_CC_IN, headline="months", headline_label="Months to pay off",
         vary="monthly_payment", table=_cc_table, steps=_cc_steps)(_cc_run)

_DEBT_IN = {"balance": I("Balance", 15000, "$", positive=True), "rate": I("Interest rate", 19, "%"),
            "minimum_payment": I("Minimum monthly payment", 400, "$", positive=True),
            "extra_payment": I("Extra monthly payment", 200, "$")}


def _debt_run(balance, rate, minimum_payment, extra_payment):
    base = _payoff(balance, rate, minimum_payment)
    fast = _payoff(balance, rate, minimum_payment + extra_payment)
    bi, fi = sum(r[1] for r in base), sum(r[1] for r in fast)
    return {"months_minimum": len(base), "months_with_extra": len(fast),
            "months_saved": len(base) - len(fast), "interest_minimum": round(bi, 2),
            "interest_with_extra": round(fi, 2), "interest_saved": round(bi - fi, 2)}


def _debt_table(balance, rate, minimum_payment, extra_payment):
    return _yearly(_payoff(balance, rate, minimum_payment + extra_payment))


def _debt_steps(balance, rate, minimum_payment, extra_payment):
    out = _debt_run(balance, rate, minimum_payment, extra_payment)
    return [f"Paying only the minimum of {_m(minimum_payment)} clears {_m(balance)} in {out['months_minimum']} months "
            f"with {_m(out['interest_minimum'])} interest.",
            f"Paying {_m(minimum_payment + extra_payment)} a month clears it in {out['months_with_extra']} months "
            f"with {_m(out['interest_with_extra'])} interest.",
            f"The extra {_m(extra_payment)} a month saves {out['months_saved']} months and {_m(out['interest_saved'])}."]


register("debt_payoff", inputs=_DEBT_IN, headline="months_with_extra", headline_label="Months to debt-free",
         vary="extra_payment", table=_debt_table, steps=_debt_steps)(_debt_run)

_EF_IN = {"monthly_expenses": I("Monthly essential expenses", 3000, "$"),
          "months_covered": I("Months of cover you want", 6, "months", positive=True, variable=False),
          "current_savings": I("Current savings", 2000, "$"), "monthly_saving": I("Saved per month", 300, "$")}


def _ef_run(monthly_expenses, months_covered, current_savings, monthly_saving):
    target = monthly_expenses * months_covered
    short = max(0.0, target - current_savings)
    months = 0 if short == 0 else (math.ceil(short / monthly_saving) if monthly_saving > 0 else None)
    return {"target": round(target, 2), "shortfall": round(short, 2), "months_to_goal": months}


def _ef_table(monthly_expenses, months_covered, current_savings, monthly_saving):
    return [{"months_covered": m, "target": round(monthly_expenses * m, 2),
             "shortfall": round(max(0.0, monthly_expenses * m - current_savings), 2)} for m in (3, 4, 5, 6, 9, 12)]


def _ef_steps(monthly_expenses, months_covered, current_savings, monthly_saving):
    out = _ef_run(monthly_expenses, months_covered, current_savings, monthly_saving)
    lines = [f"Target = {_m(monthly_expenses)} x {months_covered:g} months = {_m(out['target'])}.",
             f"Shortfall = {_m(out['target'])} - {_m(current_savings)} = {_m(out['shortfall'])}."]
    if out["months_to_goal"] is None:
        lines.append("With nothing saved each month the goal is not reached.")
    else:
        lines.append(f"Saving {_m(monthly_saving)} a month reaches it in {out['months_to_goal']} months.")
    return lines


register("emergency_fund", inputs=_EF_IN, headline="target", headline_label="Emergency fund target",
         vary="monthly_expenses", table=_ef_table, steps=_ef_steps)(_ef_run)

# ------------------------------------------------------- everyday money -------------------------
_INF_IN = {"amount": I("Amount today", 1000, "$"), "rate": I("Assumed annual inflation", 3, "%"),
           "years": I("Years", 10, "years", positive=True)}


def _inf_run(amount, rate, years):
    f = (1 + rate / 100) ** years
    return {"future_cost": round(amount * f, 2), "purchasing_power": round(amount / f, 2),
            "value_lost": round(amount - amount / f, 2)}


def _inf_table(amount, rate, years):
    return [{"year": y, "future_cost": round(amount * (1 + rate / 100) ** y, 2),
             "purchasing_power": round(amount / (1 + rate / 100) ** y, 2)}
            for y in range(1, max(1, math.ceil(years)) + 1)]


def _inf_steps(amount, rate, years):
    out = _inf_run(amount, rate, years)
    return [f"At an assumed (illustrative) {_p(rate)} inflation a year, prices rise by (1 + rate)^years over {years:g} years.",
            f"What costs {_m(amount)} today would cost {_m(out['future_cost'])}.",
            f"Or {_m(amount)} then would buy what {_m(out['purchasing_power'])} buys today."]


register("inflation", inputs=_INF_IN, headline="future_cost", headline_label="Future cost",
         vary="amount", table=_inf_table, steps=_inf_steps)(_inf_run)

_DISC_IN = {"price": I("Original price", 80, "$"), "discount_pct": I("Discount", 25, "%")}


def _disc_run(price, discount_pct):
    if discount_pct > 100:
        raise ValueError("A discount cannot be more than 100%.")
    s = price * discount_pct / 100
    return {"savings": round(s, 2), "final_price": round(price - s, 2)}


def _disc_table(price, discount_pct):
    return [{"discount_pct": d, "savings": round(price * d / 100, 2), "final_price": round(price * (1 - d / 100), 2)}
            for d in (10, 15, 20, 25, 30, 40, 50)]


def _disc_steps(price, discount_pct):
    out = _disc_run(price, discount_pct)
    return [f"Savings = price x discount = {_m(price)} x {_p(discount_pct)} = {_m(out['savings'])}.",
            f"Final price = {_m(price)} - {_m(out['savings'])} = {_m(out['final_price'])}."]


register("discount", inputs=_DISC_IN, headline="final_price", headline_label="Price after discount",
         vary="price", table=_disc_table, steps=_disc_steps)(_disc_run)

_TAX_IN = {"price": I("Price before tax", 100, "$"), "tax_rate": I("Sales tax rate (example)", 7, "%")}


def _tax_run(price, tax_rate):
    t = price * tax_rate / 100
    return {"tax": round(t, 2), "total": round(price + t, 2)}


def _tax_table(price, tax_rate):
    return [{"tax_rate": r, "tax": round(price * r / 100, 2), "total": round(price * (1 + r / 100), 2)}
            for r in (4, 5, 6, 7, 8, 9, 10)]


def _tax_steps(price, tax_rate):
    out = _tax_run(price, tax_rate)
    return [f"Tax = price x rate = {_m(price)} x {_p(tax_rate)} = {_m(out['tax'])}.",
            f"Total = {_m(price)} + {_m(out['tax'])} = {_m(out['total'])}. Use your local rate; {_p(tax_rate)} is an example."]


register("sales_tax", inputs=_TAX_IN, headline="total", headline_label="Total with tax",
         vary="price", table=_tax_table, steps=_tax_steps)(_tax_run)

_VAT_IN = {"net_price": I("Price before VAT", 200, "$"), "vat_rate": I("VAT rate (example)", 20, "%")}


def _vat_run(net_price, vat_rate):
    v = net_price * vat_rate / 100
    return {"vat_amount": round(v, 2), "gross": round(net_price + v, 2)}


def _vat_table(net_price, vat_rate):
    return [{"vat_rate": r, "vat_amount": round(net_price * r / 100, 2), "gross": round(net_price * (1 + r / 100), 2)}
            for r in (5, 10, 15, 20, 25)]


def _vat_steps(net_price, vat_rate):
    out = _vat_run(net_price, vat_rate)
    return [f"VAT = net price x rate = {_m(net_price)} x {_p(vat_rate)} = {_m(out['vat_amount'])}.",
            f"Price including VAT = {_m(out['gross'])}. Use the rate that applies to your goods; {_p(vat_rate)} is an example."]


register("vat", inputs=_VAT_IN, headline="gross", headline_label="Price including VAT",
         vary="net_price", table=_vat_table, steps=_vat_steps)(_vat_run)

_COM_IN = {"sales_amount": I("Sales amount", 50000, "$"), "commission_rate": I("Commission rate", 5, "%"),
           "base_pay": I("Base pay", 0, "$")}


def _com_run(sales_amount, commission_rate, base_pay):
    c = sales_amount * commission_rate / 100
    return {"commission": round(c, 2), "total_pay": round(c + base_pay, 2)}


def _com_table(sales_amount, commission_rate, base_pay):
    return [{"commission_rate": r, "commission": round(sales_amount * r / 100, 2),
             "total_pay": round(sales_amount * r / 100 + base_pay, 2)} for r in (2, 3, 5, 7, 10)]


def _com_steps(sales_amount, commission_rate, base_pay):
    out = _com_run(sales_amount, commission_rate, base_pay)
    return [f"Commission = sales x rate = {_m(sales_amount)} x {_p(commission_rate)} = {_m(out['commission'])}.",
            f"Total pay = commission + base pay = {_m(out['commission'])} + {_m(base_pay)} = {_m(out['total_pay'])}."]


register("commission", inputs=_COM_IN, headline="commission", headline_label="Commission earned",
         vary="sales_amount", table=_com_table, steps=_com_steps)(_com_run)

_DTI_IN = {"monthly_debt": I("Monthly debt payments", 1500, "$"),
           "gross_monthly_income": I("Gross monthly income", 5000, "$", positive=True)}


def _dti_run(monthly_debt, gross_monthly_income):
    return {"dti_pct": round(monthly_debt / gross_monthly_income * 100, 2)}


def _dti_table(monthly_debt, gross_monthly_income):
    return [{"monthly_debt": round(monthly_debt * f, 2),
             "dti_pct": round(monthly_debt * f / gross_monthly_income * 100, 2)} for f in (0.5, 0.75, 1, 1.25, 1.5)]


def _dti_steps(monthly_debt, gross_monthly_income):
    out = _dti_run(monthly_debt, gross_monthly_income)
    return [f"Debt-to-income = monthly debt / gross monthly income = {_m(monthly_debt)} / {_m(gross_monthly_income)}.",
            f"Ratio = {_p(out['dti_pct'])}. Lenders set their own limits, so check with yours."]


register("dti", inputs=_DTI_IN, headline="dti_pct", headline_label="Debt-to-income ratio (%)",
         vary="monthly_debt", table=_dti_table, steps=_dti_steps)(_dti_run)

_RY_IN = {"property_price": I("Property price", 250000, "$", positive=True), "annual_rent": I("Annual rent", 18000, "$"),
          "annual_costs": I("Annual costs", 4000, "$")}


def _ry_run(property_price, annual_rent, annual_costs):
    net = annual_rent - annual_costs
    return {"gross_yield_pct": round(annual_rent / property_price * 100, 2),
            "net_yield_pct": round(net / property_price * 100, 2), "net_income": round(net, 2)}


def _ry_table(property_price, annual_rent, annual_costs):
    return [{"annual_rent": round(annual_rent * f, 2),
             "gross_yield_pct": round(annual_rent * f / property_price * 100, 2),
             "net_yield_pct": round((annual_rent * f - annual_costs) / property_price * 100, 2)}
            for f in (0.8, 0.9, 1, 1.1, 1.2)]


def _ry_steps(property_price, annual_rent, annual_costs):
    out = _ry_run(property_price, annual_rent, annual_costs)
    return [f"Gross yield = annual rent / price = {_m(annual_rent)} / {_m(property_price)} = {_p(out['gross_yield_pct'])}.",
            f"Net income = {_m(annual_rent)} - {_m(annual_costs)} costs = {_m(out['net_income'])}.",
            f"Net yield = {_m(out['net_income'])} / {_m(property_price)} = {_p(out['net_yield_pct'])}."]


register("rental_yield", inputs=_RY_IN, headline="gross_yield_pct", headline_label="Gross rental yield (%)",
         vary="annual_rent", table=_ry_table, steps=_ry_steps)(_ry_run)

_REFI_IN = {"balance": I("Current balance", 300000, "$", positive=True), "current_rate": I("Current rate", 7, "%"),
            "new_rate": I("New rate", 6, "%"), "remaining_years": I("Years left on current loan", 28, "years", positive=True),
            "new_years": I("New loan term in years", 30, "years", positive=True),
            "closing_costs": I("Closing costs", 6000, "$")}


def _refi_run(balance, current_rate, new_rate, remaining_years, new_years, closing_costs):
    n1, n2 = _n(remaining_years), _n(new_years)
    p1, p2 = _pmt(balance, current_rate, n1), _pmt(balance, new_rate, n2)
    saving = p1 - p2
    return {"current_payment": round(p1, 2), "new_payment": round(p2, 2), "monthly_saving": round(saving, 2),
            "breakeven_months": round(closing_costs / saving, 1) if saving > 0 else None,
            "lifetime_difference": round((p1 * n1) - (p2 * n2) - closing_costs, 2)}


def _refi_table(balance, current_rate, new_rate, remaining_years, new_years, closing_costs):
    s = _refi_run(balance, current_rate, new_rate, remaining_years, new_years, closing_costs)["monthly_saving"]
    return [{"year": y, "net_savings": round(s * 12 * y - closing_costs, 2)} for y in range(1, 6)]


def _refi_steps(balance, current_rate, new_rate, remaining_years, new_years, closing_costs):
    out = _refi_run(balance, current_rate, new_rate, remaining_years, new_years, closing_costs)
    lines = [f"Current payment on {_m(balance)} at {_p(current_rate)}: {_m(out['current_payment'])}; "
             f"new payment at {_p(new_rate)} over {new_years:g} years: {_m(out['new_payment'])}.",
             f"Monthly change = {_m(out['monthly_saving'])}."]
    if out["breakeven_months"] is None:
        lines.append("The new payment is not lower, so closing costs are never earned back through the payment.")
    else:
        lines.append(f"Break-even = {_m(closing_costs)} closing costs / {_m(out['monthly_saving'])} = "
                     f"{out['breakeven_months']:g} months.")
    return lines


register("refinance", inputs=_REFI_IN, headline="monthly_saving", headline_label="Monthly payment change",
         vary="balance", table=_refi_table, steps=_refi_steps)(_refi_run)
