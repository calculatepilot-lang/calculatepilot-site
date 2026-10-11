import re,subprocess
files=[f for f in subprocess.check_output(['git','ls-files','*.html'],text=True).split() if not f.startswith(('tools/','embed/','es/','fr/','de/'))]
tpl=open('financial/1031-exchange-calculator.html',encoding='utf-8',newline='').read()
FULL=re.search(r'<footer.*?</footer>',tpl,re.S).group(0)
n=0
for f in files:
    s=open(f,encoding='utf-8',errors='surrogateescape',newline='').read()
    m=re.search(r'<footer.*?</footer>',s,re.S)
    if not m or 'footer-grid' in m.group(0) or 'cp-footer' in m.group(0):continue  # cp-footer = current design, owned by tools/footer_build.py
    emb=re.search(r'<a href="(/embed/[^"]+)"[^>]*>([^<]*)</a>',m.group(0))
    new=FULL
    if emb:
        new=new.replace('<span><a href="/" style="color:var(--slate);">All calculators →</a></span>','<span><a href="%s" target="_blank">%s</a> · <a href="/" style="color:var(--slate);">All calculators →</a></span>'%(emb.group(1),emb.group(2)))
    s2=s[:m.start()]+new+s[m.end():]
    open(f,'w',encoding='utf-8',errors='surrogateescape',newline='').write(s2);n+=1
print('footers replaced',n)
