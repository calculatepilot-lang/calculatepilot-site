import re,glob,os,collections,sys
files=[f.replace(chr(92),'/') for f in glob.glob('**/*.html',recursive=True) if not f.startswith('tools/')]
redir={'guides/index.html':'/guides/','financial/car-depreciation-calculator.html':'/other/car-depreciation-calculator.html'}
bad=collections.defaultdict(set);red=collections.defaultdict(set)
for f in files:
    h=open(f,encoding='utf-8',errors='replace').read()
    for m in re.finditer(r'<(?:a|link|script|img|iframe|source)\b[^>]*?\b(?:href|src)="([^"]+)"',h):
        u=m.group(1)
        if not u.startswith('/') or u.startswith('//'):continue
        p=re.split(r'[?#]',u)[0]
        if p.endswith('/'):p+='index.html'
        q=p.lstrip('/')
        if q in redir:red[u].add(f);continue
        if q.startswith(('fr/','de/','es/')) and not os.path.exists(q):bad['LOCALE '+u].add(f);continue
        if not os.path.exists(q) and q!='':bad[u].add(f)
print('files',len(files))
print('MISSING targets',len(bad))
for u,fs in sorted(bad.items(),key=lambda x:-len(x[1]))[:40]:print(len(fs),u,sorted(fs)[0])
print('REDIRECTED targets',{u:len(fs) for u,fs in red.items()})
