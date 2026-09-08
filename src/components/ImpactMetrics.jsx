import React, { useEffect } from 'react';

export default function ImpactMetrics() {
  useEffect(() => {
    if (window.ImpactCounters) {
      new window.ImpactCounters();
    }
  }, []);

  return (
    <section id="impact" className="section-impact">
      <div className="impact-header">
        <span className="category-tag category-tag-dark">MEASURABLE CHANGE</span>
        <h2 className="section-title section-title-dark">Newly Launched — Building Our Impact</h2>
        <p className="body-large-dark" style={{ margin: '0 auto' }}>
          Every contribution directly empowers individuals with knowledge, early screening, and compassionate care across the Mumbai-Virar region.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-number" data-target="250" data-suffix="+">0</div>
          <div className="stat-label">COMMUNITY REACH TARGET</div>
        </div>
        <div className="stat-item">
          <div className="stat-number" data-target="150" data-suffix="+">0</div>
          <div className="stat-label">AWARENESS INTERACTIONS</div>
        </div>
        <div className="stat-item">
          <div className="stat-number" data-target="50" data-suffix="+">0</div>
          <div className="stat-label">SCREENING INITIATIVES</div>
        </div>
        <div className="stat-item">
          <div className="stat-number" data-target="25" data-suffix="+">0</div>
          <div className="stat-label">COMMUNITY VOLUNTEERS</div>
        </div>
      </div>
    </section>
  );
}
