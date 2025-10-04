/**
 * Hyphal Health Co. — Main JS (2025-10-04)
 * Fixes: countdown parsing, header invert on scroll, mobile nav, preloader fallback,
 *        scroll-top, AOS safe init, hero social links horizontal.
 */

(() => {
  'use strict';

  // -------- Elements
  const body = document.body;
  const header = document.querySelector('#header');
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const scrollTopBtn = document.querySelector('.scroll-top');
  const preloader = document.querySelector('#preloader');

  // -------- Helpers
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts || false);

    // If we resize to desktop, ensure mobile overlay is cleared
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1200 && document.body.classList.contains('mobile-nav-active')) {
      document.body.classList.remove('mobile-nav-active');
      const t = document.querySelector('.mobile-nav-toggle');
      if (t) { t.classList.remove('bi-x'); t.classList.add('bi-list'); t.setAttribute('aria-expanded','false'); }
    }
  });


  // Robust local-time parser: supports "YYYY/MM/DD HH:mm[:ss]" or "YYYY-MM-DD HH:mm[:ss]" or ISO
  const parseLocalDate = (raw) => {
    if (!raw) return NaN;
    const s = String(raw).trim();
    // Try native first (handles ISO like 2025-11-01T12:00:00)
    const t1 = Date.parse(s);
    if (!Number.isNaN(t1)) return t1;

    // Normalize separators and extract parts
    const m = s
      .replace(/[\/]/g, '-')                          // unify separators
      .match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);

    if (m) {
      const [, y, mo, d, hh = '0', mm = '0', ss = '0'] = m;
      const dt = new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(hh),
        Number(mm),
        Number(ss)
      );
      return dt.getTime();
    }

    return NaN;
  };

  // -------- Header + scroll-top state
  const setScrollState = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    if (header) header.classList.toggle('header-scrolled', y > 10);
    body.classList.toggle('scrolled', y > 100); // compat if CSS ever uses it
    if (scrollTopBtn) scrollTopBtn.classList.toggle('active', y > 100);
  };
  on(window, 'scroll', setScrollState, { passive: true });
  on(window, 'load', setScrollState);
  on(document, 'DOMContentLoaded', setScrollState);

  // -------- Mobile nav toggle
  if (mobileToggle) {
    on(mobileToggle, 'click', () => {
      const isActive = body.classList.toggle('mobile-nav-active');
      mobileToggle.classList.toggle('bi-x', isActive);
      mobileToggle.classList.toggle('bi-list', !isActive);
      mobileToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
  }

  // Close mobile nav on any nav link click
  document.querySelectorAll('#navmenu a').forEach((link) => {
    on(link, 'click', () => {
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

  // -------- Preloader remove (robust)
  const killPreloader = () => {
    const p = document.getElementById('preloader');
    if (p && p.parentNode) p.parentNode.removeChild(p);
  };
  on(window, 'load', killPreloader);
  on(document, 'DOMContentLoaded', () => setTimeout(killPreloader, 1500)); // safety

  // -------- Scroll-top behavior
  if (scrollTopBtn) {
    on(scrollTopBtn, 'click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // -------- AOS init (safe)
  on(window, 'load', () => {
    if (window.AOS && typeof window.AOS.init === 'function') {
      window.AOS.init({ duration: 600, easing: 'ease-in-out', once: true, mirror: false });
    }
  });

  // -------- Hero social links: ensure horizontal layout (Bootstrap utility)
  const heroSocial = document.querySelector('#hero .social-links');
  if (heroSocial) {
    heroSocial.classList.add('d-flex', 'justify-content-center', 'gap-2');
  }

  // -------- Countdown (single implementation)
  const timers = [];
  const initCountdown = (root) => {
    const targetMs = parseLocalDate(root.getAttribute('data-count') || '');
    if (Number.isNaN(targetMs)) {
      // Hide the widget if date is bad, so it doesn't look broken
      root.style.display = 'none';
      return null;
    }

    const els = {
      days: root.querySelector('.count-days'),
      hours: root.querySelector('.count-hours'),
      minutes: root.querySelector('.count-minutes'),
      seconds: root.querySelector('.count-seconds')
    };

    const pad = (n) => String(n).padStart(2, '0');

    const tick = () => {
      const now = Date.now();
      let diff = Math.max(0, targetMs - now);

      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
      const m = Math.floor(diff / 60000);    diff -= m * 60000;
      const s = Math.floor(diff / 1000);

      if (els.days) els.days.textContent = String(d);
      if (els.hours) els.hours.textContent = pad(h);
      if (els.minutes) els.minutes.textContent = pad(m);
      if (els.seconds) els.seconds.textContent = pad(s);
    };

    tick();
    return window.setInterval(tick, 1000);
  };

  document.querySelectorAll('.countdown').forEach((node) => {
    const id = initCountdown(node);
    if (id) timers.push(id);
  });

})();
