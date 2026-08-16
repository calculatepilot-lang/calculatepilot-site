document.addEventListener('DOMContentLoaded',()=>{
  const toggle=document.querySelector('.nav-toggle');
  const links=document.querySelector('.nav-links');

  // Site-wide Guides navigation link. Add it only when the page does not
  // already contain a Guides link, regardless of whether it uses /guides/
  // or /guides/index.html as the href.
  if(links && !links.querySelector('a[href="/guides/"], a[href="/guides/index.html"]')){
    const li=document.createElement('li');
    li.innerHTML='<a href="/guides/">Guides</a>';
    links.appendChild(li);
  }

  // Site-wide Guides footer link. Add it once to the existing footer-bottom row.
  const footerBottom=document.querySelector('.site-footer .footer-bottom');
  if(footerBottom && !footerBottom.querySelector('a[href="/guides/"], a[href="/guides/index.html"]')){
    const guideLink=document.createElement('a');
    guideLink.href='/guides/';
    guideLink.textContent='Guides →';
    footerBottom.appendChild(guideLink);
  }

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


/* ---- Save & restore last inputs (per calculator, per browser) ---- */
(function(){
try{
  var form=document.getElementById('calcForm');
  if(!form)return;

  var STORAGE_PREFIX='cp_saved::';
  var MAX_AGE_DAYS=180;
  var key=STORAGE_PREFIX+location.pathname;

  function getFields(){
    return form.querySelectorAll('input[id], select[id]');
  }

  function loadSaved(){
    var raw=localStorage.getItem(key);
    if(!raw)return null;
    var data;
    try{data=JSON.parse(raw);}catch(e){return null;}
    if(!data||!data.savedAt)return null;
    var ageDays=(Date.now()-data.savedAt)/(1000*60*60*24);
    if(ageDays>MAX_AGE_DAYS){localStorage.removeItem(key);return null;}
    return data.values||null;
  }

  function restoreValues(){
    var values=loadSaved();
    if(!values)return false;
    var restoredAny=false;
    getFields().forEach(function(field){
      if(!(field.id in values))return;
      var val=values[field.id];
      if(field.type==='checkbox'||field.type==='radio'){
        field.checked=!!val;
      }else{
        field.value=val;
      }
      restoredAny=true;
    });
    return restoredAny;
  }

  function saveValues(){
    var values={};
    getFields().forEach(function(field){
      if(field.type==='checkbox'||field.type==='radio'){
        values[field.id]=field.checked;
      }else{
        values[field.id]=field.value;
      }
    });
    try{
      localStorage.setItem(key,JSON.stringify({values:values,savedAt:Date.now()}));
    }catch(e){/* storage full or blocked - fail silently */}
  }

  function clearSaved(){
    localStorage.removeItem(key);
    location.reload();
  }

  function addResetLink(){
    if(document.getElementById('cpResetSavedLink'))return;
    var link=document.createElement('button');
    link.id='cpResetSavedLink';
    link.type='button';
    link.textContent='Reset to defaults & clear saved values';
    link.style.cssText='margin-top:10px;font-size:12px;color:#6b7280;background:none;border:none;text-decoration:underline;cursor:pointer;padding:4px 0;';
    link.addEventListener('click',clearSaved);
    form.parentNode.insertBefore(link,form.nextSibling);
  }

  var wasRestored=restoreValues();
  if(wasRestored){
    form.dispatchEvent(new Event('input',{bubbles:true}));
    addResetLink();
  }

  var saveTimer=null;
  form.addEventListener('input',function(){
    clearTimeout(saveTimer);
    saveTimer=setTimeout(function(){
      saveValues();
      addResetLink();
    },400);
  });
  form.addEventListener('change',function(){
    saveValues();
    addResetLink();
  });

}catch(e){/* localStorage unavailable (private mode etc) - silently do nothing */}
})();
