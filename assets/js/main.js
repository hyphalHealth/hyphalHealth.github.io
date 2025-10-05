/**
 * Hyphal Health Co. | Main JS
 * - Header invert on scroll (.header-scrolled)
 * - Mobile nav toggle + close on link click
 * - Scroll-top button
 * - Preloader removal with hard failsafe
 * - AOS safe init (if present)
 * - Countdown (local-time parser; supports slash or dash dates)
 * - Defensive click-through fixes for overlays
 */

(() => {
  'use strict';

  // ------- Shortcuts
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts || false);

  // ------- Elements
  const body = document.body;
  const header = $('#header');
  const preloader = $('#preloader');
  const scrollTopBtn = $('.scroll-top');
  const mobileToggle = $('.mobile-nav-toggle');

  // ------- Header invert + scroll-top visibility
  const setScrollState = () => {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle('header-scrolled', y > 10);
    body.classList.toggle('scrolled', y > 100);
    if (scrollTopBtn) scrollTopBtn.classList.toggle('active', y > 100);
  };
  on(window, 'scroll', setScrollState, { passive: true });
  on(window, 'load', setScrollState);
  on(document, 'DOMContentLoaded', setScrollState);

  // ------- Mobile nav toggle
  if (mobileToggle) {
    on(mobileToggle, 'click', () => {
      const active = body.classList.toggle('mobile-nav-active');
      mobileToggle.classList.toggle('bi-x', active);
      mobileToggle.classList.toggle('bi-list', !active);
      mobileToggle.setAttribute('aria-expanded', String(active));
    });
  }
  // Close mobile nav on in-page link click
  $$('#navmenu a').forEach(a => {
    on(a, 'click', () => {
      if (body.classList.contains('mobile-nav-active')) {
        body.classList.remove('mobile-nav-active');
        if (mobileToggle) {
          mobileToggle.classList.remove('bi-x');
          mobileToggle.classList.add('bi-list');
          mobileToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // ------- Scroll-top
  if (scrollTopBtn) {
    on(scrollTopBtn, 'click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ------- Preloader remove + failsafe
  const killPreloader = () => {
    const p = $('#preloader');
    if (p && p.parentNode) p.parentNode.removeChild(p);
  };
  on(window, 'load', killPreloader);
  on(document, 'DOMContentLoaded', () => setTimeout(killPreloader, 1500)); // safety

  // ------- AOS (if loaded)
  on(window, 'load', () => {
    if (window.AOS && typeof window.AOS.init === 'function') {
      window.AOS.init({ duration: 600, easing: 'ease-in-out', once: true, mirror: false });
    }
  });

  // ------- Defensive: never let overlays block clicks
  // Ensures hero/content sits above any pseudo/overlay and is clickable.
  const hero = $('#hero');
  if (hero) {
    hero.style.position = hero.style.position || 'relative';
    hero.style.zIndex = hero.style.zIndex || '1';
    // Ensure anchors in hero accept pointer events
    $$('#hero a').forEach(a => (a.style.pointerEvents = 'auto'));
  }
  // In case legacy CSS is cached, force overlays to ignore pointer events.
  const style = document.createElement('style');
  style.textContent = `
    #preloader, body::before { pointer-events: none !important; }
  `;
  document.head.appendChild(style);

  // ------- Countdown
  // Accepts "YYYY/MM/DD HH:mm[:ss]" or "YYYY-MM-DD HH:mm[:ss]" or ISO.
  const parseLocalDate = (raw) => {
    if (!raw) return NaN;
    const s = String(raw).trim();

    // ISO or native-friendly
    const n = Date.parse(s);
    if (!Number.isNaN(n)) return n;

    // Normalize slashes -> dashes and parse as local components
    const m = s.replace(/\//g, '-')
      .match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (!m) return NaN;

    const [, yy, mo, dd, hh = '0', mm = '0', ss = '0'] = m;
    const dt = new Date(Number(yy), Number(mo) - 1, Number(dd), Number(hh), Number(mm), Number(ss));
    return dt.getTime();
  };

  const initCountdown = (root) => {
    const targetMs = parseLocalDate(root.getAttribute('data-count') || '');
    if (Number.isNaN(targetMs)) {
      root.style.display = 'none';
      return null;
    }

    const els = {
      d: root.querySelector('.count-days'),
      h: root.querySelector('.count-hours'),
      m: root.querySelector('.count-minutes'),
      s: root.querySelector('.count-seconds')
    };
    const pad = (n) => String(n).padStart(2, '0');

    const tick = () => {
      const now = Date.now();
      let diff = Math.max(0, targetMs - now);

      const days = Math.floor(diff / 86400000); diff -= days * 86400000;
      const hrs  = Math.floor(diff / 3600000);  diff -= hrs  * 3600000;
      const min  = Math.floor(diff / 60000);    diff -= min  * 60000;
      const sec  = Math.floor(diff / 1000);

      if (els.d) els.d.textContent = String(days);
      if (els.h) els.h.textContent = pad(hrs);
      if (els.m) els.m.textContent = pad(min);
      if (els.s) els.s.textContent = pad(sec);
    };

    tick();
    return window.setInterval(tick, 1000);
  };

  const timers = [];
  $$('.countdown').forEach(node => {
    const id = initCountdown(node);
    if (id) timers.push(id);
  });
})();
