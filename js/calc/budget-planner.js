/* Budget Planner — CalculatePilot. Own logic, independent of budget.js.
   Every line is converted to a monthly amount (weekly × 52/12, every 2 weeks × 26/12, twice a month × 2, quarterly ÷ 3, yearly ÷ 12).
   Savings rate = savings lines ÷ income. Possible savings rate = (savings lines + money left over) ÷ income.
   50/30/20 comparison: needs ÷ income vs 50%, wants ÷ income vs 30%, savings ÷ income vs 20%. */
(function(){
var C=window.CPX,$=C.$,last='',csv='';
var FQ={m:['Monthly',1],w:['Weekly',52/12],b:['Every 2 weeks',26/12],s:['Twice a month',2],q:['Quarterly',1/3],y:['Yearly',1/12]};
var TY={n:'Need',w:'Want',s:'Saving'};
var DI=[{n:'Take-home pay',a:4200,f:'m'},{n:'Side income',a:300,f:'m'}];
var DE=[
 {n:'Rent or mortgage',a:1200,f:'m',t:'n'},{n:'Utilities',a:180,f:'m',t:'n'},{n:'Groceries',a:520,f:'m',t:'n'},{n:'Transport and fuel',a:280,f:'m',t:'n'},{n:'Insurance',a:150,f:'m',t:'n'},{n:'Phone and internet',a:80,f:'m',t:'n'},
 {n:'Dining out',a:250,f:'m',t:'w'},{n:'Subscriptions',a:60,f:'m',t:'w'},{n:'Shopping',a:200,f:'m',t:'w'},{n:'Hobbies',a:120,f:'m',t:'w'},{n:'Travel',a:1200,f:'y',t:'w'},
 {n:'Emergency fund',a:400,f:'m',t:'s'},{n:'Retirement',a:450,f:'m',t:'s'}
];
var COL={i:'#0f5b44',n:'#0891b2',w:'#d97706',s:'#16a34a',u:'#94a3b8',d:'#dc2626'};
function sel(opts,cur,k){var h='<select data-f="'+k+'" aria-label="'+k+'">';Object.keys(opts).forEach(function(o){h+='<option value="'+o+'"'+(o===cur?' selected':'')+'>'+(Array.isArray(opts[o])?opts[o][0]:opts[o])+'</option>';});return h+'</select>';}
function rowHtml(d,exp){
  return '<div class="bp-row" data-row><input type="text" data-f="n" class="bp-name" maxlength="40" value="'+C.esc(d.n)+'" aria-label="Name">'+
   '<button type="button" class="bp-del" data-del aria-label="Remove line"><span class="msym" aria-hidden="true">close</span></button>'+
   '<div class="sx-au-in sm"><span class="pre cs">$</span><input type="number" inputmode="decimal" data-f="a" step="10" min="0" value="'+d.a+'" aria-label="Amount"></div>'+
   sel(FQ,d.f,'f')+(exp?'<span class="bp-type">'+sel(TY,d.t,'t')+'</span>':'')+'</div>';
}
function render(i,e){
  $('incRows').innerHTML=i.map(function(d){return rowHtml(d,0);}).join('');
  $('expRows').innerHTML=e.map(function(d){return rowHtml(d,1);}).join('');
  document.querySelectorAll('#bpCalc .cs').forEach(function(x){x.textContent=C.symbol();});
}
function read(id,exp){
  var o=[];document.querySelectorAll('#'+id+' [data-row]').forEach(function(r){
    function g(k){return r.querySelector('[data-f="'+k+'"]');}
    var d={n:(g('n').value||'Line').trim()||'Line',a:Math.max(0,parseFloat(g('a').value)||0),f:g('f').value};
    if(exp)d.t=g('t').value;o.push(d);});
  return o;
}
function mo(d){return d.a*FQ[d.f][1];}
function pc(x){return C.num(x*100,1)+'%';}
function esc(s){return C.esc(s);}
function flow(inc,exp,left){
  var W=640,H=380,gap=5,items=exp.filter(function(d){return d.m>0;});
  var T=Math.max(inc,exp.reduce(function(s,d){return s+d.m;},0)),short=Math.max(0,-left);
  if(!(T>0)){$('flow').innerHTML='';return;}
  var k=(H-gap*(items.length+1))/T;if(k<=0)return;
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Money flow from income to needs, wants, savings and each expense line" class="bp-svg">';
  function ribbon(x0,ya,x1,yb,h,col){var xm=(x0+x1)/2;return '<path d="M'+x0+' '+ya+'C'+xm+' '+ya+' '+xm+' '+yb+' '+x1+' '+yb+'L'+x1+' '+(yb+h)+'C'+xm+' '+(yb+h)+' '+xm+' '+(ya+h)+' '+x0+' '+(ya+h)+'Z" fill="'+col+'" opacity=".28"/>';}
  var X0=0,X1=235,X2=430,NW=12;
  var src=[];var y=0;
  if(inc>0){src.push({y:y,h:inc*k,left:inc*k,col:COL.i});s+='<rect x="'+X0+'" y="'+y+'" width="'+NW+'" height="'+(inc*k)+'" fill="'+COL.i+'"/>';s+='<text x="'+(X0+NW+4)+'" y="'+(y+12)+'" font-size="11" fill="currentColor">Income '+esc(C.short(inc))+'</text>';y+=inc*k+gap;}
  if(short>0){src.push({y:y,h:short*k,left:short*k,col:COL.d});s+='<rect x="'+X0+'" y="'+y+'" width="'+NW+'" height="'+Math.max(2,short*k)+'" fill="'+COL.d+'"/>';s+='<text x="'+(X0+NW+4)+'" y="'+(y+10)+'" font-size="11" fill="currentColor">Shortfall '+esc(C.short(short))+'</text>';}
  var types=[['n','Needs'],['w','Wants'],['s','Savings']];
  var tot={n:0,w:0,s:0};exp.forEach(function(d){tot[d.t]+=d.m;});
  var mids=types.map(function(t){return {k:t[0],l:t[1],v:tot[t[0]]};});
  if(left>0)mids.push({k:'u',l:'Unallocated',v:left});
  var my=0,si=0;
  mids.forEach(function(m){
    if(!(m.v>0))return;var h=m.v*k,need=h,cy=my;
    while(need>1e-6&&si<src.length){var sc=src[si],take=Math.min(need,sc.left);if(take>1e-6){s+=ribbon(X0+NW,sc.y+(sc.h-sc.left),X1,cy+(h-need),take,sc.col);}sc.left-=take;need-=take;if(sc.left<=1e-6)si++;}
    s+='<rect x="'+X1+'" y="'+my+'" width="'+NW+'" height="'+h+'" fill="'+COL[m.k]+'"/>';
    s+='<text x="'+(X1+NW+4)+'" y="'+(my+Math.min(12,h/2+4))+'" font-size="11" fill="currentColor">'+m.l+' '+esc(C.short(m.v))+'</text>';
    m.y=my;m.used=0;my+=h+gap;
  });
  var ly=0;
  ['n','w','s'].forEach(function(t){
    var m=mids.filter(function(q){return q.k===t;})[0];
    items.filter(function(d){return d.t===t;}).forEach(function(d){
      var h=d.m*k;
      s+=ribbon(X1+NW,m.y+m.used,X2,ly,h,COL[t]);m.used+=h;
      s+='<rect x="'+X2+'" y="'+ly+'" width="'+NW+'" height="'+Math.max(1.5,h)+'" fill="'+COL[t]+'"/>';
      s+='<text x="'+(X2+NW+4)+'" y="'+(ly+Math.max(1.5,h)/2+4)+'" font-size="10.5" fill="currentColor">'+esc(d.n.length>20?d.n.slice(0,19)+'…':d.n)+' '+esc(C.short(d.m))+'</text>';
      ly+=Math.max(1.5,h)+gap;
    });
  });
  $('flow').innerHTML=s+'</svg>';
}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','tInc','tExp','sRate','pRate','yLeft'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see the result.');$('cmpT').querySelector('tbody').innerHTML='';$('flow').innerHTML='';last='';csv='';}
function compute(){
  $('err').hidden=true;
  var inc=read('incRows',0).map(function(d){d.m=mo(d);return d;}),exp=read('expRows',1).map(function(d){d.m=mo(d);return d;});
  var I=inc.reduce(function(s,d){return s+d.m;},0),E=exp.reduce(function(s,d){return s+d.m;},0);
  if(!(I>0))return fail('Enter at least one income amount above zero.');
  var tot={n:0,w:0,s:0};exp.forEach(function(d){tot[d.t]+=d.m;});
  var left=I-E,sr=tot.s/I,pr=(tot.s+Math.max(left,0))/I;
  C.text('resultValue',(left<0?'−':'')+C.money(Math.abs(left),0));
  C.text('tag',left>0?'Surplus':left<0?'Shortfall':'Balanced');
  C.text('interp',left>=0?'You plan to spend '+C.money(E,0)+' of '+C.money(I,0)+' a month, leaving '+C.money(left,0)+' unassigned. Put it to work in savings or a goal.':'Planned spending is '+C.money(E,0)+' against '+C.money(I,0)+' of income, a gap of '+C.money(-left,0)+' a month. Trim wants first, then review needs.');
  C.text('tInc',C.money(I,0));C.text('tExp',C.money(E,0));C.text('sRate',pc(sr));C.text('pRate',pc(pr));C.text('yLeft',(left<0?'−':'')+C.money(Math.abs(left)*12,0));
  var rows=[['n','Needs',.5],['w','Wants',.3],['s','Savings',.2]],h='',lines=['Type,Monthly,Share of income,50/30/20 target,Target amount'];
  rows.forEach(function(r){var sh=tot[r[0]]/I,df=sh-r[2];
    h+='<tr><td class="a"><b>'+r[1]+'</b></td><td class="n">'+C.money(tot[r[0]],0)+'</td><td class="n">'+pc(sh)+'</td><td class="n">'+pc(r[2])+'</td><td class="n">'+C.money(r[2]*I,0)+'</td><td class="n">'+(df>0?'+':df<0?'−':'')+C.num(Math.abs(df)*100,1)+' pts</td></tr>';
    lines.push([r[1],tot[r[0]].toFixed(2),(sh*100).toFixed(1)+'%',(r[2]*100)+'%',(r[2]*I).toFixed(2)].join(','));});
  $('cmpT').querySelector('tbody').innerHTML=h;
  lines.push('');lines.push('Line,Type,Monthly');inc.forEach(function(d){lines.push([JSON.stringify(d.n),'Income',d.m.toFixed(2)].join(','));});exp.forEach(function(d){lines.push([JSON.stringify(d.n),TY[d.t],d.m.toFixed(2)].join(','));});
  csv=lines.join('\n');
  var gap=(tot.n/I-.5);C.text('ins',tot.n/I>.5?'Needs take '+pc(tot.n/I)+' of income, '+C.num(gap*100,1)+' points above the 50% guide. Most people close that gap by trimming wants first.':'Needs take '+pc(tot.n/I)+' of income, within the 50% guide.');
  flow(I,exp,left);
  last='Budget Planner — calculatepilot.com/financial/budget-planner-calculator.html\nIncome '+C.money(I,0)+', spending '+C.money(E,0)+', left over '+C.money(left,0)+' a month\nSavings rate '+pc(sr)+', possible savings rate '+pc(pr)+'\nNeeds '+pc(tot.n/I)+', wants '+pc(tot.w/I)+', savings '+pc(tot.s/I);
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function remove(box,btn){var rows=Array.prototype.slice.call(box.querySelectorAll('[data-row]'));if(rows.length<=1)return;btn.closest('[data-row]').remove();compute();}
document.addEventListener('DOMContentLoaded',function(){
  render(DI,DE);
  C.init({root:'bpCalc',compute:compute});
  $('bpForm').addEventListener('submit',function(e){e.preventDefault();compute();});
  $('addI').addEventListener('click',function(){var i=read('incRows',0);if(i.length>=10)return;i.push({n:'Income',a:0,f:'m'});render(i,read('expRows',1));compute();});
  $('addE').addEventListener('click',function(){var e=read('expRows',1);if(e.length>=30)return;e.push({n:'New expense',a:0,f:'m',t:'n'});render(read('incRows',0),e);compute();});
  ['incRows','expRows'].forEach(function(id){$(id).addEventListener('click',function(e){var b=e.target.closest('[data-del]');if(b)remove($(id),b);});});
  $('rst').addEventListener('click',function(){render(DI,DE);compute();});
  $('csvBtn').addEventListener('click',function(){if(!csv)return;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='budget-planner.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  compute();
});
})();
