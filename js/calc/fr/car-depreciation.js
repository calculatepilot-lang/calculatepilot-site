/* Car depreciation & total cost of ownership — CalculatePilot (Stitch redesign).
   Value(n) = value(n-1) × (1 − rate(n)); typical curve: class year-1 %, then 15%, then 10% a year; steep: 27% then 12%; custom.
   Used cars start further along the curve (offset years). Loan interest from a standard amortising schedule.
   TCO = value lost + interest paid in the ownership period + (insurance + maintenance + fuel) × years. */
(function(){
var C=window.CPX,$=C.$,last='';
var CLASSES=[['SUV intermédiaire',18],['Berline compacte',19],['Berline de luxe',28],['Véhicule électrique',24],['Pick-up pleine grandeur',15],['Voiture de sport',16]];
function rateAt(curve,i,y1,y1c,ylc){ /* i = 0-based year on the curve */
  if(curve==='steep')return i===0?0.27:0.12;
  if(curve==='cust')return (i===0?y1c:ylc)/100;
  return i===0?y1/100:i===1?0.15:0.10;
}
function money(x){return C.money(x,0);}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oTco','oPm','oLoss','oMo'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir l’estimation.');$('dist').innerHTML='';$('bar').innerHTML='';$('sched').querySelector('tbody').innerHTML='';last='';}
function loanInterest(P,apr,term,years){
  if(P<=0||term<=0)return {int:0,pay:0,bal:0};
  var r=apr/1200,pay=r>0?P*r/(1-Math.pow(1+r,-term)):P/term,bal=P,int=0,months=Math.min(term,Math.round(years*12));
  for(var m=1;m<=months;m++){var i=bal*r;int+=i;bal-=pay-i;}
  return {int:int,pay:pay,bal:Math.max(0,bal)};
}
function schedule(){
  var price=C.val('price'),yrs=Math.round(C.val('yrs')),off=+$('cond').value,curve=$('curve').value,y1=C.val('cls'),y1c=C.val('y1c'),ylc=C.val('ylc'),rows=[],v=price,cumLoss=0;
  var loan=$('pay').value==='loan',down=loan?Math.min(C.val('down'),price):price,P=loan?price-down:0,term=+$('term').value;
  var run=C.val('ins')+C.val('mn')+C.val('fu'),cumInt=0,prevInt=0;
  for(var y=1;y<=yrs;y++){
    var rate=rateAt(curve,off+y-1,y1,y1c,ylc),lost=v*rate,end=v-lost;cumLoss+=lost;
    var li=loanInterest(P,C.val('apr'),term,y),yInt=li.int-prevInt;prevInt=li.int;cumInt=li.int;
    rows.push({y:y,start:v,rate:rate,lost:lost,end:end,cumLoss:cumLoss,cum:cumLoss+cumInt+run*y,int:cumInt});
    v=end;
  }
  return {rows:rows,P:P,loan:loan,run:run,yrs:yrs,down:down};
}
function compute(){
  var s0=$('curve').value;$('custBox').hidden=s0!=='cust';$('loanBox').hidden=$('pay').value!=='loan';
  C.text('yrsV',C.val('yrs')+' yr'+(C.val('yrs')>1?'s':''));C.text('insV',money(C.val('ins')));C.text('mnV',money(C.val('mn')));C.text('fuV',money(C.val('fu')));
  var off=+$('cond').value;C.text('curveNote',s0==='typ'?'année 1 '+C.val('cls')+'%, puis 15 %, puis 10 %':s0==='steep'?'27 % puis 12 % par an':'vos propres taux');
  $('err').hidden=true;
  var price=C.val('price');
  if(!(price>0))return fail('Saisissez le prix d’achat.');
  if($('pay').value==='loan'&&C.val('down')>price)return fail('L’apport est supérieur au prix.');
  var s=schedule(),last1=s.rows[s.rows.length-1],mi=C.val('mi')*s.yrs,tco=last1.cum,loss=last1.cumLoss;
  C.text('heroL','Valeur estimée après '+s.yrs+' year'+(s.yrs>1?'s':''));
  C.text('resultValue',money(last1.end));C.text('tag',C.num(last1.end/price*100,1)+'% conservés');
  C.text('interp','Perd '+money(loss)+' ('+C.num(loss/price*100,1)+'%) de son '+money(price)+' prix sur '+s.yrs+' year'+(s.yrs>1?'s':'')+'.');
  C.text('oTco',money(tco));C.text('oPm',C.money(tco/mi,2)+' / mi');C.text('oLoss',money(loss));C.text('oMo',money(tco/(s.yrs*12)));
  C.text('miTot',C.num(mi,0)+' kilomètres au total');
  var parts=[['Dépréciation',loss,'#E11D48'],['Carburant et énergie',C.val('fu')*s.yrs,'#D97706'],['Assurance',C.val('ins')*s.yrs,'#0891B2'],['Intérêts du prêt',last1.int,'#131b2e'],['Entretien et pneus',C.val('mn')*s.yrs,'#059669']];
  $('bar').innerHTML=parts.map(function(p){return '<div title="'+p[0]+'" style="width:'+(p[1]/tco*100)+'%;background:'+p[2]+'"></div>';}).join('');
  $('dist').innerHTML=parts.map(function(p,i){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:'+(i?'1px solid var(--sx-border)':'0')+';font-size:13px"><span style="display:inline-flex;align-items:center;gap:8px;color:var(--sx-onv)"><i style="width:9px;height:9px;border-radius:50%;background:'+p[2]+'"></i>'+p[0]+'</span><b style="font-family:var(--font-mono);color:var(--sx-on)">'+money(p[1])+' <small style="color:var(--sx-muted);font-weight:500">'+C.num(p[1]/tco*100,1)+'%</small></b></div>';}).join('');
  var first=s.rows[0];
  var two=s.rows.length>1?price-s.rows[1].end:first.lost;
  C.text('alert','L’année 1 coûte environ '+money(first.lost)+' ('+C.num(first.rate*100,0)+'%) de valeur perdue. '+(off===0?'Les deux premières années réunies font disparaître environ '+money(two)+' ('+C.num(two/price*100,0)+'%) qu’un second propriétaire ne paie pas.':'Acheter d’occasion évite déjà la partie la plus raide de la courbe.'));
  /* table */
  var h='';h+='<tr><td class="a">Année 0 (achat)</td><td class="n">'+money(price)+'</td><td class="n">—</td><td class="n">—</td><td class="n">'+money(price)+'</td><td class="n">$0</td><td class="n">'+(s.loan?money(s.down)+' <small>apport</small>':'$0')+'</td></tr>';
  s.rows.forEach(function(r){h+='<tr><td class="a">Année '+r.y+'</td><td class="n">'+money(r.start)+'</td><td class="n">−'+C.num(r.rate*100,1)+'%</td><td class="n">−'+money(r.lost)+'</td><td class="n">'+money(r.end)+'</td><td class="n">−'+money(r.cumLoss)+' ('+C.num(r.cumLoss/price*100,0)+'%)</td><td class="n">'+money(r.cum)+'</td></tr>';});
  $('sched').querySelector('tbody').innerHTML=h;C.text('tblBase','Base : '+money(price));C.text('tblSub','Valeur, perte et coût cumulé à '+C.num(C.val('mi'),0)+' miles par an avec la courbe '+(s0==='typ'?'typical':s0==='steep'?'steep':'custom')+' .');
  /* retention by class */
  var r2='';CLASSES.forEach(function(c){var v=1;for(var i=0;i<5;i++)v*=1-rateAt('typ',i,c[1]);r2+='<tr><td class="a">'+c[0]+'</td><td class="n">'+c[1]+'%</td><td class="n">'+C.num(v*100,0)+'%</td><td class="n">'+money(price*(1-v))+'</td></tr>';});
  $('ret').querySelector('tbody').innerHTML=r2;
  /* chart */
  var vals=[price].concat(s.rows.map(function(r){return r.end;})),labels=vals.map(function(_,i){return i?'Yr '+i:'Acheter';});
  if(vals.length>=2)C.chart($('chart'),{series:[{name:'Valeur de revente',values:vals,color:'#0f5b44',fill:true}],labels:labels,label:'Valeur de revente par année',tipFmt:function(x){return C.money(x,0);}});
  last='Dépréciation d’une voiture — calculatepilot.com/other/car-depreciation-calculator.html\n'+money(price)+' véhicule, '+s.yrs+' ans : vaut ≈ '+money(last1.end)+' ('+C.num(last1.end/price*100,1)+'% conservés)\nCoût total de possession ≈ '+money(tco)+' ('+C.money(tco/mi,2)+' par mile)';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'cdCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
