#!/usr/bin/env python3
"""Fail if official LBTT/LTT examples disappear from the indexable pages.

Issues #33, #36 and #37: a redesign wiped the Revenue Scotland £465,000
case while llms.txt still cited it. These strings must stay in the HTML
outside embed-only copies.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
CHECKS = {
    "financial/scotland-lbtt-calculator.html": [
        "Scotland Stamp Duty Calculator (LBTT)",
        "465,000",
        "11,750",
        "872,000",
        "32,100",
        "62,990",
        "197,000",
        "16,800",
        "150,000",
    ],
    "financial/wales-ltt-calculator.html": [
        "Wales Stamp Duty Calculator (LTT)",
        "300,000",
        "2,750",
        "280,000",
        "3,300",
        "historical",
        "22 December 2020",
    ],
}

failed = False
for rel, needles in CHECKS.items():
    text = (ROOT / rel).read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            print(f"MISSING {rel}: {needle}")
            failed = True
        else:
            print(f"ok {rel}: {needle}")

sys.exit(1 if failed else 0)
