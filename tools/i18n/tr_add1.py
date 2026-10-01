"""Ingest single-language translations. python tools/i18n/tr_add1.py <lang> <todo.json> <out.json> <batchname>
out.json: {id: translation}. Validates inline-tag/placeholder sequences against the English text."""
import sys, os, json, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
lang, todo_p, out_p, name = sys.argv[1:5]
todo = json.load(open(todo_p, encoding="utf-8"))
out = json.load(open(out_p, encoding="utf-8"))
TAG = re.compile(r"<msym/>|</?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?>|&(?!amp;)[a-z]+;|\{[^}]*\}|%[sd]")
res, bad = {}, []
for k, t in out.items():
    if k not in todo:
        bad.append(("unknown", k)); continue
    en = todo[k]
    if not isinstance(t, str) or not t.strip():
        bad.append(("empty", k)); continue
    if sorted(TAG.findall(en)) != sorted(TAG.findall(t)):
        bad.append(("tags", k)); continue
    if re.search(r"&(?!(?:[a-zA-Z]+|#\d+);)", t):
        bad.append(("rawamp", k)); continue
    res[en] = t
missing = [k for k in todo if k not in out]
d = os.path.join(ROOT, "tools", "i18n", "tr", lang); os.makedirs(d, exist_ok=True)
p = os.path.join(d, name + ".json")
old = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}
old.update(res)
json.dump(old, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(name, "ok", len(res), "bad", len(bad), "missing", len(missing))
json.dump({"bad": [b[1] for b in bad], "missing": missing}, open(out_p + ".retry.json", "w"))
