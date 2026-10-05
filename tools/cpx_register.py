"""Register a new calculator page in the site indexes (idempotent). Run from the repo root being deployed.

Reads tools/redesign/<slug>.register.json:
  {"page": "financial/x-calculator.html", "name": "X Calculator", "related": ["/financial/a.html", ...]}
Updates calculators.json, js/search-index.js, sitemap-financial.xml, sitemap.html (financial list) and
js/related-links.js.
"""
import datetime, json, os, re, sys


def sorted_insert(items, entry):
    if any(i["href"] == entry["href"] for i in items):
        return items
    pos = next((k for k, i in enumerate(items) if i["name"].lower() > entry["name"].lower()), len(items))
    return items[:pos] + [entry] + items[pos:]


def main(slug):
    reg = json.load(open(os.path.join("tools", "redesign", slug + ".register.json"), encoding="utf-8"))
    href = "/" + reg["page"]
    entry = {"name": reg["name"], "href": href}

    items = json.load(open("calculators.json", encoding="utf-8"))
    open("calculators.json", "w", encoding="utf-8", newline="\n").write(
        json.dumps(sorted_insert(items, entry), ensure_ascii=False, separators=(",", ":")))

    s = open("js/search-index.js", encoding="utf-8").read()
    m = re.match(r"(const SEARCH_INDEX=)(\[.*\])(;\s*)$", s, re.S)
    arr = sorted_insert(json.loads(m.group(2)), entry)
    open("js/search-index.js", "w", encoding="utf-8", newline="\n").write(
        m.group(1) + json.dumps(arr, ensure_ascii=False, separators=(",", ":")) + m.group(3))

    loc = "https://www.calculatepilot.com" + href
    sm = open("sitemap-financial.xml", encoding="utf-8").read()
    if loc not in sm:
        today = datetime.date.today().isoformat()
        sm = sm.replace("</urlset>", "  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>\n</urlset>" % (loc, today))
        open("sitemap-financial.xml", "w", encoding="utf-8", newline="\n").write(sm)

    h = open("sitemap.html", encoding="utf-8").read()
    if 'href="%s"' % href not in h:
        start = h.index('<a href="/financial-calculators.html">Financial Calculators</a>')
        start = h.index('<div class="sitemap-links">', start)
        end = h.index("</div>", start)
        block = h[start:end]
        links = list(re.finditer(r'(\s*)<a href="/financial/[^"]+">([^<]+)</a>', block))
        after = None
        for l in links:
            if l.group(2).lower() < reg["name"].lower():
                after = l
        anchor = after or links[0]
        new = '%s<a href="%s">%s</a>' % (anchor.group(1), href, reg["name"])
        pos = anchor.end() if after else anchor.start()
        block = block[:pos] + new + block[pos:]
        h = h[:start] + block + h[end:]
        open("sitemap.html", "w", encoding="utf-8", newline="\n").write(h)

    if reg.get("related"):
        r = open("js/related-links.js", encoding="utf-8").read()
        if '"%s":' % href not in r:
            r = r.replace("var RELATIONS = {", 'var RELATIONS = {\n    "%s": %s,' % (href, json.dumps(reg["related"])), 1)
            open("js/related-links.js", "w", encoding="utf-8", newline="\n").write(r)
    print("registered", href)


if __name__ == "__main__":
    for a in sys.argv[1:]:
        main(a)
