"""Create the HTML shell for a brand-new calculator page from an existing page on origin/main.

Keeps the template's <head> scripts (ads, analytics), header, footer and shared scripts; rewrites title,
description, canonical/og/twitter URLs, drops translated hreflang links (new pages are English-only) and
JSON-LD (supplied by <slug>.head.json "jsonld"), and empties <main> for cpx_apply.py to fill.

Usage: python tools/cpx_newpage.py <template-page> <new-page> "<title>" "<description>"
Writes tools/redesign/<slug>.shell.html (used by cpx_deploy.sh when the page is not on main yet)
and a local copy at <new-page> for previewing.
"""
import os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(tpl, page, title, desc):
    html = subprocess.run(["git", "show", "origin/main:" + tpl], cwd=ROOT, capture_output=True,
                          check=True).stdout.decode("utf-8")
    old_url = "https://www.calculatepilot.com/" + tpl
    new_url = "https://www.calculatepilot.com/" + page
    html = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">', "", html)
    html = html.replace('<link rel="canonical" href="%s">' % old_url,
                        '<link rel="canonical" href="%s">\n<link rel="alternate" hreflang="en" href="%s">\n'
                        '<link rel="alternate" hreflang="x-default" href="%s">' % (new_url, new_url, new_url))
    html = html.replace(old_url, new_url)
    html = re.sub(r"<title>.*?</title>", "<title>%s</title>" % title, html, count=1, flags=re.S)
    for pat in (r'(<meta property="og:title" content=")[^"]*', r'(<meta name="twitter:title" content=")[^"]*'):
        html = re.sub(pat, lambda m: m.group(1) + title, html)
    for pat in (r'(<meta name="description" content=")[^"]*', r'(<meta property="og:description" content=")[^"]*',
                r'(<meta name="twitter:description" content=")[^"]*'):
        html = re.sub(pat, lambda m: m.group(1) + desc, html)
    html = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', "", html, flags=re.S)
    html = re.sub(r"\s*<!-- cpx-head-extra -->.*?<!-- /cpx-head-extra -->", "", html, flags=re.S)
    html = re.sub(r"<main>.*?</main>", "<main>\n</main>", html, count=1, flags=re.S)
    # new pages have no /embed/ twin
    html = re.sub(r'<a href="/embed/[^"]+\.html"[^>]*>[^<]*</a>\s*&nbsp;·&nbsp;\s*', "", html)
    assert new_url in html and "<main>" in html
    slug = re.sub(r"-calculator$", "", os.path.splitext(os.path.basename(page))[0])
    for out in (os.path.join(ROOT, "tools", "redesign", slug + ".shell.html"), os.path.join(ROOT, page)):
        open(out, "w", encoding="utf-8", newline="\n").write(html)
    print("shell", slug)


if __name__ == "__main__":
    main(*sys.argv[1:5])
