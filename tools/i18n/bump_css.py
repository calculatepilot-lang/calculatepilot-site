"""Bump the ?v= cache-buster of /css/styles.css on every tracked HTML page. Usage: python tools/i18n/bump_css.py <token>"""
import re, subprocess, sys

NEW = sys.argv[1]
files = subprocess.check_output(["git", "ls-files", "*.html"], text=True).split()
n = 0
for f in files:
    s = open(f, encoding="utf-8", errors="surrogateescape", newline="").read()
    t = re.sub(r"(/css/styles\.css\?v=)[A-Za-z0-9]+", r"\g<1>" + NEW, s)
    if t != s:
        open(f, "w", encoding="utf-8", errors="surrogateescape", newline="").write(t)
        n += 1
print("bumped", n)
