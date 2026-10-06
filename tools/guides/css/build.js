// Scopes the raw Tailwind output under .cpguide -> css/cp-guide.css. Run via tools/guides/css/rebuild.sh
const postcss=require('postcss');const prefix=require('postcss-prefix-selector');const fs=require('fs');
const css=fs.readFileSync('out.raw.css','utf8')
 .replace(/font-family:\s*Inter(?=[;}])/g,'font-family:Inter,ui-sans-serif,system-ui,sans-serif')
 .replace(/font-family:\s*"?Space Grotesk"?(?=[;}])/g,'font-family:"Space Grotesk",Inter,ui-sans-serif,system-ui,sans-serif')
 .replace(/font-family:\s*"?IBM Plex Mono"?(?=[;}])/g,'font-family:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace');
const out=process.argv[2];
postcss([prefix({prefix:'.cpguide',transform(p,sel,pref){
  if(sel.startsWith('.cpguide'))return sel;
  if(sel==='html'||sel==='body'||sel===':host')return p;
  if(sel==='*')return p+', '+p+' *';
  if(sel==='::before'||sel==='::after'||sel==='::backdrop')return p+' '+sel;
  if(/^(html|body)/.test(sel))return sel.replace(/^(html|body)\s*/,p+' ');
  return pref;}}),require('cssnano')({preset:'default'})]).process(css,{from:undefined}).then(r=>{fs.writeFileSync(out,r.css);console.log(r.css.length)});
