/* Wedding budget calculator — CalculatePilot (Stitch redesign). spendable = budget × (1 − contingency); category = spendable × share. */
(function(){
var C=window.CPX,$=C.$,last='';
var A=[['Lugar, catering y barra',44],['Fotografía y vídeo',11],['Vestuario y belleza',8],['Flores y decoración',8],['Música y entretenimiento',7],['Organizador o coordinador',5],['Anillos',3],['Papelería y recuerdos',3],['Ceremonia y oficiante',2],['Transporte',3],['Otros y propinas',6]];
function shares(byo){
  if(!byo)return A.map(function(x){return [x[0],x[1]];});
  var rest=A.slice(1),sum=rest.reduce(function(t,x){return t+x[1];},0),scale=(100-40-8)/sum,out=[[A[0][0],40],['Alquileres, bar y personal',8]];
  rest.forEach(function(x){out.push([x[0],x[1]*scale]);});return out;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oPg','oCt','oVc','oVg','s1','s2','s3'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';last='';}
function compute(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  var bt=C.val('bt'),gs=C.val('gs'),ct=C.val('ct'),byo=$('vn').value==='b',p1=C.val('p1'),p2=C.val('p2');
  C.text('ctV',ct+'% reservado');$('err').hidden=true;
  if(!(bt>0))return fail('Introduce tu presupuesto total.');if(!(gs>0))return fail('Introduce el número de invitados.');
  if(p1+p2>100)return fail('Los dos primeros pagos suman más del 100%.');
  var p3=100-p1-p2;$('p3').value=p3;
  var res=bt*ct/100,sp=bt-res,sh=shares(byo);
  C.text('resultValue',C.money(sp,0));C.text('tag',C.num(100-ct,0)+'% del presupuesto');
  C.text('interp','De un '+C.money(bt,0)+' presupuesto, después de reservar '+C.money(res,0)+' para imprevistos.');
  C.text('oPg',C.money(bt/gs,2));C.text('oCt',C.money(res,0));
  var vc=sp*sh[0][1]/100+(byo?sp*sh[1][1]/100:0);C.text('oVc',C.money(vc,0));C.text('oVg',C.money(vc/gs,2)+' por invitado');
  $('rows').innerHTML=sh.map(function(x){return '<tr><td class="a">'+C.esc(x[0])+'</td><td class="n">'+x[1].toFixed(x[1]%1?1:0)+'%</td><td class="n"><b>'+C.money(sp*x[1]/100,0)+'</b></td></tr>';}).join('')+'<tr><td class="a">Reserva para imprevistos</td><td class="n">'+ct+'% del presupuesto</td><td class="n"><b>'+C.money(res,0)+'</b></td></tr>';
  C.text('s1',C.money(sp*p1/100,0));C.text('s1n',p1+'% al firmar');C.text('s2',C.money(sp*p2/100,0));C.text('s2n',p2+'% unos 60 días antes');C.text('s3',C.money(sp*p3/100,0));C.text('s3n',p3+'% el día de la boda');
  last='Presupuesto de boda — calculatepilot.com/other/wedding-budget-calculator.html\nPresupuesto '+C.money(bt,0)+' for '+C.num(gs,0)+' invitados: gasto '+C.money(sp,0)+', imprevistos '+C.money(res,0)+', '+C.money(bt/gs,2)+' por invitado';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'wbCalc',compute:compute});
  document.querySelectorAll('[data-b]').forEach(function(b){b.addEventListener('click',function(){$('bt').value=b.getAttribute('data-b');$('bt').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
