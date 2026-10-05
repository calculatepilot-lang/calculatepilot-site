/* Flight time & jet lag calculator — CalculatePilot (Stitch redesign). Generated from tools/redesign/flight-time.tpl.js by flight.build.py.
   Haversine great-circle distance (R = 6371 km); ground speed = TAS + wind; block = distance / ground speed + buffer.
   Times use each airport's IANA zone via Intl for the chosen date. */
(function(){
var C=window.CPX,$=C.$,last='';
var AP=[["JFK","Nueva York JFK",40.6413,-73.7781,"America/New_York"],["LAX","Los Ángeles",33.9416,-118.4085,"America/Los_Angeles"],["ORD","Chicago O'Hare",41.9742,-87.9073,"America/Chicago"],["ATL","Atlanta",33.6407,-84.4277,"America/New_York"],["DFW","Dallas Fort Worth",32.8998,-97.0403,"America/Chicago"],["DEN","Denver",39.8561,-104.6737,"America/Denver"],["SFO","San Francisco",37.6213,-122.379,"America/Los_Angeles"],["SEA","Seattle",47.4502,-122.3088,"America/Los_Angeles"],["MIA","Miami",25.7959,-80.287,"America/New_York"],["BOS","Boston",42.3656,-71.0096,"America/New_York"],["YYZ","Toronto",43.6777,-79.6248,"America/Toronto"],["YVR","Vancouver",49.1967,-123.1815,"America/Vancouver"],["MEX","Ciudad de México",19.4363,-99.0721,"America/Mexico_City"],["GRU","São Paulo",-23.4356,-46.4731,"America/Sao_Paulo"],["LHR","Londres Heathrow",51.47,-0.4543,"Europe/London"],["CDG","París Charles de Gaulle",49.0097,2.5479,"Europe/Paris"],["AMS","Ámsterdam",52.3105,4.7683,"Europe/Amsterdam"],["FRA","Fráncfort",50.0379,8.5622,"Europe/Berlin"],["MAD","Madrid",40.4983,-3.5676,"Europe/Madrid"],["FCO","Roma Fiumicino",41.8003,12.2389,"Europe/Rome"],["IST","Estambul",41.2753,28.7519,"Europe/Istanbul"],["DXB","Dubái",25.2532,55.3657,"Asia/Dubai"],["DOH","Doha",25.2731,51.6081,"Asia/Qatar"],["DEL","Delhi",28.5562,77.1,"Asia/Kolkata"],["BOM","Bombay",19.0896,72.8656,"Asia/Kolkata"],["KHI","Karachi",24.9065,67.1608,"Asia/Karachi"],["LHE","Lahore",31.5216,74.4036,"Asia/Karachi"],["SIN","Singapur Changi",1.3644,103.9915,"Asia/Singapore"],["HKG","Hong Kong",22.308,113.9185,"Asia/Hong_Kong"],["BKK","Bangkok",13.69,100.7501,"Asia/Bangkok"],["PEK","Pekín Capital",40.0801,116.5846,"Asia/Shanghai"],["PVG","Shanghái Pudong",31.1443,121.8083,"Asia/Shanghai"],["ICN","Seúl Incheon",37.4602,126.4407,"Asia/Seoul"],["HND","Tokio Haneda",35.5494,139.7798,"Asia/Tokyo"],["SYD","Sídney",-33.9399,151.1753,"Australia/Sydney"],["AKL","Auckland",-37.0082,174.785,"Pacific/Auckland"],["JNB","Johannesburgo",-26.1392,28.246,"Africa/Johannesburg"],["CAI","El Cairo",30.1219,31.4056,"Africa/Cairo"],["LOS","Lagos",6.5774,3.3212,"Africa/Lagos"],["NBO","Nairobi",-1.3192,36.9278,"Africa/Nairobi"]],BY={};AP.forEach(function(a){BY[a[0]]={c:a[0],n:a[1],lat:a[2],lon:a[3],tz:a[4]};});
var R_KM=6371,NM=1.852;
function rad(x){return x*Math.PI/180;}
function gc(a,b){var dp=rad(b.lat-a.lat),dl=rad(b.lon-a.lon),x=Math.sin(dp/2)*Math.sin(dp/2)+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dl/2)*Math.sin(dl/2);return 2*R_KM*Math.asin(Math.sqrt(x));}
/* offset in minutes of zone at a UTC instant */
function offAt(tz,ms){var f=new Intl.DateTimeFormat('es-ES',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});var p={};f.formatToParts(new Date(ms)).forEach(function(x){p[x.type]=x.value;});var asUtc=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);return Math.round((asUtc-Math.floor(ms/1000)*1000)/60000);}
/* local wall-clock (as a UTC-style ms) in zone -> real UTC ms */
function toUtc(tz,wall){var g=wall-offAt(tz,wall)*60000;return wall-offAt(tz,g)*60000;}
function fmt(tz,ms){return new Intl.DateTimeFormat('es-ES',{timeZone:tz,weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(ms));}
function hm(m){m=Math.round(m);var h=Math.floor(m/60),r=m%60;return h+' h '+(r<10?'0':'')+r+' min';}
function sgn(m){var h=m/60;return (h>0?'+':h<0?'−':'')+Math.abs(h).toString().replace(/\.5$/,'.5')+' h';}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oArr','oTz','oNm','oGs','oAir','oJl'].forEach(function(i){C.text(i,'—');});C.text('tag','—');last='';}
function compute(){
  $('err').hidden=true;
  var a=BY[$('o').value],b=BY[$('d').value],tas=C.val('ac'),wind=C.val('wd'),buf=C.val('bf'),dtv=$('dt').value;
  if(!a||!b)return fail('Elige ambos aeropuertos.');
  if(a===b)return fail('El origen y el destino son el mismo aeropuerto.');
  if(!dtv)return fail('Introduce una fecha y hora de salida.');
  var gs=tas+wind;if(!(gs>0))return fail('El viento en contra es más fuerte que la velocidad de la aeronave. Redúcelo.');
  var km=gc(a,b),nm=km/NM,air=nm/gs*60,blk=air+buf;
  var m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(dtv);if(!m)return fail('Introduce una hora de salida válida.');
  var wall=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5]),dep=toUtc(a.tz,wall),arr=dep+blk*60000;
  var shift=(offAt(b.tz,dep)-offAt(a.tz,dep));while(shift>720)shift-=1440;while(shift<-720)shift+=1440;var shiftH=shift/60;
  C.text('resultValue',hm(blk));C.text('tag',a.c+' → '+b.c);
  C.text('interp',a.n+' to '+b.n+': '+C.num(nm,0)+' millas náuticas a '+C.num(gs,0)+' kt de velocidad sobre el suelo, más '+buf+' min en tierra.');
  C.text('oArr',fmt(b.tz,arr));C.text('oTz',(shift===0?'none':sgn(shift)));
  C.text('oNm',C.num(nm,0)+' NM');C.text('oKm',C.num(km,0)+' km · '+C.num(km/1.609344,0)+' mi');
  C.text('oGs',C.num(gs,0)+' kt');C.text('oGsN',C.num(gs*1.150779,0)+' mph'+(wind?' ('+(wind>0?'+':'−')+Math.abs(wind)+' kt de viento)':''));
  C.text('oAir',hm(air));C.text('oBuf','+ '+buf+' min = '+hm(blk));
  var days=shiftH>0?shiftH/1:Math.abs(shiftH)/1.5;
  if(shift===0){C.text('oJl','Ninguna');C.text('oJlN','mismo huso horario');C.text('note','No hay cambio de huso horario, así que no hay desfase horario por el reloj. Los vuelos largos aún pueden causar cansancio.');}
  else{var dir=shift>0?'east':'west';C.text('oJl','about '+C.num(Math.max(1,days),0)+(Math.max(1,days)<1.5?' day':' days'));C.text('oJlN',Math.abs(shiftH).toString()+' zones '+dir);
    C.text('note',shift>0?'Pierdes '+Math.abs(shiftH)+' horas al viajar hacia el este, por lo que tu reloj biológico tiene que adelantarse. Regla general: aproximadamente un día por cada hora de diferencia. Busca luz brillante por la mañana en el destino, evítala al final de la tarde y adelanta la hora de acostarte unos días antes de viajar.':'Ganas '+Math.abs(shiftH)+' horas al viajar hacia el oeste, por lo que tu reloj biológico tiene que retrasarse. Regla general: aproximadamente un día por cada 1.5 horas de diferencia. Busca luz brillante por la tarde y al anochecer en el destino, y acuéstate un poco más tarde al principio.');}
  last='Tiempo de vuelo — calculatepilot.com/other/flight-time-calculator.html\n'+a.c+' to '+b.c+': '+hm(blk)+' de puerta a puerta, '+C.num(nm,0)+' NM, aterriza '+fmt(b.tz,arr);
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  var ctl=C.init({root:'flCalc',compute:compute});
  document.querySelectorAll('[data-r]').forEach(function(b){b.addEventListener('click',function(){var r=b.getAttribute('data-r').split(',');$('o').value=r[0];$('d').value=r[1];$('o').dispatchEvent(new Event('change',{bubbles:true}));});});
  document.querySelectorAll('[data-w]').forEach(function(b){b.addEventListener('click',function(){$('wd').value=b.getAttribute('data-w');$('wd').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('swap').addEventListener('click',function(){var t=$('o').value;$('o').value=$('d').value;$('d').value=t;$('o').dispatchEvent(new Event('change',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
