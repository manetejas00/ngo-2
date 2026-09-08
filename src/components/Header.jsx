import React, { useState, useEffect } from 'react';
import { useModal } from '../context/ModalContext';

export default function Header() {
  const { openModal } = useModal();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileNav = () => {
    setIsMobileOpen(prev => !prev);
  };

  const closeMobileNav = () => {
    setIsMobileOpen(false);
  };

  useEffect(() => {
    let isTicking = false;

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const navbar = document.querySelector('.navbar');
      const heroContainer = document.querySelector('.hero-scroll-container');
      const sections = document.querySelectorAll('section[id]');
      const navLinks = document.querySelectorAll('.nav-links .nav-link');
      const statementLines = document.querySelectorAll('.statement-line');

      // 1. Dynamic Floating Navbar Theme
      if (navbar) {
        if (heroContainer) {
          const heroTop = heroContainer.offsetTop;
          const heroHeight = heroContainer.offsetHeight - window.innerHeight;
          let progress = 0;
          if (heroHeight > 0) {
            progress = (scrollY - heroTop) / heroHeight;
          }
          if (progress < 0.65) {
            navbar.classList.add('scrolled-dark');
            navbar.classList.remove('scrolled-light');
          } else {
            navbar.classList.remove('scrolled-dark');
            navbar.classList.add('scrolled-light');
          }
        }
      }

      // 2. Scroll Text Reveal Handler
      statementLines.forEach((line) => {
        const lineTop = line.getBoundingClientRect().top;
        if (lineTop < window.innerHeight * 0.85) {
          line.classList.add('revealed');
        }
      });

      // 3. Active Section Link Highlighting
      let currentSectionId = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 160;
        const sectionHeight = section.offsetHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          currentSectionId = section.getAttribute('id');
        }
      });

      if (currentSectionId) {
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href === `#${currentSectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    };

    const onScrollOrResize = () => {
      if (!isTicking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          isTicking = false;
        });
        isTicking = true;
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    // Initial trigger
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  return (
    <>
      {/* 1. MINIMAL FLOATING DOCK NAVIGATION (NESTJS STYLE) */}
      <header className="navbar-wrapper">
        <nav className="navbar scrolled-dark" aria-label="Main Navigation">
          <a href="#hero" className="nav-brand" aria-label="Avinya Care Foundation Home">
            <img src="assets/logo-emblem.png" alt="Avinya Care Foundation Logo" className="brand-logo-img" />
            <div className="brand-text">
              <span className="brand-name">Avinya Care</span>
              <span className="brand-tag">Foundation</span>
            </div>
          </a>

          <ul className="nav-links">
            <li><a href="#hero" className="nav-link active">About</a></li>
            <li><a href="#what-we-do" className="nav-link">What We Do</a></li>
            <li><a href="/doctors" className="nav-link nav-link-healthcare" id="nav-doctors-tests">Doctors & Tests</a></li>
            <li><a href="#stories" className="nav-link">Stories</a></li>
            <li><a href="#impact" className="nav-link">Impact</a></li>
            <li><a href="#news" className="nav-link">News</a></li>
          </ul>

          <div className="nav-actions">
            <button className="btn-primary" onClick={() => openModal('donate-modal')}>
              <span>Make a Difference</span>
              <span className="arrow">→</span>
            </button>
            <button className="mobile-toggle" onClick={toggleMobileNav} aria-label="Toggle Mobile Navigation" aria-expanded={isMobileOpen}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Fullscreen Mobile Navigation Drawer */}
      <div 
        className={`mobile-nav-overlay ${isMobileOpen ? 'active' : ''}`} 
        id="mobile-nav-overlay" 
        style={{ display: isMobileOpen ? 'flex' : 'none' }}
      >
        <button 
          className="modal-close-btn" 
          style={{ top: '2rem', right: '2rem', color: 'white', background: 'rgba(255,255,255,0.1)' }} 
          onClick={closeMobileNav}
        >✕</button>
        <div className="mobile-nav-brand-header">
          <img src="assets/logo-white.png" alt="Avinya Care Foundation" className="mobile-nav-logo" />
          <div className="mobile-nav-title">Avinya Care Foundation</div>
          <div className="mobile-nav-tagline">No one should face a health crisis alone</div>
        </div>
        <ul className="mobile-nav-menu">
          <li><a href="#hero" className="mobile-nav-link" onClick={closeMobileNav}>About</a></li>
          <li><a href="#what-we-do" className="mobile-nav-link" onClick={closeMobileNav}>What We Do</a></li>
          <li><a href="/doctors" className="mobile-nav-link" style={{ color: 'var(--brand)', fontWeight: 700 }}>Doctors & Tests</a></li>
          <li><a href="#stories" className="mobile-nav-link" onClick={closeMobileNav}>Stories</a></li>
          <li><a href="#impact" className="mobile-nav-link" onClick={closeMobileNav}>Impact</a></li>
          <li><a href="#news" className="mobile-nav-link" onClick={closeMobileNav}>News</a></li>
        </ul>
        <div style={{ marginTop: '2.5rem' }}>
          <button 
            className="btn-primary" 
            style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }} 
            onClick={() => { closeMobileNav(); openModal('donate-modal'); }}
          >
            <span>Make a Difference</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </>
  );
}
