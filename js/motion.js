export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  || new URLSearchParams(location.search).has('reduced');
export const gsap = window.gsap ?? null;

export function initMotion() {
  if (!gsap) return null;
  gsap.registerPlugin(...[window.ScrollTrigger, window.DrawSVGPlugin].filter(Boolean));
  if (reduced || !window.Lenis || !window.ScrollTrigger) return null;
  const lenis = new window.Lenis({ lerp: 0.1 });
  lenis.on('scroll', window.ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
