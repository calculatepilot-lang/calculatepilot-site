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
  const TICKER='<div class="ticker-bar" role="note" aria-label="Announcement"><div class="ticker-content"><span class="ticker-icon">✨</span><span class="ticker-text">Embed any of our 158+ calculators on your website — remove branding from $7.99/month.</span><a href="/embed/" class="ticker-btn">See embed options →</a></div><button class="ticker-close" onclick="this.parentElement.style.display=\'none\'" aria-label="Dismiss announcement">✕</button></div>';

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
