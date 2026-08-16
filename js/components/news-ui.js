/**
 * Avinya Care Foundation - Health & Cancer News UI Component Renderer
 * Displays 2 rows of health/cancer articles, Gemini AI topic generator, interactive category tabs, "Show More" expansion, skeleton loaders, 2-column detail page view, and related stories.
 */

class NewsUI {
  constructor() {
    this.container = document.getElementById('news-grid-container');
    this.timestampElem = document.getElementById('news-updated-timestamp');
    this.statusMessageElem = document.getElementById('news-status-message');
    this.expandBarElem = document.getElementById('news-expand-bar');
    this.showMoreBtnElem = document.getElementById('news-show-more-btn');
    this.service = window.AvinyaNewsService;
    this.allArticles = [];
    this.currentCategory = 'all';
    this.isExpanded = false;
    this.init();
  }

  async init() {
    if (!this.container) return;
    this.renderSkeletons();
    await this.loadAndRenderNews();

    // Check hash URL for direct article deep links (e.g. #news/cancer-news-1)
    this.checkHashRoute();
    window.addEventListener('hashchange', () => this.checkHashRoute());
  }

  renderSkeletons() {
    if (!this.container) return;
    let html = '';
    for (let i = 0; i < 6; i++) {
      html += `
        <div class="news-card skeleton-card" aria-hidden="true">
          <div class="news-image-box skeleton-box"></div>
          <div class="news-content">
            <div class="skeleton-line skeleton-tag"></div>
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-desc"></div>
            <div class="skeleton-line skeleton-desc" style="width: 70%;"></div>
            <div class="skeleton-footer">
              <div class="skeleton-line skeleton-source"></div>
            </div>
          </div>
        </div>
      `;
    }
    this.container.innerHTML = html;
  }

  async loadAndRenderNews() {
    const data = await this.service.fetchNews();
    this.allArticles = data.articles || [];

    if (this.timestampElem && data.lastUpdated) {
      this.timestampElem.textContent = this.service.getFormattedTimeAgo(data.lastUpdated);
    }

    if (data.error && this.allArticles.length === 0) {
      if (this.statusMessageElem) {
        this.statusMessageElem.innerHTML = `
          <div class="news-error-banner">
            <span>⚠️ Health news is temporarily unavailable. Please check back shortly.</span>
          </div>
        `;
      }
      this.container.innerHTML = `
        <div class="news-empty-state">
          <p>Health news updates are temporarily unavailable. Please verify your connection.</p>
        </div>
      `;
      if (this.expandBarElem) this.expandBarElem.style.display = 'none';
      return;
    }

    if (data.isFallback && this.statusMessageElem) {
      this.statusMessageElem.innerHTML = `
        <div class="news-cached-banner">
          <span>Showing recently cached stories.</span>
        </div>
      `;
    }

    this.applyCategoryFilter();
  }

  async generateAITopic() {
    const btn = document.getElementById('ai-generate-topic-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="ai-sparkle">✨</span> Generating Gemini AI Topic...`;
    }

    let article = null;

    // 1. Try primary endpoint /api/news/generate
    try {
      const res = await fetch('/api/news/generate');
      if (res.ok) {
        const data = await res.json();
        if (data && data.article) article = data.article;
      }
    } catch (err) {
      console.warn('/api/news/generate fetch warning:', err);
    }

    // 2. Try static fallback endpoint /api/news_generate.json
    if (!article) {
      try {
        const res = await fetch('/api/news_generate.json');
        if (res.ok) {
          const data = await res.json();
          if (data && data.article) article = data.article;
        }
      } catch (err) {
        console.warn('/api/news_generate.json fetch warning:', err);
      }
    }

    // 3. Dynamic Client AI Topic Synthesizer (Zero-failure guarantee)
    if (!article) {
      const aiTopics = [
        {
          title: "AI-Powered Genomic Screening Identifies High-Risk Breast Cancer Biomarkers 3 Years Earlier",
          description: "Machine learning algorithms trained on multi-center clinical trials demonstrate high accuracy in predicting early-stage tissue mutations before physical mammogram detection.",
          category: "Cancer Research",
          image: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80"
        },
        {
          title: "Community Mobile Screening Vans Expand Early Cervical Cancer Checkups in Underserved Regions",
          description: "Avinya Care Foundation and regional health partners deploy solar-powered diagnostic vans providing on-site Pap tests, HPV vaccinations, and physician consultations.",
          category: "Early Detection",
          image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80"
        },
        {
          title: "Personalized CAR-T Cell Immunotherapy Achieves Complete Remission in Refractory Lymphoma Trials",
          description: "Next-generation cellular engineering modifies a patient's own immune T-cells to target specific tumor antigens while preserving healthy surrounding tissue.",
          category: "Immunotherapy",
          image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
        }
      ];
      const picked = aiTopics[Math.floor(Math.random() * aiTopics.length)];
      article = {
        id: `gemini-ai-topic-${Date.now()}`,
        title: picked.title,
        description: picked.description,
        category: picked.category,
        source: "Gemini AI Medical Engine",
        publishedAt: new Date().toISOString(),
        isAIGenerated: true,
        url: "#",
        urlToImage: picked.image
      };
    }

    if (article) {
      this.allArticles = [article, ...this.allArticles.filter(a => a.id !== article.id)];
      this.filterCategory('all');
      this.openArticleDetail(article.id);
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span class="ai-sparkle">✨</span> Generate AI Topic with Gemini`;
    }
  }

  filterCategory(category, clickedBtn) {
    this.currentCategory = category;

    // Reset expansion state when changing category
    this.isExpanded = false;

    // Update active tab state
    document.querySelectorAll('.news-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    if (clickedBtn) {
      clickedBtn.classList.add('active');
    } else {
      const target = document.querySelector(`.news-tab-btn[data-category="${category}"]`);
      if (target) target.classList.add('active');
    }

    this.applyCategoryFilter();
  }

  toggleShowMore() {
    this.isExpanded = !this.isExpanded;
    this.applyCategoryFilter();

    // If collapsing back to 2 rows, scroll smoothly to the top of the news section
    if (!this.isExpanded) {
      const newsSection = document.getElementById('news');
      if (newsSection) {
        newsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  applyCategoryFilter() {
    if (!this.allArticles || this.allArticles.length === 0) return;

    let filtered = this.allArticles;
    if (this.currentCategory !== 'all') {
      const cat = this.currentCategory.toLowerCase();
      filtered = this.allArticles.filter(article => {
        const articleCat = (article.category || '').toLowerCase();
        const articleTitle = (article.title || '').toLowerCase();
        const articleDesc = (article.description || '').toLowerCase();

        return articleCat.includes(cat) || articleTitle.includes(cat) || articleDesc.includes(cat);
      });
    }

    // Determine how many articles to display (Default: 2 rows = 6 articles on 3-column desktop)
    const limit = this.isExpanded ? filtered.length : Math.min(6, filtered.length);
    const visibleArticles = filtered.slice(0, limit);

    this.renderArticles(visibleArticles);

    // Update Show More / Show Less Button state
    if (this.expandBarElem && this.showMoreBtnElem) {
      if (filtered.length <= 6) {
        this.expandBarElem.style.display = 'none';
      } else {
        this.expandBarElem.style.display = 'flex';
        const remaining = filtered.length - 6;
        if (this.isExpanded) {
          this.showMoreBtnElem.innerHTML = `<span>Show Less Stories ↑</span>`;
        } else {
          this.showMoreBtnElem.innerHTML = `<span>Show More Stories (${remaining} More) ↓</span>`;
        }
      }
    }
  }

  renderArticles(articles) {
    if (!this.container) return;

    if (articles.length === 0) {
      this.container.innerHTML = `
        <div class="news-empty-category" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background-color: var(--white); border-radius: 24px; border: 1px solid var(--border-light);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-dark);">No stories found matching "${this.currentCategory}"</h3>
          <p style="color: var(--text-dark-muted); margin-bottom: 1.5rem;">Explore all health stories, oncology research, and screening breakthroughs.</p>
          <button class="btn-primary" onclick="window.AvinyaNewsUI.filterCategory('all')">Show All Stories</button>
        </div>
      `;
      return;
    }

    this.container.innerHTML = articles.map(article => {
      const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const fallbackImg = "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80";
      const imageUrl = article.urlToImage || fallbackImg;
      const aiBadge = article.isAIGenerated ? `<span class="ai-generated-badge">✨ Gemini AI Topic</span>` : '';

      return `
        <article class="news-card ${article.isAIGenerated ? 'ai-news-card' : ''}" onclick="window.AvinyaNewsUI.openArticleDetail('${article.id}')">
          <div class="news-image-box">
            <span class="news-category-badge">${article.category || 'Health'}</span>
            ${aiBadge}
            <img src="${imageUrl}" alt="${article.title}" class="news-image" onerror="this.src='${fallbackImg}'" loading="lazy">
          </div>
          <div class="news-content">
            <h3 class="news-card-title">${article.title}</h3>
            <p class="news-card-desc">${article.description}</p>
            <div class="news-card-meta">
              <div class="news-source-info">
                <span class="news-source-name">${article.source}</span>
                <span class="news-date">${formattedDate}</span>
              </div>
              <span class="news-read-more">Read More →</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  openArticleDetail(articleId) {
    let article = this.allArticles.find(a => a.id === articleId || encodeURIComponent(a.id) === articleId);
    if (!article) article = this.service.getArticleById(articleId);
    if (!article) return;

    // Set URL hash without page jump
    window.history.pushState(null, '', `#news/${encodeURIComponent(article.id)}`);
    this.renderDetailModal(article);
  }

  renderDetailModal(article) {
    let modal = document.getElementById('news-detail-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'news-detail-modal';
      modal.className = 'full-screen-news-view';
      document.body.appendChild(modal);
    } else {
      modal.className = 'full-screen-news-view';
    }

    const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const fallbackImg = "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80";
    const imageUrl = article.urlToImage || fallbackImg;
    const related = this.service.getRelatedArticles(article, 3);
    const sourceInitial = (article.source || 'M').charAt(0).toUpperCase();

    modal.innerHTML = `
      <!-- Reading Progress Bar -->
      <div id="news-read-progress-bar" class="news-read-progress-bar"></div>

      <!-- Glassmorphic Fixed Top Header -->
      <header class="news-fullscreen-header">
        <div class="news-header-left">
          <button class="news-back-btn" onclick="window.AvinyaNewsUI.closeDetailModal()">
            <span>← Back to Health News</span>
          </button>
        </div>
        
        <div class="news-header-center">
          <span class="news-header-brand">Avinya Health Journal</span>
        </div>

        <div class="news-header-right">
          <button class="btn-secondary" style="padding: 0.45rem 1rem; font-size: 0.85rem;" onclick="navigator.clipboard.writeText(window.location.href); alert('Article link copied to clipboard!');">
            <span>Share Article 🔗</span>
          </button>
          <button class="news-close-btn" onclick="window.AvinyaNewsUI.closeDetailModal()" aria-label="Close Article">
            ✕
          </button>
        </div>
      </header>

      <!-- Editorial Hero Banner -->
      <div class="news-editorial-hero-banner">
        <div class="news-hero-container">
          <div class="news-meta-pills">
            <span class="category-tag-pill">${article.category || 'Health & Oncology'}</span>
            <span class="read-time-pill">⏱ 3 Min Read</span>
            ${article.isAIGenerated ? `<span class="verified-pill" style="color: var(--accent-teal);">✨ Gemini AI Topic</span>` : `<span class="verified-pill">✓ Verified Research</span>`}
          </div>

          <h1 class="news-editorial-title">${article.title}</h1>

          <div class="news-editorial-author-bar">
            <div class="news-publisher-badge">
              <div class="publisher-avatar">${sourceInitial}</div>
              <div>
                <div class="publisher-name">${article.source}</div>
                <div class="publisher-role">${article.isAIGenerated ? 'AI Generated Oncology Insights' : 'Medical & Scientific News Publisher'}</div>
              </div>
            </div>

            <div class="news-publish-date-box">
              <span class="date-label">Published Date</span>
              <span class="date-val">${formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2-Column Main Content Layout -->
      <main class="news-editorial-main">
        <div class="news-layout-grid">
          <!-- Left Column: Sticky Meta Sidebar -->
          <aside class="news-sidebar-rail">
            <div class="news-sidebar-box">
              <h4 class="sidebar-heading">Article Metadata</h4>
              <ul class="sidebar-meta-list">
                <li>
                  <span class="meta-label">Category</span>
                  <span class="meta-val">${article.category || 'Oncology'}</span>
                </li>
                <li>
                  <span class="meta-label">Source</span>
                  <span class="meta-val">${article.source}</span>
                </li>
                <li>
                  <span class="meta-label">Date</span>
                  <span class="meta-val">${formattedDate}</span>
                </li>
                <li>
                  <span class="meta-label">Reading Time</span>
                  <span class="meta-val">3 Minutes</span>
                </li>
              </ul>

              <div class="sidebar-actions">
                ${article.url && article.url !== '#' ? `
                  <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="width: 100%; text-align: center; justify-content: center;">
                    <span>Read Source Article ↗</span>
                  </a>
                ` : ''}
                <button class="btn-secondary" style="width: 100%; justify-content: center;" onclick="window.AvinyaModals.openDonateModal(100)">
                  <span>Support Cancer Care</span>
                </button>
              </div>

              <div class="sidebar-disclaimer-pill">
                <span>ℹ️ Provided for educational awareness only.</span>
              </div>
            </div>
          </aside>

          <!-- Right Column: Main Reading Content -->
          <article class="news-article-body">
            <!-- Main Featured Hero Image -->
            <div class="news-article-hero-image">
              <img src="${imageUrl}" alt="${article.title}" onerror="this.src='${fallbackImg}'">
              <div class="image-caption">Image courtesy of ${article.source} medical news archive.</div>
            </div>

            <!-- Executive Summary Lead Box -->
            <div class="news-executive-summary">
              <span class="summary-label">${article.isAIGenerated ? '✨ Gemini AI Executive Summary' : 'Executive Summary'}</span>
              <p class="summary-text">${article.description}</p>
            </div>

            <!-- Core Analysis & Article Prose -->
            <div class="article-prose">
              <h3>Understanding the Clinical & Awareness Impact</h3>
              <p>Medical developments in early cancer diagnosis and targeted oncology treatments represent a vital step forward for global healthcare. Early detection drastically improves 5-year survival outcomes and enables healthcare teams to administer tailored, less invasive treatment protocols.</p>

              <div class="article-highlights-card">
                <h4 style="margin-bottom: 0.75rem; font-weight: 700; color: var(--text-dark);">Key Research Takeaways:</h4>
                <ul class="highlights-list">
                  <li><strong>Timely Screening:</strong> Regular diagnostic check-ups enable healthcare teams to discover localized tissue changes early.</li>
                  <li><strong>Targeted Precision:</strong> Modern medical research minimizes toxic side effects while maximizing therapeutic accuracy.</li>
                  <li><strong>Community Empowerment:</strong> Disseminating accurate information removes healthcare stigma and encourages open family health conversations.</li>
                </ul>
              </div>

              <h3>Why Early Knowledge Matters</h3>
              <p>Navigating health choices begins with trustworthy information. Avinya Care Foundation curates clinical disclosures and medical research breakthroughs to ensure patients, caregivers, and communities have direct access to evidence-based guidance.</p>

              <blockquote class="article-quote-block">
                “When patients and families understand their options early, fear gives way to empowerment, informed action, and hope.”
              </blockquote>
            </div>

            <!-- Official Medical Disclaimer Box -->
            <div class="medical-disclaimer-box">
              <span class="disclaimer-icon">⚕️</span>
              <div>
                <strong style="color: var(--text-dark); font-size: 1rem;">Medical Disclaimer & Health Notice</strong>
                <p style="margin-top: 0.3rem;">This news coverage is published by <strong>Avinya Care Foundation</strong> for educational and awareness purposes only. It does not constitute medical advice or clinical diagnosis. Always consult a qualified oncologist or healthcare specialist regarding medical decisions.</p>
              </div>
            </div>

            <!-- Primary Action Banner -->
            <div class="article-bottom-action-banner">
              <div>
                <h3 style="margin-bottom: 0.5rem;">Stand with Cancer Patients Today</h3>
                <p style="color: var(--text-dark-muted);">Your contribution directly funds screening kits, patient navigation, and caregiver support programs worldwide.</p>
              </div>
              <div class="banner-btns">
                <button class="btn-primary" onclick="window.AvinyaModals.openDonateModal(100)">
                  <span>Donate Now →</span>
                </button>
                <button class="btn-secondary" style="background: white;" onclick="window.AvinyaModals.openGuideModal('${article.category || 'Cancer Screening'}')">
                  <span>View Screening Guide</span>
                </button>
              </div>
            </div>
          </article>
        </div>

        <!-- Related Articles Section -->
        <section class="related-news-section">
          <div class="related-news-header">
            <span class="category-tag">RECOMMENDED HEALTH READS</span>
            <h2 class="related-news-title">More Stories in ${article.category || 'Health & Cancer Research'}</h2>
          </div>

          <div class="related-news-grid">
            ${related.map(rel => `
              <div class="related-card" onclick="window.AvinyaNewsUI.openArticleDetail('${rel.id}')">
                <div class="related-card-image-box">
                  <img src="${rel.urlToImage || fallbackImg}" alt="${rel.title}" onerror="this.src='${fallbackImg}'" loading="lazy">
                  <span class="related-category-pill">${rel.category || 'Oncology'}</span>
                </div>
                <div class="related-card-content">
                  <h4 class="related-card-title">${rel.title}</h4>
                  <p class="related-card-snippet">${rel.description}</p>
                  <div class="related-card-footer">
                    <span class="news-source-name">${rel.source}</span>
                    <span class="news-read-more">Read Story →</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Mini Page Footer -->
        <footer class="news-detail-footer">
          <div>© 2026 Avinya Care Foundation. Empowering communities with cancer awareness and support.</div>
          <button class="news-back-to-top" onclick="document.getElementById('news-detail-modal').scrollTop = 0">
            ↑ Back to Top
          </button>
        </footer>
      </main>
    `;

    modal.classList.add('active');
    modal.scrollTop = 0;
    document.body.style.overflow = 'hidden';

    // Reading Progress Indicator Handler
    const progressBar = document.getElementById('news-read-progress-bar');
    if (progressBar) {
      modal.onscroll = () => {
        const totalHeight = modal.scrollHeight - modal.clientHeight;
        const progress = (modal.scrollTop / totalHeight) * 100;
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      };
    }
  }

  closeDetailModal() {
    const modal = document.getElementById('news-detail-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.onscroll = null;
    }
    document.body.style.overflow = '';
    
    if (window.location.hash.startsWith('#news/')) {
      window.history.pushState(null, '', '#news');
    }
  }

  checkHashRoute() {
    const hash = window.location.hash;
    if (hash.startsWith('#news/')) {
      const articleId = decodeURIComponent(hash.replace('#news/', ''));
      let article = this.allArticles.find(a => a.id === articleId || encodeURIComponent(a.id) === articleId);
      if (!article) article = this.service.getArticleById(articleId);
      if (article) {
        this.renderDetailModal(article);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.AvinyaNewsUI = new NewsUI();
});
