#!/usr/bin/env python3
"""Programmatic SEO master-plan pass for CalculatePilot (2026-09-16).

Surgical fixes only: restore crawlability, complete truncated metas, add
hreflang, FAQ/breadcrumb/app schema on missing pages, segmented sitemaps
with lastmod, robots.txt sitemap hygiene, category ItemList schema.
"""
from __future__ import annotations

import json
import re
from datetime import date
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TODAY = date.today().isoformat()
HOST = "https://www.calculatepilot.com"
CAT_LABEL = {
    "financial": "Financial calculators",
    "health": "Health calculators",
    "math": "Math calculators",
    "other": "Everyday calculators",
}
CAT_HUB = {
    "financial": "/financial-calculators.html",
    "health": "/health-calculators.html",
    "math": "/math-calculators.html",
    "other": "/other-calculators.html",
}
APP_CAT = {
    "financial": "FinanceApplication",
    "health": "HealthApplication",
    "math": "EducationalApplication",
    "other": "UtilitiesApplication",
}

stats = {
    "meta_fixed": 0,
    "hreflang_added": 0,
    "schema_added": 0,
    "itemlist_added": 0,
}


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


def write(p: Path, s: str) -> None:
    p.write_text(s, encoding="utf-8")


def strip_tags(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s).replace("&", "&").strip()


def complete_desc(desc: str) -> str:
    original = desc
    cut = " No signup needed. CalculatePilot explains"
    if cut in desc:
        desc = desc.split(cut)[0].rstrip(" .") + "."
    elif "CalculatePilot explains" in desc and not desc.rstrip().endswith((".", "!", "?")):
        desc = desc.split(" No signup needed.")[0].rstrip(" .") + "."
    desc = re.sub(r"\s+", " ", desc).strip()
    if not desc.endswith((".", "!", "?")):
        desc += "."
    if len(desc) < 120:
        closer = " Free, instant, formula shown. No signup."
        if closer.strip() not in desc:
            desc = desc.rstrip(".") + closer
    if len(desc) > 158:
        desc = desc[:157].rsplit(" ", 1)[0].rstrip(".,;:") + "."
    return desc if desc != original else original


def replace_attr_content(html: str, attr_name: str, new: str, attr="name") -> str:
    """Replace content= on a meta tag matching name= or property=."""
    pattern = rf'(<meta\s+{attr}="{re.escape(attr_name)}"[^>]*content=")([^"]*)(")'

    def repl(m):
        return m.group(1) + new + m.group(3)

    html2, n = re.subn(pattern, repl, html, count=1)
    if n:
        return html2
    # content before name
    pattern = rf'(<meta\s+content=")([^"]*)("\s+{attr}="{re.escape(attr_name)}")'
    html2, n = re.subn(pattern, lambda m: m.group(1) + new + m.group(3), html, count=1)
    return html2 if n else html


def insert_after_canonical(html: str, block: str) -> str:
    if block.strip() in html:
        return html
    m = re.search(r'<link rel="canonical"[^>]*>', html)
    if m:
        return html[: m.end()] + "\n" + block + html[m.end() :]
    m = re.search(r"</title>", html, re.I)
    if m:
        return html[: m.end()] + "\n" + block + html[m.end() :]
    return html.replace("<head>", "<head>\n" + block, 1)


def hreflang_block(path: str) -> str:
    """path like financial/mortgage-calculator.html or financial-calculators.html or '' for home."""
    en = f"{HOST}/{path}" if path else f"{HOST}/"
    lines = [
        f'<link rel="alternate" hreflang="en" href="{en}">',
        f'<link rel="alternate" hreflang="fr" href="{HOST}/fr/{path}">',
        f'<link rel="alternate" hreflang="de" href="{HOST}/de/{path}">',
        f'<link rel="alternate" hreflang="es" href="{HOST}/es/{path}">',
        f'<link rel="alternate" hreflang="x-default" href="{en}">',
    ]
    return "\n".join(lines)


def extract_faqs(html: str) -> list[tuple[str, str]]:
    faqs = []
    # h3 + following p inside FAQ section
    sec = re.search(
        r"<h2[^>]*>\s*Frequently asked questions\s*</h2>([\s\S]*?)(?:<h2|</section>|</main>)",
        html,
        re.I,
    )
    chunk = sec.group(1) if sec else html
    for q, a in re.findall(r"<h3[^>]*>([\s\S]*?)</h3>\s*<p[^>]*>([\s\S]*?)</p>", chunk, re.I):
        qq, aa = strip_tags(q), strip_tags(a)
        if qq and aa and len(qq) < 180:
            faqs.append((qq, aa))
    return faqs[:8]


def page_name(html: str, fallback: str) -> str:
    h1 = re.search(r"<h1[^>]*>([\s\S]*?)</h1>", html, re.I)
    if h1:
        return strip_tags(h1.group(1))
    t = re.search(r"<title>([\s\S]*?)</title>", html, re.I)
    if t:
        return strip_tags(t.group(1)).split("|")[0].split("—")[0].strip()
    return fallback


def schema_bundle(path: str, html: str, desc: str) -> str:
    cat = path.split("/")[0]
    name = page_name(html, Path(path).stem.replace("-", " ").title())
    url = f"{HOST}/{path}"
    hub = CAT_HUB.get(cat, "/")
    hub_name = CAT_LABEL.get(cat, "Calculators")
    faqs = extract_faqs(html)
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{HOST}/"},
                    {"@type": "ListItem", "position": 2, "name": hub_name, "item": f"{HOST}{hub}"},
                    {"@type": "ListItem", "position": 3, "name": name, "item": url},
                ],
            },
            {
                "@type": "SoftwareApplication",
                "name": name,
                "url": url,
                "applicationCategory": APP_CAT.get(cat, "UtilitiesApplication"),
                "operatingSystem": "Web",
                "browserRequirements": "Requires a modern web browser",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/OnlineOnly",
                },
                "isAccessibleForFree": True,
                "description": desc or name,
            },
        ],
    }
    blocks = [f'<script type="application/ld+json">{json.dumps(graph, ensure_ascii=False)}</script>']
    if faqs:
        faq = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": q,
                    "acceptedAnswer": {"@type": "Answer", "text": a},
                }
                for q, a in faqs
            ],
        }
        blocks.append(
            f'<script type="application/ld+json">{json.dumps(faq, ensure_ascii=False)}</script>'
        )
    return "\n".join(blocks)


def fix_metas(path: Path) -> None:
    html = read(path)
    m = re.search(r'<meta name="description" content="([^"]*)"', html)
    if not m:
        return
    old = m.group(1)
    new = complete_desc(old)
    if new == old:
        return
    html = html.replace(f'content="{old}"', f'content="{new}"')
    write(path, html)
    stats["meta_fixed"] += 1


def add_hreflang_file(path: Path, rel: str) -> None:
    html = read(path)
    if 'hreflang="en"' in html:
        return
    html = insert_after_canonical(html, hreflang_block(rel))
    write(path, html)
    stats["hreflang_added"] += 1


def ensure_schema(path: Path, rel: str) -> None:
    html = read(path)
    if "application/ld+json" in html and "SoftwareApplication" in html:
        return
    if "application/ld+json" in html and "WebApplication" in html:
        return
    desc_m = re.search(r'<meta name="description" content="([^"]*)"', html)
    desc = desc_m.group(1) if desc_m else ""
    block = schema_bundle(rel, html, desc)
    # insert before </head>
    if "</head>" not in html:
        return
    html = html.replace("</head>", block + "\n</head>", 1)
    write(path, html)
    stats["schema_added"] += 1


def itemlist_for_hub(path: Path, name: str, url_path: str) -> None:
    html = read(path)
    if '"@type":"ItemList"' in html or '"@type": "ItemList"' in html:
        return
    hrefs = re.findall(r'href="((?:/financial|/health|/math|/other)/[^"]+\.html)"', html)
    seen = []
    for h in hrefs:
        if h not in seen:
            seen.append(h)
    if len(seen) < 5:
        return
    items = [
        {
            "@type": "ListItem",
            "position": i,
            "url": HOST + h,
        }
        for i, h in enumerate(seen, 1)
    ]
    data = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": name,
        "url": HOST + url_path,
        "numberOfItems": len(items),
        "itemListElement": items,
    }
    block = f'<script type="application/ld+json">{json.dumps(data, ensure_ascii=False)}</script>\n'
    html = html.replace("</head>", block + "</head>", 1)
    write(path, html)
    stats["itemlist_added"] += 1


def url_entry(loc: str) -> str:
    return (
        "  <url>\n"
        f"    <loc>{loc}</loc>\n"
        f"    <lastmod>{TODAY}</lastmod>\n"
        "    <changefreq>weekly</changefreq>\n"
        "  </url>\n"
    )


def write_urlset(path: Path, locs: list[str]) -> None:
    body = ['<?xml version="1.0" encoding="UTF-8"?>\n']
    body.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for loc in locs:
        body.append(url_entry(loc))
    body.append("</urlset>\n")
    write(path, "".join(body))


def rebuild_sitemaps() -> None:
    core = [
        f"{HOST}/",
        f"{HOST}/financial-calculators.html",
        f"{HOST}/health-calculators.html",
        f"{HOST}/math-calculators.html",
        f"{HOST}/other-calculators.html",
        f"{HOST}/about.html",
        f"{HOST}/methodology.html",
        f"{HOST}/pricing.html",
        f"{HOST}/privacy.html",
        f"{HOST}/terms.html",
        f"{HOST}/sitemap.html",
        f"{HOST}/guides/",
        f"{HOST}/how-to-calculate-compound-interest.html",
        f"{HOST}/what-is-a-good-bmi.html",
        f"{HOST}/what-is-a-good-debt-to-income-ratio.html",
    ]
    families = {}
    for cat in ("financial", "health", "math", "other"):
        locs = sorted(
            f"{HOST}/{cat}/{p.name}" for p in (ROOT / cat).glob("*.html") if p.stat().st_size > 200
        )
        families[cat] = locs
    guides = [f"{HOST}/guides/"]
    for p in sorted((ROOT / "guides").glob("*.html")):
        if p.name == "index.html":
            continue
        guides.append(f"{HOST}/guides/{p.name}")

    write_urlset(ROOT / "sitemap-core.xml", core)
    write_urlset(ROOT / "sitemap-financial.xml", families["financial"])
    write_urlset(ROOT / "sitemap-health.xml", families["health"])
    write_urlset(ROOT / "sitemap-math.xml", families["math"])
    write_urlset(ROOT / "sitemap-everyday.xml", families["other"])
    write_urlset(ROOT / "sitemap-guides.xml", guides)

    index = [
        '<?xml version="1.0" encoding="UTF-8"?>\n',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n',
    ]
    for name in (
        "sitemap-core.xml",
        "sitemap-financial.xml",
        "sitemap-health.xml",
        "sitemap-math.xml",
        "sitemap-everyday.xml",
        "sitemap-guides.xml",
    ):
        index.append("  <sitemap>\n")
        index.append(f"    <loc>{HOST}/{name}</loc>\n")
        index.append(f"    <lastmod>{TODAY}</lastmod>\n")
        index.append("  </sitemap>\n")
    index.append("</sitemapindex>\n")
    write(ROOT / "sitemap.xml", "".join(index))


def fix_robots() -> None:
    robots = read(ROOT / "robots.txt")
    # llms.txt is not an XML sitemap; keep it crawlable, drop invalid Sitemap line
    robots = robots.replace(f"Sitemap: {HOST}/llms.txt\n", "")
    if "llms.txt" not in robots:
        robots = robots.rstrip() + "\n\n# AI/LLM content index (not an XML sitemap)\nAllow: /llms.txt\n"
    if "Sitemap: https://www.calculatepilot.com/sitemap-core.xml" not in robots:
        # index already listed as sitemap.xml
        pass
    write(ROOT / "robots.txt", robots if robots.endswith("\n") else robots + "\n")


def locale_overlap() -> set[str]:
    en = set()
    for cat in ("financial", "health", "math", "other"):
        for p in (ROOT / cat).glob("*.html"):
            en.add(f"{cat}/{p.name}")
    loc = set()
    for lang in ("fr", "de", "es"):
        found = set()
        for cat in ("financial", "health", "math", "other"):
            for p in (ROOT / lang / cat).glob("*.html"):
                found.add(f"{cat}/{p.name}")
        loc = found if not loc else loc & found
    return en & loc


def main() -> None:
    overlap = locale_overlap()

    # 1. truncated / incomplete metas
    for cat in ("financial", "health", "math", "other"):
        for p in (ROOT / cat).glob("*.html"):
            if p.stat().st_size < 200:
                continue
            fix_metas(p)

    # 2. hreflang on overlapping calculator pages + hubs + home
    for rel in sorted(overlap):
        add_hreflang_file(ROOT / rel, rel)
        for lang in ("fr", "de", "es"):
            lp = ROOT / lang / rel
            if lp.exists():
                add_hreflang_file(lp, rel)

    hubs = {
        "index.html": "",
        "financial-calculators.html": "financial-calculators.html",
        "health-calculators.html": "health-calculators.html",
        "math-calculators.html": "math-calculators.html",
        "other-calculators.html": "other-calculators.html",
    }
    for fname, rel in hubs.items():
        if (ROOT / fname).exists() and (ROOT / "fr" / fname).exists():
            add_hreflang_file(ROOT / fname, rel)
            for lang in ("fr", "de", "es"):
                lp = ROOT / lang / fname
                if lp.exists():
                    add_hreflang_file(lp, rel)

    # 3. missing schema on calculator pages
    for cat in ("financial", "health", "math", "other"):
        for p in (ROOT / cat).glob("*.html"):
            if p.stat().st_size < 200:
                continue
            ensure_schema(p, f"{cat}/{p.name}")

    # 4. ItemList on category hubs
    itemlist_for_hub(ROOT / "financial-calculators.html", "Financial calculators", "/financial-calculators.html")
    itemlist_for_hub(ROOT / "health-calculators.html", "Health & fitness calculators", "/health-calculators.html")
    itemlist_for_hub(ROOT / "math-calculators.html", "Math calculators", "/math-calculators.html")
    itemlist_for_hub(ROOT / "other-calculators.html", "Everyday calculators", "/other-calculators.html")

    # 5. sitemaps + robots
    rebuild_sitemaps()
    fix_robots()

    print(json.dumps(stats, indent=2))
    print("overlap pages", len(overlap))
    print("sitemap.xml is index:", "<sitemapindex" in read(ROOT / "sitemap.xml"))
    print("student-loan size", (ROOT / "financial/student-loan-calculator.html").stat().st_size)


if __name__ == "__main__":
    main()
