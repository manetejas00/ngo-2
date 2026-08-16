/**
 * Avinya Care Foundation - Impact Metric Counter Animations
 */

class ImpactCounters {
  constructor() {
    this.counters = document.querySelectorAll('.stat-number');
    this.hasAnimated = false;
    this.init();
  }

  init() {
    if (!this.counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.hasAnimated) {
          this.animateAll();
          this.hasAnimated = true;
        }
      });
    }, { threshold: 0.3 });

    const impactSection = document.getElementById('impact');
    if (impactSection) {
      observer.observe(impactSection);
    }
  }

  animateAll() {
    this.counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target') || '0', 10);
      const prefix = counter.getAttribute('data-prefix') || '';
      const suffix = counter.getAttribute('data-suffix') || '+';
      const duration = 2000; // ms
      const startTime = performance.now();

      const updateCount = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Ease out quad
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        const currentVal = Math.floor(easeProgress * target);

        counter.textContent = `${prefix}${currentVal.toLocaleString()}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          counter.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
        }
      };

      requestAnimationFrame(updateCount);
    });
  }
}

window.ImpactCounters = ImpactCounters;
