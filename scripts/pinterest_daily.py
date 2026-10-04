#!/usr/bin/env python3
"""
CalculatePilot daily Pinterest planner.

  python scripts/pinterest_daily.py plan [--max-new 3] [--variants 1]
      Picks guides that have not been pinned yet (newest first). If there is
      nothing new, picks one FAQ-question "variant" pin for the least-pinned
      guide. For every pick it renders a 1000x1500 pin image into
      images/pinterest/auto/ and prints a JSON plan (title, description with
      hashtags, link, image_url, board_id, alt_text).

  python scripts/pinterest_daily.py record <slug> <pin_id> [faq_index]
      Appends a posted pin to data/pinterest_log.json so it is never repeated.

The script never talks to Pinterest. Posting is done by the scheduled agent
through the Composio Pinterest connection.
"""
import argparse, base64, html as H, io, json, os, re, subprocess, sys, textwrap
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.chdir(ROOT)
BASE = "https://www.calculatepilot.com"
LOG = "data/pinterest_log.json"
CONFIG = "data/pinterest_config.json"
OUT_DIR = "images/pinterest/auto"

DEEP, GREEN = "#0f5b44", "#137456"
FONT = 'font-family="Segoe UI, Arial, Helvetica, sans-serif"'

BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
]


def load_json(path, default):
    if os.path.exists(path):
        with io.open(path, encoding="utf-8") as f:
            return json.load(f)
    return default


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def strip(t):
    return re.sub(r"\s+", " ", H.unescape(re.sub(r"<[^>]+>", " ", t))).strip()


def guide_list():
    """Every guide card in the guides index: slug, path, category."""
    s = io.open("guides/index.html", encoding="utf-8").read()
    secs = [(m.start(), m.group(1)) for m in re.finditer(r'<section class="sx-hcat" data-cat="([^"]+)">', s)]
    out = []
    for m in re.finditer(r'<a class="sx-card sx-tool sx-htool" href="(/[^"]+\.html)"', s):
        href = m.group(1)
        cat = [c for p, c in secs if p < m.start()]
        cat = cat[-1] if cat else "other"
        slug = os.path.basename(href)[:-5]
        path = href.lstrip("/")
        if os.path.exists(path):
            out.append({"slug": slug, "path": path, "href": href, "cat": cat})
    return out


def newest_order():
    order = {}
    if os.path.exists("sitemap-guides.xml"):
        s = io.open("sitemap-guides.xml", encoding="utf-8").read()
        for m in re.finditer(r"<loc>[^<]*/([^/<]+)\.html</loc>\s*<lastmod>([^<]+)</lastmod>", s):
            order[m.group(1)] = m.group(2)
    return order


def parse_guide(g):
    s = io.open(g["path"], encoding="utf-8").read()
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S)
    title = strip(h1.group(1)) if h1 else strip(re.search(r"<title>(.*?)</title>", s, re.S).group(1))
    desc = re.search(r'name="description" content="([^"]*)"', s)
    desc = H.unescape(desc.group(1)).strip() if desc else ""
    og = re.search(r'property="og:image" content="([^"]+)"', s)
    hero = None
    if og:
        p = og.group(1).replace(BASE, "").lstrip("/")
        if os.path.exists(p) and not p.endswith("og-share.png"):
            hero = p
    faqs = [strip(m) for m in re.findall(r"<h3>(.*?)</h3>", s, re.S)]
    faqs = [q for q in faqs if q.endswith("?")]
    return dict(title=title, desc=desc, hero=hero, faqs=faqs)


def board_for(g, info, cfg):
    t = (info["title"] + " " + g["slug"]).lower()
    boards = cfg["boards"]
    if re.search(r"pregnan|due-date|due date|baby", t):
        return "pregnancy"
    if re.search(r"grade|gpa|exam|student|school", t) and "loan" not in t:
        return "study"
    if re.search(r"mortgage|house|home|rent|refinanc|down-payment|down payment|va-home|amortiz|529", t):
        return "home" if "529" not in t else "money"
    if g["cat"] == "finance":
        return "money"
    if re.search(r"calorie|protein|bmi|steps|weight|fitness|macro|bac|alcohol|height", t) or g["cat"] == "health":
        return "fitness" if not re.search(r"moving|car-|depreciation|utc|number|percent", t) else "calculators"
    if g["cat"] == "math":
        return "study"
    return "calculators"


def hashtags(board_key, title, cfg):
    tags = list(cfg["boards"][board_key]["tags"])
    words = [w for w in re.findall(r"[A-Za-z]{5,}", title) if w.lower() not in
             ("should", "would", "could", "which", "about", "their", "there", "needs", "while", "where", "other", "money", "guide")]
    for w in words[:2]:
        t = "#" + w.lower()
        if t not in tags:
            tags.append(t)
    tags.append("#freecalculator")
    return " ".join(tags[:7])


def make_description(info, board_key, cfg, question=None):
    base = info["desc"]
    if question:
        base = f"{question} {info['desc']}"
    base = re.sub(r"\s+", " ", base)
    tail = " Free calculator and full guide on CalculatePilot."
    tags = " " + hashtags(board_key, info["title"], cfg)
    room = 800 - len(tail) - len(tags)
    if len(base) > room:
        base = base[: room - 1].rsplit(" ", 1)[0] + "."
    return (base + tail + tags).strip()


def wrap(t, n):
    return textwrap.wrap(t, n) or [""]


def hero_b64(path):
    from PIL import Image
    im = Image.open(path).convert("RGB")
    im = im.resize((840, int(im.height * 840 / im.width)))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=88)
    return base64.b64encode(buf.getvalue()).decode(), im.height


def pin_svg(kicker, title, hero_path, sub):
    lines = wrap(title, 22)[:4]
    fs = 66 if len(lines) <= 3 else 56
    ty = 215
    t = "".join(f'<text x="80" y="{ty + i * (fs + 14)}" {FONT} font-size="{fs}" font-weight="800" fill="#ffffff">{H.escape(l, quote=False)}</text>' for i, l in enumerate(lines))
    img_y = ty + len(lines) * (fs + 14) + 10
    body = ""
    if hero_path:
        b64, hh = hero_b64(hero_path)
        body += f'<clipPath id="c"><rect x="80" y="{img_y}" width="840" height="{hh}" rx="22"/></clipPath><image href="data:image/jpeg;base64,{b64}" x="80" y="{img_y}" width="840" height="{hh}" clip-path="url(#c)"/>'
        sy = img_y + hh + 70
    else:
        sy = img_y + 40
    sl = "".join(f'<text x="80" y="{sy + i * 46}" {FONT} font-size="34" fill="#e8f5f0">{H.escape(l, quote=False)}</text>' for i, l in enumerate(wrap(sub, 46)[:3]))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500" viewBox="0 0 1000 1500">
<defs><linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="{DEEP}"/><stop offset="1" stop-color="#1b9a73"/></linearGradient></defs>
<rect width="1000" height="1500" fill="url(#g)"/>
<circle cx="900" cy="120" r="280" fill="#ffffff" opacity="0.06"/>
<text x="80" y="120" {FONT} font-size="32" font-weight="700" fill="#b7e0d2" letter-spacing="4">{H.escape(kicker.upper(), quote=False)}</text>
{t}
{body}
{sl}
<rect x="80" y="1296" width="440" height="84" rx="42" fill="#ffffff"/>
<text x="300" y="1352" {FONT} font-size="36" font-weight="800" fill="{DEEP}" text-anchor="middle">Read the guide</text>
<text x="920" y="1352" {FONT} font-size="32" font-weight="700" fill="#ffffff" text-anchor="end">calculatepilot.com</text>
</svg>'''


def render(svg, out):
    browser = next((b for b in BROWSERS if os.path.exists(b)), None)
    if not browser:
        raise SystemExit("No Edge/Chrome found to render pins")
    tmp = out + ".svg"
    io.open(tmp, "w", encoding="utf-8").write(svg)
    png = out + ".png"
    subprocess.run([browser, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--window-size=1000,1500",
                    f"--screenshot={os.path.abspath(png)}", "file:///" + os.path.abspath(tmp).replace("\\", "/")],
                   check=True, capture_output=True, timeout=120)
    from PIL import Image
    im = Image.open(png).convert("RGB")
    if im.size != (1000, 1500):
        im = im.crop((0, 0, 1000, 1500))
    im.save(out, "JPEG", quality=90, optimize=True)
    os.remove(tmp)
    os.remove(png)


def kicker_for(board_key, cfg):
    return cfg["boards"][board_key]["kicker"]


def plan(max_new, variants):
    cfg = load_json(CONFIG, None)
    if not cfg:
        raise SystemExit("missing " + CONFIG)
    log = load_json(LOG, {"pins": []})
    pinned = {}
    for p in log["pins"]:
        pinned.setdefault(p["slug"], []).append(p)
    guides = guide_list()
    order = newest_order()
    new = [g for g in guides if g["slug"] not in pinned]
    new.sort(key=lambda g: order.get(g["slug"], ""), reverse=True)
    picks = [(g, None) for g in new[:max_new]]
    if not picks:
        # variant pins: least-pinned, then least-recently pinned guide with an unused FAQ question
        cands = []
        for g in guides:
            info = parse_guide(g)
            used = {p.get("faq") for p in pinned.get(g["slug"], []) if p.get("faq") is not None}
            free = [i for i in range(len(info["faqs"])) if i not in used]
            if free:
                last = max((p["date"] for p in pinned.get(g["slug"], [])), default="")
                cands.append((len(pinned.get(g["slug"], [])), last, g, free[0]))
        cands.sort(key=lambda c: (c[0], c[1]))
        picks = [(c[2], c[3]) for c in cands[:variants]]
    os.makedirs(OUT_DIR, exist_ok=True)
    result = []
    for g, faq_i in picks:
        info = parse_guide(g)
        bk = board_for(g, info, cfg)
        board = cfg["boards"][bk]
        title_text = info["faqs"][faq_i] if faq_i is not None else info["title"]
        question = None
        suffix = f"-q{faq_i + 1}" if faq_i is not None else ""
        fname = f"{g['slug']}{suffix}.jpg"
        out = os.path.join(OUT_DIR, fname)
        if faq_i is None:
            first = re.split(r"(?<=[.!?])\s", info["desc"])[0]
            sub = first if len(first) <= 90 else first[:88].rsplit(" ", 1)[0] + "…"
        else:
            sub = "Answer, formula and worked example inside."
        render(pin_svg(kicker_for(bk, cfg), title_text, info["hero"], sub), out)
        link = f"{BASE}{g['href']}?utm_source=pinterest&utm_medium=pin&utm_campaign=guides"
        result.append({
            "slug": g["slug"], "faq": faq_i, "board_key": bk, "board_id": board["id"], "board_name": board["name"],
            "title": title_text[:100], "description": make_description(info, bk, cfg, question),
            "link": link, "image_path": out.replace("\\", "/"), "image_url": f"{BASE}/{out.replace(os.sep, '/')}",
            "alt_text": f"Pin graphic: {info['title']}"[:500],
        })
    print(json.dumps(result, indent=2, ensure_ascii=False))


def record(slug, pin_id, faq=None):
    log = load_json(LOG, {"pins": []})
    log["pins"].append({"slug": slug, "pin_id": pin_id, "date": date.today().isoformat(),
                        **({"faq": int(faq)} if faq not in (None, "", "None") else {})})
    save_json(LOG, log)
    print("recorded", slug)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p1 = sub.add_parser("plan"); p1.add_argument("--max-new", type=int, default=3); p1.add_argument("--variants", type=int, default=1)
    p2 = sub.add_parser("record"); p2.add_argument("slug"); p2.add_argument("pin_id"); p2.add_argument("faq", nargs="?")
    a = ap.parse_args()
    if a.cmd == "plan":
        plan(a.max_new, a.variants)
    else:
        record(a.slug, a.pin_id, a.faq)
