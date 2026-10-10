"""Search-engine autocomplete sources (public suggest endpoints)."""
from __future__ import annotations

import json
import re

from .base import Source


def _suggestions_from_opensearch(text: str) -> list[str] | None:
    try:
        data = json.loads(text)
        items = data[1]
        return [str(i) for i in items if isinstance(i, str)]
    except (ValueError, IndexError, TypeError, KeyError):
        return None


class _OpenSearchSource(Source):
    url = ""

    def _params(self, query: str) -> dict:  # pragma: no cover
        raise NotImplementedError

    def fetch(self, query: str) -> list[str]:
        text = self._body(self.url, self._params(query))
        if text is None:
            return []
        out = _suggestions_from_opensearch(text)
        return self._fail_parse() if out is None else out


class GoogleAC(_OpenSearchSource):
    name = "google"
    url = "https://suggestqueries.google.com/complete/search"

    def _params(self, query):
        return {"client": "firefox", "q": query}


class BingAC(_OpenSearchSource):
    name = "bing"
    url = "https://api.bing.com/osjson.aspx"

    def _params(self, query):
        return {"query": query}


class YouTubeAC(Source):
    name = "youtube"
    url = "https://suggestqueries.google.com/complete/search"

    def fetch(self, query: str) -> list[str]:
        text = self._body(self.url, {"client": "youtube", "ds": "yt", "q": query})
        if text is None:
            return []
        try:
            m = re.search(r"\((\[.*\])\)\s*;?\s*$", text.strip(), re.S)
            data = json.loads(m.group(1) if m else text)
            return [i[0] for i in data[1] if isinstance(i, list) and i and isinstance(i[0], str)]
        except (ValueError, IndexError, TypeError, KeyError):
            return self._fail_parse()


class DDGAC(Source):
    name = "ddg"
    url = "https://duckduckgo.com/ac/"

    def fetch(self, query: str) -> list[str]:
        text = self._body(self.url, {"q": query, "type": "list"})
        if text is None:
            return []
        try:
            data = json.loads(text)
            return [d["phrase"] for d in data if isinstance(d, dict) and "phrase" in d]
        except (ValueError, TypeError, KeyError):
            return self._fail_parse()
