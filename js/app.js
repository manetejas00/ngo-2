/**
 * Avinya Care Foundation - Master Application Controller
 * Optimized scroll handling for non-blocking 60FPS animation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Hero Canvas Engine
  const heroEngine = new window.HeroCanvasEngine();

  // 2. Initialize Journey Timeline & Impact Counters
  if (window.JourneyTimeline) new window.JourneyTimeline();
  if (window.ImpactCounters) new window.ImpactCounters();

  // 3. Optimized Passive Scroll Listener with RequestAnimationFrame Throttling
  const heroContainer = document.querySelector('.hero-scroll-container');
  const navbar = document.querySelector('.navbar');
  const narrativeCards = document.querySelectorAll('.hero-narrative-card');
  const scrollIndicator = document.querySelector('.scroll-indicator');

  let isTicking = false;

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        isTicking = false;
      });
      isTicking = true;
    }
  }, { passive: true });

  function handleScroll() {
    const scrollY = window.scrollY;

    if (heroContainer) {
      const containerTop = heroContainer.offsetTop;
      const containerHeight = heroContainer.offsetHeight - window.innerHeight;
      let progress = (scrollY - containerTop) / containerHeight;
      progress = Math.max(0, Math.min(1, progress));

      // Pass progress to Canvas Engine
      if (heroEngine) heroEngine.updateScrollProgress(progress);

      // Typography Reveals based on scroll percentages
      updateHeroNarrativeCards(progress, narrativeCards);

      // Fade out scroll indicator
      if (scrollIndicator) {
        scrollIndicator.style.opacity = progress > 0.1 ? '0' : '1';
      }

      // Dynamic Navbar Appearance
      if (progress < 0.6) {
        navbar.classList.add('scrolled-dark');
        navbar.classList.remove('scrolled-light');
      } else {
        navbar.classList.remove('scrolled-dark');
        navbar.classList.add('scrolled-light');
      }
    }
  }

  // Helper for Hero Text Cards
  let activeCardId = null;
  function updateHeroNarrativeCards(p, cards) {
    let currentId = null;

    if (p >= 0 && p < 0.20) {
      currentId = 'card-1';
    } else if (p >= 0.20 && p < 0.40) {
      currentId = 'card-2';
    } else if (p >= 0.40 && p < 0.65) {
      currentId = 'card-3';
    } else if (p >= 0.65 && p < 0.85) {
      currentId = 'card-4';
    }

    if (currentId !== activeCardId) {
      cards.forEach(card => card.classList.remove('active'));
      if (currentId) {
        document.getElementById(currentId)?.classList.add('active');
      }
      activeCardId = currentId;
    }
  }

  // 4. Mobile Navigation Toggle
  const mobileToggleBtn = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggleBtn && navLinks) {
    mobileToggleBtn.addEventListener('click', () => {
      const isOpened = navLinks.classList.toggle('active-mobile');
      mobileToggleBtn.setAttribute('aria-expanded', isOpened);
    });
  }
});
