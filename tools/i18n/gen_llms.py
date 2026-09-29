"""Generate llms-full.txt (complete machine-readable index) and refresh counts in llms.txt."""
import os, re, html, glob
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE = "https://www.calculatepilot.com"

def info(rel):
    h = open(os.path.join(ROOT, rel), encoding="utf-8", errors="replace").read()
    if re.search(r'<meta\s+name="robots"[^>]*noindex', h, re.I):
        return None
    c = re.search(r'<link rel="canonical" href="([^"]*)"', h)
    t = re.search(r"<title>([^<]*)", h)
    d = re.search(r'<meta name="description" content="([^"]*)"', h)
    if not c or not t:
        return None
    title = re.sub(r"\s*[|\u2014-]\s*CalculatePilot\s*$", "", html.unescape(t.group(1))).strip()
    return c.group(1), title, html.unescape(d.group(1)).strip() if d else ""

def section(folder):
    rows = []
    for f in sorted(glob.glob(folder + "/*.html")):
        f = f.replace(chr(92), "/")
        if f.endswith("/index.html"):
            continue
        r = info(f)
        if r:
            rows.append(r)
    return rows

def lines(rows):
    return "\n".join("- [%s](%s): %s" % (t, u, d) if d else "- [%s](%s)" % (t, u) for u, t, d in rows)

cats = [("Financial calculators", "financial"), ("Health and fitness calculators", "health"), ("Math calculators", "math"), ("Everyday calculators", "other")]
counts = {}
out = ["# CalculatePilot: full index", "",
       "> Complete list of CalculatePilot's free online calculators and guides, one line each. Every calculator page shows its formula, a worked example and sources, runs in the browser and needs no account. Results are estimates, not professional financial, medical or legal advice.", "",
       "Short version: %s/llms.txt" % BASE, "Sitemap index: %s/sitemap.xml" % BASE, ""]
for title, folder in cats:
    rows = section(folder)
    counts[folder] = len(rows)
    out += ["## %s (%d)" % (title, len(rows)), "", lines(rows), ""]
g = section("guides")
root = [info(f) for f in ("how-to-calculate-compound-interest.html", "what-is-a-good-bmi.html", "what-is-a-good-debt-to-income-ratio.html")]
g += [r for r in root if r]
out += ["## Guides and explainers (%d)" % len(g), "", lines(g), ""]
loc = []
for lg, name in (("es", "Spanish"), ("fr", "French"), ("de", "German")):
    n = len([f for f in glob.glob(lg + "/**/*.html", recursive=True) if info(f.replace(chr(92), "/"))])
    loc.append("- %s: %s/%s/ (%d indexable pages), sitemap %s/%s/sitemap.xml" % (name, BASE, lg, n, BASE, lg))
out += ["## Languages", "", "English is the default. Translated versions of the calculators keep the same URLs under a language folder, and each page links its translations with hreflang.", ""] + loc + [""]
open(os.path.join(ROOT, "llms-full.txt"), "w", encoding="utf-8", newline="\n").write("\n".join(out))
total = sum(counts.values())

p = os.path.join(ROOT, "llms.txt")
s = open(p, encoding="utf-8").read()
s = re.sub(r"website of \d+ online calculators", "website of %d online calculators" % total, s)
s = re.sub(r"\[All calculators\]\(([^)]*)\): \d+ tools", r"[All calculators](\1): %d tools" % total, s)
s = re.sub(r"(\[Financial\]\([^)]*\): )\d+\+? tools", r"\g<1>%d tools" % counts["financial"], s)
s = re.sub(r"(\[Health & Fitness\]\([^)]*\): )\d+\+? tools", r"\g<1>%d tools" % counts["health"], s)
s = re.sub(r"(\[Math\]\([^)]*\): )\d+\+? tools", r"\g<1>%d tools" % counts["math"], s)
s = re.sub(r"(\[Everyday\]\([^)]*\): )\d+\+? tools", r"\g<1>%d tools" % counts["other"], s)
if "llms-full.txt" not in s:
    s = s.replace("Sitemap: https://www.calculatepilot.com/sitemap.xml\n", "Sitemap: https://www.calculatepilot.com/sitemap.xml\nFull index of every calculator and guide: https://www.calculatepilot.com/llms-full.txt\nLanguages: English (default), Spanish /es/, French /fr/, German /de/ (each page lists its translations with hreflang)\n", 1)
open(p, "w", encoding="utf-8", newline="\n").write(s)
print(counts, total, len(g))
