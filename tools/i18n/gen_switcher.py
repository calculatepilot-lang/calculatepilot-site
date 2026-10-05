"""Regenerate the per-locale TRANSLATED map in js/language-switcher.js from the files on disk."""
import os, re, glob, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
p = os.path.join(ROOT, "js", "language-switcher.js")
s = open(p, encoding="utf-8").read()
m = {}
for l in ("es", "fr", "de"):
    paths = ["/" if f == "index.html" else "/" + f for f in sorted(os.path.relpath(x, os.path.join(ROOT, l)).replace("\\", "/") for x in glob.glob(os.path.join(ROOT, l, "**", "*.html"), recursive=True))]
    m[l] = {x: 1 for x in paths}
body = "  var TRANSLATED_BY = " + json.dumps(m, indent=1).replace("\n", "\n  ") + ";\n"
s = re.sub(r"  var TRANSLATED = \{.*?\n  \};\n|  var TRANSLATED_BY = \{.*?\n  \};\n", lambda _: body, s, count=1, flags=re.S)
s = s.replace("function hasTranslation(cleanPath) {\n    var TRANSLATED = TRANSLATED_BY[window.__cpLoc || 'x'] || {};", "function hasTranslation(cleanPath) {")
open(p, "w", encoding="utf-8").write(s)
