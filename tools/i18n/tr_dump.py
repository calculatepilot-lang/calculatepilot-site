import sys, json, re
d = json.load(open(sys.argv[1], encoding="utf-8"))
a, n = int(sys.argv[2]), int(sys.argv[3])
items = list(d.items())[a:a + n]
for k, v in items:
    print(k + "|" + re.sub(r"\s+", " ", v["en"]))
print("--", a + len(items), "of", len(d))
