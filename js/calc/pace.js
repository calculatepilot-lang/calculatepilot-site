/* Running pace calculator — CalculatePilot (redesign, PSEO standards).
   Pace = time ÷ distance; time = pace × distance; 1 mi = 1.609344 km. Half = 21.0975 km, marathon = 42.195 km.
   Riegel 1981: T2 = T1 × (D2/D1)^1.06. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,MI=1.609344;
var RC={s1:['1 mile',MI],s2:['5K',5],s3:['10K',10],s4:['Half marathon',21.0975],s5:['Marathon',42.195]};
function hms(s){s=Math.round(s);var h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+('0'+m).slice(-2):m)+':'+('0'+x).slice(-2);}

function compute(){
  var tp=$('mode').value==='s2',rc=$('rc').value;$('cRow').hidden=rc!=='s6';$('tRow').hidden=tp;$('pRow').hidden=!tp;
  var km=rc==='s6'?v('cd')*($('du').value==='s1'?MI:1):RC[rc][1],name=rc==='s6'?(v('cd')+' '+($('du').value==='s1'?'mi':'km')):RC[rc][0];
  if(!(km>0))return;
  var sec;
  if(tp){var p=v('pm')*60+v('ps');if(!(p>0))return;sec=p*km/($('pu').value==='s1'?MI:1);}
  else{sec=v('th')*3600+v('tm')*60+v('ts');if(!(sec>0))return;}
  var sk=sec/km,smi=sk*MI,kmh=km/(sec/3600);
  C.text('hdL',tp?'Finish time':'Pace');
  C.text('resultValue',tp?hms(sec):hms(sk)+' /km');C.text('tag',name);
  C.text('rN',tp?name+' at '+hms($('pu').value==='s1'?smi:sk)+($('pu').value==='s1'?' per mile':' per km')+' takes '+hms(sec)+'.':name+' in '+hms(sec)+' is '+hms(sk)+' per km, or '+hms(smi)+' per mile.');
  C.text('pmi',hms(smi)+' /mi');C.text('pkm',hms(sk)+' /km');C.text('spd',kmh.toFixed(1)+' km/h · '+(kmh/MI).toFixed(1)+' mph');C.text('fin',hms(sec));
  var std=[['1 mile',MI],['5K',5],['10K',10],['Half marathon',21.0975],['Marathon',42.195]];
  $('pred').innerHTML=std.map(function(d){var t=sec*Math.pow(d[1]/km,1.06),me=Math.abs(d[1]-km)<1e-6;return '<div class="l'+(me?' t':'')+'"><span>'+d[0]+(me?' (your race)':'')+'</span><b>'+hms(me?sec:t)+' · '+hms((me?sec:t)/d[1])+'/km</b></div>';}).join('');
  var pts=[],useMi=$('mode').value==='s2'?$('pu').value==='s1':(rc==='s1'||(rc==='s6'&&$('du').value==='s1')),unit=useMi?MI:1,n=km/unit,step=n<=13?1:n<=27?2:5;
  for(var d=step;d<n-1e-9;d+=step)pts.push([d+(useMi?' mi':' km'),d*unit]);
  [['5K',5],['10K',10],['Half',21.0975]].forEach(function(x){if(x[1]<km-1e-9&&!pts.some(function(p){return Math.abs(p[1]-x[1])<0.05;}))pts.push([x[0],x[1]]);});
  pts.sort(function(a,b){return a[1]-b[1];});pts.push(['Finish',km]);
  C.text('tbT',hms(useMi?smi:sk)+(useMi?' /mi':' /km'));
  $('spTbl').innerHTML=pts.map(function(p){var f=p[0]==='Finish';return '<tr'+(f?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+p[0]+'</td><td>'+(p[1]/(useMi?MI:1)).toFixed(2)+(useMi?' mi':' km')+'</td><td class="b">'+hms(sk*p[1])+'</td></tr>';}).join('');
  last=name+': '+hms(sec)+' — '+hms(sk)+'/km, '+hms(smi)+'/mi, '+kmh.toFixed(1)+' km/h\n— calculatepilot.com/health/pace-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pcCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Results');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
