/* Recipe scaling & kitchen converter — CalculatePilot (Stitch redesign).
   scaled = qty × (target ÷ original servings); grams = cups × g/cup (weight units convert directly);
   baker's percentage = ingredient g ÷ flour g. Amounts display to the nearest 1/8 cup, 1/4 tsp or 1/4 tbsp. */
(function(){
var C=window.CPX,$=C.$,last='',csv='',n=0;
var P={flour_ap:['All-purpose flour',120,'flour'],flour_bread:['Bread flour',127,'flour'],flour_ww:['Whole-wheat flour',113,'flour'],sugar:['Granulated sugar',200,'sugar'],brown:['Brown sugar, packed',213,'sugar'],powder:['Powdered sugar',113,'sugar'],butter:['Butter or solid fat',227,'fat'],oil:['Vegetable oil',218,'fat'],water:['Water',237,'liquid'],milk:['Milk',244,'liquid'],honey:['Honey',340,'sugar'],oats:['Rolled oats',90,'other'],cocoa:['Cocoa powder',85,'other'],salt_m:['Kosher salt (Morton)',230,'salt'],salt_d:['Kosher salt (Diamond Crystal)',134,'salt'],salt_t:['Table salt',288,'salt'],other:['Other (custom g per cup)',0,'other']};
var U=[['cups','cup'],['tbsp','tbsp'],['tsp','tsp'],['ml','ml'],['sticks','stick'],['g','g'],['oz','oz']];
var PRE={cookie:[[4,10],[['All-purpose flour',2.5,'cups','flour_ap'],['Granulated sugar',1,'cups','sugar'],['Unsalted butter',1.5,'sticks','butter'],['Kosher salt (Morton)',1.5,'tsp','salt_m']]],
  bread:[[1,2],[['Bread flour',500,'g','flour_bread'],['Water',350,'g','water'],['Kosher salt (Morton)',10,'g','salt_m'],['Sourdough starter (100% hydration)',100,'g','other']]]};
var FR=['','⅛','¼','⅜','½','⅝','¾','⅞'];
function fmtq(q,unit){var step=unit==='tsp'||unit==='tbsp'?4:8,r=Math.round(q*step)/step;if(unit==='g'||unit==='ml'||unit==='oz'){return C.num(q,q<10?2:1).replace(/\.?0+$/,'');}var w=Math.floor(r+1e-9),f=Math.round((r-w)*8);if(f===8){w++;f=0;}var s=(w?w:'')+(f?(w?' ':'')+FR[f]:'');return s||'0';}
function gramsPerCup(k,custom){return k==='other'?custom:P[k][1];}
function toGrams(q,unit,k,custom){var g=gramsPerCup(k,custom);if(unit==='g')return q;if(unit==='oz')return q*28.349523125;var cups=unit==='cups'?q:unit==='tbsp'?q/16:unit==='tsp'?q/48:unit==='ml'?q/236.588236:unit==='sticks'?q*0.5:0;return g?cups*g:NaN;}
function opts(o,sel){return Object.keys(o).map(function(k){return '<option value="'+k+'"'+(k===sel?' selected':'')+'>'+C.esc(o[k][0])+(o[k][1]&&k!=='other'?' ('+o[k][1]+' g/cup)':'')+'</option>';}).join('');}
function uopts(sel){return U.map(function(u){return '<option value="'+u[0]+'"'+(u[0]===sel?' selected':'')+'>'+u[1]+'</option>';}).join('');}
function addRow(nm,q,u,k){
  var tr=document.createElement('tr');tr.innerHTML='<td><div class="sx-au-in sm np"><input class="in" type="text" maxlength="40" value="'+C.esc(nm)+'" placeholder="Ingredient" aria-label="Ingredient" style="min-width:150px"></div></td><td class="n"><div class="sx-au-in sm np" style="min-width:76px"><input class="iq" type="number" inputmode="decimal" step="0.05" min="0" value="'+q+'" aria-label="Quantity"></div></td><td><select class="iu sx-mt-sel" aria-label="Unit">'+uopts(u)+'</select></td><td><select class="ik sx-mt-sel" aria-label="Ingredient type">'+opts(P,k)+'</select><div class="sx-au-in sm np ic" hidden style="margin-top:6px"><input class="ig" type="number" inputmode="decimal" step="1" min="1" value="120" aria-label="Grams per cup" placeholder="g per cup"></div></td><td class="n io">—</td><td class="n ig2">—</td><td><button type="button" class="sx-reset rm" aria-label="Remove ingredient" style="padding:4px"><span class="msym" aria-hidden="true">delete</span></button></td>';
  $('ing').querySelector('tbody').appendChild(tr);
}
function load(r){var p=PRE[r];C.set('os',p[0][0]);C.set('ts',p[0][1]);$('ing').querySelector('tbody').innerHTML='';p[1].forEach(function(x){addRow(x[0],x[1],x[2],x[3]);});$('os').dispatchEvent(new Event('input',{bubbles:true}));}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oMass','oImp','oN','oSv'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above.');$('bp').innerHTML='';last='';}
function scale(){
  var os=C.val('os'),ts=C.val('ts');$('err').hidden=true;
  if(!(os>0&&ts>0))return fail('Enter the original and target servings above zero.');
  var m=ts/os,tot=0,fl=0,by={sugar:0,fat:0,liquid:0,salt:0},cnt=0,lines=[],rows=[];
  $('ing').querySelectorAll('tbody tr').forEach(function(tr){
    var k=tr.querySelector('.ik').value;tr.querySelector('.ic').hidden=k!=='other';
    var q=parseFloat(tr.querySelector('.iq').value)||0,u=tr.querySelector('.iu').value,nm=tr.querySelector('.in').value||'Ingredient',sq=q*m,g=toGrams(sq,u,k,parseFloat(tr.querySelector('.ig').value)||0);
    var un=(U.filter(function(x){return x[0]===u;})[0]||['',u])[1];if((u==='cups'||u==='sticks')&&Math.abs(sq-1)>0.001)un=u==='cups'?'cups':'sticks';tr.querySelector('.io').textContent=fmtq(sq,u)+' '+un;
    tr.querySelector('.ig2').textContent=isNaN(g)?'—':C.num(g,1);
    if(!isNaN(g)){tot+=g;cnt++;var cat=P[k][2];if(cat==='flour')fl+=g;else if(by[cat]!==undefined)by[cat]+=g;}
    lines.push(nm+': '+fmtq(sq,u)+' '+u+(isNaN(g)?'':' ('+C.num(g,0)+' g)'));rows.push([nm,q,u,sq,isNaN(g)?'':g.toFixed(1)]);
  });
  C.text('mult',C.num(m,3).replace(/\.?0+$/,''));C.text('resultValue',C.num(m,3).replace(/\.?0+$/,'')+'×');C.text('tag','exact ratio');
  C.text('interp','Every ingredient is multiplied by '+C.num(m,3).replace(/\.?0+$/,'')+' to go from '+C.num(os,1).replace(/\.0$/,'')+' to '+C.num(ts,1).replace(/\.0$/,'')+' servings.');
  var lb=tot/453.59237,oz=Math.floor(lb),rem=(lb-oz)*16;C.text('oMass',C.num(tot,0)+' g');C.text('oImp',oz+' lb '+C.num(rem,1)+' oz');C.text('oN',String(rows.length));C.text('oSv',C.num(ts,0));
  var bp='';[['Flour',fl],['Sugar and sweeteners',by.sugar],['Fat (butter, oil)',by.fat],['Liquid (water, milk)',by.liquid],['Salt',by.salt]].forEach(function(x,i){var p=fl>0?x[1]/fl*100:NaN;bp+='<div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:'+(i?'1px solid var(--sx-border)':'0')+';font-size:13px"><span style="color:var(--sx-onv)">'+x[0]+'</span><b style="font-family:var(--font-mono);color:var(--sx-on)">'+C.num(x[1],0)+' g'+(isNaN(p)?'':' · '+C.num(p,1)+'%')+'</b></div>';});
  $('bp').innerHTML=bp;C.text('bpN',fl>0?'Liquid is '+C.num(by.liquid/fl*100,0)+'% of the flour weight (hydration).':'Add a flour ingredient to see baker’s percentages.');
  csv='Ingredient,Original qty,Unit,Scaled qty,Grams\n'+rows.map(function(r){return '"'+r[0].replace(/"/g,'""')+'",'+r[1]+','+r[2]+','+C.num(r[3],3).replace(/,/g,'')+','+r[4];}).join('\n');
  last='Scaled recipe (x'+C.num(m,3).replace(/\.?0+$/,'')+') — calculatepilot.com/other/recipe-conversion-calculator.html\n'+lines.join('\n')+'\nTotal '+C.num(tot,0)+' g';
}
function conv(){
  var k=$('cp').value;$('cgBox').hidden=k!=='other';var a=C.val('ca'),u=$('cu').value,g=toGrams(a,u,k,C.val('cg'));
  if(isNaN(g)||!(a>=0)){C.text('cRes','—');C.text('ctag','—');C.text('cInterp','Choose an ingredient to convert volume to weight.');$('cAll').innerHTML='';return;}
  var gp=gramsPerCup(k,C.val('cg')),cups=gp?g/gp:NaN;
  C.text('cRes',C.num(g,1)+' g');C.text('ctag',C.num(g/28.349523125,2)+' oz');C.text('cInterp',C.num(a,2).replace(/\.?0+$/,'')+' '+u+' of '+P[k][0].toLowerCase()+' is about '+C.num(g,1)+' grams.');
  var rows=[['Cups',cups,4],['Tablespoons',cups*16,3],['Teaspoons',cups*48,2],['Millilitres',cups*236.588236,1],['Grams',g,1],['Ounces',g/28.349523125,2],['Sticks of butter',cups*2,2]];
  $('cAll').innerHTML=rows.map(function(r,i){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:'+(i?'1px solid var(--sx-border)':'0')+';font-size:13px"><span style="color:var(--sx-onv)">'+r[0]+'</span><b style="font-family:var(--font-mono);color:var(--sx-on)">'+(isNaN(r[1])?'—':C.num(r[1],r[2]).replace(/\.?0+$/,''))+'</b></div>';}).join('');
  last='Kitchen conversion — calculatepilot.com/other/recipe-conversion-calculator.html\n'+a+' '+u+' '+P[k][0]+' = '+C.num(g,1)+' g';
}
function compute(){var m=$('mode').value;$('scaleMode').hidden=m!=='scale';$('convMode').hidden=m!=='conv';if(m==='scale')scale();else conv();}
function dens(){var h='';Object.keys(P).filter(function(k){return k!=='other';}).forEach(function(k){var g=P[k][1];h+='<tr><td class="a">'+P[k][0]+'</td><td class="n">'+g+'</td><td class="n">'+C.num(g/28.349523125,1)+'</td><td class="n">'+C.num(g/16,1)+'</td></tr>';});$('dens').querySelector('tbody').innerHTML=h;}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('os').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  $('cu').innerHTML=uopts('cups');$('cp').innerHTML=opts(P,'flour_ap');
  load('cookie');dens();
  C.init({root:'rcCalc',compute:compute});
  $('rpre').addEventListener('click',function(e){var b=e.target.closest('button[data-r]');if(b)load(b.getAttribute('data-r'));});
  document.querySelectorAll('[data-m]').forEach(function(b){b.addEventListener('click',function(){C.set('ts',C.val('os')*parseFloat(b.getAttribute('data-m')));fire();});});
  $('addIng').addEventListener('click',function(){addRow('',1,'cups','flour_ap');fire();});
  $('ing').addEventListener('click',function(e){var b=e.target.closest('.rm');if(!b)return;b.closest('tr').remove();fire();});
  document.querySelectorAll('[data-action="reset"]').forEach(function(b){b.addEventListener('click',function(){setTimeout(function(){load('cookie');},0);});});
  $('csvBtn').addEventListener('click',function(){if(!csv)return;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='recipe.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy scaled recipe');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)window.scrollTo({top:document.getElementById('rcCalc').offsetTop+250,behavior:'smooth'});});
});
})();
