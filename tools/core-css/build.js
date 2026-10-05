const postcss=require('postcss');const prefix=require('postcss-prefix-selector');const fs=require('fs');
const css=fs.readFileSync('out.raw.css','utf8').replace(/font-family:\s*Inter(?=[;}])/g,'font-family:Inter,ui-sans-serif,system-ui,sans-serif').replace(/font-family:\s*"?Plus Jakarta Sans"?(?=[;}])/g,'font-family:"Plus Jakarta Sans",Inter,ui-sans-serif,system-ui,sans-serif').replace(/font-family:\s*"?JetBrains Mono"?(?=[;}])/g,'font-family:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace');
postcss([prefix({prefix:'.cpcore',transform(p,sel,pref){
  if(sel.startsWith('.cpcore'))return sel;
  if(sel==='html'||sel==='body'||sel===':host')return p;
  if(sel==='*')return p+', '+p+' *';
  if(sel==='::before'||sel==='::after'||sel==='::backdrop')return p+' '+sel;
  if(/^(html|body)/.test(sel))return sel.replace(/^(html|body)\s*/,p+' ');
  return pref;}}),require('cssnano')({preset:'default'})]).process(css,{from:undefined}).then(r=>{fs.writeFileSync('css/cp-core.css',r.css);console.log(r.css.length)});
