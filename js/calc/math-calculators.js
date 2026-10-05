/* Math calculators hub — search box and category chips (Stitch redesign).
   Cards are static HTML (crawlable); this only shows/hides them. Press "/" to focus search. */
(function(){
function $(id){return document.getElementById(id);}
function apply(){
  var q=($('hubSearch').value||'').trim().toLowerCase(),cat=$('hubCat').value,any=false;
  document.querySelectorAll('.sx-hchips button').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-cat')===cat));});
  document.querySelectorAll('.sx-hcat').forEach(function(sec){
    var inCat=cat==='all'||sec.getAttribute('data-cat')===cat,shown=0;
    sec.querySelectorAll('.sx-tool').forEach(function(a){var ok=inCat&&(!q||q.split(/\s+/).every(function(w){return a.getAttribute('data-q').indexOf(w)>-1;}));a.hidden=!ok;if(ok)shown++;});
    sec.hidden=!shown;if(shown)any=true;
  });
  $('hubEmpty').hidden=any;
}
document.addEventListener('DOMContentLoaded',function(){
  var s=$('hubSearch');if(!s)return;
  s.addEventListener('input',apply);
  document.querySelector('.sx-hchips').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;$('hubCat').value=b.getAttribute('data-cat');apply();});
  document.addEventListener('keydown',function(e){if(e.key==='/'&&document.activeElement!==s&&!/input|textarea|select/i.test((document.activeElement||{}).tagName||'')){e.preventDefault();s.focus();}});
  try{var q=new URLSearchParams(location.search).get('q');if(q)s.value=q;}catch(e){}
  apply();
});
})();
document.addEventListener('DOMContentLoaded',function(){
  var b=document.getElementById('copyEmbed');if(!b)return;
  b.addEventListener('click',function(){var t=document.getElementById('embedCode').textContent,done=function(){document.getElementById('copyTxt').textContent='Copied';setTimeout(function(){document.getElementById('copyTxt').textContent='Copy code';},1800);};
    if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});else{var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');done();}catch(e){}a.remove();}});
});
