"""Extend the Financial / Health / Math & More footer columns to six links on every page (logo/brand block untouched).
Idempotent.  python tools/i18n/footer_links.py
"""
import re, glob, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.chdir(ROOT)
SEP = chr(92)
LANGS = ("es", "fr", "de")

NEW = [  # (column index, path, labels)
    (0, "/financial/mortgage-calculator.html", {"en": "Mortgage", "es": "Hipoteca", "fr": "Prêt immobilier", "de": "Hypothek"}),
    (0, "/financial/uk-stamp-duty-calculator.html", {"en": "UK Stamp Duty", "es": "Stamp Duty (Reino Unido)", "fr": "Stamp Duty (Royaume-Uni)", "de": "Stamp Duty (UK)"}),
    (0, "/financial/compound-interest-calculator.html", {"en": "Compound Interest", "es": "Interés compuesto", "fr": "Intérêts composés", "de": "Zinseszins"}),
    (1, "/health/bmi-calculator.html", {"en": "BMI", "es": "IMC", "fr": "IMC", "de": "BMI"}),
    (1, "/health/macro-calculator.html", {"en": "Macro", "es": "Macros", "fr": "Macros", "de": "Makros"}),
    (1, "/health/calorie-calculator.html", {"en": "Calorie", "es": "Calorías", "fr": "Calories", "de": "Kalorien"}),
    (2, "/math/percentage-calculator.html", {"en": "Percentage", "es": "Porcentaje", "fr": "Pourcentage", "de": "Prozent"}),
    (2, "/other/gpa-calculator.html", {"en": "GPA", "es": "GPA", "fr": "GPA", "de": "GPA"}),
    (2, "/math/quadratic-formula-calculator.html", {"en": "Quadratic Formula", "es": "Fórmula cuadrática", "fr": "Formule quadratique", "de": "Quadratische Formel"}),
]
COL = re.compile(r'(<h4>[^<]*</h4>\s*<ul>)(.*?)(</ul>)', re.S)
changed = 0
for f in glob.glob("**/*.html", recursive=True):
    f = f.replace(SEP, "/")
    if f.startswith(("tools/", "node_modules/", "embed/")):
        continue
    s = open(f, encoding="utf-8", newline="").read()
    fm = re.search(r'<footer class="site-footer">.*?</footer>', s, re.S)
    if not fm:
        continue
    foot = fm.group(0)
    pre = f.split("/")[0]
    lang = pre if pre in LANGS else "en"
    pref = "/" + lang if lang != "en" else ""
    cols = list(COL.finditer(foot))[:3]
    if len(cols) < 3:
        print("skip (no 3 columns):", f)
        continue
    out, last = [], 0
    for ci, m in enumerate(cols):
        body = m.group(2)
        add = ""
        for c, path, labels in NEW:
            if c != ci:
                continue
            href = pref + path
            if 'href="%s"' % href in body or 'href="%s"' % path in body:
                continue
            add += '          <li><a href="%s">%s</a></li>\n' % (href, labels[lang])
        if add:
            nb = body.rstrip() + "\n" + add + "        "
            out.append((m.start(2), m.end(2), nb))
    if not out:
        continue
    nf = foot
    for a, b, nb in reversed(out):
        nf = nf[:a] + nb + nf[b:]
    s2 = s.replace(foot, nf, 1)
    open(f, "w", encoding="utf-8", newline="").write(s2)
    changed += 1
print("footers updated:", changed)
