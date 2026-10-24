(() => {
  function start() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({ reduced: '(prefers-reduced-motion: reduce)', full: '(prefers-reduced-motion: no-preference)' }, context => {
      const reduced = context.conditions.reduced;
      const entrance = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform,opacity' } });
      entrance.from('.about-title-line > span', { yPercent: reduced ? 0 : 105, opacity: 0, duration: reduced ? .18 : .85, stagger: reduced ? 0 : .07 })
        .from('.about-enter', { y: reduced ? 0 : 14, opacity: 0, duration: reduced ? .18 : .55, stagger: reduced ? 0 : .06 }, reduced ? 0 : .18)
        .from('.about-art', { opacity: 0, duration: reduced ? .18 : .8 }, 0)
        .from('.about-art-label', { y: reduced ? 0 : 16, opacity: 0, duration: reduced ? .18 : .65, stagger: reduced ? 0 : .07 }, reduced ? 0 : .3);
      document.querySelectorAll('[data-about-reveal]').forEach(element => {
        gsap.from(element, { y: reduced ? 0 : 22, opacity: 0, duration: reduced ? .18 : .65, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: element, start: 'top 91%', once: true } });
      });
      if (!reduced) gsap.to('.about-progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true } });
    });
    window.addEventListener('pagehide', () => media.revert(), { once: true });
    window.addEventListener('pageshow', event => { if (event.persisted) ScrollTrigger.refresh(); });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
