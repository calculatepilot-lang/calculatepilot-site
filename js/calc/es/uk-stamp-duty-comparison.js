/* UK stamp duty comparison — CalculatePilot (Stitch 1:1 redesign).
   England & NI SDLT (from 1 Apr 2025): 0/2/5/10/12% at £125k/£250k/£925k/£1.5m; FTB 0% to £300k, 5% to £500k (not
   available above £500k); additional dwellings +5% on every band; non-UK resident +2% on residential bands.
   Scotland LBTT: 0/2/5/10/12% at £145k/£250k/£325k/£750k; FTB nil band £175k; ADS 8% of the whole price (from 5 Dec 2024).
   Wales LTT: main 0/6/7.5/10/12% at £225k/£400k/£750k/£1.5m; higher rates 5/8.5/10/12.5/15/17% (from 11 Dec 2024); no FTB relief.
   Non-residential freehold: SDLT 0/2/5% (£150k/£250k), LBTT 0/1/5% (£150k/£250k), LTT 0/1/5/6% (£225k/£250k/£1m). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var T={
 en:{std:[[125000,0],[250000,.02],[925000,.05],[1500000,.10],[Infinity,.12]],ftb:[[300000,0],[500000,.05]],nr:[[150000,0],[250000,.02],[Infinity,.05]]},
 sc:{std:[[145000,0],[250000,.02],[325000,.05],[750000,.10],[Infinity,.12]],ftb:[[175000,0],[250000,.02],[325000,.05],[750000,.10],[Infinity,.12]],nr:[[150000,0],[250000,.01],[Infinity,.05]]},
 wa:{std:[[225000,0],[400000,.06],[750000,.075],[1500000,.10],[Infinity,.12]],hi:[[180000,.05],[250000,.085],[400000,.10],[750000,.125],[1500000,.15],[Infinity,.17]],nr:[[225000,0],[250000,.01],[1000000,.05],[Infinity,.06]]}
};
function G(x){return '£'+Math.round(x).toLocaleString('en-GB');}
function K(x){return x>=1e6?'£'+(+(x/1e6).toFixed(2))+'M':'£'+(+(x/1000).toFixed(1))+'k';}
function bands(p,tb,add){var lo=0,out=[];tb.forEach(function(b){if(p>lo){var top=Math.min(p,b[0]),slice=top-lo,r=b[1]+add;out.push({lo:lo,hi:top,slice:slice,r:r,t:slice*r});}lo=b[0];});return out;}
function pctS(r){return +(r*100).toFixed(2)+'%';}

function nation(k,p,kind,nonres){
  var t=T[k],rows,extra=[],note='';
  if(kind==='s4'){rows=bands(p,t.nr,0);note='Tabla no residencial';}
  else if(k==='en'){var add=(kind==='s3'&&p>=40000?.05:0)+(nonres?.02:0);
    if(kind==='s2'&&p<=500000){rows=bands(p,t.ftb,nonres?.02:0);note='Exención para primeros compradores aplicada';}
    else{rows=bands(p,t.std,add);note=kind==='s2'?'Exención FTB retirada por encima de £500,000':kind==='s3'?'Incluye tipos más altos de +5 %':'Tipos residenciales estándar';}
    if(nonres)note+=' · +2 % no residente';}
  else if(k==='sc'){rows=bands(p,kind==='s2'?t.ftb:t.std,0);note=kind==='s2'?'Tramo exento de £175,000 para primeros compradores':'Tipos residenciales estándar';
    if(kind==='s3'&&p>=40000){extra.push({lbl:'Recargo por vivienda adicional (8 % × '+G(p)+')',t:p*.08});note='Tipos estándar + 8 % de ADS';}}
  else{rows=bands(p,kind==='s3'&&p>=40000?t.hi:t.std,0);note=kind==='s3'?'Tabla de tipos más altos':kind==='s2'?'Sin exención FTB en Gales':'Tipos residenciales principales';}
  var tot=rows.reduce(function(s,r){return s+r.t;},0)+extra.reduce(function(s,e){return s+e.t;},0);
  return {rows:rows,extra:extra,tot:tot,note:note};
}

function compute(){
  var p=Math.max(0,v('price')),kind=$('kind').value,nonres=$('nonres').checked&&kind!=='s4';
  $('nrRow').style.opacity=kind==='s4'?.5:1;C.text('priceOut',G(p));
  var N=[['en','Inglaterra e Irlanda del Norte','HMRC · SDLT','Impuesto de timbre sobre la tierra (Stamp Duty Land Tax)'],['sc','Escocia','Revenue Scotland · LBTT','Impuesto sobre transacciones de tierras y edificios (Land and Buildings Transaction Tax)'],['wa','Gales','Welsh Revenue Authority · LTT','Impuesto sobre transacciones de tierras (Land Transaction Tax)']];
  var R=N.map(function(n){var r=nation(n[0],p,kind,nonres);r.k=n[0];r.name=n[1];r.au=n[2];r.tx=n[3];return r;});
  var min=Math.min.apply(null,R.map(function(r){return r.tot;})),max=Math.max.apply(null,R.map(function(r){return r.tot;}));
  var best=R.filter(function(r){return r.tot===min;}),bn=best.map(function(r){return r.name;});
  C.text('spH','Diferencia de carga fiscal regional ('+G(p)+' '+(kind==='s4'?'non-residential':'property')+')');
  C.text('spE','Diferencia máxima: '+G(max-min)+(min>0?' ('+(+((max-min)/min*100).toFixed(1))+'%)':''));
  $('spT').innerHTML=max===min?'Las tres naciones cobran lo mismo: <b>'+G(min)+'</b> a este precio.':'<b>'+bn.join(' and ')+'</b> '+(best.length>1?'empatan en':'has')+' el impuesto de compra más bajo a este precio'+R.filter(function(r){return r.tot>min;}).map(function(r){return ', <b>'+G(r.tot-min)+'</b> menos que '+r.name;}).join('')+'.';
  $('cards').innerHTML=R.map(function(r){var isB=r.tot===min&&max>min;
    return '<div class="sx-sc-card'+(isB?' best':'')+'">'+(isB?'<span class="rib">Impuesto más bajo</span>':'')+'<h3>'+r.name+'</h3><div class="au">'+r.au+'</div><div class="tx">'+r.tx+'</div><div class="v">'+G(r.tot)+'</div>'+
      (isB||max===min?'<span class="dl g">'+(max===min?'Igual en todas las naciones':'El más bajo de los tres')+'</span>':'<span class="dl"><span class="msym" aria-hidden="true">north_east</span>+'+G(r.tot-min)+' frente al más bajo</span>')+
      '<div class="er"><span>Tipo efectivo</span><b>'+(p?(r.tot/p*100).toFixed(2):'0.00')+'%</b></div><ul>'+
      r.rows.map(function(b){return '<li><span>'+(b.lo===0?'£0':G(b.lo+1))+' to '+G(b.hi)+' ('+G(b.slice)+' @ '+pctS(b.r)+')</span><b>'+G(b.t)+'</b></li>';}).join('')+
      r.extra.map(function(e){return '<li class="s"><span>'+e.lbl+'</span><b>'+G(e.t)+'</b></li>';}).join('')+'</ul><div class="nt">'+r.note+'</div></div>';}).join('');
  last={p:p,R:R};
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'scCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;var rows=[];last.R.forEach(function(r){r.rows.forEach(function(b){rows.push({n:r.name,b:G(b.lo)+'–'+G(b.hi),r:pctS(b.r),t:Math.round(b.t)});});r.extra.forEach(function(e){rows.push({n:r.name,b:e.lbl,r:'',t:Math.round(e.t)});});rows.push({n:r.name,b:'TOTAL',r:'',t:Math.round(r.tot)});});
    C.csv('uk-stamp-duty-comparison.csv',[{h:'Nación',key:'n'},{h:'Tramo',key:'b'},{h:'Tipo',key:'r'},{h:'Impuesto',key:'t'}],rows);});
  $('calcForm').addEventListener('submit',function(e){e.preventDefault();});
});
window.cpSdltCmp={nation:nation};
})();
