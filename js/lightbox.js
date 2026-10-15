import { altText, pad } from './data.js';

export function createLightbox(dialog, { onOpen, onClose } = {}) {
  const img = dialog.querySelector('[data-lb-img]');
  const caption = dialog.querySelector('[data-lb-caption]');
  const link = dialog.querySelector('[data-lb-link]');
  const counter = dialog.querySelector('[data-lb-counter]');
  const flash = dialog.querySelector('[data-lb-flash]');
  let list = [];
  let index = 0;
  let lastFocus = null;

  const show = () => {
    const photo = list[index];
    img.src = photo.src;
    img.alt = altText(photo.caption);
    img.width = photo.w || 1080;
    img.height = photo.h || 1350;
    caption.textContent = altText(photo.caption, '');
    link.hidden = !photo.permalink;
    if (photo.permalink) link.href = photo.permalink;
    counter.textContent = `${pad(index + 1)} / ${pad(list.length)}`;
  };
  const step = (delta) => {
    index = (index + delta + list.length) % list.length;
    show();
  };

  dialog.querySelector('[data-lb-prev]').addEventListener('click', () => step(-1));
  dialog.querySelector('[data-lb-next]').addEventListener('click', () => step(1));
  dialog.querySelector('[data-lb-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  let startX = null;
  let swiped = false;
  dialog.addEventListener('pointerdown', (e) => { startX = e.clientX; swiped = false; });
  dialog.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    swiped = Math.abs(dx) > 50;
    if (swiped) step(dx < 0 ? 1 : -1);
  });
  // Klick auf den Hintergrund (nicht Bild, Text oder Buttons) schließt – außer nach einem Wisch.
  const figure = dialog.querySelector('.lightbox__figure');
  dialog.addEventListener('click', (e) => {
    if (!swiped && (e.target === dialog || e.target === figure)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    onClose?.();
    lastFocus?.focus({ preventScroll: true });
  });

  return {
    open(items, i) {
      if (!items.length) return;
      list = items;
      index = Math.min(Math.max(i, 0), items.length - 1);
      lastFocus = document.activeElement;
      show();
      dialog.showModal();
      onOpen?.();
      flash.classList.remove('flash--fire');
      void flash.offsetWidth;
      flash.classList.add('flash--fire');
    },
  };
}
