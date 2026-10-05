/* Wedding budget calculator — CalculatePilot (Stitch redesign). spendable = budget × (1 − contingency); category = spendable × share. */
(function(){
var C=window.CPX,$=C.$,last='';
var A=[['Location, Catering und Bar',44],['Fotografie und Video',11],['Kleidung und Styling',8],['Blumen und Dekoration',8],['Musik und Unterhaltung',7],['Hochzeitsplaner oder Koordinator',5],['Ringe',3],['Papeterie und Gastgeschenke',3],['Zeremonie und Trauredner',2],['Transport',3],['Sonstiges und Trinkgelder',6]];
function shares(byo){
  if(!byo)return A.map(function(x){return [x[0],x[1]];});
  var rest=A.slice(1),sum=rest.reduce(function(t,x){return t+x[1];},0),scale=(100-40-8)/sum,out=[[A[0][0],40],['Mieten, Bar und Personal',8]];
  rest.forEach(function(x){out.push([x[0],x[1]*scale]);});return out;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oPg','oCt','oVc','oVg','s1','s2','s3'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';last='';}
function compute(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  var bt=C.val('bt'),gs=C.val('gs'),ct=C.val('ct'),byo=$('vn').value==='b',p1=C.val('p1'),p2=C.val('p2');
  C.text('ctV',ct+'% zurückgehalten');$('err').hidden=true;
  if(!(bt>0))return fail('Geben Sie Ihr Gesamtbudget ein.');if(!(gs>0))return fail('Geben Sie die Anzahl der Gäste ein.');
  if(p1+p2>100)return fail('Die ersten beiden Zahlungen ergeben zusammen mehr als 100 %.');
  var p3=100-p1-p2;$('p3').value=p3;
  var res=bt*ct/100,sp=bt-res,sh=shares(byo);
  C.text('resultValue',C.money(sp,0));C.text('tag',C.num(100-ct,0)+'% des Budgets');
  C.text('interp','Bei einem '+C.money(bt,0)+' Budget, nach Zurückhalten von '+C.money(res,0)+' für Unvorhergesehenes.');
  C.text('oPg',C.money(bt/gs,2));C.text('oCt',C.money(res,0));
  var vc=sp*sh[0][1]/100+(byo?sp*sh[1][1]/100:0);C.text('oVc',C.money(vc,0));C.text('oVg',C.money(vc/gs,2)+' pro Gast');
  $('rows').innerHTML=sh.map(function(x){return '<tr><td class="a">'+C.esc(x[0])+'</td><td class="n">'+x[1].toFixed(x[1]%1?1:0)+'%</td><td class="n"><b>'+C.money(sp*x[1]/100,0)+'</b></td></tr>';}).join('')+'<tr><td class="a">Reserve für Unvorhergesehenes</td><td class="n">'+ct+'% des Budgets</td><td class="n"><b>'+C.money(res,0)+'</b></td></tr>';
  C.text('s1',C.money(sp*p1/100,0));C.text('s1n',p1+'% bei Vertragsabschluss');C.text('s2',C.money(sp*p2/100,0));C.text('s2n',p2+'% etwa 60 Tage vorher');C.text('s3',C.money(sp*p3/100,0));C.text('s3n',p3+'% am Hochzeitstag');
  last='Hochzeitsbudget — calculatepilot.com/other/wedding-budget-calculator.html\nBudget '+C.money(bt,0)+' for '+C.num(gs,0)+' Gäste: Ausgaben '+C.money(sp,0)+', Reserve '+C.money(res,0)+', '+C.money(bt/gs,2)+' pro Gast';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'wbCalc',compute:compute});
  document.querySelectorAll('[data-b]').forEach(function(b){b.addEventListener('click',function(){$('bt').value=b.getAttribute('data-b');$('bt').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
