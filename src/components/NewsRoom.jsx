import React, { useEffect, useState } from 'react';
import { newsService } from '../services/newsService';
import { generateAIInsight } from '../services/api';

export default function NewsRoom() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState('all');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [activeModalArticle, setActiveModalArticle] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function loadNews() {
      const data = await newsService.fetchNews();
      setArticles(data.articles || []);
    }
    loadNews();
  }, []);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setIsExpanded(false);
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const result = await generateAIInsight('oncology research & early detection');
      if (result && result.summary) {
        const newAIArticle = {
          id: `gemini-ai-custom-${Date.now()}`,
          title: "AI Clinical Insight: Accelerated Oncology Biomarker Detection",
          description: result.summary,
          category: "Cancer Research",
          source: "Gemini AI Medical Engine",
          apiProvider: "Gemini AI Engine",
          isAIGenerated: true,
          publishedAt: new Date().toISOString(),
          urlToImage: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80"
        };
        setArticles(prev => [newAIArticle, ...prev]);
      }
    } catch (err) {
      console.warn('AI insight error:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const filteredArticles = category === 'all'
    ? articles
    : articles.filter(a => (a.category || '').toLowerCase().includes(category.toLowerCase()) || (a.title || '').toLowerCase().includes(category.toLowerCase()));

  const limit = isExpanded ? filteredArticles.length : Math.min(7, filteredArticles.length);
  const visibleArticles = filteredArticles.slice(0, limit);
  const featured = visibleArticles[0];
  const gridStories = visibleArticles.slice(1);
  const fallbackImg = "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80";

  return (
    <section id="news" className="section-news">
      <div className="section-header-center">
        <div className="news-updated-pill">
          <span className="live-dot"></span>
          <span>UPDATED DAILY · GLOBAL HEALTHCARE &amp; ONCOLOGY</span>
        </div>
        <h2 className="section-title" style={{ marginTop: '1rem' }}>Worldwide Health &amp; Cancer Insights</h2>
        <p className="body-large">
          Updated every day with clinical breakthroughs, global early screening initiatives, and verified healthcare news from medical institutes worldwide.
        </p>

        {/* Category Filter Tabs + Gemini AI Badge */}
        <div className="news-category-tabs">
          <button className={`news-tab-btn ${category === 'all' ? 'active' : ''}`} onClick={() => handleCategoryChange('all')}>All</button>
          <button className={`news-tab-btn ${category === 'Cancer Research' ? 'active' : ''}`} onClick={() => handleCategoryChange('Cancer Research')}>Cancer Research</button>
          <button className={`news-tab-btn ${category === 'Early Detection' ? 'active' : ''}`} onClick={() => handleCategoryChange('Early Detection')}>Early Detection</button>
          <button className={`news-tab-btn ${category === 'Prevention' ? 'active' : ''}`} onClick={() => handleCategoryChange('Prevention')}>Prevention</button>
          <button className={`news-tab-btn ${category === 'Treatment' ? 'active' : ''}`} onClick={() => handleCategoryChange('Treatment')}>Treatment</button>
          <button className={`news-tab-btn ${category === 'Care' ? 'active' : ''}`} onClick={() => handleCategoryChange('Care')}>Care</button>
          
          <button className="news-ai-gen-btn" onClick={handleGenerateAI} disabled={isGeneratingAI}>
            <span>{isGeneratingAI ? '✦ GENERATING AI STORY...' : '✦ AI INSIGHT'}</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.8, marginLeft: '0.35rem', fontWeight: 500 }}>(AI-assisted summary)</span>
          </button>
        </div>
      </div>

      <div id="news-grid-container" className="news-grid">
        {/* Featured Lead Banner */}
        {featured && (
          <div className="news-featured-lead" onClick={() => setActiveModalArticle(featured)} style={{ gridColumn: '1 / -1' }}>
            <div className="news-featured-image-box">
              <img src={featured.urlToImage || fallbackImg} alt={featured.title} className="news-featured-image" onError={(e) => { e.target.src = fallbackImg; }} loading="lazy" />
            </div>
            <div className="news-featured-content">
              <div className="news-tag-group">
                <span className="news-category-badge">{featured.category || 'Cancer Research'}</span>
                {featured.isAIGenerated ? <span className="ai-generated-badge">✦ AI INSIGHT</span> : <span className="live-news-badge">🌐 DAILY HEALTH DESK</span>}
              </div>
              <h3 className="news-featured-title">{featured.title}</h3>
              <p className="news-featured-desc">{featured.description}</p>
              <div className="news-featured-footer">
                <div className="news-source-meta">
                  <span>{featured.isAIGenerated ? '✦' : '🌐'} {featured.source}</span>
                  <span>·</span>
                  <span>{new Date(featured.publishedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <span className="news-read-btn">Read Full Story →</span>
              </div>
            </div>
          </div>
        )}

        {/* 3-Column News Grid */}
        {gridStories.map((article) => (
          <article className="news-card" key={article.id} onClick={() => setActiveModalArticle(article)}>
            <div className="news-image-box">
              <span className="news-category-badge" style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 2, background: 'rgba(10,10,10,0.85)', color: 'white' }}>
                {article.category || 'Health'}
              </span>
              <img src={article.urlToImage || fallbackImg} alt={article.title} className="news-image" onError={(e) => { e.target.src = fallbackImg; }} loading="lazy" />
            </div>
            <div className="news-content">
              <div>
                <div style={{ marginBottom: '0.6rem' }}>
                  {article.isAIGenerated ? <span className="ai-generated-badge">✦ AI INSIGHT</span> : <span className="live-news-badge">{article.apiProvider || '🌐 GLOBAL HEALTH'}</span>}
                </div>
                <h3 className="news-card-title">{article.title}</h3>
                <p className="news-card-desc">{article.description}</p>
              </div>
              <div className="news-card-meta">
                <span className="news-source-name">{article.source} · {new Date(article.publishedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="news-read-more">Read Story →</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredArticles.length > 7 && (
        <div className="news-expand-bar" style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
          <button className="btn-primary" onClick={() => setIsExpanded(prev => !prev)}>
            <span>{isExpanded ? 'Show Less Stories ↑' : `Show More News Stories (${filteredArticles.length - 7} More) ↓`}</span>
          </button>
        </div>
      )}

      {/* Article Detail Full Screen Modal */}
      {activeModalArticle && (
        <div className="full-screen-news-view">
          <div className="modal-backdrop active" style={{ zIndex: 2500 }}>
            <div className="modal-container" style={{ width: 'min(850px, 95%)', padding: '3.5rem 3rem' }}>
              <button className="modal-close-btn" onClick={() => setActiveModalArticle(null)}>✕</button>
              <div className="news-tag-group" style={{ marginBottom: '1rem' }}>
                <span className="news-category-badge">{activeModalArticle.category || 'Health & Oncology'}</span>
                {activeModalArticle.isAIGenerated ? <span className="ai-generated-badge">✦ GEMINI AI INSIGHT</span> : <span className="live-news-badge">🌐 VERIFIED ONCOLOGY REPORT</span>}
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, lineHeight: 1.25, marginBottom: '1.25rem', color: 'var(--gray-900)' }}>
                {activeModalArticle.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.92rem', color: 'var(--muted)', paddingBottom: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--gray-200)' }}>
                <div><strong>Source:</strong> {activeModalArticle.source}</div>
              </div>
              <div style={{ width: '100%', height: '360px', borderRadius: '16px', overflow: 'hidden', marginBottom: '2.2rem', background: 'var(--black)' }}>
                <img src={activeModalArticle.urlToImage || fallbackImg} alt={activeModalArticle.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = fallbackImg; }} />
              </div>
              <div style={{ fontSize: '1.12rem', lineHeight: 1.8, color: 'var(--gray-900)', marginBottom: '2.5rem' }}>
                <p style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.2rem', color: 'var(--gray-900)' }}>{activeModalArticle.description}</p>
                <p style={{ marginBottom: '1.5rem' }}>Clinical awareness and timely diagnostic interventions form the cornerstone of effective oncology care. At Avinya Care Foundation, our mission is ensuring every individual has access to reliable health guidance, early screening facilities, and compassionate support throughout their journey.</p>
              </div>
              <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                <button className="btn-primary" onClick={() => setActiveModalArticle(null)} style={{ padding: '0.85rem 2.5rem' }}>Close Article</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
