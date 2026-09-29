/* URL encoder/decoder — CalculatePilot (Stitch redesign). Uses encodeURIComponent / encodeURI / decodeURIComponent. */
(function(){
var C=window.CPX,$=C.$,last='';
var X={q:'https://www.calculatepilot.com/search?query=gas leak&metric=m³/hr&filter=cat#1&auth=token+key/test==',o:'https://auth.example.com/callback?redirect_uri=https://app.example.com/cb?state=a b&scope=read write',j:'{"name":"Zoë","tags":["a","b"],"n":1}',i:'https://example.com/café/日本語?q=naïve résumé',clear:''};
function strict(s){return s.replace(/[!'()*]/g,function(c){return '%'+c.charCodeAt(0).toString(16).toUpperCase();});}
function enc(s,full,plus,st){var o=full?encodeURI(s):encodeURIComponent(s);if(st)o=strict(o);if(plus)o=o.replace(/%20/g,'+');return o;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','o1','o2','o3','o4'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';C.text('qN','');last='';}
function bytes(s){return new TextEncoder().encode(s).length-s.length;}
function compute(){
  var mode=$('mode').value,s=$('in').value,plus=$('sp').value==='+',st=$('st').checked;$('err').hidden=true;
  var n=Array.from(s).length;C.text('cnt',n+(n===1?' character':' characters'));
  if(!s)return fail('Enter some text.');
  var out,q=s.indexOf('?')>=0?s.slice(s.indexOf('?')+1):(s.indexOf('=')>=0?s:'');
  try{
    if(mode==='d'){out=decodeURIComponent(plus?s.replace(/\+/g,' '):s);}
    else out=enc(s,mode==='u',plus,st);
  }catch(e){return fail('That text has a malformed percent sequence. Each % needs two hex digits, and the bytes must be valid UTF-8.');}
  C.text('hL',mode==='d'?'Decoded result':'Encoded result');$('resultValue').textContent=out;C.text('tag',mode==='c'?'component':mode==='u'?'full URL':'decoded');
  C.text('interp',mode==='d'?'Percent sequences turned back into text.':'Ready to use in a URL.');
  C.text('o1',String(n));C.text('o2',String(Array.from(out).length));
  var reserved=0;if(mode!=='d'){Array.from(s).forEach(function(c){if(/[:\/?#\[\]@!$&'()*+,;=% ]/.test(c)&&enc(c,mode==='u',false,st)!==c)reserved++;});}
  C.text('o3',mode==='d'?'n/a':String(reserved));C.text('o4',mode==='d'?'n/a':bytes(s)+' extra bytes');
  var pairs=q?q.split('&').filter(function(x){return x.length;}):[];
  C.text('qN',pairs.length+(pairs.length===1?' pair':' pairs'));
  $('rows').innerHTML=pairs.length?pairs.map(function(p){var i=p.indexOf('='),k=i>=0?p.slice(0,i):p,v=i>=0?p.slice(i+1):'',shown,e;
    if(mode==='d'){try{shown=decodeURIComponent(v.replace(/\+/g,plus?' ':'+'));}catch(x){shown=v;}e=v;}else{shown=v;e=enc(v,false,plus,st);}
    return '<tr><td class="a" style="white-space:normal;word-break:break-all">'+C.esc(k)+'</td><td class="a" style="white-space:normal;word-break:break-all">'+C.esc(shown)+'</td><td class="a" style="white-space:normal;word-break:break-all"><code>'+C.esc(e)+'</code></td></tr>';}).join(''):'<tr><td class="a" colspan="3">No key=value pairs in the input.</td></tr>';
  last=out;
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  var ctl=C.init({root:'ueCalc',compute:compute});
  document.querySelectorAll('[data-x]').forEach(function(b){b.addEventListener('click',function(){$('in').value=X[b.getAttribute('data-x')];$('in').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('useBtn').addEventListener('click',function(){if(!last)return;$('in').value=last;$('mode').value=$('mode').value==='d'?'c':'d';$('in').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
