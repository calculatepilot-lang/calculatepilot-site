import re,glob,os,collections,sys
base='https://www.calculatepilot.com'
urls=collections.OrderedDict()
SM=['sitemap-core.xml','sitemap-financial.xml','sitemap-health.xml','sitemap-math.xml','sitemap-everyday.xml','sitemap-guides.xml','es/sitemap.xml','fr/sitemap.xml','de/sitemap.xml']
for sm in SM:
    x=open(sm,encoding='utf-8').read()
    for u in re.findall(r'<loc>([^<]+)</loc>',x): urls.setdefault(u,[]).append(sm)
print('urls',len(urls),'dups',[u for u,v in urls.items() if len(v)>1][:5])
def tofile(u):
    p=u.replace(base,'')
    if p.endswith('/'):p+='index.html'
    return p.lstrip('/')
issues=collections.defaultdict(list)
for u,sms in urls.items():
    f=tofile(u)
    if not os.path.exists(f): issues['missing file'].append(u);continue
    h=open(f,encoding='utf-8',errors='replace').read()
    c=re.search(r'<link rel="canonical" href="([^"]*)"',h)
    if not c: issues['no canonical'].append(u)
    elif c.group(1)!=u: issues['canonical differs'].append((u,c.group(1)))
    if re.search(r'<meta name="robots"[^>]*noindex',h,re.I): issues['noindex in sitemap'].append(u)
for k,v in issues.items(): print(k,len(v),v[:8])
inmap={tofile(u) for u in urls}
allf=[f.replace(chr(92),'/') for f in glob.glob('**/*.html',recursive=True)]
notin=[f for f in allf if f not in inmap and not f.startswith('embed/') and not f.startswith('tools/')]
print('html not in sitemap',len(notin))
for f in sorted(notin):
    h=open(f,encoding='utf-8',errors='replace').read()
    ni=bool(re.search(r'<meta name="robots"[^>]*noindex',h,re.I));c=re.search(r'<link rel="canonical" href="([^"]*)"',h)
    print(' ',f,'NOINDEX' if ni else '', c.group(1).replace(base,'') if c else 'NOCANON')
