/* Unit price & grocery comparison — CalculatePilot (Stitch redesign).
   Every package is converted to a base unit (grams / millilitres / items) with NIST SP 811 factors,
   unit price = price ÷ base quantity × target-unit factor. Baseline is item A. */
(function(){
var C=window.CPX,$=C.$,N=6,last='';
var U={
 w:{base:'g',units:[['oz','oz',28.349523125],['lb','lb',453.59237],['g','g',1],['kg','kg',1000]],eq:[['lb',453.59237],['kg',1000]]},
 v:{base:'mL',units:[['fl oz','fl oz',29.5735295625],['pt','pt',473.176473],['qt','qt',946.352946],['gal','gal',3785.411784],['mL','mL',1],['L','L',1000]],eq:[['gal',3785.411784],['L',1000]]},
 c:{base:'item',units:[['each','each',1],['dozen','dozen',12],['100 Stück','100 St.',100]],eq:[['100 Stück',100]]}
};
var DEF={w:['oz','oz'],v:['fl oz','fl oz'],c:['each','each']};
var PRE={
 oil:{d:'v',t:'fl oz',it:[['Standardflasche',9.49,16.9,'fl oz'],['Familienflasche',12.99,25.4,'fl oz'],['Großdose',21.99,50.7,'fl oz']]},
 towels:{d:'c',t:'each',it:[['Normalpackung',8.49,660,'each'],['Familienpackung',15.99,1320,'each'],['Großpackung',22.99,1980,'each']]},
 soap:{d:'v',t:'fl oz',it:[['Normaler Behälter',10.99,50,'fl oz'],['Sparbehälter',17.99,100,'fl oz'],['Großbehälter',24.99,150,'fl oz']]}
};
function unitDef(d,name){var us=U[d].units;for(var i=0;i<us.length;i++)if(us[i][0]===name)return us[i];return us[0];}
function fillUnits(d){
  var us=U[d].units,h='';us.forEach(function(u){h+='<option value="'+u[0]+'">'+C.esc(u[0])+'</option>';});
  for(var i=0;i<N;i++){var s=$('u'+i),cur=s.value;s.innerHTML=h;s.value=us.some(function(u){return u[0]===cur;})?cur:DEF[d][0];}
  var t=$('tu'),ct=t.value;t.innerHTML=h;t.value=us.some(function(u){return u[0]===ct;})?ct:DEF[d][1]==='oz'?'oz':DEF[d][0];
}
function up(x){if(!isFinite(x))return '—';var s=x>=1?x.toFixed(2):x>=0.1?x.toFixed(3):x>=0.01?x.toFixed(4):x.toPrecision(3);return C.symbol()+s;}
function shown(){var n=0;for(var i=0;i<N;i++)if(!$('it'+i).hidden)n++;return n;}
var curDim='w';

function compute(){
  var d=$('dim').value;
  if(d!==curDim){curDim=d;fillUnits(d);}
  var td=unitDef(d,$('tu').value),ns=shown(),rows=[],i;
  $('err').hidden=true;
  for(i=0;i<N;i++){
    if($('it'+i).hidden)continue;
    var p=C.val('p'+i),q=C.val('q'+i),ud=unitDef(d,$('u'+i).value),ok=$('p'+i).value!==''&&q>0&&p>=0;
    var baseQ=q*ud[2],pb=ok?p/baseQ:NaN;
    rows.push({i:i,ok:ok,p:p,q:q,ud:ud,baseQ:baseQ,pb:pb,pt:pb*td[2]});
  }
  var valid=rows.filter(function(r){return r.ok;});
  rows.forEach(function(r){var s=r.i;C.text('us'+s,'/ '+td[1]);C.text('h'+s,s===0?'Standard-Vergleichsbasis':s===1?'Vorteilspackung':s===2?'Großpackung':'Option '+String.fromCharCode(65+s));});
  if(valid.length<2){
    rows.forEach(function(r){C.text('up'+r.i,r.ok?up(r.pt):'—');C.text('eq'+r.i,'—');C.text('dl'+r.i,'Geben Sie mindestens zwei Produkte ein');C.text('tg'+r.i,'—');$('it'+r.i).classList.remove('best');});
    C.text('sumTxt','Geben Sie für mindestens zwei Produkte einen Preis und eine Menge ein, um sie zu vergleichen.');last='';return;
  }
  var base=valid[0],best=valid.reduce(function(a,b){return b.pb<a.pb?b:a;});
  rows.forEach(function(r){
    var el=$('it'+r.i);el.classList.toggle('best',r===best);
    if(!r.ok){C.text('up'+r.i,'—');C.text('eq'+r.i,'Preis und Menge eingeben');C.text('dl'+r.i,'—');C.text('tg'+r.i,'—');return;}
    C.text('up'+r.i,up(r.pt));
    C.text('eq'+r.i,'Auch '+U[d].eq.map(function(e){return up(r.pb*e[1])+' / '+e[0];}).join(' · '));
    var diff=(1-r.pb/base.pb)*100,dl=$('dl'+r.i);
    if(r===base){dl.innerHTML='<span class="msym" aria-hidden="true">horizontal_rule</span>Vergleichsbasis';C.text('tg'+r.i,'Ausgangswert');}
    else if(diff>0.005){dl.innerHTML='<span class="msym" aria-hidden="true">arrow_downward</span>'+up((base.pb-r.pb)*td[2])+' günstiger pro '+C.esc(td[1])+' than '+C.esc(base.i===0?'A':'das erste Produkt');C.text('tg'+r.i,'Ersparnis '+diff.toFixed(1)+'%');}
    else if(diff<-0.005){dl.innerHTML='<span class="msym" aria-hidden="true">arrow_upward</span>'+up((r.pb-base.pb)*td[2])+' mehr pro '+C.esc(td[1])+' als A';C.text('tg'+r.i,'Kostet '+(-diff).toFixed(1)+'% mehr');}
    else{dl.innerHTML='<span class="msym" aria-hidden="true">horizontal_rule</span>Gleich wie die Vergleichsbasis';C.text('tg'+r.i,'Gleich');}
    $('tg'+r.i).classList.toggle('g',diff>0.005);
    if(r===best)C.text('fl'+r.i,diff>0.005?' · spart '+diff.toFixed(1)+'%':'');
  });
  C.text('tg'+base.i,'Ausgangswert');$('tg'+base.i).classList.remove('g');
  var nm=function(r){return ($('l'+r.i).value.trim()||'Position '+String.fromCharCode(65+r.i))+' ('+C.num(r.q,2).replace(/[.,]?0+$/,'')+' '+r.ud[1]+')';};
  if(best===base){C.text('sumTxt',nm(best)+' hat bereits den niedrigsten Stückpreis ('+up(best.pt)+' per '+td[1]+'), daher spart keine andere Packung Geld.');}
  else{
    var atBase=best.baseQ*base.pb,save=atBase-best.p,pct=save/atBase*100,mult=best.baseQ/base.baseQ;
    C.text('sumTxt','Der Kauf von '+nm(best)+' anstelle derselben Menge der Vergleichsbasis zu deren Stückpreis kostet '+C.money(best.p,2)+' statt '+C.money(atBase,2)+' ('+(Math.abs(mult-Math.round(mult))<0.005?'about '+Math.round(mult)+' × die Packung der Vergleichsbasis':'dieselbe Menge')+'). Das spart '+C.money(save,2)+' ('+pct.toFixed(1)+'%).');
  }
  /* shrinkflation */
  var s0=C.val('s0'),s1=C.val('s1');
  if(s0>0&&s1>0){var inc=(s0/s1-1)*100,loss=(1-s1/s0)*100;C.text('shr',(inc>0?'+':inc<0?'−':'')+Math.abs(inc).toFixed(2)+'%');C.text('shrLoss',(loss>=0?'−':'+')+Math.abs(loss).toFixed(2)+'% Größe');}
  else{C.text('shr','—');C.text('shrLoss','—');}
  last='Stückpreisvergleich — calculatepilot.com/other/unit-price-calculator.html\n'+valid.map(function(r){return nm(r)+': '+C.money(r.p,2)+' = '+up(r.pt)+' per '+td[1]+(r===best?'  ← bester Kauf':'');}).join('\n');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));}

document.addEventListener('DOMContentLoaded',function(){
  fillUnits('w');$('u0').value='oz';$('u1').value='oz';$('u2').value='oz';$('tu').value='oz';
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'upCalc',compute:compute});
  $('addBtn').addEventListener('click',function(){for(var i=3;i<N;i++){if($('it'+i).hidden){$('it'+i).hidden=false;$('p'+i).focus();fire($('p'+i));return;}}$('addBtn').disabled=true;});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-p]');if(!b)return;var p=PRE[b.getAttribute('data-p')];
    $('dim').value=p.d;curDim=p.d;fillUnits(p.d);$('tu').value=p.t;
    p.it.forEach(function(r,i){C.set('l'+i,r[0]);C.set('p'+i,r[1]);C.set('q'+i,r[2]);$('u'+i).value=r[3];});
    for(var i=3;i<N;i++)$('it'+i).hidden=true;fire($('dim'));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
});
})();
