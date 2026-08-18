/**
 * Avinya Care Foundation - NestJS Sticky Stacked Overlapping Stage Panels
 * Pins panels as sticky layers and applies 3D card-deck scaling, dimming, and depth blur as following panels slide over.
 */

class StackedPanelsEngine {
  constructor() {
    this.container = document.getElementById('deep-dives');
    if (!this.container) return;

    this.panels = Array.from(this.container.querySelectorAll('.stacked-feature-panel'));
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    if (!this.panels.length) return;

    // Set explicit z-indexes & sticky top offsets
    this.panels.forEach((panel, idx) => {
      panel.style.zIndex = (idx + 1).toString();
    });

    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', () => {
      requestAnimationFrame(this.handleScroll);
    }, { passive: true });

    // Initial calculation
    this.handleScroll();
  }

  handleScroll() {
    if (this.reducedMotion) return;

    const viewportHeight = window.innerHeight;

    this.panels.forEach((panel, idx) => {
      const nextPanel = this.panels[idx + 1];

      if (nextPanel) {
        const nextRect = nextPanel.getBoundingClientRect();
        // Calculate how far the next panel has covered/overlapped this panel
        const overlapProgress = Math.max(0, Math.min(1, (viewportHeight - nextRect.top) / (viewportHeight * 0.7)));

        if (overlapProgress > 0) {
          const scale = 1 - (0.06 * overlapProgress);
          const opacity = 1 - (0.4 * overlapProgress);
          const blur = overlapProgress * 5;

          panel.style.transform = `scale(${scale})`;
          panel.style.opacity = opacity.toString();
          panel.style.filter = `blur(${blur}px)`;
        } else {
          panel.style.transform = 'scale(1)';
          panel.style.opacity = '1';
          panel.style.filter = 'blur(0px)';
        }
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.AvinyaStackedPanels = new StackedPanelsEngine();
});
