/* Golf handicap calculator — CalculatePilot (Stitch redesign). World Handicap System method.
   diff = round1(113/slope × (AGS − CR − PCC)); index = round1(mean(lowest N diffs) + adj); course = index × slope/113 + (CR − par); playing = course × allowance. */
(function(){
var C=window.CPX,$=C.$,last='';
var DEF=[[80,73.2,136],[88,72.4,130],[81,74.7,143],[84,73.8,145],[82,71.4,128],[90,74.1,140],[85,74.5,139],[86,73.6,137]];
/* scores in record -> [differentials used, adjustment] */
function rule(n){if(n<3)return null;if(n===3)return [1,-2];if(n===4)return [1,-1];if(n===5)return [1,0];if(n===6)return [2,-1];if(n<=8)return [2,0];if(n<=11)return [3,0];if(n<=14)return [4,0];if(n<=16)return [5,0];if(n<=18)return [6,0];if(n===19)return [7,0];return [8,0];}
function r1(x){return Math.round(x*10+1e-9)/10;}
function rows(){return Array.prototype.slice.call($('gfRows').querySelectorAll('tr'));}
function rowHtml(i,a,c,s,p){return '<tr><td class="n gi">'+i+'</td><td><input class="gs" type="number" inputmode="numeric" step="1" min="0" value="'+a+'" aria-label="Adjusted gross score"></td><td><input class="gc" type="number" inputmode="decimal" step="0.1" min="0" value="'+c+'" aria-label="Course rating"></td><td><input class="gl" type="number" inputmode="numeric" step="1" min="55" max="155" value="'+s+'" aria-label="Slope rating"></td><td><input class="gp" type="number" inputmode="decimal" step="0.5" min="-1" max="3" value="'+p+'" aria-label="PCC"></td><td class="n gd">—</td><td><button type="button" class="gx" aria-label="Remove round" style="background:none;border:0;cursor:pointer;color:var(--sx-muted);font-size:18px;line-height:1">×</button></td></tr>';}
function load(list){$('gfRows').innerHTML=list.map(function(r,i){return rowHtml(i+1,r[0],r[1],r[2],r[3]||0);}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oCh','oPh','oUsed','oAvg'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('wk','—');last='';}
function compute(){
  $('err').hidden=true;var rs=rows(),ds=[],valid=0;
  rs.forEach(function(tr,i){
    tr.querySelector('.gi').textContent=i+1;
    var a=parseFloat(tr.querySelector('.gs').value),c=parseFloat(tr.querySelector('.gc').value),s=parseFloat(tr.querySelector('.gl').value),p=parseFloat(tr.querySelector('.gp').value)||0,cell=tr.querySelector('.gd');
    if(isFinite(a)&&isFinite(c)&&isFinite(s)&&s>0){var d=r1(113/s*(a-c-p));ds.push({d:d,tr:tr});cell.textContent=d.toFixed(1);valid++;}else{cell.textContent='—';}
  });
  C.text('cntN',valid+(valid===1?' round':' rounds'));
  $('gfAdd').disabled=rs.length>=20;
  var rl=rule(valid),cr=C.val('cr'),sr=C.val('sr'),par=C.val('par'),al=parseFloat($('al').value),mi=$('mi').value.trim(),idx=NaN,used=0,avg=NaN;
  if(rl){var sorted=ds.slice().sort(function(x,y){return x.d-y.d;}),best=sorted.slice(0,rl[0]);used=rl[0];avg=best.reduce(function(t,x){return t+x.d;},0)/used;idx=Math.min(54,r1(avg+rl[1]));
    ds.forEach(function(x){x.tr.style.background='';});best.forEach(function(x){x.tr.style.background='var(--sx-hover,rgba(0,0,0,.05))';});}
  else{ds.forEach(function(x){x.tr.style.background='';});}
  var manual=mi!==''&&isFinite(parseFloat(mi)),use=manual?parseFloat(mi):idx;
  if(!isFinite(use)&&!rl)return fail('Saisissez au moins 3 scores, ou indiquez un index de handicap dans le champ de remplacement.');
  C.text('resultValue',isFinite(use)?use.toFixed(1):'—');C.text('tag',manual?'index manuel':valid+' scores');
  C.text('interp',rl?'Moyenne de vos '+used+' of '+valid+' differentials'+(rl[1]?' avec un '+rl[1].toFixed(1)+' adjustment':'')+'.':'Utilisation de l’index que vous avez saisi.');
  C.text('oUsed',rl?'Les plus bas '+used:'—');C.text('oAvg',rl?avg.toFixed(2):'—');
  var ch=NaN,ph=NaN;
  if(isFinite(use)&&sr>0&&cr>0&&par>0){ch=use*(sr/113)+(cr-par);ph=Math.round(ch*al+1e-9);C.text('oCh',Math.round(ch+1e-9)+' strokes');C.text('oPh',ph+' strokes');C.text('wk',use.toFixed(1)+' × ('+sr+' ÷ 113) + ('+cr+' − '+par+') = '+ch.toFixed(2)+' → Handicap de parcours '+Math.round(ch+1e-9)+'. × '+Math.round(al*100)+'% = '+(ch*al).toFixed(2)+' → Handicap de jeu '+ph+'.');}
  else{C.text('oCh','—');C.text('oPh','—');C.text('wk','Saisissez le rating du parcours, le slope et le par pour voir le handicap de parcours.');}
  C.text('note',valid>20?'':valid<20?'Vous avez '+valid+' scores. Avec 20, le système retient les 8 meilleurs, l’index se stabilisera donc à mesure que vous ajouterez des parties.':'Historique complet de 20 parties : la moyenne des 8 meilleurs différentiels est calculée.');
  last='Handicap de golf — calculatepilot.com/other/golf-handicap-calculator.html\nIndex de handicap '+(isFinite(use)?use.toFixed(1):'—')+(isFinite(ch)?', handicap de parcours '+Math.round(ch+1e-9)+', handicap de jeu '+ph:'');
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  load(DEF);
  var ctl=C.init({root:'gfCalc',compute:compute});
  function run(){if(ctl)ctl.run();}
  $('gfAdd').addEventListener('click',function(){var n=rows().length;if(n>=20)return;var tr=document.createElement('tbody');var last=rows()[n-1],a=last?last.querySelector('.gc').value:'72',b=last?last.querySelector('.gl').value:'130';tr.innerHTML=rowHtml(n+1,'',a,b,0);$('gfRows').appendChild(tr.firstChild);run();});
  $('gfRows').addEventListener('click',function(e){var b=e.target.closest('.gx');if(!b)return;b.closest('tr').remove();run();});
  $('gfReset').addEventListener('click',function(){load(DEF);$('cr').value='72.1';$('sr').value='132';$('par').value='72';$('al').value='0.95';$('mi').value='';run();});
  document.querySelectorAll('[data-cr]').forEach(function(b){b.addEventListener('click',function(){$('cr').value=b.getAttribute('data-cr');$('sr').value=b.getAttribute('data-sr');run();});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
});
})();
