/**
 * Avinya Care Foundation - Master Application Controller
 * NestJS-inspired scroll controller, 7-stage canvas hero cards, text reveal animation, & navbar themes.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Hero Canvas Engine & Global Export
  const heroEngine = new window.HeroCanvasEngine();
  window.heroEngine = heroEngine;

  // 2. Initialize Journey Timeline & Impact Counters
  if (window.JourneyTimeline) new window.JourneyTimeline();
  if (window.ImpactCounters) new window.ImpactCounters();

  // 3. Scroll & Floating Navbar Controller
  const heroContainer = document.querySelector('.hero-scroll-container');
  const navbar = document.querySelector('.navbar');
  const narrativeCards = document.querySelectorAll('.hero-narrative-card');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  const navLinkElems = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const statementLines = document.querySelectorAll('.statement-line');

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

      // Hero typography narrative cards (7 stages)
      updateHeroNarrativeCards(progress, narrativeCards);

      // Fade out scroll indicator on scroll
      if (scrollIndicator) {
        scrollIndicator.style.opacity = progress > 0.08 ? '0' : '1';
      }

      // Dynamic Floating Navbar Theme (Dark over hero, Light over content)
      if (navbar) {
        if (progress < 0.65) {
          navbar.classList.add('scrolled-dark');
          navbar.classList.remove('scrolled-light');
        } else {
          navbar.classList.remove('scrolled-dark');
          navbar.classList.add('scrolled-light');
        }
      }
    }

    // Scroll Text Reveal Transition Handler (.statement-line)
    statementLines.forEach((line) => {
      const lineTop = line.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      if (lineTop < windowHeight * 0.85) {
        line.classList.add('revealed');
      }
    });

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

  // 7-Stage Hero Narrative Card Scroll Progression
  let activeCardId = null;
  function updateHeroNarrativeCards(p, cards) {
    let currentId = null;

    if (p >= 0 && p < 0.14) {
      currentId = 'card-1';
    } else if (p >= 0.14 && p < 0.28) {
      currentId = 'card-2';
    } else if (p >= 0.28 && p < 0.42) {
      currentId = 'card-3';
    } else if (p >= 0.42 && p < 0.56) {
      currentId = 'card-4';
    } else if (p >= 0.56 && p < 0.70) {
      currentId = 'card-5';
    } else if (p >= 0.70 && p < 0.86) {
      currentId = 'card-6';
    } else if (p >= 0.86 && p <= 1.0) {
      currentId = 'card-7';
    }

    if (currentId !== activeCardId) {
      cards.forEach(card => card.classList.remove('active'));
      if (currentId) {
        document.getElementById(currentId)?.classList.add('active');
      }
      activeCardId = currentId;
    }
  }

  // Initial trigger on load
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

          // Close mobile menu drawer if open
          const mobileOverlay = document.getElementById('mobile-nav-overlay');
          if (mobileOverlay) mobileOverlay.classList.remove('active');
        }
      }
    });
  });

  // 5. Mobile Drawer Toggle
  const mobileToggleBtn = document.querySelector('.mobile-toggle');
  const mobileOverlay = document.getElementById('mobile-nav-overlay');

  if (mobileToggleBtn && mobileOverlay) {
    mobileToggleBtn.addEventListener('click', () => {
      const isOpened = mobileOverlay.classList.toggle('active');
      mobileToggleBtn.setAttribute('aria-expanded', isOpened);
    });

    mobileOverlay.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileOverlay.classList.remove('active');
        mobileToggleBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
});
