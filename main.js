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

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

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
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });
});

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Page transition handling: fade in on load, fade out on internal navigation
document.addEventListener('DOMContentLoaded', () => {
  // small delay so transitions apply
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-loaded')));

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
