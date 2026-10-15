export async function initHeroLogo(mount, { animate }) {
  if (!mount) return null;
  let markup;
  try {
    const res = await fetch('assets/logo/logo.svg');
    if (!res.ok) return null;
    markup = await res.text();
  } catch {
    return null;
  }
  const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').querySelector('svg');
  if (!svg) return null;
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  mount.replaceChildren(document.importNode(svg, true));
  if (!animate || !window.DrawSVGPlugin) return null;

  const paths = mount.querySelectorAll('path');
  return window.gsap.timeline({ delay: 0.2 })
    .set(paths, { fillOpacity: 0, stroke: '#fff', strokeWidth: 1.5 })
    .fromTo(paths, { drawSVG: '0%' }, { drawSVG: '100%', duration: 3.2, ease: 'power1.inOut' })
    .to(paths, { fillOpacity: 1, duration: 1.2, ease: 'power2.out' }, '-=0.8')
    .to(paths, { strokeWidth: 0, duration: 0.8 }, '<0.4');
}
