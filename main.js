/*
  main.js — canonical UI behaviors

  Responsibilities:
  - Global navigation drawer (hamburger) toggle for the site.
  - Smooth-scrolling for intra-page anchors.
  - Footer year insertion.
  - Page transition handling (fade in/out on navigation).

  Notes for contributors:
  - This file is the single source of truth for the site-level nav drawer. Do not add another
    listener that toggles the same `.nav-links`/`#drawer` element from page-specific scripts —
    that will cause double-toggle races. If you need page-specific nav behavior, decorate the
    toggle with a data attribute (for example `data-page-nav="true"`) and check for it here.
  - To opt out of page transition interception on a particular link, add `data-no-transition` to
    the anchor or use `target="_blank"` for external/open-in-new-tab behavior.
*/

// Mobile nav toggle (use var to avoid const redeclare errors if script is included twice)
var navToggle = document.querySelector('.nav-toggle');
var navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    // Keep aria-hidden in-sync for accessibility
    navLinks.setAttribute('aria-hidden', String(!isOpen));
  });
}

// Smooth scroll for internal anchors
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const toggle = document.querySelector('.nav-toggle');
      const links = document.querySelector('.nav-links');
      if (links && links.classList.contains('open') && toggle) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }
  });
});

// Footer year
var yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Page transition handling: fade in on load, fade out on internal navigation
document.addEventListener('DOMContentLoaded', () => {
  // small delay so transitions apply
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-loaded')));

  // Inject language switcher into header
  function injectLangToggle(){
    // Check if already exists (avoid duplicates)
    if (document.getElementById('langToggle')) return;
    
    const nav = document.querySelector('nav.nav') || document.querySelector('header, .header-row');
    if (!nav) return;
    
    // Prefer placing inside unified header row if present
    const headerRow = nav.querySelector('.header-row') || nav;
    
    const sel = document.createElement('select');
    sel.id = 'langToggle';
    sel.className = 'btn';
    sel.style.marginLeft = '8px';
    sel.style.fontSize = '0.9rem';
    sel.style.padding = '6px 8px';
    sel.setAttribute('aria-label', 'Language');
    
    const optEn = document.createElement('option'); 
    optEn.value = 'en'; 
    optEn.textContent = 'EN';
    const optZh = document.createElement('option'); 
    optZh.value = 'zh-HK'; 
    optZh.textContent = '中文';
    
    sel.appendChild(optEn); 
    sel.appendChild(optZh);
    
    try {
      const current = localStorage.getItem('fitouthub_lang') || 'en';
      sel.value = current;
    } catch(e) {}
    
    headerRow.appendChild(sel);
  }

  // Centralized navigation menu for FitOut Hub (root pages only)
  function injectFitOutMenu() {
    const inSubfolder = window.location.pathname.includes('/buildingrennovations/');
    const isAdminPage = window.location.pathname.includes('-admin.html');
    if (inSubfolder || isAdminPage) return; // skip subfolder and admin pages
    const drawer = document.getElementById('drawer') || document.querySelector('.nav-links');
    if (!drawer) return;
    const t = (k, f) => (window.t ? window.t(k, f) : f);
    const items = [
      { href: 'index.html', text: t('nav.home','Home') },
      { href: 'forclients.html', text: t('forclients.nav','For Clients') },
      { href: 'forcontractors.html', text: t('forcontractors.nav','For Contractors') },
      { href: 'forsuppliers.html', text: t('forsuppliers.nav','For Suppliers') },
      { href: 'ourservices.html', text: t('services.nav','Our Services') },
      { href: 'projectmanagement.html', text: t('nav.projectManagement','Project Management') },
      { href: 'reviews.html', text: t('reviews.nav','Client Reviews') },
      { href: 'contactus.html', text: t('contact.nav','Contact Us') },
      { divider: true },
      { href: 'buildingrennovations/index.html', text: t('renovations.nav','Renovations Hub') }
    ];
    drawer.innerHTML = items.map(item => item.divider ? '<li class="divider"></li>' : `<li><a href="${item.href}">${item.text}</a></li>`).join('');
  }

  // Ensure Renovations Hub link exists in FitOut Hub hamburger (drawer)
  try {
    const inSubfolder = window.location.pathname.includes('/buildingrennovations/');
    const isAdminPage = window.location.pathname.includes('-admin.html');
    if (!inSubfolder && !isAdminPage) {
      // Replace entire drawer with centralized FitOut Hub menu
      injectFitOutMenu();
      injectLangToggle();
      const drawer = document.getElementById('drawer') || document.querySelector('.nav-links');
      if (drawer) {
        const existing = drawer.querySelector('a[href$="buildingrennovations/index.html"]');
        if (!existing) {
          const divider = document.createElement('li');
          divider.className = 'divider';
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = 'buildingrennovations/index.html';
          a.textContent = (window.t ? window.t('renovations.nav','Renovations Hub') : 'Renovations Hub');
          li.appendChild(a);
          drawer.appendChild(divider);
          drawer.appendChild(li);
        }
      }
    }
  } catch (e) {
    // no-op if nav not present
  }

  // Also inject language toggle for Renovations pages
  try { const inSubfolder = window.location.pathname.includes('/buildingrennovations/'); if (inSubfolder) injectLangToggle(); } catch(e) {}

  // Re-inject FitOut menu when language initializes or changes
  document.addEventListener('i18n:ready', injectFitOutMenu);
  document.addEventListener('i18n:changed', injectFitOutMenu);

  // Intercept link clicks for same-origin navigations (soft transitions)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    // ignore if the link has target=_blank, download, or a data-no-transition attribute
    if (a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    // Only handle same-origin navigations
    try {
      const url = new URL(href, location.href);
      // Gate expert page behind login
      const isExpert = /expert3\.html$/i.test(url.pathname);
      if (isExpert && typeof window.requireLoginForExpert === 'function') {
        const ok = window.requireLoginForExpert(url.href);
        if (!ok) { e.preventDefault(); return; }
      }
      if (url.origin !== location.origin) return;
      // Allow normal behavior for fragments on same page
      if (url.pathname === location.pathname && url.hash) return;
      // Prevent default and animate
      e.preventDefault();
      document.body.classList.remove('is-loaded');
      document.body.classList.add('is-exiting');
      // Delay navigation to allow the exit animation to play
      setTimeout(() => {
        window.location.href = url.href;
      }, 300);
    } catch (err) {
      // If URL parsing fails, do nothing (let browser handle it)
    }
  }, { passive: false });
});
