import { dataBase, loadJSON } from './data.js';
import { initMotion } from './motion.js';
import { initNav, initReveal } from './ui.js';

function scriptCard(script) {
  const card = document.createElement('article');
  card.className = 'script-card';
  card.dataset.reveal = '';
  if (script.image) {
    const img = document.createElement('img');
    img.src = script.image;
    img.alt = `Vorschau: ${script.name}`;
    img.loading = 'lazy';
    card.append(img);
  }
  const body = document.createElement('div');
  body.className = 'script-card__body';
  const title = document.createElement('h2');
  title.textContent = script.name;
  body.append(title);
  if (script.description) {
    const p = document.createElement('p');
    p.textContent = script.description;
    body.append(p);
  }
  if (Array.isArray(script.features) && script.features.length) {
    const ul = document.createElement('ul');
    for (const feature of script.features) {
      const li = document.createElement('li');
      li.textContent = feature;
      ul.append(li);
    }
    body.append(ul);
  }
  if (typeof script.link === 'string' && script.link.startsWith('https://')) {
    const a = document.createElement('a');
    a.className = 'btn';
    a.href = script.link;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = script.linkLabel || 'Ansehen';
    body.append(a);
  }
  card.append(body);
  return card;
}

const lenis = initMotion();
initNav(lenis);
const scripts = await loadJSON(`${dataBase()}scripts.json`, []);
const list = Array.isArray(scripts) ? scripts.filter((s) => s && typeof s.name === 'string' && s.name) : [];
const grid = document.querySelector('[data-scripts-grid]');
if (list.length) list.forEach((s) => grid.append(scriptCard(s)));
else document.querySelector('[data-scripts-empty]').hidden = false;
initReveal();
