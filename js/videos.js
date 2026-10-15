import { gsap, reduced } from './motion.js';
import { pad } from './data.js';

const MAX_VIDEOS = 6;

function videoCard(video, index, total) {
  const card = document.createElement('article');
  card.className = 'vcard';

  const media = document.createElement('div');
  media.className = 'vcard__media';
  const img = document.createElement('img');
  img.src = video.thumbSmall;
  img.srcset = `${video.thumbSmall} 800w, ${video.thumb} 1600w`;
  img.sizes = '100vw';
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  media.append(img);

  const body = document.createElement('div');
  body.className = 'vcard__body';
  const label = document.createElement('span');
  label.className = 'vcard__index';
  label.textContent = `VIDEO · ${pad(index + 1)} / ${pad(total)}`;
  const title = document.createElement('h3');
  title.className = 'vcard__title';
  title.textContent = video.title;
  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'vcard__play';
  play.setAttribute('aria-label', `Video abspielen: ${video.title}`);
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '▶';
  play.append(icon, 'Abspielen');
  play.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.className = 'vcard__frame';
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=1&rel=0`;
    frame.title = video.title;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    card.append(frame);
    frame.focus();
  }, { once: true });

  body.append(label, title, play);
  card.append(media, body);
  return card;
}

export function initVideos(section, videos) {
  const stack = section.querySelector('[data-video-stack]');
  const items = videos.slice(0, MAX_VIDEOS);
  const cards = items.map((video, i) => {
    const card = videoCard(video, i, items.length);
    stack.append(card);
    return card;
  });
  if (!gsap || !window.ScrollTrigger || reduced) return;
  cards.slice(0, -1).forEach((card, i) => {
    gsap.to(card.querySelector('.vcard__media'), {
      scale: 0.9, opacity: 0.35, ease: 'none',
      scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top top', scrub: true },
    });
  });
}
