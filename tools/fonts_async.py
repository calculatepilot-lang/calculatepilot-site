"""Make Google Fonts stylesheet links non-blocking.

A plain <link rel="stylesheet" href="https://fonts.googleapis.com/..."> blocks first paint until a
third-party round trip completes (hundreds of ms on mobile). This rewrites each one to the
media="print" + onload swap pattern with a <noscript> fallback. Idempotent; safe to re-run.

Usage: python tools/fonts_async.py            # rewrite every .html under the repo
       python tools/fonts_async.py --check    # list files that still hold a blocking link, exit 1 if any

tools/core_apply.py and tools/guide_build.py already emit the async form for new pages.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = {".git", "node_modules"}
PAT = re.compile(r'(?<!<noscript>)<link rel="stylesheet" href="(https://fonts\.googleapis\.com/[^"]+)">')


def async_link(m):
    u = m.group(1)
    return ('<link rel="stylesheet" href="%s" media="print" onload="this.media=\'all\'">'
            '<noscript><link rel="stylesheet" href="%s"></noscript>' % (u, u))


def main():
    check = "--check" in sys.argv
    changed = []
    for d, dirs, files in os.walk(ROOT):
        dirs[:] = [x for x in dirs if x not in SKIP]
        for f in files:
            if not f.endswith(".html"):
                continue
            p = os.path.join(d, f)
            with open(p, encoding="utf-8") as fh:
                s = fh.read()
            t = PAT.sub(async_link, s)
            if t != s:
                changed.append(os.path.relpath(p, ROOT))
                if not check:
                    with open(p, "w", encoding="utf-8") as fh:
                        fh.write(t)
    print("%s: %d files" % ("blocking" if check else "rewritten", len(changed)))
    if check:
        for c in changed[:20]:
            print("  " + c)
        sys.exit(1 if changed else 0)


if __name__ == "__main__":
    main()
