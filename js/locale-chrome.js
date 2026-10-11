(function(){
  var m=(location.pathname||'').match(/^\/(de|fr|es)(\/|$)/);
  if(!m) return;
  var L=m[1];
  var NAV={
    de:{home:'/de/',fin:'/de/financial-calculators.html',hea:'/de/health-calculators.html',math:'/de/math-calculators.html',oth:'/de/other-calculators.html',guides:'/guides/index.html',fl:'Finanzen',hl:'Gesundheit & Fitness',ml:'Mathematik',ol:'Alltag',gl:'Ratgeber',menu:'Menü öffnen',menul:'Menü'},
    fr:{home:'/fr/',fin:'/fr/financial-calculators.html',hea:'/fr/health-calculators.html',math:'/fr/math-calculators.html',oth:'/fr/other-calculators.html',guides:'/guides/index.html',fl:'Finance',hl:'Santé & fitness',ml:'Mathématiques',ol:'Quotidien',gl:'Guides',menu:'Ouvrir le menu',menul:'Menu'},
    es:{home:'/es/',fin:'/es/financial-calculators.html',hea:'/es/health-calculators.html',math:'/es/math-calculators.html',oth:'/es/other-calculators.html',guides:'/guides/index.html',fl:'Finanzas',hl:'Salud y fitness',ml:'Matemáticas',ol:'Día a día',gl:'Guías',menu:'Abrir menú',menul:'Menú'}
  }[L];
  function headerHTML(){
    return '<a href="'+NAV.home+'" class="logo">calculatepilot<span class="dot">.</span></a><ul class="nav-links"><li><a href="'+NAV.fin+'">'+NAV.fl+'</a></li><li><a href="'+NAV.hea+'">'+NAV.hl+'</a></li><li><a href="'+NAV.math+'">'+NAV.ml+'</a></li><li><a href="'+NAV.oth+'">'+NAV.ol+'</a></li><li><a href="'+NAV.guides+'">'+NAV.gl+'</a></li></ul><button class="nav-toggle" aria-label="'+NAV.menu+'">'+NAV.menul+'</button>';
  }
  function ensureHeader(){
    var header=document.querySelector('header.site-header');
    if(!header){
      header=document.createElement('header');
      header.className='site-header';
      document.body.insertBefore(header,document.body.firstChild);
    }
    var box=header.querySelector('.container');
    if(!box){box=document.createElement('div');box.className='container';header.appendChild(box);}
    if(!box.querySelector('.nav-links')) box.innerHTML=headerHTML();
  }
  function ensureFooter(){
    if(document.querySelector('footer.site-footer .footer-grid, footer.site-footer.cp-footer')) return;
    fetch(NAV.home,{credentials:'omit'}).then(function(r){return r.text();}).then(function(html){
      var doc=new DOMParser().parseFromString(html,'text/html');
      var src=doc.querySelector('footer.site-footer');
      if(!src||!src.querySelector('.footer-grid')) return;
      var next=src.cloneNode(true);
      var cur=document.querySelector('footer.site-footer');
      if(cur) cur.replaceWith(next); else document.body.appendChild(next);
      if(typeof window.__cpApplyLogos==='function') window.__cpApplyLogos();
    }).catch(function(){});
  }
  function run(){ensureHeader();ensureFooter();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run);
  else run();
})();
