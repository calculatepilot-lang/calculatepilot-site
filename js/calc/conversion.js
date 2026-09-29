/* Length converter — CalculatePilot (Stitch redesign). Converts through metres with exact international factors. */
(function(){
var C=window.CPX,$=C.$,last='';
var U={mm:[0.001,'mm'],cm:[0.01,'cm'],m:[1,'m'],km:[1000,'km'],um:[1e-6,'µm'],in:[0.0254,'in'],ft:[0.3048,'ft'],yd:[0.9144,'yd'],mi:[1609.344,'mi'],nm:[1852,'NM']};
var NAME={mm:'Millimetres',cm:'Centimetres',m:'Metres',km:'Kilometres',um:'Micrometres',in:'Inches',ft:'Feet',yd:'Yards',mi:'Miles',nm:'Nautical miles'};
function gcd(a,b){return b?gcd(b,a%b):a;}
function sig(x,n){if(x===0)return '0';var a=Math.abs(x);if(a>=1e9||a<1e-4)return x.toExponential(4).replace('e+',' × 10^').replace('e-',' × 10^−');return Number(x.toPrecision(n||6)).toLocaleString('en-US',{maximumFractionDigits:10});}
function tape(inches,N){var neg=inches<0,a=Math.abs(inches),units=Math.round(a*N),w=Math.floor(units/N),r=units%N,s;if(r===0)s=w+' in';else{var g=gcd(r,N);s=(w?w+' ':'')+(r/g)+'/'+(N/g)+' in';}return {txt:(neg?'−':'')+s,err:(units/N-a)*(neg?-1:1)};}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oTp','oSci'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';last='';}
function compute(){
  $('err').hidden=true;var v=parseFloat($('v').value),f=$('f').value,t=$('t').value,dp=+$('dp').value,N=+$('tp').value;
  if(!isFinite(v))return fail('Enter a number to convert.');
  var m=v*U[f][0],out=m/U[t][0],r=Math.abs(out)>0&&Math.abs(out)<Math.pow(10,-dp)||Math.abs(out)>=1e12;
  C.text('resultValue',r?out.toExponential(4):out.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:dp}));C.text('resU',U[t][1]);C.text('tag',U[f][1]+' → '+U[t][1]);
  C.text('interp',sig(v)+' '+U[f][1]+' is '+sig(out,8)+' '+U[t][1]+'.');
  var inch=m/0.0254,tp=tape(inch,N);
  C.text('oTp',Math.abs(inch)>1e7?'—':tp.txt);C.text('oSci',out===0?'0':out.toExponential(3).replace('e+',' × 10^').replace('e-',' × 10^−'));
  $('rows').innerHTML=Object.keys(U).map(function(k){return '<tr><td class="a">'+NAME[k]+'</td><td class="n"><b>'+sig(m/U[k][0],6)+'</b> '+U[k][1]+'</td></tr>';}).join('');
  last='Length conversion — calculatepilot.com/other/conversion-calculator.html\n'+sig(v)+' '+U[f][1]+' = '+sig(out,8)+' '+U[t][1];
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'cvCalc',compute:compute});
  document.querySelectorAll('[data-p]').forEach(function(b){b.addEventListener('click',function(){var p=b.getAttribute('data-p').split(',');$('v').value=p[0];$('f').value=p[1];$('v').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('swap').addEventListener('click',function(){var a=$('f').value;$('f').value=$('t').value;$('t').value=a;$('f').dispatchEvent(new Event('change',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
