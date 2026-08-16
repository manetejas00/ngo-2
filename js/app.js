/**
 * Avinya Care Foundation - Master Application Controller
 * Optimized scroll handling for 60FPS animation & active section highlighting.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Hero Canvas Engine & Global Export
  const heroEngine = new window.HeroCanvasEngine();
  window.heroEngine = heroEngine;

  // 2. Initialize Journey Timeline & Impact Counters
  if (window.JourneyTimeline) new window.JourneyTimeline();
  if (window.ImpactCounters) new window.ImpactCounters();

  // 3. Scroll & Navbar Controller
  const heroContainer = document.querySelector('.hero-scroll-container');
  const navbar = document.querySelector('.navbar');
  const narrativeCards = document.querySelectorAll('.hero-narrative-card');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  const navLinkElems = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  let isTicking = false;

  function onScrollOrResize() {
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        isTicking = false;
      });
      isTicking = true;
    }
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });

  function handleScroll() {
    const scrollY = window.scrollY || window.pageYOffset || 0;

    if (heroContainer) {
      const containerTop = heroContainer.offsetTop;
      const containerHeight = heroContainer.offsetHeight - window.innerHeight;

      let progress = 0;
      if (containerHeight > 0) {
        progress = (scrollY - containerTop) / containerHeight;
        progress = Math.max(0, Math.min(1, progress));
      }

      // Pass progress to Canvas Engine
      const engine = window.heroEngine || heroEngine;
      if (engine) engine.updateScrollProgress(progress);

      // Hero typography reveals
      updateHeroNarrativeCards(progress, narrativeCards);

      // Fade out scroll indicator
      if (scrollIndicator) {
        scrollIndicator.style.opacity = progress > 0.1 ? '0' : '1';
      }

      // Dynamic Navbar Theme
      if (progress < 0.6) {
        navbar.classList.add('scrolled-dark');
        navbar.classList.remove('scrolled-light');
      } else {
        navbar.classList.remove('scrolled-dark');
        navbar.classList.add('scrolled-light');
      }
    }

    // Active Section Link Highlighting
    let currentSectionId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 140;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    if (currentSectionId) {
      navLinkElems.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${currentSectionId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
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

  // Initial calculation on page load and window load
  handleScroll();
  window.addEventListener('load', handleScroll);

  // 4. Smooth Anchor Link Scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('#news/')) {
        const targetElem = document.querySelector(href);
        if (targetElem) {
          e.preventDefault();
          targetElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // 5. Mobile Navigation Toggle
  const mobileToggleBtn = document.querySelector('.mobile-toggle');
  const navLinksContainer = document.querySelector('.nav-links');

  if (mobileToggleBtn && navLinksContainer) {
    mobileToggleBtn.addEventListener('click', () => {
      const isOpened = navLinksContainer.classList.toggle('active-mobile');
      mobileToggleBtn.setAttribute('aria-expanded', isOpened);
    });

    // Close mobile nav on link click
    navLinkElems.forEach(link => {
      link.addEventListener('click', () => {
        navLinksContainer.classList.remove('active-mobile');
        mobileToggleBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
});
