/* Wedding budget calculator — CalculatePilot (Stitch redesign). spendable = budget × (1 − contingency); category = spendable × share. */
(function(){
var C=window.CPX,$=C.$,last='';
var A=[['Lieu, traiteur et bar',44],['Photographie et vidéo',11],['Tenues et beauté',8],['Fleurs et décoration',8],['Musique et animation',7],['Organisateur ou coordinateur',5],['Alliances',3],['Papeterie et cadeaux d\'invités',3],['Cérémonie et officiant',2],['Transport',3],['Divers et pourboires',6]];
function shares(byo){
  if(!byo)return A.map(function(x){return [x[0],x[1]];});
  var rest=A.slice(1),sum=rest.reduce(function(t,x){return t+x[1];},0),scale=(100-40-8)/sum,out=[[A[0][0],40],['Locations, bar et personnel',8]];
  rest.forEach(function(x){out.push([x[0],x[1]*scale]);});return out;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oPg','oCt','oVc','oVg','s1','s2','s3'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';last='';}
function compute(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  var bt=C.val('bt'),gs=C.val('gs'),ct=C.val('ct'),byo=$('vn').value==='b',p1=C.val('p1'),p2=C.val('p2');
  C.text('ctV',ct+'% mis de côté');$('err').hidden=true;
  if(!(bt>0))return fail('Saisissez votre budget total.');if(!(gs>0))return fail('Saisissez le nombre d\'invités.');
  if(p1+p2>100)return fail('Les deux premiers versements dépassent 100 %.');
  var p3=100-p1-p2;$('p3').value=p3;
  var res=bt*ct/100,sp=bt-res,sh=shares(byo);
  C.text('resultValue',C.money(sp,0));C.text('tag',C.num(100-ct,0)+'% du budget');
  C.text('interp','Sur un budget de '+C.money(bt,0)+' budget, après avoir mis de côté '+C.money(res,0)+' pour les imprévus.');
  C.text('oPg',C.money(bt/gs,2));C.text('oCt',C.money(res,0));
  var vc=sp*sh[0][1]/100+(byo?sp*sh[1][1]/100:0);C.text('oVc',C.money(vc,0));C.text('oVg',C.money(vc/gs,2)+' par invité');
  $('rows').innerHTML=sh.map(function(x){return '<tr><td class="a">'+C.esc(x[0])+'</td><td class="n">'+x[1].toFixed(x[1]%1?1:0)+'%</td><td class="n"><b>'+C.money(sp*x[1]/100,0)+'</b></td></tr>';}).join('')+'<tr><td class="a">Réserve pour imprévus</td><td class="n">'+ct+'% du budget</td><td class="n"><b>'+C.money(res,0)+'</b></td></tr>';
  C.text('s1',C.money(sp*p1/100,0));C.text('s1n',p1+'% à la signature');C.text('s2',C.money(sp*p2/100,0));C.text('s2n',p2+'% environ 60 jours avant');C.text('s3',C.money(sp*p3/100,0));C.text('s3n',p3+'% le jour du mariage');
  last='Budget de mariage — calculatepilot.com/other/wedding-budget-calculator.html\nBudget '+C.money(bt,0)+' for '+C.num(gs,0)+' invités : dépenses '+C.money(sp,0)+', imprévus '+C.money(res,0)+', '+C.money(bt/gs,2)+' par invité';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'wbCalc',compute:compute});
  document.querySelectorAll('[data-b]').forEach(function(b){b.addEventListener('click',function(){$('bt').value=b.getAttribute('data-b');$('bt').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
