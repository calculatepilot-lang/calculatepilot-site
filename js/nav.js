(function(){
  if(!document.getElementById('cp-brand-css')){
    const link=document.createElement('link');
    link.id='cp-brand-css';
    link.rel='stylesheet';
    link.href='/css/brand.css?v=20260909';
    document.head.appendChild(link);
  }
  if(!document.getElementById('cp-chip-contrast')){
    const link=document.createElement('link');
    link.id='cp-chip-contrast';
    link.rel='stylesheet';
    link.href='/css/chip-contrast.css?v=20260924c';
    document.head.appendChild(link);
  }
  if(!document.getElementById('cp-chip-contrast-inline')){
    const s=document.createElement('style');
    s.id='cp-chip-contrast-inline';
    s.textContent='button.preset-chip.active,button.term-btn.active,.preset-chip.active,.term-btn.active{color:#fff!important;-webkit-text-fill-color:#fff!important}';
    document.head.appendChild(s);
  }
  const logoHTML='<span class="logo-mark" aria-hidden="true"><span class="logo-mark-letters">C<span class="logo-p">P<span class="logo-p-dot"></span></span></span></span><span class="logo-word"><span class="logo-calculate">Calculate</span><span class="logo-pilot">Pilot</span></span>';
  const applyLogos=()=>{
    document.querySelectorAll('a.logo').forEach((el)=>{
      if(el.querySelector('.logo-mark')) return;
      el.innerHTML=logoHTML;
      el.setAttribute('aria-label','CalculatePilot home');
    });
  };
  window.__cpApplyLogos=applyLogos;
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',applyLogos);
  } else {
    applyLogos();
  }
})();

(function(){
  try{
    if(localStorage.getItem('cp-theme')==='dark'){document.documentElement.classList.add('cp-dark');}
  }catch(e){}
})();

(function(){
  const path=location.pathname||'/';
  const isHome=path==='/'||path==='/index.html';
  const isLocale=/^\/(fr|de|es)(\/|$)/.test(path);

  const HEADER_INNER='<a href="/" class="logo">calculatepilot<span class="dot">.</span></a><ul class="nav-links"><li><a href="/financial-calculators.html">Financial</a></li><li><a href="/health-calculators.html">Health & Fitness</a></li><li><a href="/math-calculators.html">Math</a></li><li><a href="/other-calculators.html">Everyday</a></li><li><a href="/guides/index.html">Guides</a></li></ul><button class="nav-toggle" aria-label="Open menu">Menu</button>';
  const TICKER='<div class="ticker-bar" role="note" aria-label="Announcement"><div class="ticker-content"><span class="ticker-icon">✨</span><span class="ticker-text">Embed any of our 170+ calculators on your website — remove branding from $7.99/month.</span><a href="/embed/" class="ticker-btn">See embed options →</a></div><button class="ticker-close" onclick="this.parentElement.style.display=\'none\'" aria-label="Dismiss announcement">✕</button></div>';

  function ensureHeader(){
    let header=document.querySelector('header.site-header');
    if(!header){header=document.createElement('header');header.className='site-header';document.body.insertBefore(header,document.body.firstChild);}
    let container=header.querySelector('.container');
    if(!container){container=document.createElement('div');container.className='container';header.appendChild(container);}
    container.innerHTML=HEADER_INNER;
  }
  function ensureTicker(){
    if(document.querySelector('.ticker-bar')) return;
    const header=document.querySelector('header.site-header');
    if(header) header.insertAdjacentHTML('afterend',TICKER);
  }
  function loadLanguageSelector(cb){
    if(typeof window.__cpMountLanguage==='function'){
      window.__cpMountLanguage();
      if(cb) cb();
      return;
    }
    if([...document.scripts].some((s)=>s.src&&s.src.indexOf('language-selector.js')!==-1)){
      const wait=()=>{
        if(typeof window.__cpMountLanguage==='function'){
          window.__cpMountLanguage();
          if(cb) cb();
        } else setTimeout(wait,40);
      };
      wait();
      return;
    }
    const s=document.createElement('script');
    s.src='/js/language-selector.js?v=20260916hf';
    s.onload=function(){
      if(typeof window.__cpMountLanguage==='function') window.__cpMountLanguage();
      if(cb) cb();
    };
    document.head.appendChild(s);
  }
  function pageEmbedHref(){
    const current=document.querySelector('footer.site-footer');
    if(!current) return null;
    const embedLink=current.querySelector('a[href*="/embed/"]');
    if(!embedLink) return null;
    const href=embedLink.getAttribute('href')||'';
    if(/\/embed\/?$/.test(href)) return null;
    return href;
  }
  function swapFooter(homeFooter,embedHref){
    if(!homeFooter) return;
    const current=document.querySelector('footer.site-footer');
    const next=homeFooter.cloneNode(true);
    next.querySelectorAll('.cp-language-selector, .cp-language-chips').forEach((n)=>n.remove());
    const bottom=next.querySelector('.footer-bottom');
    if(bottom&&embedHref){
      const extra=document.createElement('span');
      extra.innerHTML='<a href="'+embedHref+'" target="_blank" rel="noopener">Embed this calculator</a>';
      bottom.appendChild(extra);
    }
    if(current) current.replaceWith(next); else document.body.appendChild(next);
    if(typeof window.__cpApplyLogos==='function') window.__cpApplyLogos();
  }
  function finishChrome(){
    if(typeof window.__cpApplyLogos==='function') window.__cpApplyLogos();
    if(typeof window.__cpInjectHeaderTools==='function') window.__cpInjectHeaderTools();
    loadLanguageSelector();
  }
  function apply(){
    if(isLocale) return;
    if(!isHome){
      ensureHeader();
      ensureTicker();
    }
    const embedHref=pageEmbedHref();
    if(isHome){
      finishChrome();
      return;
    }
    fetch('/',{credentials:'omit'}).then((r)=>r.text()).then((html)=>{
      const doc=new DOMParser().parseFromString(html,'text/html');
      swapFooter(doc.querySelector('footer.site-footer'),embedHref);
      finishChrome();
    }).catch(function(){
      finishChrome();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply);
  else apply();
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
      wrap.innerHTML='<button type="button" class="quick-search-btn" aria-label="Quick search">'+searchIcon+'<span class="qs-label">Quick jump</span><span class="quick-search-kbd">Ctrl K</span></button><a href="/embed/" class="embed-pill" aria-label="Embed Tools">'+embedIcon+'<span>Embed Tools</span></a><button type="button" class="theme-toggle" aria-label="Toggle dark mode">'+sunIcon+moonIcon+'</button>';
      if(toggle){container.insertBefore(wrap,toggle);} else {container.appendChild(wrap);}
    });
  }
  window.__cpInjectHeaderTools=injectHeaderTools;
  function buildOverlay(){
    if(document.getElementById('cpQuickJump')) return document.getElementById('cpQuickJump');
    const overlay=document.createElement('div');
    overlay.id='cpQuickJump';
    overlay.className='quick-jump-overlay';
    overlay.innerHTML='<div class="quick-jump-panel"><div class="quick-jump-input-row">'+searchIcon+'<input type="text" id="cpQuickJumpInput" placeholder="Jump to a calculator..." autocomplete="off"><button type="button" class="quick-jump-close" aria-label="Close">Esc</button></div><div class="quick-jump-results" id="cpQuickJumpResults"></div></div>';
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
    loadIndex().then(()=>{const input=document.getElementById('cpQuickJumpInput');if(input){input.value='';input.focus();}renderResults('');});
  }
  function closeOverlay(){
    const overlay=document.getElementById('cpQuickJump');
    if(overlay) overlay.classList.remove('is-open');
    document.body.style.overflow='';
  }
  function initSearch(){
    document.addEventListener('click',(e)=>{
      if(e.target.closest('.quick-search-btn')) openOverlay();
      if(e.target.closest('.quick-jump-close')) closeOverlay();
      const overlay=document.getElementById('cpQuickJump');
      if(overlay && overlay.classList.contains('is-open') && e.target===overlay) closeOverlay();
      if(e.target.closest('.quick-jump-result')) closeOverlay();
    });
    document.addEventListener('input',(e)=>{if(e.target && e.target.id==='cpQuickJumpInput') renderResults(e.target.value);});
    document.addEventListener('keydown',(e)=>{
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){e.preventDefault();openOverlay();}
      if(e.key==='Escape') closeOverlay();
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
  const headerContainer=document.querySelector('.site-header .container');
  if(!toggle||!links||!headerContainer)return;
  const mobileUtility=document.createElement('div');
  mobileUtility.className='mobile-menu-utility';
  mobileUtility.setAttribute('role','listitem');
  links.appendChild(mobileUtility);
  function relocateForMobile(open){
    if(open){
      const headerTools=headerContainer.querySelector('.header-tools');
      const langSelector=headerContainer.querySelector('.cp-language-selector');
      if(headerTools) mobileUtility.appendChild(headerTools);
      if(langSelector) mobileUtility.appendChild(langSelector);
    } else {
      const headerTools=mobileUtility.querySelector('.header-tools');
      const langSelector=mobileUtility.querySelector('.cp-language-selector');
      if(headerTools) headerContainer.insertBefore(headerTools,toggle);
      if(langSelector) headerContainer.insertBefore(langSelector,headerTools||toggle);
    }
  }
  function openMenu(){
    links.classList.add('nav-open');
    toggle.setAttribute('aria-expanded','true');
    toggle.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    document.body.style.overflow='hidden';
    relocateForMobile(true);
  }
  function closeMenu(){
    links.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    document.body.style.overflow='';
    relocateForMobile(false);
  }
  toggle.setAttribute('aria-label','Open menu');
  toggle.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
  toggle.addEventListener('click',()=>{if(links.classList.contains('nav-open')) closeMenu(); else openMenu();});
  links.addEventListener('click',(e)=>{if(e.target.tagName==='A') closeMenu();});
  window.addEventListener('resize',()=>{if(window.innerWidth>720 && links.classList.contains('nav-open')) closeMenu();});
});
