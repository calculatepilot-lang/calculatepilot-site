/* Base64 encoder/decoder — CalculatePilot (Stitch redesign). RFC 4648, UTF-8 via TextEncoder/TextDecoder. */
(function(){
var C=window.CPX,$=C.$,last='';
var AB='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var X={hello:'Hello, CalculatePilot!',jwt:'{"alg":"HS256","typ":"JWT"}',auth:'user:password',emoji:'Café ☕ 你好 🚀',clear:''};
function b64(bytes,url,pad,wrap){var o='',i;for(i=0;i<bytes.length;i+=3){var a=bytes[i],b=i+1<bytes.length?bytes[i+1]:0,c=i+2<bytes.length?bytes[i+2]:0,n=(a<<16)|(b<<8)|c;o+=AB.charAt(n>>18&63)+AB.charAt(n>>12&63)+(i+1<bytes.length?AB.charAt(n>>6&63):'=')+(i+2<bytes.length?AB.charAt(n&63):'=');}
  if(url)o=o.replace(/\+/g,'-').replace(/\//g,'_');if(!pad)o=o.replace(/=+$/,'');if(wrap)o=o.replace(/(.{76})(?=.)/g,'$1\n');return o;}
function unb64(s){s=s.replace(/\s+/g,'').replace(/-/g,'+').replace(/_/g,'/');if(/[^A-Za-z0-9+\/=]/.test(s))return null;s=s.replace(/=+$/,'');if(s.length%4===1)return null;var out=[],i,buf=0,bits=0;for(i=0;i<s.length;i++){buf=(buf<<6)|AB.indexOf(s.charAt(i));bits+=6;if(bits>=8){bits-=8;out.push((buf>>bits)&255);buf&=(1<<bits)-1;}}return new Uint8Array(out);}
function hexBytes(s){s=s.replace(/0x/gi,'').replace(/[\s,:-]+/g,'');if(!s.length||s.length%2||/[^0-9a-f]/i.test(s))return null;var o=new Uint8Array(s.length/2);for(var i=0;i<o.length;i++)o[i]=parseInt(s.substr(i*2,2),16);return o;}
function toHex(b){return Array.prototype.map.call(b,function(x){return (x<16?'0':'')+x.toString(16);}).join(' ');}
function size(n){return n+(n===1?' byte':' bytes');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','o1','o2','o3','o4'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';last='';}
function compute(){
  var mode=$('mode').value,s=$('in').value,f=$('fm').value,url=$('us').checked,pad=!$('np').checked,wrap=$('mw').checked;$('err').hidden=true;
  var dec=mode==='d';C.text('inL',dec?'Base64 to decode':(f==='h'?'Hex bytes to encode':'Text to encode'));C.text('fmL',dec?'Show the result as':'Input is');
  var sel=$('fm');sel.options[0].text=dec?'Text (UTF-8)':'Text (UTF-8)';sel.options[1].text=dec?'Hex bytes':'Hex bytes';
  if(!s)return fail('Enter something to convert.');
  var bytes,out,src;
  if(!dec){
    if(f==='h'){bytes=hexBytes(s);if(!bytes)return fail('Hex input needs pairs of digits 0 to 9 and a to f, for example 48 65 6c 6c 6f.');}else bytes=new TextEncoder().encode(s);
    C.text('cnt',size(bytes.length));out=b64(bytes,url,pad,wrap);
    C.text('hL','Base64 output');$('resultValue').textContent=out;C.text('tag',url?'Base64url':'Base64');C.text('interp','Encoded '+size(bytes.length)+' as '+out.replace(/\n/g,'').length+' characters.');
    var flat=out.replace(/\n/g,'');C.text('o1',size(bytes.length));C.text('o2',flat.length+' characters');C.text('o3',bytes.length?'+'+((Math.ceil(bytes.length/3)*4/bytes.length-1)*100).toFixed(1)+'%':'—');C.text('o4',(flat.match(/=/g)||[]).length+' "="');src=flat;
  }else{
    bytes=unb64(s);if(!bytes)return fail('That is not valid Base64. Use A to Z, a to z, 0 to 9, + and / (or - and _), and optional = at the end.');
    C.text('cnt',s.replace(/\s+/g,'').length+' characters');
    var txt=null;try{txt=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch(e){}
    if(f==='h'||txt===null){out=toHex(bytes);C.text('tag',txt===null&&f!=='h'?'binary data, shown as hex':'hex');}else{out=txt;C.text('tag','text (UTF-8)');}
    C.text('hL','Decoded output');$('resultValue').textContent=out;C.text('interp','Decoded to '+size(bytes.length)+'.');
    var n=s.replace(/\s+/g,'').length;C.text('o1',n+' characters');C.text('o2',size(bytes.length));C.text('o3',bytes.length?'−'+((1-bytes.length/n)*100).toFixed(1)+'%':'—');C.text('o4',(s.match(/=/g)||[]).length+' "="');src=null;
  }
  var rows='';
  if(!dec){var flat2=src.replace(/=/g,'');for(var i=0;i<Math.min(4,flat2.length);i++){var c=flat2.charAt(i),ix=url?AB.indexOf(c.replace('-','+').replace('_','/')):AB.indexOf(c);rows+='<tr><td class="a"><code>'+C.esc(c)+'</code></td><td class="n">'+ix+'</td><td class="n"><code>'+('000000'+ix.toString(2)).slice(-6)+'</code></td></tr>';}}
  else{var t=s.replace(/\s+/g,'').replace(/=+$/,'');for(var j=0;j<Math.min(4,t.length);j++){var ch=t.charAt(j),x2=AB.indexOf(ch.replace('-','+').replace('_','/'));rows+='<tr><td class="a"><code>'+C.esc(ch)+'</code></td><td class="n">'+x2+'</td><td class="n"><code>'+('000000'+x2.toString(2)).slice(-6)+'</code></td></tr>';}}
  $('rows').innerHTML=rows;last=out;
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'b6Calc',compute:compute});
  document.querySelectorAll('[data-x]').forEach(function(b){b.addEventListener('click',function(){$('in').value=X[b.getAttribute('data-x')];$('in').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('useBtn').addEventListener('click',function(){if(!last)return;$('in').value=last;$('mode').value=$('mode').value==='d'?'e':'d';$('fm').value='t';$('in').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
