import re,subprocess
files=[f for f in subprocess.check_output(['git','ls-files','*.html','*.js','*.json','*.md'],text=True).split() if not f.startswith(('tools/',)) and not f.endswith('.min.js')]
P167=re.compile(r'\b167\b(?=\s+(?:[A-Za-z\u00c0-\u00ff]+\s+)?(?:calculators|Calculators|tools|Tools|calculadoras|calculateurs|Rechner|herramientas|outils))')
P1=re.compile(r'\b(?:158|160)\+(?=\s+(?:free\s+)?(?:calculators|tools|calculadoras|calculateurs|Rechner))')
n=0
for f in files:
    try:s=open(f,encoding='utf-8',newline='').read()
    except Exception:continue
    t=P167.sub('170',s);t=P1.sub('170+',t)
    if t!=s:
        open(f,'w',encoding='utf-8',newline='').write(t);n+=1;print(f)
print(n)
