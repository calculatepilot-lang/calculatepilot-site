"""Community question sources: Reddit, Hacker News, Stack Exchange (public endpoints)."""
from __future__ import annotations

import html
import json

from .base import Source

MIN_WORDS, MAX_WORDS = 3, 12


def _keep(titles) -> list[str]:
    out = []
    for t in titles:
        if not isinstance(t, str):
            continue
        t = html.unescape(t).strip()
        if MIN_WORDS <= len(t.split()) <= MAX_WORDS:
            out.append(t)
    return out


class _JsonSource(Source):
    url = ""

    def _params(self, query: str) -> dict:  # pragma: no cover
        raise NotImplementedError

    def _titles(self, data) -> list:  # pragma: no cover
        raise NotImplementedError

    def fetch(self, query: str) -> list[str]:
        text = self._body(self.url, self._params(query))
        if text is None:
            return []
        try:
            return _keep(self._titles(json.loads(text)))
        except (ValueError, KeyError, TypeError, AttributeError):
            return self._fail_parse()


class RedditSource(_JsonSource):
    name = "reddit"
    url = "https://www.reddit.com/search.json"

    def _params(self, query):
        return {"q": query, "limit": 25, "sort": "relevance"}

    def _titles(self, data):
        return [c["data"].get("title") for c in data["data"]["children"]]


class HNSource(_JsonSource):
    name = "hn"
    url = "https://hn.algolia.com/api/v1/search"

    def _params(self, query):
        return {"query": query, "tags": "story", "hitsPerPage": 25}

    def _titles(self, data):
        return [h.get("title") for h in data["hits"]]


class StackExchangeSource(_JsonSource):
    name = "stackexchange"
    url = "https://api.stackexchange.com/2.3/search/advanced"

    def _params(self, query):
        return {"q": query, "site": "money", "pagesize": 25, "order": "desc", "sort": "relevance"}

    def _titles(self, data):
        return [i.get("title") for i in data["items"]]
