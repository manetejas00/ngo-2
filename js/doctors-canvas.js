/** Scroll-linked microscopic camera scene. Draws only when the view changes. */
class DoctorsCanvasEngine {
  constructor() {
    this.canvas = document.getElementById('doctors-canvas');
    this.wrapper = document.querySelector('.hc-hero-scroll-wrapper');
    if (!this.canvas || !this.wrapper) return;
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    if (!this.ctx) return;
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.progress = 0;
    this.image = new Image();
    this.image.onload = () => this.schedule();
    this.image.src = '/assets/diagnostics/patient-test-storyboard.jpg';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.schedule = this.schedule.bind(this);
    window.addEventListener('scroll', this.schedule, { passive: true });
    window.addEventListener('resize', this.schedule, { passive: true });
    this.motion.addEventListener('change', this.schedule);
    this.observer = new IntersectionObserver(entries => {
      this.visible = entries[0].isIntersecting;
      if (this.visible) this.schedule();
    });
    this.visible = true;
    this.observer.observe(this.wrapper);
    this.schedule();
  }
  schedule() {
    if (this.queued || this.visible === false || document.hidden) return;
    this.queued = requestAnimationFrame(() => { this.queued = null; this.draw(); });
  }
  // Kept for compatibility with the page's existing scroll story controller.
  updateScrollProgress() { this.schedule(); }
  draw() {
    const bounds = this.wrapper.getBoundingClientRect();
    const progress = this.motion.matches ? 0 : Math.max(0, Math.min(1, -bounds.top / Math.max(1, this.wrapper.offsetHeight - innerHeight)));
    this.progress = progress;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const width = Math.round(this.canvas.clientWidth * dpr);
    const height = Math.round(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    const ctx = this.ctx;
    ctx.fillStyle = '#07191e'; ctx.fillRect(0, 0, width, height);
    const image = this.image;
    if (!image?.naturalWidth) return;
    const panelHeight = image.naturalHeight / 3;
    const scale = Math.max(width / image.naturalWidth, height / panelHeight);
    const w = image.naturalWidth * scale, h = panelHeight * scale;
    const x = (width - w) * (width < height ? .76 : .5);
    const y = (height - h) / 2;
    // Keep only the first, unbranded patient-testing scene.
    this.sceneIndex = 0;
    ctx.globalAlpha = 1;
    ctx.drawImage(image, 0, 0, image.naturalWidth, panelHeight, x, y, w, h);
    const shade = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * .75);
    shade.addColorStop(0, 'rgba(5,15,24,.08)'); shade.addColorStop(1, 'rgba(5,15,24,.25)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
    const blend = ctx.createLinearGradient(0, height * .65, 0, height);
    blend.addColorStop(0, 'rgba(10,15,29,0)'); blend.addColorStop(1, '#0a0f1d');
    ctx.fillStyle = blend; ctx.fillRect(0, height * .65, width, height * .35);
  }
}
window.DoctorsCanvasEngine = DoctorsCanvasEngine;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('doctors-canvas')) window.doctorsEngine = new DoctorsCanvasEngine();
});
