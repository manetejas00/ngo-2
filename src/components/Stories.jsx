import React, { useState } from 'react';
import { useModal } from '../context/ModalContext';

export default function Stories() {
  const { openModal } = useModal();
  const [showAllStories, setShowAllStories] = useState(false);

  const toggleStories = () => {
    setShowAllStories(prev => !prev);
  };

  return (
    <section id="stories" className="section-stories">
      <div className="section-header-center">
        <span className="category-tag category-tag-dark">VOICES OF COURAGE</span>
        <h2 className="section-title section-title-dark">Every journey has a story.</h2>
        <p className="body-large-dark">
          Behind every diagnosis is a person, a family, and a community standing together across the Mumbai-Virar region.
        </p>
      </div>

      <div className="stories-grid">
        {/* Story 1: Survivor — Meera Deshmukh */}
        <div 
          className="story-card" 
          onClick={() => openModal('story-modal', {
            author: 'Meera Deshmukh',
            title: 'Breast Cancer Survivor',
            content: 'An early screening camp in Virar caught my tumor at Stage 1. Today, I am cancer-free and living fully. When Avinya Care conducted a free diagnostic screening camp in Virar, I almost didn\'t go. The early ultrasound caught a small lump before symptoms ever appeared. With Avinya\'s care navigator walking beside my family at every hospital visit, I completed treatment smoothly and am now back with my children.',
            image: 'assets/stories/story-meera-deshmukh.jpg'
          })}
        >
          <div className="story-image-box">
            <span className="story-badge" style={{ background: 'rgba(235,94,40,0.9)', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', padding: '0.3rem 0.75rem', borderRadius: '999px', zIndex: 2 }}>01 SURVIVOR</span>
            <img src="assets/stories/story-meera-deshmukh.jpg" alt="Meera Deshmukh - Cancer Survivor" className="story-image" loading="lazy" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none' }}></div>
          </div>
          <div className="story-content">
            <div>
              <p className="story-quote">"An early screening camp in Virar caught my tumor at Stage 1. Today, I am cancer-free and living fully."</p>
            </div>
            <div className="story-meta" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
              <div>
                <div className="story-author">Meera Deshmukh</div>
                <div className="story-role">Cancer Survivor • Virar West</div>
              </div>
              <span style={{ color: 'var(--brand)', fontWeight: 800, fontSize: '0.9rem' }}>Read Journey →</span>
            </div>
          </div>
        </div>

        {/* Story 2: Caregiver — Rajesh Sharma */}
        <div 
          className="story-card" 
          onClick={() => openModal('story-modal', {
            author: 'Rajesh Sharma',
            title: 'Family Caregiver',
            content: 'When my mother was diagnosed, the navigation team gave us clear steps and hope when we were lost. The hardest part of a cancer diagnosis is not knowing what to do next. Avinya Care\'s patient navigator decoded pathology reports, scheduled doctor consultations, and provided emotional strength to our entire household throughout her chemotherapy.',
            image: 'assets/stories/story-rajesh-sharma.jpg'
          })}
        >
          <div className="story-image-box">
            <span className="story-badge" style={{ background: 'rgba(42,157,143,0.9)', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', padding: '0.3rem 0.75rem', borderRadius: '999px', zIndex: 2 }}>02 CAREGIVER</span>
            <img src="assets/stories/story-rajesh-sharma.jpg" alt="Rajesh Sharma - Family Caregiver" className="story-image" loading="lazy" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none' }}></div>
          </div>
          <div className="story-content">
            <div>
              <p className="story-quote">"When my mother was diagnosed, the navigation team gave us clear steps and hope when we were lost."</p>
            </div>
            <div className="story-meta" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
              <div>
                <div className="story-author">Rajesh Sharma</div>
                <div className="story-role">Family Caregiver • Vasai Road</div>
              </div>
              <span style={{ color: 'var(--brand)', fontWeight: 800, fontSize: '0.9rem' }}>Read Journey →</span>
            </div>
          </div>
        </div>

        {/* Story 3: Oncologist — Dr. Ananya Iyer */}
        <div 
          className="story-card" 
          onClick={() => openModal('story-modal', {
            author: 'Dr. Ananya Iyer',
            title: 'Surgical Oncologist',
            content: 'Timely screening bridges the gap between fear and cure. Avinya\'s grassroots camps save lives daily. Most patients in the suburban Mumbai-Virar belt arrive at advanced stages simply due to delayed testing and lack of awareness. Avinya Care Foundation\'s mobile diagnostic initiative is transforming early intervention and survival rates across our communities.',
            image: 'assets/stories/story-ananya-iyer.jpg'
          })}
        >
          <div className="story-image-box">
            <span className="story-badge" style={{ background: 'rgba(255,255,255,0.25)', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', padding: '0.3rem 0.75rem', borderRadius: '999px', zIndex: 2 }}>03 ONCOLOGIST</span>
            <img src="assets/stories/story-ananya-iyer.jpg" alt="Dr. Ananya Iyer - Surgical Oncologist" className="story-image" loading="lazy" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none' }}></div>
          </div>
          <div className="story-content">
            <div>
              <p className="story-quote">"Timely screening bridges the gap between fear and cure. Avinya's grassroots camps save lives daily."</p>
            </div>
            <div className="story-meta" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
              <div>
                <div className="story-author">Dr. Ananya Iyer</div>
                <div className="story-role">Surgical Oncologist • Mumbai Partner</div>
              </div>
              <span style={{ color: 'var(--brand)', fontWeight: 800, fontSize: '0.9rem' }}>Read Journey →</span>
            </div>
          </div>
        </div>

        {/* Extra stories revealed when toggled */}
        {showAllStories && (
          <>
            <div 
              className="story-card story-card-extra" 
              onClick={() => openModal('story-modal', {
                author: 'Kailash Patil',
                title: 'Dialysis Beneficiary',
                content: 'Subsidised sessions and travel aid ensured I never missed a single life-saving dialysis cycle. Managing bi-weekly dialysis on a modest pension was rapidly exhausting my family\'s lifetime savings. Avinya Care\'s subsidized dialysis program and local transport assistance ensured uninterrupted clinical treatment.',
                image: 'assets/stories/story-kailash-patil.jpg'
              })}
            >
              <div className="story-image-box">
                <span className="story-badge" style={{ background: 'rgba(235,94,40,0.9)', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', padding: '0.3rem 0.75rem', borderRadius: '999px', zIndex: 2 }}>04 DIALYSIS CARE</span>
                <img src="assets/stories/story-kailash-patil.jpg" alt="Kailash Patil - Dialysis Beneficiary" className="story-image" loading="lazy" />
              </div>
              <div className="story-content">
                <p className="story-quote">"Subsidised sessions and travel aid ensured I never missed a single life-saving dialysis cycle."</p>
                <div className="story-meta" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
                  <div>
                    <div className="story-author">Kailash Patil</div>
                    <div className="story-role">Dialysis Beneficiary • Nalasopara East</div>
                  </div>
                  <span style={{ color: 'var(--brand)', fontWeight: 800, fontSize: '0.9rem' }}>Read Journey →</span>
                </div>
              </div>
            </div>

            <div 
              className="story-card story-card-extra" 
              onClick={() => openModal('story-modal', {
                author: 'Leela Ben Rathod',
                title: 'Cataract Surgery Beneficiary',
                content: 'After two years of blurred darkness, the sponsored cataract surgery gave me back my sight. I could not read or walk to the market without stumbling. Through Avinya\'s free community eye camp, I received sponsored IOL cataract surgery at no cost.',
                image: 'assets/stories/story-leela-rathod.jpg'
              })}
            >
              <div className="story-image-box">
                <span className="story-badge" style={{ background: 'rgba(42,157,143,0.9)', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', padding: '0.3rem 0.75rem', borderRadius: '999px', zIndex: 2 }}>05 CATARACT CARE</span>
                <img src="assets/stories/story-leela-rathod.jpg" alt="Leela Ben Rathod - Cataract Beneficiary" className="story-image" loading="lazy" />
              </div>
              <div className="story-content">
                <p className="story-quote">"After two years of blurred darkness, the sponsored cataract surgery gave me back my sight."</p>
                <div className="story-meta" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
                  <div>
                    <div className="story-author">Leela Ben Rathod</div>
                    <div className="story-role">Vision Care Beneficiary (Age 68) • Palghar</div>
                  </div>
                  <span style={{ color: 'var(--brand)', fontWeight: 800, fontSize: '0.9rem' }}>Read Journey →</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: '3.5rem', textAlign: 'center' }}>
        <button className="btn-secondary btn-secondary-dark" onClick={toggleStories}>
          <span>{showAllStories ? 'Show Fewer Stories' : 'Explore All Stories'}</span>
        </button>
      </div>
    </section>
  );
}
