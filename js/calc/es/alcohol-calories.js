/* Alcohol calories calculator — CalculatePilot (redesign, PSEO standards).
   Alcohol g = mL × ABV/100 × 0.789; kcal = alcohol g × 7 + carbs g × 4. US standard drink = 14 g (NIAAA); UK unit = 8 g.
   Presets: [name, fl oz, ABV %, carbs g] — carbs typical per USDA FoodData Central. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null,prevDt=null;
var OZ=29.5735,P=[['Cerveza normal',12,5,13],['Cerveza light',12,4.2,6],['Vino',5,12,4],['Chupito de licor',1.5,40,0],['Licor + 6 oz de refresco normal',7.5,8,20],['Hard seltzer',12,5,2]];
function K(x){return isFinite(x)?Math.round(x).toLocaleString('es-ES'):'—';}
function calc(ml,abv,cb){var g=ml*abv/100*0.789;return {g:g,ak:g*7,ck:cb*4,kcal:g*7+cb*4};}

function compute(){
  var imp=$('u').value==='s1',dt=$('dt').value;
  if(prevU!==null&&prevU!==$('u').value)$('sz').value=imp?Math.round(v('sz')/OZ*2)/2:Math.round(v('sz')*OZ);
  if(prevDt!==null&&prevDt!==dt&&dt!=='6'){var p=P[+dt];$('sz').value=imp?p[1]:Math.round(p[1]*OZ);$('abv').value=p[2];$('cb').value=p[3];}
  prevU=$('u').value;prevDt=dt;C.text('szU',imp?'fl oz':'mL');
  var ml=imp?v('sz')*OZ:v('sz'),abv=v('abv'),cb=Math.max(0,v('cb')),n=Math.max(0,v('n')),occ=Math.max(0,v('occ'));
  if(!(ml>0))return;
  var d=calc(ml,abv,cb),perOcc=d.kcal*n,wk=perOcc*occ,yr=wk*52,sd=d.g/14,uk=d.g/8,ukw=uk*n*occ;
  C.text('resultValue',K(wk));C.text('tag',(Math.round(sd*n*occ*10)/10)+' bebidas estándar / sem.');
  C.text('rN',n+' drink'+(n===1?'':'s')+' × '+occ+' occasion'+(occ===1?'':'s')+' a la semana con unas '+K(d.kcal)+' kcal cada una.');
  C.text('pd',K(d.kcal)+' kcal');C.text('po',K(perOcc)+' kcal');C.text('py',K(yr)+' kcal');C.text('eq','≈ '+(Math.round(yr/3500*10)/10)+' lb de grasa corporal');
  C.text('brT',(imp?(Math.round(v('sz')*10)/10)+' fl oz':Math.round(ml)+' mL')+' at '+abv+'%');
  C.text('ag',d.g.toFixed(1)+' g');C.text('ak',K(d.ak)+' kcal');C.text('ck',K(d.ck)+' kcal');C.text('sd',sd.toFixed(1));C.text('uk',uk.toFixed(1));C.text('ukw',ukw.toFixed(1));
  var wn=$('warn');
  if(ukw>14)wn.innerHTML='<b style="color:var(--sx-err)">'+ukw.toFixed(1)+' unidades del Reino Unido a la semana</b> — por encima de la pauta de bajo riesgo de 14 unidades de los directores médicos del Reino Unido.';
  else if(n*sd>=4)wn.textContent='Acerca de '+(Math.round(n*sd*10)/10)+' bebidas estándar en una sola ocasión — el NIAAA define el consumo excesivo de alcohol como aproximadamente 4 o más (mujeres) o 5 o más (hombres) bebidas en unas 2 horas.';
  else wn.textContent='La equivalencia energética usa 3,500 kcal por lb como referencia aproximada; no es una predicción de aumento de peso.';
  $('cmpTbl').innerHTML=P.map(function(p,i){var x=calc(p[1]*OZ,p[2],p[3]);return '<tr'+(String(i)===dt?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+p[0]+'</td><td style="font-family:inherit">'+(imp?p[1]+' fl oz':Math.round(p[1]*OZ)+' mL')+', '+p[2]+'%</td><td class="b">'+K(x.kcal)+'</td><td>'+(x.g/14).toFixed(1)+'</td><td>'+(x.g/8).toFixed(1)+'</td></tr>';}).join('');
  last='Calorías del alcohol: '+K(d.kcal)+' kcal por bebida, '+K(wk)+' kcal/week, '+K(yr)+' kcal/year\n'+sd.toFixed(1)+' bebidas estándar de EE. UU. / '+uk.toFixed(1)+' unidades del Reino Unido por bebida\n— calculatepilot.com/health/alcohol-calories-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'acCalc',compute:compute});
  $('dt').addEventListener('change',compute);
  ['sz','abv','cb'].forEach(function(id){$(id).addEventListener('input',function(){if($('dt').value!=='6'){$('dt').value='6';prevDt='6';}});});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resultados');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
