import { gsap, reduced } from './motion.js';

export function hideSection(id) {
  document.querySelectorAll(`[data-section="${id}"], [data-section-link="${id}"]`).forEach((el) => {
    el.hidden = true;
  });
}

const samePage = (url) => url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');

export function initNav(lenis) {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  const toggle = nav.querySelector('[data-nav-toggle]');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('nav--hidden', y > lastY && y > 200 && !nav.classList.contains('nav--open'));
    lastY = y;
  }, { passive: true });

  const setOpen = (open) => {
    nav.classList.toggle('nav--open', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Schließen' : 'Menü';
    }
    if (open) lenis?.stop(); else lenis?.start();
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle?.addEventListener('click', () => setOpen(!nav.classList.contains('nav--open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', (e) => {
    setOpen(false);
    const url = new URL(link.href);
    if (!url.hash || !samePage(url)) return;
    const target = document.querySelector(url.hash);
    if (!target || !lenis) return;
    e.preventDefault();
    lenis.scrollTo(target);
    history.replaceState(null, '', url.hash);
  }));
}

export function initCopy() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const status = btn.querySelector('[data-copy-status]');
    let timer;
    btn.addEventListener('click', async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        ok = true;
      } catch {
        ok = false;
      }
      if (status) status.textContent = ok ? 'Kopiert ✓' : `Discord-Name: ${btn.dataset.copy}`;
      clearTimeout(timer);
      timer = setTimeout(() => { if (status) status.textContent = 'Klicken zum Kopieren'; }, 2500);
    });
  });
}

export function initCounters(sources) {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const key = el.dataset.count;
    const fixed = /^\d+$/.test(key);
    const target = fixed ? Number(key) : sources[key] ?? 0;
    if (!fixed && target === 0) {
      el.closest('div').hidden = true;
      return;
    }
    const suffix = el.dataset.suffix ?? '';
    const set = (v) => { el.textContent = `${Math.round(v)}${suffix}`; };
    if (reduced || !gsap || !window.ScrollTrigger) {
      set(target);
      return;
    }
    const counter = { v: 0 };
    set(0);
    gsap.to(counter, {
      v: target, duration: 1.8, ease: 'power2.out', onUpdate: () => set(counter.v),
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

export function initReveal(root = document) {
  if (reduced || !gsap || !window.ScrollTrigger) return;
  root.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.from(el, { autoAlpha: 0, y: 40, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
}


export function splitChars(el) {
  if (!el) return [];
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  return [...text].map((ch) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = ch === ' ' ? ' ' : ch;
    el.append(span);
    return span;
  });
}
