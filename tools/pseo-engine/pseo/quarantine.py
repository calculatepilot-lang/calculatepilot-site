"""Suspicious-keyword quarantine (spec section 6).

A quarantined keyword is stored for audit but never clustered, scored or turned into a page.
Built-in term lists below can be extended (not replaced) by config/quarantine_terms.yml.
"""
from __future__ import annotations

import re
from pathlib import Path

import yaml

from . import normalize

DEFAULT_TERMS: dict[str, list[str]] = {
    "adult": ["porn", "xxx", "nude", "nsfw", "sex", "escort", "onlyfans", "hentai", "erotic"],
    "gambling": ["casino", "sportsbook", "betting odds", "online betting", "poker", "slot machine",
                 "gambling"],
    "piracy": ["crack", "cracked", "keygen", "torrent", "pirated", "warez", "serial key",
               "free download full version"],
    "scam": ["get rich quick", "make money fast", "free money", "easy money", "ponzi",
             "pyramid scheme", "passive income overnight", "work from home no experience"],
    "malware": ["malware", "ransomware", "trojan", "keylogger", "ddos", "hack account",
                "hack wifi", "hacking tool"],
    "miracle_claim": ["miracle cure", "guaranteed returns", "guaranteed profit",
                      "double your money", "risk free profit", "cure cancer"],
    "brand_hijack": ["bankrate", "nerdwallet", "calculator net", "omni calculator",
                     "omnicalculator", "calculatorsoup", "calculator soup", "investopedia",
                     "zillow", "rocket mortgage", "quicken loans", "wells fargo", "bank of america",
                     "chase bank", "paypal", "turbotax", "h r block"],
}
TERM_ORDER = ["adult", "gambling", "piracy", "scam", "malware", "miracle_claim", "brand_hijack"]
MAX_WORDS = 12

_MARKUP = re.compile(r"<[^>]*>|<\s*/|javascript:|&lt;|&gt;", re.I)
_URL = re.compile(r"https?://|www\.|\b[\w-]+\.(?:com|net|org|io|co|info|xyz|biz|ru|cn|example)\b", re.I)
_EMAIL = re.compile(r"\S+@\S+\.\S+")
_CHAR_SPAM = re.compile(r"([a-z!?$%])\1{3,}")

_extra: dict[str, list[str]] = {}
_compiled: dict[str, re.Pattern] | None = None


def load_extra(path: str | Path | None) -> None:
    """Add owner terms from a YAML file ({rule: [terms]}); None resets to built-ins."""
    global _extra, _compiled
    _extra = {}
    if path and Path(path).exists():
        data = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or {}
        _extra = {k: [str(t) for t in v] for k, v in data.items() if isinstance(v, list)}
    _compiled = None


def _patterns() -> dict[str, re.Pattern]:
    global _compiled
    if _compiled is None:
        _compiled = {}
        rules = list(TERM_ORDER) + [r for r in _extra if r not in TERM_ORDER]
        for rule in rules:
            terms = DEFAULT_TERMS.get(rule, []) + _extra.get(rule, [])
            alts = [re.escape(normalize.normalize(t)) for t in terms if normalize.normalize(t)]
            if alts:
                _compiled[rule] = re.compile(
                    r"(?<![a-z0-9])(?:" + "|".join(alts) + r")(?![a-z0-9])")
    return _compiled


def reason(text: str) -> str | None:
    """Return the rule that fired for this keyword, or None if it looks clean."""
    if _MARKUP.search(text):
        return "markup"
    if _URL.search(text) or _EMAIL.search(text):
        return "url_or_email"
    norm = normalize.normalize(text)
    if len(norm.split()) > MAX_WORDS:
        return "too_long"
    if _CHAR_SPAM.search(text.lower()):
        return "char_spam"
    for rule, pat in _patterns().items():
        if pat.search(norm):
            return rule
    return None
