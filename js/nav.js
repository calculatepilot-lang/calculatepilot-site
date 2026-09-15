(function(){
  if(!document.getElementById('cp-brand-css')){
    const link=document.createElement('link');
    link.id='cp-brand-css';
    link.rel='stylesheet';
    link.href='/css/brand.css?v=20260909';
    document.head.appendChild(link);
  }
  const logoHTML='<span class="logo-mark" aria-hidden="true"><span class="logo-mark-letters">C<span class="logo-p">P<span class="logo-p-dot"></span></span></span></span><span class="logo-word"><span class="logo-calculate">Calculate</span><span class="logo-pilot">Pilot</span></span>';
  const applyLogos=()=>{
    document.querySelectorAll('a.logo').forEach((el)=>{
      if(el.querySelector('.logo-mark')) return;
      el.innerHTML=logoHTML;
      el.setAttribute('aria-label','CalculatePilot home');
    });
  };
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',applyLogos);
  } else {
    applyLogos();
  }
})();

(function(){
  // Dark mode: apply saved preference immediately (before paint) to avoid flash
  try{
    if(localStorage.getItem('cp-theme')==='dark'){document.documentElement.classList.add('cp-dark');}
  }catch(e){}
})();

(function(){
  const searchIcon='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
  const embedIcon='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';
  const sunIcon='<svg class="icon-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  const moonIcon='<svg class="icon-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  function injectHeaderTools(){
    document.querySelectorAll('.site-header .container').forEach((container)=>{
      if(container.querySelector('.header-tools')) return;
      const toggle=container.querySelector('.nav-toggle');
      const wrap=document.createElement('div');
      wrap.className='header-tools';
      wrap.innerHTML=
        '<button type="button" class="quick-search-btn" aria-label="Quick search">'+searchIcon+'<span class="quick-search-kbd">Ctrl K</span></button>'+
        '<a href="/embed/" class="embed-pill">'+embedIcon+'<span>Embed Tools</span></a>'+
        '<button type="button" class="theme-toggle" aria-label="Toggle dark mode">'+sunIcon+moonIcon+'</button>';
      if(toggle){container.insertBefore(wrap,toggle);} else {container.appendChild(wrap);}
    });
  }

  function buildOverlay(){
    if(document.getElementById('cpQuickJump')) return document.getElementById('cpQuickJump');
    const overlay=document.createElement('div');
    overlay.id='cpQuickJump';
    overlay.className='quick-jump-overlay';
    overlay.innerHTML=
      '<div class="quick-jump-panel">'+
        '<div class="quick-jump-input-row">'+searchIcon+
        '<input type="text" id="cpQuickJumpInput" placeholder="Jump to a calculator..." autocomplete="off">'+
        '<button type="button" class="quick-jump-close" aria-label="Close">Esc</button></div>'+
        '<div class="quick-jump-results" id="cpQuickJumpResults"></div>'+
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  let calcIndex=null;
  function loadIndex(){
    if(calcIndex) return Promise.resolve(calcIndex);
    return fetch('/calculators.json').then((r)=>r.json()).then((data)=>{calcIndex=data;return data;}).catch(()=>{calcIndex=[];return [];});
  }

  function renderResults(query){
    const results=document.getElementById('cpQuickJumpResults');
    if(!results) return;
    const q=query.trim().toLowerCase();
    if(!q){results.innerHTML='';return;}
    const matches=(calcIndex||[]).filter((c)=>c.name.toLowerCase().includes(q)).slice(0,8);
    if(!matches.length){results.innerHTML='<div class="quick-jump-empty">No matches</div>';return;}
    results.innerHTML=matches.map((c)=>'<a href="'+c.href+'" class="quick-jump-result">'+c.name+'<span class="arrow">\u2192</span></a>').join('');
  }

  function openOverlay(){
    const overlay=buildOverlay();
    overlay.classList.add('is-open');
    document.body.style.overflow='hidden';
    loadIndex().then(()=>{
      const input=document.getElementById('cpQuickJumpInput');
      if(input){input.value='';input.focus();}
      renderResults('');
    });
  }
  function closeOverlay(){
    const overlay=document.getElementById('cpQuickJump');
    if(overlay){overlay.classList.remove('is-open');}
    document.body.style.overflow='';
  }

  function initSearch(){
    document.addEventListener('click',(e)=>{
      if(e.target.closest('.quick-search-btn')){openOverlay();}
      if(e.target.closest('.quick-jump-close')){closeOverlay();}
      const overlay=document.getElementById('cpQuickJump');
      if(overlay && overlay.classList.contains('is-open') && e.target===overlay){closeOverlay();}
      const result=e.target.closest('.quick-jump-result');
      if(result){closeOverlay();}
    });
    document.addEventListener('input',(e)=>{
      if(e.target && e.target.id==='cpQuickJumpInput'){renderResults(e.target.value);}
    });
    document.addEventListener('keydown',(e)=>{
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){e.preventDefault();openOverlay();}
      if(e.key==='Escape'){closeOverlay();}
    });
  }

  function initTheme(){
    document.addEventListener('click',(e)=>{
      if(e.target.closest('.theme-toggle')){
        const isDark=document.documentElement.classList.toggle('cp-dark');
        try{localStorage.setItem('cp-theme',isDark?'dark':'light');}catch(err){}
      }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{injectHeaderTools();initSearch();initTheme();});
  } else {
    injectHeaderTools();initSearch();initTheme();
  }
})();

document.addEventListener('DOMContentLoaded',()=>{
  const toggle=document.querySelector('.nav-toggle');
  const links=document.querySelector('.nav-links');
  if(!toggle||!links)return;
  toggle.addEventListener('click',()=>{
    const isOpen=links.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded',isOpen?'true':'false');
    toggle.textContent=isOpen?'Close':'Menu';
  });
  links.addEventListener('click',(e)=>{
    if(e.target.tagName==='A'){
      links.classList.remove('nav-open');
      toggle.textContent='Menu';
      toggle.setAttribute('aria-expanded','false');
    }
  });
  document.addEventListener('click',(e)=>{
    if(!links.classList.contains('nav-open'))return;
    if(!links.contains(e.target)&&!toggle.contains(e.target)){
      links.classList.remove('nav-open');
      toggle.textContent='Menu';
      toggle.setAttribute('aria-expanded','false');
    }
  });
});
