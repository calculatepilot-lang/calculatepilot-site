#!/usr/bin/env python3
"""
Rankai -> CalculatePilot guide sync.

Pulls all articles from the Rankai project API, renders each into
CalculatePilot's existing guide-page template (matching
guides/mortgage-calculator-guide.html), avoids slug collisions with
guides already on the site, updates guides/index.html's auto-managed
"Latest guides" block + its JSON-LD ItemList, and appends new URLs to
sitemap-guides.xml.

Run manually (python3 scripts/rankai_sync.py) to list what Rankai has
published. The actual commit-to-GitHub + Search Console resubmission
step is run separately (see README note at bottom of this file).
"""
import json
import re
import urllib.request
from datetime import date, datetime

RANKAI_PROJECT = "cmuatpvmp000214wzocy8ihac"
RANKAI_BASE = f"https://rankai.ai/api/v1/{RANKAI_PROJECT}"
SITE_BASE = "https://www.calculatepilot.com"
GUIDES_DIR = "guides"
AUTO_START = "<!-- rankai:auto-list:start -->"
AUTO_END = "<!-- rankai:auto-list:end -->"
MAX_LISTED = 30  # cap on how many auto-published guides show in the index list


def fetch_json(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def fetch_all_articles():
    """Paginate through Rankai's articles endpoint."""
    articles, page = [], 1
    while True:
        data = fetch_json(f"{RANKAI_BASE}/articles?page={page}&limit=50")
        batch = data.get("data", [])
        articles.extend(batch)
        if page >= data.get("pagination", {}).get("totalPages", 0):
            break
        page += 1
    return articles


def fetch_article_html(slug):
    data = fetch_json(f"{RANKAI_BASE}/articles/{slug}?format=html")
    return data.get("data", data)


def slugify(text):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)


def resolve_slug(base_slug, existing_filenames, rankai_id, id_by_filename):
    """Return the filename to use, resolving collisions.
    If a file with this rankai_id already exists, reuse it (update in place).
    Otherwise, append -2, -3... until free."""
    for fname, existing_id in id_by_filename.items():
        if existing_id == rankai_id:
            return fname
    candidate = f"{base_slug}.html"
    n = 2
    while candidate in existing_filenames:
        candidate = f"{base_slug}-{n}.html"
        n += 1
    return candidate


PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} | CalculatePilot</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{title} | CalculatePilot"><meta property="og:description" content="{description}"><meta property="og:type" content="article"><meta property="og:url" content="{url}"><meta property="og:image" content="{og_image}">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32"><link rel="icon" type="image/png" href="/favicon-16x16.png" sizes="16x16"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/css/styles.css?v=b9fa22ed">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Article","headline":{title_json},"description":{description_json},"mainEntityOfPage":{{"@type":"WebPage","@id":"{url}"}},"datePublished":"{date_published}","publisher":{{"@type":"Organization","name":"CalculatePilot","url":"{site_base}/"}}}}</script>
<!-- rankai-id: {rankai_id} -->
</head>
<body>
<header class="site-header"><div class="container"><a href="/" class="logo">calculatepilot<span class="dot">.</span></a><ul class="nav-links"><li><a href="/financial-calculators.html">Financial</a></li><li><a href="/health-calculators.html">Health &amp; Fitness</a></li><li><a href="/math-calculators.html">Math</a></li><li><a href="/other-calculators.html">Everyday</a></li><li><a href="/guides/index.html">Guides</a></li></ul><button class="nav-toggle" aria-label="Open menu">Menu</button></div></header>
<main>
<section class="calc-page-head"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/guides/index.html">Guides</a> / {title}</nav><h1>{title}</h1></div></section>
<section class="content-block"><div class="container prose">
{body_html}
</div></section></main>
<footer class="site-footer"><div class="container"><div class="footer-grid"><div><a href="/" class="logo">calculatepilot<span class="dot">.</span></a><p style="color:var(--slate);font-size:0.88rem;margin-top:10px;max-width:260px;">Free, accurate calculators for everyday decisions — built for clarity, not clutter.</p></div><div><h3>Calculators</h3><a href="/financial-calculators.html">Financial</a><br><a href="/health-calculators.html">Health &amp; Fitness</a><br><a href="/math-calculators.html">Math</a></div><div><h3>Explore</h3><a href="/guides/index.html">Guides</a><br><a href="/embed/">Embed</a><br><a href="/about.html">About</a></div></div></div></footer>
<script src="/js/nav.js?v=ed5961c9"></script>
</body></html>"""


def render_guide(article, url):
    title = article.get("title", "Untitled")
    description = article.get("seoDescription") or article.get("excerpt") or title
    body_html = article.get("content") or article.get("html") or ""
    date_published = article.get("publishedAt") or date.today().isoformat()
    return PAGE_TEMPLATE.format(
        title=title,
        description=description,
        title_json=json.dumps(title),
        description_json=json.dumps(description),
        url=url,
        og_image=f"{SITE_BASE}/images/og-share.png",
        date_published=date_published,
        site_base=SITE_BASE,
        body_html=body_html,
        rankai_id=article.get("id", article.get("slug", "")),
    )


def update_index(index_html, entries):
    """entries: list of (url, title), newest first. Rewrites only the
    auto-managed block between AUTO_START/AUTO_END; adds the block
    (with its own <h2>) right after the page lede if it doesn't exist yet."""
    links = "\n".join(
        f'<a href="{u}" class="tool-link">{t} <span class="arrow">→</span></a>'
        for u, t in entries[:MAX_LISTED]
    )
    block = f'{AUTO_START}\n<h2>Latest guides</h2>\n<div class="tool-grid">\n{links}\n</div>\n{AUTO_END}'

    if AUTO_START in index_html:
        index_html = re.sub(
            re.escape(AUTO_START) + r".*?" + re.escape(AUTO_END),
            block, index_html, flags=re.S,
        )
    else:
        marker = '<section class="content-block"><div class="container prose">\n'
        index_html = index_html.replace(marker, marker + block + "\n", 1)

    item_list = {
        "@type": "ItemList", "name": "Latest guides",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "url": u}
            for i, (u, _t) in enumerate(entries[:MAX_LISTED])
        ],
    }

    def _patch_jsonld(m):
        data = json.loads(m.group(1))
        parts = [p for p in data.get("hasPart", []) if p.get("name") != "Latest guides"]
        parts.insert(0, item_list)
        data["hasPart"] = parts
        return f'<script type="application/ld+json">{json.dumps(data)}</script>'

    index_html = re.sub(
        r'<script type="application/ld\+json">(\{.*?"@type":"CollectionPage".*?\})</script>',
        _patch_jsonld, index_html, count=1, flags=re.S,
    )
    return index_html


def update_sitemap(sitemap_xml, urls):
    today = date.today().isoformat()
    new_entries = "".join(
        f"  <url>\n    <loc>{u}</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>\n"
        for u in urls if f"<loc>{u}</loc>" not in sitemap_xml
    )
    if not new_entries:
        return sitemap_xml
    return sitemap_xml.replace("</urlset>", new_entries + "</urlset>")


if __name__ == "__main__":
    articles = fetch_all_articles()
    print(f"Rankai articles found: {len(articles)}")
    for a in articles:
        print(" -", a.get("slug"), "|", a.get("title"))

# --- Ops note ---
# The commit-to-GitHub + Google Search Console resubmission step runs
# via Claude (which has repo write + GSC access for this project) on
# request: "sync new guides from Rankai". It fetches existing
# guides/*.html filenames from the repo tree, calls resolve_slug() per
# article to avoid collisions, writes each new/changed page under
# guides/, rewrites guides/index.html and sitemap-guides.xml using the
# functions above, commits all of it in one atomic commit to main
# (Hostinger auto-deploys on push), then calls
# GOOGLE_SEARCH_CONSOLE_SUBMIT_SITEMAP for sitemap-guides.xml so Google
# recrawls it.
