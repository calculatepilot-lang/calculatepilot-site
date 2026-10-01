/* Water intake calculator — CalculatePilot (redesign, PSEO standards).
   IOM 2004 total water AI (L/day): 1–3: 1.3; 4–8: 1.7; 9–13 M2.4 F2.1; 14–18 M3.3 F2.3; 19+ M3.7 F2.7; pregnancy 3.0; lactation 3.8.
   Drinks ≈ 80% of total. EFSA 2010 adults: M2.5 F2.0, +0.3 pregnancy, +0.7 lactation. Exercise extra = min ÷ 60 × sweat rate (L/h).
   Post-exercise rehydration 1.25–1.5 L per kg lost (ACSM 2016). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
function iom(age,male,life){if(!male&&life==='s2')return 3.0;if(!male&&life==='s3')return 3.8;if(age<4)return 1.3;if(age<9)return 1.7;if(age<14)return male?2.4:2.1;if(age<19)return male?3.3:2.3;return male?3.7:2.7;}
function efsa(age,male,life){if(age<14)return null;var b=age<19?(male?2.5:2.0):(male?2.5:2.0);return b+(!male&&life==='s2'?0.3:!male&&life==='s3'?0.7:0);}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value&&v('wl')>0)$('wl').value=Math.round(v('wl')*(imp?2.20462:1/2.20462)*10)/10;prevU=$('u').value;
  C.text('wlU',imp?'lb':'kg');
  var male=$('sex').value==='s1',age=v('age'),life=$('life').value;
  $('lifeRow').hidden=male||age<14;if(male||age<14)life='s1';
  var L=function(l){return imp?Math.round(l*33.814)+' oz ('+(Math.round(l*33.814/8*2)/2)+' tazas)':l.toFixed(1)+' L';};
  if(!(age>0))return;
  var tot=iom(age,male,life),ex=Math.max(0,v('ex'))/60*Math.max(0,v('sr')),drinks=tot*0.8+ex,e=efsa(age,male,life),wl=v('wl'),wlKg=imp?wl/2.20462:wl;
  C.text('resultValue',imp?Math.round(drinks*33.814)+' oz':drinks.toFixed(1)+' L');
  C.text('tag',imp?(Math.round(drinks*33.814/8*2)/2)+' cups':Math.round(drinks*33.814)+' oz');
  C.text('rN','Alrededor del 80% de tu '+tot.toFixed(1)+' L de referencia de agua total ('+(tot*0.8).toFixed(1)+' L)'+(ex>0?' plus '+ex.toFixed(2)+' L para '+Math.round(v('ex'))+' min de ejercicio.':'. Add exercise minutes to include sweat losses.'));
  C.text('tot',L(tot+ex));C.text('exo',ex>0?L(ex):'—');C.text('iom',L(tot));C.text('efsa',e?L(e):'No se muestra para menores de 14');
  $('rhRow').hidden=!(wlKg>0);if(wlKg>0)C.text('rh',L(wlKg*1.25)+' – '+L(wlKg*1.5));
  $('warn').textContent=age<14?'Niños: se muestra como agua total de todos los alimentos y bebidas; ofrece agua con regularidad y en las comidas.':v('sr')>1.5?'Una tasa de sudoración alta: compruébala pesándote antes y después del ejercicio, y considera los electrolitos en sesiones largas.':'Las necesidades aumentan con el calor, la altitud y las enfermedades. Las personas con afecciones cardíacas, renales o hepáticas deben seguir las indicaciones de su médico sobre los líquidos.';
  var split=[['Al despertar','15%',0.15],['Mañana','20%',0.2],['Con el almuerzo','15%',0.15],['Tarde','20%',0.2],['Con la cena','15%',0.15],['Noche','15%',0.15]];
  C.text('tbT',imp?Math.round(drinks*33.814)+' oz en total':drinks.toFixed(1)+' L en total');
  $('dayTbl').innerHTML=split.map(function(s){return '<tr><td style="font-family:inherit;font-weight:600">'+s[0]+'</td><td>'+s[1]+'</td><td class="b">'+(imp?Math.round(drinks*s[2]*33.814)+' oz':(drinks*s[2]*1000/50|0)*50+' mL')+'</td></tr>';}).join('')+(ex>0?'<tr class="hl"><td style="font-family:inherit;font-weight:600">Durante / después del ejercicio</td><td>incluido</td><td class="b">'+(imp?Math.round(ex*33.814)+' oz':Math.round(ex*1000)+' mL')+' del total</td></tr>':'');
  last='Líquido diario de bebidas: '+L(drinks)+'\nReferencia de agua total (IOM): '+L(tot)+(ex>0?'\nIncludes '+L(ex)+' para ejercicio':'')+'\n— calculatepilot.com/health/water-intake-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'wiCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resultados');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
