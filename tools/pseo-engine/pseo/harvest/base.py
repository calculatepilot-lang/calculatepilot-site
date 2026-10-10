"""Shared pieces for keyword sources."""
from __future__ import annotations

import logging
import time
import urllib.parse
import urllib.request

log = logging.getLogger("pseo.harvest")
USER_AGENT = "CalculatePilot-PSEO/0.1 (+https://calculatepilot.com)"


def http_get(url: str, params: dict | None, delay: float = 1.0, timeout: float = 15) -> str | None:
    """Polite GET. Returns the body text, or None on any error or non-200 (reason is logged)."""
    if delay:
        time.sleep(delay)
    full = url + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(full, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status != 200:
                log.warning("GET %s -> HTTP %s", url, resp.status)
                return None
            return resp.read().decode("utf-8", errors="replace")
    except Exception as exc:  # network, TLS, 4xx/5xx, timeout
        log.warning("GET %s failed: %s", url, exc)
        return None


class Source:
    """A keyword source. `fetch` returns suggestion strings; `last_error` explains an empty result."""
    name = "base"

    def __init__(self, http_get=None, delay: float = 1.0):
        self._get = http_get or globals()["http_get"]
        self.delay = delay
        self.last_error: str | None = None

    def fetch(self, query: str) -> list[str]:  # pragma: no cover - interface
        raise NotImplementedError

    def _body(self, url: str, params: dict) -> str | None:
        text = self._get(url, params, self.delay)
        self.last_error = "http" if text is None else None
        return text

    def _fail_parse(self) -> list[str]:
        self.last_error = "parse"
        return []
