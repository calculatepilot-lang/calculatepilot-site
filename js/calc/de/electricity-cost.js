/* Electricity & appliance cost calculator — CalculatePilot (Stitch redesign).
   kWh/day = W × h ÷ 1000; cost = kWh/day × days × rate; CO₂ = kWh × factor. Ledger sums appliances. */
(function(){
var C=window.CPX,$=C.$,last='',led=[];
var APPL=[['ac_unit','Zentrale Klimaanlage (3,5 Tonnen)',3500,8],['water_heater','Elektrischer Warmwasserspeicher',4000,3],['ev_station','Heimladestation für E-Autos (Level 2)',7200,2.5],['heat','Tragbares Heizgerät',1500,5],['kitchen','Kühlschrank / Gefrierschrank (ca. 10 Std. Kompressorlaufzeit)',150,10],['local_laundry_service','Elektrischer Wäschetrockner',3000,1],['sports_esports','Gaming-PC und Monitor',450,6],['tv','65-Zoll-Smart-TV',120,5],['dishwasher_gen','Geschirrspüler mit Trocknung',1400,1.2],['microwave','Mikrowelle',1200,0.3],['dns','Heimserver oder NAS',65,24],['lightbulb','LED-Beleuchtung, 10 Lampen',90,6]];
function w(){return C.val('pu')==='k'?0:0;}
function watts(){return $('pu').value==='k'?C.val('pw')*1000:C.val('pw');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','kH','kD','kM','kY','eD','eM','eY','cM'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um die Kosten zu sehen.');last='';}
function compute(){
  var W=watts(),h=C.val('hrs'),d=C.val('days'),r=C.val('rate'),k=C.val('co2');
  C.text('pwUnit',$('pu').value==='k'?'kilowatts':'watts');C.text('hV',C.num(h,1).replace(/[.,]0$/,'')+' hrs');C.text('dV',d+' days');C.text('rateC','= '+C.num(r*100,2).replace(/[.,]?0+$/,'')+' ¢ / kWh');
  $('err').hidden=true;
  if(!(W>0))return fail('Geben Sie eine Leistungsaufnahme größer als null ein.');
  if(!(r>=0)||$('rate').value==='')return fail('Geben Sie Ihren Strompreis pro kWh ein.');
  var kd=W*h/1000,km=kd*d,ky=km*12,cd=kd*r,cm=km*r,cy=cm*12;
  C.text('resultValue',C.money(cm,2));C.text('tag',C.num(W,0)+' W');
  C.text('interp',C.num(W,0)+' W für '+C.num(h,1).replace(/[.,]0$/,'')+' Stunden pro Tag an '+d+' Tagen verbrauchen '+C.num(km,1)+' kWh im Monat bei '+C.money(r,3)+' pro kWh.');
  C.text('kH',C.money(W/1000*r,3));C.text('kD',C.money(cd,2));C.text('kM',C.money(cm,2));C.text('kY',C.money(cy,2));
  C.text('eD',C.num(kd,2));C.text('eM',C.num(km,1));C.text('eY',C.num(ky,0));C.text('cM',C.num(km*k,1));
  last='Stromkosten – calculatepilot.com/other/electricity-cost-calculator.html\n'+C.num(W,0)+' W × '+C.num(h,1)+' Std. × '+d+' Tage bei '+C.money(r,3)+'/kWh\n'+C.num(km,1)+' kWh/Monat = '+C.money(cm,2)+'/month, '+C.money(cy,2)+'/year\nCO₂ ≈ '+C.num(km*k,1)+' kg/month';
  matrix(r);vamp(r);renderLedger(r);
}
function matrix(r){
  C.text('matRate','at '+C.money(r,3)+' pro kWh');
  var h='';APPL.forEach(function(a,i){var e=a[2]*a[3]*30/1000,c=e*r;h+='<tr data-i="'+i+'" style="cursor:pointer"><td class="a"><span class="msym" aria-hidden="true" style="vertical-align:-5px;color:var(--sx-pc)">'+a[0]+'</span> '+C.esc(a[1])+'</td><td class="n">'+C.num(a[2],0)+' W</td><td class="n">'+a[3]+'</td><td class="n">'+C.num(e,1)+'</td><td class="n">'+C.money(c,2)+'</td><td class="n">'+C.money(c*12,2)+'</td><td><button type="button" class="sx-reset" data-use="'+i+'" style="padding:4px 10px;border:1px solid var(--sx-border);border-radius:6px">Verwenden</button></td></tr>';});
  $('matrix').querySelector('tbody').innerHTML=h;
}
function vamp(r){[[2.5,'v1'],[8,'v2'],[15,'v3'],[1,'v4']].forEach(function(v){C.text(v[1],C.money(v[0]*8.76*r,2));});}
function renderLedger(r){
  var h='',te=0,tc=0;
  led.forEach(function(x,i){var e=x.w*x.h*x.d/1000,c=e*x.r;te+=e;tc+=c;h+='<tr><td class="a">'+C.esc(x.name)+'</td><td class="n">'+C.num(x.w,0)+' W</td><td class="n">'+C.num(x.h,1)+'</td><td class="n">'+x.d+'</td><td class="n">'+C.num(e,1)+'</td><td class="n">'+C.money(c,2)+'</td><td><button type="button" class="sx-reset" data-rm="'+i+'" aria-label="Entfernen" style="padding:4px"><span class="msym" aria-hidden="true">delete</span></button></td></tr>';});
  $('led').innerHTML=h||'<tr><td class="a" colspan="7" style="color:var(--sx-muted)">Noch keine Geräte.</td></tr>';
  C.text('ledE',led.length?C.num(te,1)+' kWh':'—');C.text('ledC',led.length?C.money(tc,2):'—');
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
function load(wt,hr){$('pu').value='w';C.set('pw',wt);C.set('hrs',hr);var rg=document.querySelector('input[data-sync="hrs"]');if(rg)rg.value=hr;fire($('pw'));}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'elCalc',compute:compute});
  $('pre').addEventListener('click',function(e){var b=e.target.closest('button[data-w]');if(!b)return;load(+b.getAttribute('data-w'),+b.getAttribute('data-h'));$('pre').dataset.name=b.getAttribute('data-n');e.stopPropagation();});
  document.querySelectorAll('[data-r]').forEach(function(b){b.addEventListener('click',function(){C.set('rate',b.getAttribute('data-r'));fire($('rate'));});});
  document.querySelectorAll('[data-c]').forEach(function(b){b.addEventListener('click',function(){C.set('co2',b.getAttribute('data-c'));fire($('co2'));});});
  $('matrix').addEventListener('click',function(e){var b=e.target.closest('[data-use]');var tr=e.target.closest('tr[data-i]');var i=b?+b.getAttribute('data-use'):tr?+tr.getAttribute('data-i'):-1;if(i<0)return;var a=APPL[i];load(a[2],a[3]);$('pre').dataset.name=a[1];});
  $('addBtn').addEventListener('click',function(){var W=watts();if(!(W>0))return;led.push({name:$('lbl').value.trim()||$('pre').dataset.name||'Gerät '+(led.length+1),w:W,h:C.val('hrs'),d:C.val('days'),r:C.val('rate')});$('lbl').value='';renderLedger();});
  $('clrBtn').addEventListener('click',function(){led=[];renderLedger();});
  $('led').addEventListener('click',function(e){var b=e.target.closest('[data-rm]');if(!b)return;led.splice(+b.getAttribute('data-rm'),1);renderLedger();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
  renderLedger();
});
})();
