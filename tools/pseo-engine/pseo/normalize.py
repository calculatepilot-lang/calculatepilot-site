"""Keyword normalization, tokenizing and the long-tail test."""
from __future__ import annotations

import re

STOP_WORDS = frozenset(
    "a an the of to in on for and or is are was were be what how do does did i my me we our "
    "you your can could should would will with at by from it its this that as if when".split()
)
# Words that signal a specific situation (spec section 7).
SITUATION_WORDS = frozenset("for with without after before if when per vs".split())


def normalize(text: str) -> str:
    t = text.lower()
    t = re.sub(r"(?<=\d),(?=\d)", "", t)           # 250,000 -> 250000
    t = re.sub(r"(?<!\d)\.|\.(?!\d)", " ", t)       # keep only decimal points
    t = re.sub(r"[^a-z0-9$%. ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def words(text: str) -> list[str]:
    return normalize(text).split()


def tokens(text: str) -> list[str]:
    return [w for w in words(text) if w not in STOP_WORDS]


def is_long_tail(text: str) -> bool:
    ws = words(text)
    if len(tokens(text)) >= 4:
        return True
    return any(w in SITUATION_WORDS for w in ws[1:]) and len(ws) >= 3
