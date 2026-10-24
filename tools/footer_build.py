"""Stamp the dark-green site footer (css/footer.css) on every page and link css/mobile-fix.css.

Single source of truth for the footer markup in EN / ES / FR / DE. Idempotent: re-running replaces the existing
<footer class="site-footer"> and keeps the per-calculator "Embed this calculator" link that nav.js reads.

Usage: python tools/footer_build.py [--check] [page.html ...]     (default: every page, --check only reports)
Pages skipped: backups/, tools/, embed/ (widgets have their own brand strip) and pinterest-2e526.html.
Re-run after adding a page, or after changing the labels below. Bump CSS_VER when css/footer.css changes.
"""
import html as H
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS_VER = "20261011a"
MOBILE_VER = "20261012a"  # css/mobile-fix.css (phone-only layout fixes, linked from every page)
# Metricool web tracker, stamped right after the footer on every page (idempotent; embed/ widgets are skipped below).
METRICOOL_TAG = ('<script data-metricool>function loadScript(a){var b=document.getElementsByTagName("head")[0],c=document.createElement("script");'
                 'c.type="text/javascript",c.src="https://tracker.metricool.com/resources/be.js",c.onreadystatechange=a,c.onload=a,b.appendChild(c)}'
                 'loadScript(function(){beTracker.t({hash:"483f376f39f09da6213e7f59c6c79a56"})});</script>')
METRICOOL_RE = re.compile(r'<script data-metricool>.*?</script>', re.S)
SKIP_PREFIX = ("backups/", "tools/", "embed/")
SKIP_FILES = {"pinterest-2e526.html"}

# (english path, label) per column; paths are localised to /<lang>/... when that translation exists.
COLS = [
    ("fin", [("financial/401k-calculator.html", 0), ("financial/amortization-calculator.html", 1), ("financial/annuity-calculator.html", 2),
             ("financial/compound-interest-calculator.html", 3), ("financial/mortgage-calculator.html", 4), ("financial/loan-calculator.html", 5)]),
    ("health", [("health/alcohol-calories-calculator.html", 0), ("health/bac-calculator.html", 1), ("health/blood-pressure-category-calculator.html", 2),
                ("health/bmi-calculator.html", 3), ("health/calorie-calculator.html", 4)]),
    ("math", [("math/basic-calculator.html", 0), ("math/area-calculator.html", 1), ("other/age-calculator.html", 2),
              ("math/percentage-calculator.html", 3), ("other/date-calculator.html", 4)]),
    ("company", [("about.html", 0), ("facts.html", 1), ("methodology.html", 2), ("guides/", 3), ("embed/", 4), ("sitemap.html", 5), ("press.html", 6)]),
]

T = {
    "en": dict(
        cols=["Financial", "Health", "Math & More", "Company"],
        fin=["401K Calculator", "Amortization Schedule", "Annuity Calculator", "Compound Interest", "Mortgage Calculator", "Loan Repayment"],
        health=["Alcohol Calories", "BAC Estimator", "Blood Pressure Category", "BMI Calculator", "Calorie & Macro"],
        math=["Basic Calculator", "Area & Volume", "Age Calculator", "Percentage Calculator", "Date Difference"],
        company=["About CalculatePilot", "Facts for citations", "Our Methodology", "Guides & Articles", "Embed Calculators", "Sitemap", "Press kit"],
        tag="Free, accurate calculators for everyday decisions — built for clarity, not clutter. Every formula open and client-side verified.",
        support="Support online", wp_pre="Available on", wp_name="WordPress.org",
        copy="© 2026 CalculatePilot. All calculations are estimates — consult a professional for financial or medical decisions.",
        privacy="Privacy Policy", terms="Terms of Use", clientside="100% Client-side Calculation", nolog="Zero Data Logging",
        embed_this="Embed this calculator", home="CalculatePilot home", lang="Language"),
    "es": dict(
        cols=["Finanzas", "Salud", "Matemáticas y más", "Empresa"],
        fin=["Calculadora 401K", "Tabla de amortización", "Calculadora de anualidades", "Interés compuesto", "Calculadora de hipoteca", "Pago de préstamo"],
        health=["Calorías del alcohol", "Estimador de alcoholemia", "Categoría de presión arterial", "Calculadora de IMC", "Calorías y macros"],
        math=["Calculadora básica", "Área y volumen", "Calculadora de edad", "Calculadora de porcentajes", "Diferencia de fechas"],
        company=["Acerca de CalculatePilot", "Datos para citar", "Nuestra metodología", "Guías y artículos", "Incrustar calculadoras", "Mapa del sitio", "Prensa"],
        tag="Calculadoras gratuitas y precisas para decisiones cotidianas — pensadas para la claridad, no para el desorden. Cada fórmula es abierta y se verifica en el navegador.",
        support="Soporte en línea", wp_pre="Disponible en", wp_name="WordPress.org",
        copy="© 2026 CalculatePilot. Todos los cálculos son estimaciones: consulta a un profesional para tomar decisiones financieras o médicas.",
        privacy="Política de privacidad", terms="Términos de uso", clientside="100 % de cálculo en el navegador", nolog="Sin registro de datos",
        embed_this="Incrustar esta calculadora", home="Inicio de CalculatePilot", lang="Idioma"),
    "fr": dict(
        cols=["Finance", "Santé", "Mathématiques & plus", "Entreprise"],
        fin=["Calculateur 401K", "Tableau d'amortissement", "Calculateur de rente", "Intérêts composés", "Calculateur de prêt immobilier", "Remboursement de prêt"],
        health=["Calories de l'alcool", "Estimateur d'alcoolémie", "Catégorie de tension artérielle", "Calculateur d'IMC", "Calories et macros"],
        math=["Calculatrice de base", "Aire et volume", "Calculateur d'âge", "Calculateur de pourcentage", "Écart entre deux dates"],
        company=["À propos de CalculatePilot", "Faits à citer", "Notre méthodologie", "Guides et articles", "Intégrer des calculateurs", "Plan du site", "Presse"],
        tag="Des calculateurs gratuits et précis pour les décisions du quotidien — conçus pour la clarté, pas l'encombrement. Chaque formule est ouverte et vérifiée côté client.",
        support="Support en ligne", wp_pre="Disponible sur", wp_name="WordPress.org",
        copy="© 2026 CalculatePilot. Tous les calculs sont des estimations — consultez un professionnel pour toute décision financière ou médicale.",
        privacy="Politique de confidentialité", terms="Conditions d'utilisation", clientside="100 % de calcul côté client", nolog="Aucune journalisation des données",
        embed_this="Intégrer ce calculateur", home="Accueil CalculatePilot", lang="Langue"),
    "de": dict(
        cols=["Finanzen", "Gesundheit", "Mathematik & mehr", "Unternehmen"],
        fin=["401(k)-Rechner", "Tilgungsplan", "Annuitätenrechner", "Zinseszins", "Hypothekenrechner", "Kreditrückzahlung"],
        health=["Alkoholkalorien", "Blutalkohol-Schätzer", "Blutdruck-Kategorie", "BMI-Rechner", "Kalorien & Makros"],
        math=["Basisrechner", "Fläche & Volumen", "Altersrechner", "Prozentrechner", "Datumsdifferenz"],
        company=["Über CalculatePilot", "Fakten zum Zitieren", "Unsere Methodik", "Ratgeber & Artikel", "Rechner einbetten", "Sitemap", "Presse"],
        tag="Kostenlose, präzise Rechner für den Alltag — gebaut für Klarheit, nicht für Ballast. Jede Formel offen und clientseitig geprüft.",
        support="Support online", wp_pre="Verfügbar auf", wp_name="WordPress.org",
        copy="© 2026 CalculatePilot. Alle Berechnungen sind Schätzungen — ziehen Sie bei finanziellen oder medizinischen Entscheidungen eine Fachperson hinzu.",
        privacy="Datenschutz", terms="Nutzungsbedingungen", clientside="100 % clientseitige Berechnung", nolog="Keine Datenprotokollierung",
        embed_this="Diesen Rechner einbetten", home="CalculatePilot Startseite", lang="Sprache"),
}
LANGS = [("en", "EN", "English", ""), ("es", "ES", "Español", "/es"), ("fr", "FR", "Français", "/fr"), ("de", "DE", "Deutsch", "/de")]

SOCIAL = [
    ("https://x.com/CalculatePilot", "noopener nofollow", "CalculatePilot on X (Twitter)", "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"),
    ("https://www.pinterest.com/calculatepilot/", "noopener", "CalculatePilot on Pinterest", "M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"),
    ("https://www.tiktok.com/@calculatepilot", "noopener", "CalculatePilot on TikTok", "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"),
    ("https://www.instagram.com/calculatepilot", "noopener nofollow", "CalculatePilot on Instagram", "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"),
    ("https://www.youtube.com/@CalculatePilot", "noopener", "CalculatePilot on YouTube", "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"),
    ("https://www.facebook.com/calculatepilot", "noopener", "CalculatePilot on Facebook", "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"),
]
WP_URL = "https://wordpress.org/plugins/calculatepilot-calculator-embed"
WP_ICON = '<svg class="cpf-wp-ico" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 11H19V7a2 2 0 0 0-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4a2 2 0 0 0-2 2v3.8h1.5a2.7 2.7 0 0 1 0 5.4H2V20a2 2 0 0 0 2 2h3.8v-1.5a2.7 2.7 0 0 1 5.4 0V22H17a2 2 0 0 0 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z"/></svg>'
WP_EXT = '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>'
SHIELD = '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>'

FOOTER_RE = re.compile(r'<footer\b[^>]*class="[^"]*\bsite-footer\b[^"]*"[^>]*>.*?</footer>', re.S)


def esc(s):
    return H.escape(s, quote=False)


def exists(rel):
    return os.path.exists(os.path.join(ROOT, rel))


def locale_of(page):
    first = page.split("/", 1)[0]
    return first if first in ("es", "fr", "de") and "/" in page else "en"


def localise(path, lg):
    """English site path -> the /<lg>/ translation when it exists, else the English page."""
    if lg == "en":
        return "/" + path
    if path == "guides/":
        return "/%s/guides/" % lg if exists("%s/guides/index.html" % lg) else "/guides/"
    if path == "embed/":
        return "/embed/"
    return "/%s/%s" % (lg, path) if exists("%s/%s" % (lg, path)) else "/" + path


def english_path(page):
    p = page
    if locale_of(page) != "en":
        p = page.split("/", 1)[1]
    return "" if p == "index.html" else p[:-10] if p.endswith("/index.html") else p


def lang_links(page, cur):
    ep = english_path(page)
    out = []
    for code, short, label, prefix in LANGS:
        if code == "en":
            href = "/" + ep
        else:
            cand = (ep or "index.html")
            href = "%s/%s" % (prefix, ep) if exists("%s/%s" % (code, cand if not cand.endswith("/") else cand + "index.html")) else prefix + "/"
        cur_attr = ' aria-current="true"' if code == cur else ""
        out.append('<a href="%s" hreflang="%s" data-lang="%s"%s>%s <span>%s</span></a>' % (href, code, code, cur_attr, short, label))
    return "".join(out)


def footer_html(page, embed_href=None):
    lg = locale_of(page)
    t = T[lg]
    home = "/" if lg == "en" else "/%s/" % lg
    cols = []
    for i, (key, items) in enumerate(COLS):
        lis = "".join('<li><a href="%s">%s</a></li>' % (localise(path, lg), esc(t[key][idx])) for path, idx in items)
        cols.append('<nav class="cpf-col" aria-label="%s"><h4>%s</h4><ul>%s</ul></nav>' % (esc(t["cols"][i]), esc(t["cols"][i]), lis))
    social = "".join(
        '<a class="cpf-soc" href="%s" target="_blank" rel="%s" aria-label="%s"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="%s"/></svg></a>' % (u, rel, a, d)
        for u, rel, a, d in SOCIAL)
    embed_li = '<li><a href="%s">%s</a></li>' % (embed_href, esc(t["embed_this"])) if embed_href else ""
    return (
        '<footer class="site-footer cp-footer" data-cp-footer="2"><div class="cpf-wrap"><div class="cpf-top">'
        '<div class="cpf-brand"><a class="cpf-logo" href="%(home)s" aria-label="%(homelbl)s"><span class="cpf-mark" aria-hidden="true">CP</span><span class="cpf-name">CalculatePilot</span></a>'
        '<p class="cpf-tag">%(tag)s</p>'
        '<a class="cpf-mail" href="mailto:help@calculatepilot.com"><span class="cpf-dot" aria-hidden="true"></span><strong>help@calculatepilot.com</strong><span class="cpf-sup">%(support)s</span></a>'
        '<div class="cpf-social">%(social)s</div>'
        '<a class="cpf-wp" href="%(wp)s" target="_blank" rel="noopener">%(wpico)s<span>%(wppre)s <b>%(wpname)s</b></span>%(wpext)s</a></div>'
        '%(cols)s</div>'
        '<div class="cpf-bottom footer-bottom"><div class="cpf-legal"><p class="cpf-copy">%(copy)s</p><ul class="cpf-links">'
        '<li><a href="/privacy.html">%(privacy)s</a></li><li><a href="/terms.html">%(terms)s</a></li>'
        '<li class="cpf-ok">%(shield)s<a href="/privacy.html">%(client)s</a></li><li><a href="/privacy.html">%(nolog)s</a></li>%(embed)s</ul></div>'
        '<nav class="footer-langs" data-lang-switch aria-label="%(langlbl)s">%(langs)s</nav></div></div></footer>'
    ) % dict(home=home, homelbl=esc(t["home"]), tag=esc(t["tag"]), support=esc(t["support"]), social=social, wp=WP_URL, wpico=WP_ICON,
             wppre=esc(t["wp_pre"]), wpname=t["wp_name"], wpext=WP_EXT, cols="".join(cols), copy=esc(t["copy"]), privacy=esc(t["privacy"]),
             terms=esc(t["terms"]), shield=SHIELD, client=esc(t["clientside"]), nolog=esc(t["nolog"]), embed=embed_li,
             langlbl=esc(t["lang"]), langs=lang_links(page, lg))


def pages():
    out = subprocess.check_output(["git", "ls-files", "*.html"], cwd=ROOT, text=True).split("\n")
    return [p for p in out if p and not p.startswith(SKIP_PREFIX) and p not in SKIP_FILES]


def process(page, write):
    path = os.path.join(ROOT, page)
    orig = open(path, encoding="utf-8", errors="surrogateescape", newline="").read()
    s = METRICOOL_RE.sub("", orig)
    m = FOOTER_RE.search(s)
    if not m:
        return "nofooter"
    old = m.group(0)
    # keep the per-calculator embed link (nav.js reads it to show "Embed this calculator")
    e = re.search(r'href="(/embed/[^"/]+\.html)"', old)
    new = footer_html(page, e.group(1) if e else None)
    s2 = s[:m.start()] + new + METRICOOL_TAG + s[m.end():]
    for css, ver in (("footer.css", CSS_VER), ("mobile-fix.css", MOBILE_VER)):
        link = '<link rel="stylesheet" href="/css/%s?v=%s">' % (css, ver)
        if "css/" + css in s2:
            s2 = re.sub(r'<link rel="stylesheet" href="/css/%s[^"]*">' % re.escape(css), link, s2, count=1)
        elif "</head>" in s2:
            s2 = s2.replace("</head>", link + "\n</head>", 1)
        else:
            return "nohead"
    if s2 == orig:
        return "same"
    if write:
        open(path, "w", encoding="utf-8", errors="surrogateescape", newline="").write(s2)
    return "changed"


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check = "--check" in sys.argv
    counts = {}
    for pg in args or pages():
        r = process(pg, not check)
        counts[r] = counts.get(r, 0) + 1
        if r in ("nofooter", "nohead"):
            print(r, pg)
    print(counts)
