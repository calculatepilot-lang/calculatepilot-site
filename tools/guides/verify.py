"""Content-preservation check: every word of each source guide must appear in the built page."""
import os, re, sys, collections
from bs4 import BeautifulSoup
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def words(t): return re.findall(r"[\w$%.,'’\-]+", re.sub(r"\s+", " ", t).lower())
bad = 0
for f in sorted(os.listdir(os.path.join(ROOT, "tools/guides/src"))):
    s = f[:-5]
    src = BeautifulSoup(open(os.path.join(ROOT, "tools/guides/src", f), encoding="utf-8").read(), "html.parser").find("main")
    out = BeautifulSoup(open(os.path.join(ROOT, "guides", f), encoding="utf-8").read(), "html.parser").find("main")
    a = collections.Counter(words(src.get_text(" ")))
    b = collections.Counter(words(out.get_text(" ")))
    miss = a - b
    n = sum(miss.values())
    imgs_src = len(src.find_all("img")); imgs_out = len(out.find_all("img"))
    tag = "OK " if n == 0 and imgs_src == imgs_out else "!! "
    if tag == "!! ": bad += 1
    print(tag + s, "missing words:", n, list(miss)[:12], "imgs %d->%d" % (imgs_src, imgs_out))
print("problems:", bad)
