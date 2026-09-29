/* Wedding budget calculator — CalculatePilot (Stitch redesign). spendable = budget × (1 − contingency); category = spendable × share. */
(function(){
var C=window.CPX,$=C.$,last='';
var A=[['Venue, catering and bar',44],['Photography and video',11],['Attire and beauty',8],['Flowers and decor',8],['Music and entertainment',7],['Planner or coordinator',5],['Rings',3],['Stationery and favors',3],['Ceremony and officiant',2],['Transport',3],['Other and tips',6]];
function shares(byo){
  if(!byo)return A.map(function(x){return [x[0],x[1]];});
  var rest=A.slice(1),sum=rest.reduce(function(t,x){return t+x[1];},0),scale=(100-40-8)/sum,out=[[A[0][0],40],['Rentals, bar and staffing',8]];
  rest.forEach(function(x){out.push([x[0],x[1]*scale]);});return out;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oPg','oCt','oVc','oVg','s1','s2','s3'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';last='';}
function compute(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  var bt=C.val('bt'),gs=C.val('gs'),ct=C.val('ct'),byo=$('vn').value==='b',p1=C.val('p1'),p2=C.val('p2');
  C.text('ctV',ct+'% held back');$('err').hidden=true;
  if(!(bt>0))return fail('Enter your total budget.');if(!(gs>0))return fail('Enter the number of guests.');
  if(p1+p2>100)return fail('The first two payments add up to more than 100%.');
  var p3=100-p1-p2;$('p3').value=p3;
  var res=bt*ct/100,sp=bt-res,sh=shares(byo);
  C.text('resultValue',C.money(sp,0));C.text('tag',C.num(100-ct,0)+'% of budget');
  C.text('interp','From a '+C.money(bt,0)+' budget, after holding back '+C.money(res,0)+' for surprises.');
  C.text('oPg',C.money(bt/gs,2));C.text('oCt',C.money(res,0));
  var vc=sp*sh[0][1]/100+(byo?sp*sh[1][1]/100:0);C.text('oVc',C.money(vc,0));C.text('oVg',C.money(vc/gs,2)+' a guest');
  $('rows').innerHTML=sh.map(function(x){return '<tr><td class="a">'+C.esc(x[0])+'</td><td class="n">'+x[1].toFixed(x[1]%1?1:0)+'%</td><td class="n"><b>'+C.money(sp*x[1]/100,0)+'</b></td></tr>';}).join('')+'<tr><td class="a">Contingency reserve</td><td class="n">'+ct+'% of budget</td><td class="n"><b>'+C.money(res,0)+'</b></td></tr>';
  C.text('s1',C.money(sp*p1/100,0));C.text('s1n',p1+'% at signing');C.text('s2',C.money(sp*p2/100,0));C.text('s2n',p2+'% about 60 days out');C.text('s3',C.money(sp*p3/100,0));C.text('s3n',p3+'% wedding day');
  last='Wedding budget — calculatepilot.com/other/wedding-budget-calculator.html\nBudget '+C.money(bt,0)+' for '+C.num(gs,0)+' guests: spend '+C.money(sp,0)+', contingency '+C.money(res,0)+', '+C.money(bt/gs,2)+' a guest';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'wbCalc',compute:compute});
  document.querySelectorAll('[data-b]').forEach(function(b){b.addEventListener('click',function(){$('bt').value=b.getAttribute('data-b');$('bt').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
