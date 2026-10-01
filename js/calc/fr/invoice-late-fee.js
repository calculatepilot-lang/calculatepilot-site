/* Invoice late fee calculator — CalculatePilot (Stitch redesign). charged days = max(0, days late − grace); simple: P·r·d/365; monthly/yearly compounding as stated on the page. */
(function(){
var C=window.CPX,$=C.$,last='';
function day(v){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||'');return m?Date.UTC(+m[1],+m[2]-1,+m[3])/86400000:NaN;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oD','oB','oI','oF','oPd','oAg'].forEach(function(i){C.text(i,'—');});C.text('tag','—');last='';}
function compute(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  $('err').hidden=true;var P=C.val('pr'),due=day($('dd').value),as=day($('ao').value),gr=Math.max(0,Math.round(C.val('gr'))),ff=C.val('ff'),r=C.val('ap')/100,cp=$('cp').value;
  if(!(P>0))return fail('Saisissez le montant de la facture.');if(isNaN(due)||isNaN(as))return fail('Saisissez la date d’échéance et la date jusqu’à laquelle calculer.');
  var late=Math.max(0,as-due),ch=Math.max(0,late-gr),I;
  if(cp==='s')I=P*r*ch/365;else if(cp==='m')I=P*(Math.pow(1+r/12,12*ch/365)-1);else I=P*(Math.pow(1+r,ch/365)-1);
  var fee=ch>0?ff:0,tot=P+I+fee;
  C.text('resultValue',C.money(tot,2));C.text('tag',late===0?'non échue':late+' jours de retard');
  C.text('interp',ch>0?C.money(P,2)+' plus '+C.money(I,2)+' interest'+(fee?' et des frais de '+C.money(fee,2)+' fee':'')+'.':(late>0?'Toujours dans le '+gr+' jours de grâce, donc ni intérêts ni frais pour l’instant.':'Pas encore échue, ou échue à la date choisie. Rien à ajouter.'));
  C.text('oD',String(late));C.text('oB',String(ch));C.text('oI',C.money(I,2));C.text('oF',C.money(fee,2));
  C.text('oPd',C.money(P*r/365,2));C.text('oPn',C.num(r*100/365,4)+'% par jour à '+C.num(r*100,2)+'% par an');
  C.text('oAg',late===0?'En cours':late<=30?'1 à 30':late<=60?'31 à 60':late<=90?'61 à 90':'90+');
  last='Facture en retard — calculatepilot.com/other/invoice-late-fee-calculator.html\nFacture '+C.money(P,2)+', '+late+' jours de retard ('+ch+' facturés) : intérêts '+C.money(I,2)+', frais '+C.money(fee,2)+', total '+C.money(tot,2);
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ivCalc',compute:compute});
  function put(id,v){$(id).value=v;$(id).dispatchEvent(new Event('input',{bubbles:true}));}
  document.querySelectorAll('[data-a]').forEach(function(b){b.addEventListener('click',function(){put('pr',b.getAttribute('data-a'));});});
  document.querySelectorAll('[data-r]').forEach(function(b){b.addEventListener('click',function(){put('ap',b.getAttribute('data-r'));});});
  $('todayBtn').addEventListener('click',function(){var d=new Date();put('ao',d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));});
  $('ukBtn').addEventListener('click',function(){var P=C.val('pr');put('ff',P>=10000?100:P>=1000?70:40);});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résumé');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
