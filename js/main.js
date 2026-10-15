import { dataBase, loadJSON, visible } from './data.js';
import { initMotion, gsap, reduced } from './motion.js';
import { initNav, initCopy, initCounters, initReveal, initServices, hideSection, splitChars } from './ui.js';
import { initHeroLogo } from './logo.js';
import { createLightbox } from './lightbox.js';
import { initStrip, initArchive } from './gallery.js';
import { initVideos } from './videos.js';

async function initHero() {
  const animate = Boolean(gsap) && !reduced;
  const chars = splitChars(document.querySelector('[data-hero-word]'));
  const subChars = splitChars(document.querySelector('[data-hero-sub]'));
  const reveal = document.querySelectorAll('[data-hero-reveal]');
  if (animate) gsap.set(reveal, { autoAlpha: 0 });
  const logoTl = await initHeroLogo(document.querySelector('[data-logo]'), { animate });
  document.documentElement.classList.add('js-ready');
  if (!animate) return;
  const tl = gsap.timeline();
  if (logoTl) tl.add(logoTl);
  tl.set('.hero__title', { autoAlpha: 1 }, logoTl ? '-=1.4' : 0)
    .from(chars, { autoAlpha: 0, y: 30, duration: 0.9, ease: 'power3.out', stagger: 0.06 }, '<')
    .from(subChars, { autoAlpha: 0, duration: 0.6, stagger: 0.04 }, '-=0.5')
    .fromTo('.hero__rule', { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power3.inOut' }, '<')
    .fromTo('.hero__claim', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8 }, '-=0.4')
    .fromTo('.hero__scroll', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 });
}

function setHeroBackground(photo) {
  const bg = document.querySelector('[data-hero-bg]');
  if (!bg) return;
  bg.style.backgroundImage = `url("${photo.src}")`;
  if (gsap && !reduced) gsap.to(bg, { scale: 1, duration: 12, ease: 'none' });
}

async function main() {
  const lenis = initMotion();
  initNav(lenis);
  initCopy();
  const hero = initHero();
  const base = dataBase();
  const [photosRaw, videosRaw, hiddenRaw] = await Promise.all([
    loadJSON(`${base}photos.json`, []),
    loadJSON(`${base}videos.json`, []),
    loadJSON(`${base}hidden.json`, {}),
  ]);
  const photos = visible(photosRaw, hiddenRaw?.photos);
  const videos = visible(videosRaw, hiddenRaw?.videos);

  const lightbox = createLightbox(document.querySelector('[data-lightbox]'), {
    onOpen: () => lenis?.stop(),
    onClose: () => lenis?.start(),
  });
  if (photos.length) {
    setHeroBackground(photos[0]);
    initStrip(document.querySelector('#neueste'), photos, lightbox);
    initArchive(document.querySelector('#archiv'), photos, lightbox);
  } else {
    hideSection('neueste');
    hideSection('archiv');
  }
  if (videos.length) initVideos(document.querySelector('#videos'), videos);
  else hideSection('videos');
  const scrollCue = document.querySelector('.hero__scroll');
  if (scrollCue && !photos.length) scrollCue.href = videos.length ? '#videos' : '#leistungen';

  initServices(photos);
  initCounters({ photos: photos.length, videos: videos.length });
  initReveal();
  await hero;
  window.ScrollTrigger?.refresh();
}

main().catch((err) => {
  console.error(err);
  document.documentElement.classList.add('js-ready');
});
