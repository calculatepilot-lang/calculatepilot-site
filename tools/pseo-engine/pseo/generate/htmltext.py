"""Small HTML text helpers shared by the page tests and the quality gates."""
from __future__ import annotations

import re
from html.parser import HTMLParser

NUM = re.compile(r"\d(?:[\d,]*\d)?(?:\.\d+)?")


class _Text(HTMLParser):
    def __init__(self, section: str | None = None):
        super().__init__(convert_charrefs=True)
        self.section, self.parts = section, []
        self._skip = 0
        self._in = section is None
        self._depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style", "head", "title"):
            self._skip += 1
            return
        if self.section is not None and tag == "section":
            if self._in:
                self._depth += 1
            elif a.get("id") == self.section:
                self._in, self._depth = True, 1

    def handle_endtag(self, tag):
        if tag in ("script", "style", "head", "title"):
            self._skip = max(0, self._skip - 1)
            return
        if self.section is not None and tag == "section" and self._in:
            self._depth -= 1
            if self._depth == 0:
                self._in = False

    def handle_data(self, data):
        if self._in and not self._skip and data.strip():
            self.parts.append(data.strip())


def _run(html: str, section: str | None) -> str:
    p = _Text(section)
    p.feed(html)
    return re.sub(r"\s+", " ", " ".join(p.parts)).strip()


def visible_text(html: str) -> str:
    """Text a reader sees: no head, scripts, styles or JSON-LD."""
    return _run(html, None)


def section_text(html: str, section_id: str) -> str:
    return _run(html, section_id)


def section_html(html: str, section_id: str) -> str:
    """Raw markup of one <section id=...> (sections are never nested in generated pages)."""
    m = re.search(rf'<section id="{re.escape(section_id)}">(.*?)</section>', html, re.S)
    return m.group(1) if m else ""


def links(fragment: str) -> list[str]:
    """href values of every anchor in an HTML fragment."""
    return re.findall(r'<a\s[^>]*href="([^"]*)"', fragment)
