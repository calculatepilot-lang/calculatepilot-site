/* Square footage & room area calculator — CalculatePilot (Stitch redesign).
   Rectangle L×W, triangle ½·b·h, circle π(d/2)², perimeter 2(L+W) with wall area = perimeter × height.
   Feet+inches → ft + in/12; metres → ×3.280839895. Ledger totals several rooms (net and with margin). */
(function(){
var C=window.CPX,$=C.$,last='',led=[],M2=0.09290304;
function n0(x){return C.num(x,0);}
function ft(id,u){var a=C.val(id+'f'),b=C.val(id+'i');return u==='fi'?a+b/12:u==='m'?(a+b/100)*3.280839895:a;}
function dims(){
  var u=$('unit').value,sh=$('shape').value;
  var lLbl={tri:'Base',circ:'Diamètre'}[sh]||'Longueur',wLbl={tri:'Taille'}[sh]||'Largeur';
  var L=ft('l',u),W=ft('w',u);
  return {u:u,sh:sh,L:L,W:W,lLbl:lLbl,wLbl:wLbl,H:u==='m'?C.val('hf')*3.280839895:C.val('hf')};
}
function area(d){
  if(d.sh==='tri')return 0.5*d.L*d.W;
  if(d.sh==='circ')return Math.PI*Math.pow(d.L/2,2);
  return d.L*d.W;
}
function fmtDim(d){var f=function(x){return C.num(x,2);};return d.sh==='circ'?'Ø '+f(d.L)+' ft':d.sh==='tri'?f(d.L)+' × '+f(d.W)+' ft (triangle)':f(d.L)+' × '+f(d.W)+' ft';}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oYd','oM2','oIn','oAc','oBox','oTile','oPaint'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir la surface.');$('costs').innerHTML='';last='';}
function compute(){
  var d=dims(),u=d.u,w=C.val('waste')/100,pr=C.val('pr');
  document.querySelectorAll('[data-sub]').forEach(function(e){e.hidden=u==='df';});
  document.querySelectorAll('#lBox,#wBox').forEach(function(e){});
  var g=document.querySelectorAll('.sx-au-g2 > div > div[style*="grid-template-columns"]');
  g.forEach(function(e){e.style.gridTemplateColumns=u==='df'?'1fr':'1fr 84px';});
  var sfx=u==='fi'?['ft','in']:u==='m'?['m','cm']:['ft',''];
  ['lf','wf'].forEach(function(id,i){$(id).setAttribute('aria-label',(id==='lf'?d.lLbl:d.wLbl)+', '+sfx[0]);});
  C.text('lLbl',d.lLbl);C.text('wLbl',d.wLbl);
  C.text('lHint',u==='fi'?'pieds et pouces':u==='m'?'mètres et cm':'pieds décimaux');C.text('wHint',u==='fi'?'pieds et pouces':u==='m'?'mètres et cm':'pieds décimaux');
  $('wBox').hidden=d.sh==='circ';$('hBox').hidden=false;
  C.text('subNote',u==='fi'?'La case des pouces accepte de 0 à 11,99.':u==='m'?'La deuxième case accepte des centimètres (de 0 à 99,99).':'Saisissez des pieds décimaux, par exemple 12,5.');
  C.text('wNote','+'+C.val('waste')+'%');
  $('err').hidden=true;
  var multi=d.sh==='multi';
  var a=multi?led.reduce(function(s,r){return s+r.a;},0):null;
  if(!multi){
    if(!(d.L>0)||(d.sh!=='circ'&&!(d.W>0)))return fail('Saisissez toutes les dimensions supérieures à zéro.');
    a=d.sh==='perim'?d.L*d.W:area(d);
  }else if(!(a>0)){
    return fail('Ajoutez des pièces au registre ci-dessous (saisissez des dimensions, puis cliquez sur « Ajouter au registre des pièces »). Le total s\'affiche ici.');
  }
  var gross=multi?led.reduce(function(s,r){return s+r.gross;},0):a*(1+w);
  C.text('heroLbl',d.sh==='perim'?'Surface de la pièce':multi?'Surface nette du registre':'Surface nette');
  C.text('resultValue',C.num(a,2));C.text('tag',multi?led.length+' room'+(led.length>1?'s':''):'+'+C.val('waste')+'% = '+C.num(gross,2)+' pi²');
  var nm=d.sh==='rect'?'Rectangle':d.sh==='tri'?'Triangle':d.sh==='circ'?'Cercle':d.sh==='perim'?'Rectangle':'Registre multi-pièces';
  var perim=2*(d.L+d.W),walls=perim*d.H;
  C.text('interp',multi?'Total de '+led.length+' pièce du registre'+(led.length>1?'s':'')+'; '+C.num(gross,2)+' sq ft à acheter avec la marge de chaque pièce.':d.sh==='perim'?'Périmètre '+C.num(perim,2)+' pieds linéaires ; murs de '+C.num(walls,0)+' pi² sur '+C.num(d.H,1)+' ft de haut.':nm+': '+fmtDim(d)+' = '+C.num(a,2)+' sq ft, soit '+C.num(gross,2)+' sq ft avec '+C.val('waste')+'% de perte.');
  C.text('oYd',C.num(a/9,2)+' sq yd');C.text('oM2',C.num(a*M2,2)+' m²');C.text('oIn',n0(a*144)+' sq in');C.text('oAc',C.num(a/43560,4)+' ac');
  var boxes=Math.ceil(gross/20-1e-9),tiles=Math.ceil(gross-1e-9);
  C.text('oBox',n0(boxes));C.text('oTile',n0(tiles));
  var paintOk=(d.sh==='rect'||d.sh==='perim')&&d.H>0;
  C.text('oPaint',paintOk?C.num(walls/350,2)+' gal':'n/a');C.text('oPaintN',paintOk?C.num(walls,0)+' sq ft de murs, 1 couche':'nécessite une pièce rectangulaire');
  var base=a*pr,extra=(gross-a)*pr;
  $('costs').innerHTML=[['Matériau ('+C.num(a,2)+' pi² sur '+C.money(pr,2)+')',base],['Marge de perte ('+C.num(gross-a,2)+' sq ft)',extra],['Budget total',base+extra]].map(function(x,i){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:'+(i?'1px solid var(--sx-border)':'0')+';font-size:'+(i===2?'15':'13')+'px"><span style="color:var(--sx-onv);'+(i===2?'font-weight:700':'')+'">'+C.esc(x[0])+'</span><b style="font-family:var(--font-mono);color:var(--sx-on)">'+C.money(x[1],2)+'</b></div>';}).join('');
  last='Surface en pieds carrés — calculatepilot.com/other/square-footage-calculator.html\n'+(multi?'Total du registre : ':nm+' '+fmtDim(d)+': ')+C.num(a,2)+' pi² nets, '+C.num(gross,2)+' sq ft à acheter\n= '+C.num(a/9,2)+' sq yd = '+C.num(a*M2,2)+' m²';
  renderLedger();
}
function renderLedger(){
  var h='',tn=0,tb=0;
  led.forEach(function(r,i){tn+=r.a;tb+=r.gross;h+='<tr><td class="a">'+C.esc(r.name)+'</td><td class="a">'+C.esc(r.dim)+'</td><td class="n">'+C.num(r.a,2)+' sq ft</td><td class="n">'+r.wp+'%</td><td class="n">'+C.num(r.gross,2)+' sq ft</td><td><button type="button" class="sx-reset" data-rm="'+i+'" style="padding:4px 8px">Supprimer</button></td></tr>';});
  $('led').innerHTML=h||'<tr><td class="a" colspan="6" style="color:var(--sx-muted)">Aucune pièce pour le moment.</td></tr>';
  C.text('ledNet',led.length?C.num(tn,2)+' pi²':'—');C.text('ledBuy',led.length?C.num(tb,2)+' pi²':'—');
}
function matrix(){
  var rows=[['Toilettes',5,6],['Chambre d\'amis',11,12],['Suite parentale',16,18],['Salle à manger',14,16],['Garage pour 2 voitures',20,20],['Terrasse',12,16]],h='';
  rows.forEach(function(r){var a=r[1]*r[2],g=a*1.1,walls=2*(r[1]+r[2])*8-35,paint=r[0]==='Patio'?'n/a':Math.max(1,walls*2/350*1.1).toFixed(1);h+='<tr><td class="a">'+r[0]+'</td><td class="a">'+r[1]+' × '+r[2]+' ft</td><td class="n">'+a+' sq ft</td><td class="n">'+Math.ceil(g-1e-9)+'</td><td class="n">'+Math.ceil(g/20-1e-9)+'</td><td class="n">'+paint+'</td></tr>';});
  document.querySelector('#matrix tbody').innerHTML=h;
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  matrix();
  C.init({root:'sfCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-l]');if(!b)return;var u=$('unit').value,k=u==='m'?0.3048:1;C.set('lf',+(b.getAttribute('data-l')*k).toFixed(2));C.set('wf',+(b.getAttribute('data-w')*k).toFixed(2));C.set('li',0);C.set('wi',0);if($('shape').value==='multi')$('shape').value='rect';$('lf').dispatchEvent(new Event('input',{bubbles:true}));});
  $('addBtn').addEventListener('click',function(){
    var d=dims(),a=d.sh==='perim'||d.sh==='multi'?d.L*d.W:area(d);if(!(a>0))return;
    var w=C.val('waste');led.push({name:$('zoneName').value.trim()||'Pièce '+(led.length+1),dim:fmtDim(d),a:a,gross:a*(1+w/100),wp:w});$('zoneName').value='';
    $('lf').dispatchEvent(new Event('input',{bubbles:true}));
  });
  $('clrBtn').addEventListener('click',function(){led=[];$('lf').dispatchEvent(new Event('input',{bubbles:true}));});
  $('led').addEventListener('click',function(e){var b=e.target.closest('[data-rm]');if(!b)return;led.splice(+b.getAttribute('data-rm'),1);$('lf').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
  renderLedger();
});
})();
