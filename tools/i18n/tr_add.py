"""Ingest a translation batch.  python tools/i18n/tr_add.py <todo.json> <batch.json> <batchname>
batch.json: {id: [es, fr, de]} ; writes tools/i18n/tr/<lang>/<batchname>.json keyed by the English key.
Validates that bare-tag sequences match the English key."""
import sys, os, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import seg
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
todo = {}
for f in sys.argv[1].split(","):
    todo.update(json.load(open(f, encoding="utf-8")))
batch = json.load(open(sys.argv[2], encoding="utf-8"))
name = sys.argv[3]
LANGS = ("es", "fr", "de")
out = {l: {} for l in LANGS}
bad = 0
TAG = re.compile(r"<msym/>|</?[a-zA-Z][a-zA-Z0-9]*>")
for k, tr in batch.items():
    if k not in todo:
        print("unknown id", k); bad += 1; continue
    en = todo[k]["en"]
    if len(tr) != 3:
        print("need 3 translations", k, en[:50]); bad += 1; continue
    for l, t in zip(LANGS, tr):
        if TAG.findall(en) != TAG.findall(t):
            print("TAGS", l, k, "|", en[:70], "=>", t[:70]); bad += 1; continue
        out[l][en] = t
for l in LANGS:
    d = os.path.join(ROOT, "tools", "i18n", "tr", l)
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, name + ".json")
    old = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}
    old.update(out[l])
    json.dump(old, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print("ingested", len(batch), "bad", bad)
