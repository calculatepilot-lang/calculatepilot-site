"""Rule-based search-intent classifier (ordered rules, first match wins)."""
from __future__ import annotations

import re

from .. import store

_UNITS = (r"(?:inch(?:es)?|in|cm|mm|m|km|mile|miles|mi|ft|feet|yards?|kg|g|lbs?|pounds?|oz|"
          r"ounces?|liters?|litres?|l|ml|gallons?|gal|celsius|fahrenheit|c|f|kelvin|mph|kph|"
          r"hours?|minutes?|seconds?|days?|weeks?|months?|years?|bytes?|kb|mb|gb)")

# (label, rule_name, regex, confidence)
RULES: list[tuple[str, str, re.Pattern, float]] = [
    ("navigational", "navigational:brand", re.compile(r"\bcalculate\s*pilot\b"), 0.95),
    ("compare", "compare:vs", re.compile(r"\b(?:vs|versus)\b"), 0.9),
    ("compare", "compare:difference", re.compile(r"\bdifference between\b"), 0.9),
    ("compare", "compare:or", re.compile(r"\w+ or \w+"), 0.6),
    ("learn", "learn:what_is", re.compile(r"\bwhat (?:is|are)\b"), 0.85),
    ("learn", "learn:how_does", re.compile(r"\bhow (?:does|do)\b"), 0.8),
    ("learn", "learn:formula", re.compile(r"\b(?:formula|explained|meaning|definition)\b"), 0.8),
    ("convert", "convert:verb", re.compile(r"\bconvert(?:er|ing)?\b"), 0.9),
    ("convert", "convert:units", re.compile(rf"\b{_UNITS} to {_UNITS}\b"), 0.85),
    ("calculate", "calculate:word", re.compile(r"\bcalculat(?:or|e|ing|ion)\b"), 0.9),
    ("calculate", "calculate:how_much", re.compile(r"\bhow much\b"), 0.75),
    ("calculate", "calculate:payment", re.compile(r"\b(?:monthly )?payment\b|\bestimate\b"), 0.7),
]


def classify(text: str) -> tuple[str, float, str]:
    t = text.lower()
    for label, rule, pat, conf in RULES:
        if pat.search(t):
            return label, conf, rule
    return "other", 0.3, "default"


def run(conn) -> int:
    """Classify active keywords that have no intent row yet; returns rows written."""
    done = {r[0] for r in conn.execute("SELECT keyword_id FROM intent")}
    n = 0
    for kw in store.active_keywords(conn):
        if kw["id"] in done:
            continue
        label, conf, rule = classify(kw["text"])
        conn.execute("INSERT INTO intent(keyword_id,label,confidence,rule) VALUES(?,?,?,?)",
                     (kw["id"], label, conf, rule))
        n += 1
    conn.commit()
    return n
