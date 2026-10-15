import { gsap, reduced } from './motion.js';
import { altText, pad, firstPage } from './data.js';

export const STRIP_COUNT = 6;
const PAGE_SIZE = 24;

function photoButton(photo, index, onOpen, sizes, eager = false) {
  const btn = document.createElement('button');
  btn.type = 'button';
  // Kein aria-label: der Alt-Text des Bildes bleibt der zugängliche Name, haspopup kündigt die Großansicht an.
  btn.setAttribute('aria-haspopup', 'dialog');
  const img = document.createElement('img');
  img.src = photo.thumb;
  img.srcset = `${photo.thumb} 800w, ${photo.src} 1600w`;
  img.sizes = sizes;
  img.width = photo.w || 1080;
  img.height = photo.h || 1350;
  img.loading = eager ? 'eager' : 'lazy';
  img.decoding = 'async';
  img.alt = altText(photo.caption);
  btn.append(img);
  btn.addEventListener('click', () => onOpen(index));
  return btn;
}

export function initStrip(section, photos, lightbox) {
  const items = photos;
  const track = section.querySelector('[data-strip-track]');
  const viewport = section.querySelector('.strip__viewport');
  const pin = section.querySelector('.strip__pin');
  const bar = section.querySelector('[data-strip-progress]');
  const current = section.querySelector('[data-strip-current]');
  section.querySelector('[data-strip-total]').textContent = pad(items.length);

  items.forEach((photo, i) => {
    const li = document.createElement('li');
    li.className = 'strip__item';
    li.append(photoButton(photo, i, (idx) => lightbox.open(items, idx), '(max-width: 700px) 80vw, 40vw', i < 4));
    track.append(li);
  });

  const update = (progress) => {
    bar.style.transform = `scaleX(${progress})`;
    current.textContent = pad(Math.min(items.length, Math.round(progress * (items.length - 1)) + 1));
  };
  const onNativeScroll = () => {
    const max = viewport.scrollWidth - viewport.clientWidth;
    update(max > 0 ? viewport.scrollLeft / max : 0);
  };
  update(0);

  if (!gsap || !window.ScrollTrigger || reduced) {
    viewport.addEventListener('scroll', onNativeScroll, { passive: true });
    return;
  }
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    section.classList.add('strip--pinned');
    const padding = () => parseFloat(getComputedStyle(viewport).paddingLeft) * 2;
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + padding());
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section, pin, start: 'top top', end: () => `+=${distance()}`,
        scrub: 0.6, invalidateOnRefresh: true, onUpdate: (self) => update(self.progress),
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(track, { x: 0 });
      section.classList.remove('strip--pinned');
    };
  });
  mm.add('(max-width: 767px)', () => {
    viewport.addEventListener('scroll', onNativeScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onNativeScroll);
  });
}

function reveal(items) {
  if (!gsap || !window.ScrollTrigger || reduced || !items.length) return;
  gsap.set(items, { clipPath: 'inset(100% 0% 0% 0%)' });
  window.ScrollTrigger.batch(items, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut', stagger: 0.12 }),
  });
}

export function initArchive(section, photos, lightbox) {
  const grid = section.querySelector('[data-archive-grid]');
  const more = section.querySelector('[data-archive-more]');
  let pages = 1;
  let rendered = 0;

  const render = () => {
    const list = firstPage(photos, pages, PAGE_SIZE);
    const fresh = [];
    for (let i = rendered; i < list.length; i++) {
      const photo = list[i];
      const li = document.createElement('li');
      li.className = 'archive__item';
      li.append(photoButton(photo, i, (idx) => lightbox.open(photos, idx), '(max-width: 700px) 50vw, 33vw'));
      grid.append(li);
      fresh.push(li);
    }
    rendered = list.length;
    more.hidden = rendered >= photos.length;
    reveal(fresh);
    return fresh;
  };

  more.addEventListener('click', () => {
    pages += 1;
    const fresh = render();
    window.ScrollTrigger?.refresh();
    fresh[0]?.querySelector('button')?.focus({ preventScroll: true });
  });
  render();
}
