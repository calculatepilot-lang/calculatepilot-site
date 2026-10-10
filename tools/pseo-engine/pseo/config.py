"""Load settings and the calculator list."""
from __future__ import annotations

from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path

import yaml

DEFAULTS: dict = {
    "site_url": "https://calculatepilot.com",
    "pilot_cap": 25,
    "numeric_variant_cap": 5,
    "request_delay": 1.0,
    "similarity_max": 0.40,
    "cluster_threshold": 0.6,
    "intitle_budget": 100,
    "intitle_cache_days": 30,
    "harvest_budget": 400,
    "letters": False,
    "requery_days": 14,
    "facts_sla_days": 180,
    "guide_dir": "guides",
    "sources": {
        "google": True, "bing": True, "youtube": True, "ddg": True,
        "reddit": True, "hn": True, "stackexchange": True,
    },
}


@dataclass
class Calculator:
    slug: str
    name: str
    category: str
    url: str
    aliases: list[str] = field(default_factory=list)
    formula_id: str | None = None


def load_settings(path: str | Path | None) -> dict:
    data: dict = {}
    if path and Path(path).exists():
        data = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or {}
    merged = {**DEFAULTS, **data}
    merged["sources"] = {**DEFAULTS["sources"], **(data.get("sources") or {})}
    return merged


def load_calculators(path: str | Path) -> list[Calculator]:
    rows = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or []
    return [
        Calculator(
            slug=r["slug"],
            name=r["name"],
            category=r.get("category", "uncategorized"),
            url=r.get("url", f"/{r['slug']}.html"),
            aliases=list(r.get("aliases") or []),
            formula_id=r.get("formula_id"),
        )
        for r in rows
    ]


class _SitemapParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.category = "uncategorized"
        self.links: list[tuple[str, str, str]] = []
        self._heading = False
        self._buf = ""
        self._href: str | None = None

    def handle_starttag(self, tag, attrs):
        if tag in ("h1", "h2", "h3", "h4"):
            self._heading, self._buf = True, ""
        elif tag == "a":
            self._href = dict(attrs).get("href")
            self._buf = ""

    def handle_data(self, data):
        if self._heading or self._href is not None:
            self._buf += data

    def handle_endtag(self, tag):
        if tag in ("h1", "h2", "h3", "h4") and self._heading:
            self._heading = False
            text = self._buf.strip().lower()
            if text:
                self.category = text
        elif tag == "a" and self._href is not None:
            self.links.append((self._href, self._buf.strip(), self.category))
            self._href = None


_KINDS = ("calculator", "converter", "calc")


def calculators_from_sitemap_html(html: str, base_url: str) -> list[Calculator]:
    parser = _SitemapParser()
    parser.feed(html)
    out: list[Calculator] = []
    seen: set[str] = set()
    for href, text, category in parser.links:
        name = href.rstrip("/").rsplit("/", 1)[-1]
        slug = name.rsplit(".", 1)[0] if "." in name else name
        if not slug or slug in seen or not any(k in slug for k in _KINDS):
            continue
        seen.add(slug)
        url = href if href.startswith("http") else base_url.rstrip("/") + "/" + href.lstrip("/")
        out.append(Calculator(slug=slug, name=text or slug.replace("-", " ").title(),
                              category=category, url=url))
    return out
