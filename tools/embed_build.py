"""Build embed/<slug>.html widgets from the redesigned calculator pages (same CSS/JS as the live pages).

For every embed/<slug>.html it finds <category>/<slug>.html (financial, health, math, other), keeps the .sx
calculator block (title + inputs + results), hides the rest, and re-uses the existing .embed-brand footer so
embed/widget.php can still strip it for licensed customers.

Usage: python tools/embed_build.py [root] [slug ...]       (default root = repo root, all widgets)
Needs: beautifulsoup4
"""
import os, re, sys
from bs4 import BeautifulSoup, Tag

CATS = ("financial", "health", "math", "other")
SKIP_SCRIPTS = ("nav.js", "consent.js", "search", "language-selector", "googletagmanager", "googlesyndication", "ahrefs")

EMBED_CSS = """
html,body{margin:0;padding:0;background:#fff}
body.cp-embed{min-height:100vh;display:flex;flex-direction:column}
.cp-embed main{flex:1}
.cp-embed .cp-hide{display:none!important}
.cp-embed .sx{padding:10px 12px 4px!important;margin:0!important;max-width:none!important}
.cp-embed .sx-badges{display:none!important}
.cp-embed .sx-headbar,.cp-embed .sx-head,.cp-embed .sx-cihead{margin-bottom:10px!important;padding:0!important}
.cp-embed .sx-headbar p,.cp-embed .sx-head>p,.cp-embed .sx-cihead>p{display:none!important}
.cp-embed h1{font-size:1.2rem!important;line-height:1.25!important;margin:0!important}
.cp-embed .sx-grid{margin-bottom:12px!important}
.cp-embed .sx-chartcard,.cp-embed .cpx-chart,.cp-embed .sx-au-chart,.cp-embed .sx-cichart,.cp-embed .sx-chart,.cp-embed .sx-sched,.cp-embed .sx-cisched{display:none!important}
"""

# lets sites that listen for it size the iframe to the content
HEIGHT_SCRIPT = ("<script>(function(){function s(){try{parent.postMessage({cpEmbedHeight:document.documentElement.scrollHeight,src:location.pathname},'*')}catch(e){}}"
                 "addEventListener('load',s);if(window.ResizeObserver)new ResizeObserver(s).observe(document.body);})();</script>")


def page_for(root, name):
    for c in CATS:
        p = os.path.join(root, c, name)
        if os.path.exists(p):
            return p
    return None


def brand_and_css(old):
    """The existing branding footer markup and its CSS rules (kept identical for widget.php)."""
    m = re.search(r'<div class="embed-brand">.*?</div>', old, re.S)
    brand = m.group(0) if m else ''
    css = ''.join(re.findall(r'(?:^|\n)(\.embed-(?:brand|disclaimer)[^{]*\{[^}]*\})', re.search(r'<style>(.*?)</style>', old, re.S).group(1)))
    return brand, css


def keep_range(children):
    idx_in = [i for i, k in enumerate(children) if k.find(['input', 'select', 'textarea'])]
    idx_live = [i for i, k in enumerate(children) if k.get('aria-live') or k.find(attrs={'aria-live': True})]
    if not idx_in:
        return None
    start = idx_in[0]
    end = max([start] + [i for i in idx_live if i >= start])
    return start, end


def build(root, name):
    page = page_for(root, name)
    old_path = os.path.join(root, 'embed', name)
    if not page:
        return None
    old = open(old_path, encoding='utf-8').read()
    soup = BeautifulSoup(open(page, encoding='utf-8').read(), 'html.parser')
    sx = soup.select_one('main .sx')
    if sx is None:
        return None
    children = [k for k in sx.children if isinstance(k, Tag)]
    if len(children) > 1:
        rng = keep_range(children)
        if rng is None:
            return None
        s, e = rng
        for i, k in enumerate(children):
            is_title = k.name == 'header'
            if not (s <= i <= e or is_title):
                k['class'] = (k.get('class') or []) + ['cp-hide']
    # head assets
    head = soup.head
    heads = []
    for l in head.find_all('link'):
        rel = l.get('rel') or []
        href = l.get('href', '')
        if 'stylesheet' in rel and (href.startswith('/css/') or 'fonts.googleapis.com' in href) or 'preconnect' in rel:
            heads.append(str(l))
    for st in head.find_all('style'):
        heads.append(str(st))
    # scripts: everything from the page body except site chrome/analytics
    scripts = []
    for sc in soup.body.find_all('script'):
        if sc.get('type') == 'application/ld+json':
            continue
        src = sc.get('src')
        if src:
            if any(x in src for x in SKIP_SCRIPTS):
                continue
            scripts.append(str(sc))
        else:
            txt = sc.string or ''
            if txt.strip() and 'gtag' not in txt and 'dataLayer' not in txt:
                scripts.append(str(sc))
    for sc in head.find_all('script'):  # head scripts that are not analytics (rare)
        src = sc.get('src')
        if src and not any(x in src for x in SKIP_SCRIPTS) and sc.get('type') != 'application/ld+json':
            scripts.insert(0, str(sc))
    title = re.search(r'<title>(.*?)</title>', old, re.S).group(1)
    brand, brand_css = brand_and_css(old)
    out = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
           '<title>%s</title>\n<meta name="robots" content="index, follow">\n%s\n<style>\n%s%s\n</style>\n</head>\n'
           '<body class="cp-embed">\n<main>\n%s\n</main>\n\n%s\n\n%s\n</body>\n</html>\n') % (
        title, '\n'.join(heads), EMBED_CSS, brand_css, str(sx), brand, '\n'.join(scripts + [HEIGHT_SCRIPT]))
    return out


if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    names = [a + ('' if a.endswith('.html') else '.html') for a in sys.argv[2:]] or sorted(
        f for f in os.listdir(os.path.join(root, 'embed')) if f.endswith('.html') and f != 'index.html')
    done = skipped = 0
    for n in names:
        res = build(root, n)
        if res is None:
            print('skip (no redesigned page):', n)
            skipped += 1
            continue
        open(os.path.join(root, 'embed', n), 'w', encoding='utf-8', newline='\n').write(res)
        done += 1
    print('built', done, 'skipped', skipped)
