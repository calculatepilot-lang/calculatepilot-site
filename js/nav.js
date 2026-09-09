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
