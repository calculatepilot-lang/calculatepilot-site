/* Dog & cat age in human years — CalculatePilot (Stitch redesign).
   Dogs: size-based veterinary table (linear interpolation between whole years) or UCSD epigenetic clock 16·ln(age)+31 (Wang et al. 2020).
   Cats: 15 at year 1, 24 at year 2, then +4 per year (AAHA/AAFP life-stage guidance). 6 months ≈ 10 for all. */
(function(){
var C=window.CPX,$=C.$,last='';
var T={s:[15,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80],m:[15,24,28,32,36,42,47,51,56,60,65,69,74,78,83,87],l:[15,24,28,32,36,45,50,55,61,66,72,77,82,88,93,99],g:[12,22,31,38,45,49,56,64,71,79,86,93,100,107,114,121]};
var LIFE={s:14,m:13,l:11,g:9},TIER={s:'small dog',m:'medium dog',l:'large dog',g:'giant dog'};
function at(arr,a){ /* anchors: 0→0, 0.5→10 (giant 9), then arr[0] at year 1 ... */
  if(a<=0)return 0;var half=arr===T.g?9:10;
  if(a<0.5)return half*a/0.5;
  if(a<1)return half+(arr[0]-half)*(a-0.5)/0.5;
  var i=Math.floor(a);
  if(i>=arr.length){var slope=arr[arr.length-1]-arr[arr.length-2];return arr[arr.length-1]+slope*(a-arr.length);}
  var f=a-i;return f===0?arr[i-1]:arr[i-1]+(arr[i]-arr[i-1])*f;
}
function cat(a){if(a<=0)return 0;if(a<0.5)return 10*a/0.5;if(a<1)return 10+5*(a-0.5)/0.5;if(a<2)return 15+9*(a-1);return 24+4*(a-2);}
function human(sp,tier,model,a){if(sp==='cat')return cat(a);if(model==='epi')return a>=0.15?Math.max(0,16*Math.log(a)+31):NaN;return at(T[tier],a);}
function stage(sp,tier,a){
  if(sp==='cat')return a<1?['Kitten',1,5]:a<7?['Young adult',2,5]:a<11?['Mature adult',3,5]:a<15?['Senior',4,5]:['End of life',5,5];
  var ex=LIFE[tier],f=a/ex;return a<1?['Puppy',1,4]:f<0.5?['Adult',2,4]:f<0.75?['Mature',3,4]:['Senior',4,4];
}
function care(sp,st){
  var n=st[0];
  if(n==='Kitten'||n==='Puppy')return ['Every 3 to 4 weeks until the vaccine series is finished','Start home tooth care; ask your vet about a first dental check','Usually not needed unless your vet advises'];
  if(n==='Senior'||n==='End of life')return ['Twice a year (every 6 months)','Dental exam at least yearly, more often if there is disease','Blood and urine tests once or twice a year'];
  if(n==='Mature')return ['Once a year, or twice if health issues appear','Yearly dental exam','Baseline blood tests; your vet may suggest yearly screening'];
  return ['Once a year','Yearly dental check; cleaning as your vet advises','A baseline panel, then as your vet recommends'];
}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','stage','rate'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see the result.');last='';}
function chartT(){
  var yrs=[0.5,1,2,3,5,7,10,12,15],h='';
  yrs.forEach(function(y){h+='<tr'+(y===7?' style="background:var(--sx-low)"':'')+'><td class="a"><b>'+(y<1?'6 months':y+' year'+(y>1?'s':''))+'</b>'+(y===7?' <span class="sx-mt-tag">senior marker</span>':'')+'</td>'+['s','m','l','g'].map(function(t){return '<td class="n">'+Math.round(at(T[t],y))+'</td>';}).join('')+'<td class="n">'+Math.round(cat(y))+'</td></tr>';});
  $('chartT').querySelector('tbody').innerHTML=h;
}
function compute(){
  var sp=$('sp').value,tier=$('tier').value,model=$('model').value,y=Math.max(0,Math.round(C.val('yy'))),m=Math.min(11,Math.max(0,Math.round(C.val('mm')))),a=y+m/12;
  $('tierBox').hidden=sp!=='dog';$('modelBox').hidden=sp!=='dog';$('err').hidden=true;
  if(!(a>0))return fail('Enter your pet’s age.');
  var hv=human(sp,tier,model,a);
  if(isNaN(hv))return fail('The epigenetic formula needs an age of about 2 months or more.');
  var st=stage(sp,tier,a),k=1/12,rate=(human(sp,tier,model,a+0.5)-human(sp,tier,model,Math.max(0.16,a-0.5)))/(a-0.5<0.16?a+0.5-0.16:1);
  var nm=sp==='cat'?'cat':TIER[tier];
  C.text('resultValue',C.num(hv,1));C.text('tag',nm+' · '+y+'y '+m+'m');
  C.text('interp','A '+nm+' aged '+y+' year'+(y!==1?'s':'')+(m?' '+m+' month'+(m>1?'s':''):'')+' is about '+Math.round(hv)+' in human years'+(sp==='dog'?(model==='epi'?' (epigenetic clock).':' (size-based table).'):' (feline guideline).'));
  C.text('stage',st[0]);C.text('rate','+'+C.num(Math.max(0,rate),1)+' / yr');
  var cr=care(sp,st);C.text('c1',cr[0]);C.text('c2',cr[1]);C.text('c3',cr[2]);
  var max=Math.max(16,Math.ceil(a)+1),xs=[],vals=[],lab=[];for(var i=0;i<=max;i++){xs.push(i);vals.push(human(sp,tier,model,i===0?0.16:i)||0);lab.push(i+'y');}
  C.text('curveN',sp==='cat'?'cat':model==='epi'?'epigenetic':TIER[tier]);
  C.chart($('chart'),{series:[{name:'Human years',values:vals,color:'#0f5b44',fill:true}],labels:lab,label:'Human-year equivalent by pet age',tipFmt:function(x){return C.num(x,0)+' human years';}});
  last='Pet age — calculatepilot.com/other/pet-age-calculator.html\n'+nm+', '+y+'y '+m+'m = '+C.num(hv,1)+' human years ('+st[0]+')';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  chartT();
  C.init({root:'paCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
