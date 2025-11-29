(function(){
  const LANG_KEY = 'fitouthub_lang';
  const DEFAULT_LANG = 'en';

  function isSubfolder(){
    try { return window.location.pathname.includes('/buildingrennovations/'); } catch(e){ return false; }
  }

  function getI18nPath(lang){
    const base = isSubfolder() ? '../i18n/' : 'i18n/';
    return base + lang + '.json';
  }

  function setHtmlLang(lang){
    try { document.documentElement.setAttribute('lang', lang === 'zh-HK' ? 'zh-HK' : 'en'); } catch(e){}
  }

  async function loadDict(lang){
    const path = getI18nPath(lang);
    const resp = await fetch(path);
    if(!resp.ok) throw new Error('i18n load failed: ' + path);
    return await resp.json();
  }

  function applyI18n(dict){
    // Elements with textual content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && dict[key]) el.textContent = dict[key];
    });
    // Attributes like placeholder, aria-label
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const attr = el.getAttribute('data-i18n-attr');
      const key = el.getAttribute('data-i18n');
      if (attr && key && dict[key]) el.setAttribute(attr, dict[key]);
    });
  }

  function bindToggle(lang){
    const toggle = document.getElementById('langToggle');
    if (!toggle) return false;
    
    // Set current language in dropdown
    toggle.value = lang;
    
    // Avoid binding multiple times
    if (toggle.dataset.i18nBound) return true;
    toggle.dataset.i18nBound = 'true';
    
    toggle.addEventListener('change', async (e)=>{
      const newLang = e.target.value;
      localStorage.setItem(LANG_KEY, newLang);
      setHtmlLang(newLang);
      try {
        const dict2 = await loadDict(newLang);
        window.i18nDict = dict2;
        // Ensure t() reflects new dictionary immediately
        window.t = function(key, fallback){
          try { return (window.i18nDict && window.i18nDict[key]) || (fallback ?? key); } catch(e){ return fallback ?? key; }
        };
        applyI18n(dict2);
        // Notify listeners that language changed
        document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: newLang, dict: dict2 } }));
      } catch(err){ console.warn(err); }
    });
    return true;
  }

  async function initI18n(){
    const lang = localStorage.getItem(LANG_KEY) || DEFAULT_LANG;
    setHtmlLang(lang);
    try {
      const dict = await loadDict(lang);
      // expose globally for JS-rendered content
      window.i18nDict = dict;
      window.t = function(key, fallback){
        try { return (window.i18nDict && window.i18nDict[key]) || (fallback ?? key); } catch(e){ return fallback ?? key; }
      };
      applyI18n(dict);
      // Notify listeners that i18n is ready
      document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang, dict } }));
    } catch(e){ console.warn(e); }

    // Try to bind toggle immediately
    if (!bindToggle(lang)) {
      // If toggle not found, wait a bit and retry (may be injected by main.js)
      setTimeout(() => bindToggle(lang), 50);
      setTimeout(() => bindToggle(lang), 200);
    }
  }

  document.addEventListener('DOMContentLoaded', initI18n);
})();
