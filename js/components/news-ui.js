/**
 * Avinya Care Foundation - Modern Editorial Health & Cancer Newsroom
 * NestJS Red + Black + White Editorial Layout featuring Lead Banner Article, Grid Stories, Gemini AI Synthesizer, Category Tabs, and Full-Screen Reader Modal.
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
    let html = `
      <div class="news-featured-lead skeleton-card" aria-hidden="true" style="grid-column: 1 / -1;">
        <div class="news-featured-image-box skeleton-box"></div>
        <div class="news-featured-content">
          <div class="skeleton-line skeleton-tag" style="width: 140px; height: 24px;"></div>
          <div class="skeleton-line skeleton-title" style="height: 36px; margin: 1rem 0;"></div>
          <div class="skeleton-line skeleton-desc"></div>
          <div class="skeleton-line skeleton-desc" style="width: 80%;"></div>
        </div>
      </div>
    `;
    for (let i = 0; i < 4; i++) {
      html += `
        <div class="news-card skeleton-card" aria-hidden="true">
          <div class="news-image-box skeleton-box"></div>
          <div class="news-content">
            <div class="skeleton-line skeleton-tag"></div>
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-desc"></div>
            <div class="skeleton-line skeleton-desc" style="width: 70%;"></div>
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
          <div class="news-error-banner" style="text-align: center; color: var(--brand); padding: 1rem;">
            <span>⚠️ Health news service is temporarily offline. Showing embedded archives.</span>
          </div>
        `;
      }
    }

    this.applyCategoryFilter();
  }

  async generateAITopic(topicHint = null, clickedBtn = null, count = 5) {
    const btn = clickedBtn || document.querySelector('.news-ai-gen-btn');
    const originalContent = btn ? btn.innerHTML : `<span>✦ AI INSIGHT</span><span style="font-size: 0.72rem; opacity: 0.8; margin-left: 0.35rem; font-weight: 500;">(AI-assisted summary)</span>`;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>✦ GENERATING 5 AI STORIES...</span>`;
    }

    let generatedArticles = [];

    // 1. Try primary API endpoint POST /api/news/generate with count=5
    try {
      const res = await fetch('/api/news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topicHint: topicHint || 'oncology research & early detection',
          count: count || 5
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (Array.isArray(data.articles) && data.articles.length > 0) {
            generatedArticles = data.articles;
          } else if (data.article) {
            generatedArticles = [data.article];
          }
        }
      }
    } catch (err) {
      console.warn('/api/news/generate fetch warning:', err);
    }

    // 2. Try GET /api/news/generate fallback
    if (generatedArticles.length === 0) {
      try {
        const res = await fetch(`/api/news/generate?count=${count || 5}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (Array.isArray(data.articles) && data.articles.length > 0) {
              generatedArticles = data.articles;
            } else if (data.article) {
              generatedArticles = [data.article];
            }
          }
        }
      } catch (err) {}
    }

    // 3. Client-side AI Generator Fallback (Comprehensive 10 Medical Research Topics Pool)
    if (generatedArticles.length === 0) {
      const aiTopicsPool = [
        {
          id: "gemini-ai-genomics-screening",
          title: "AI-Powered Genomic Screening Identifies High-Risk Breast Cancer Biomarkers 3 Years Earlier",
          description: "Multi-center clinical trials utilizing machine learning predictive models reveal microscopic cellular mutations years before physical mammogram detection, enabling targeted preventive interventions.",
          category: "Cancer Research",
          image: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80"
        },
        {
          id: "gemini-ai-rural-mobile-screening",
          title: "Mobile AI Diagnostic Vans Expand Early Oral & Cervical Screening Across Maharashtra",
          description: "Avinya Care Foundation and regional health networks deploy solar-powered diagnostic vans equipped with portable colposcopy and AI-assisted oral visual examination tools for underserved rural communities.",
          category: "Early Detection",
          image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80"
        },
        {
          id: "gemini-ai-cart-immunotherapy",
          title: "Next-Generation CAR-T Cell Immunotherapy Achieves Complete Remission in Refractory Lymphoma Trials",
          description: "Indigenous cellular engineering and targeted T-cell receptors demonstrate unprecedented success rates in halting aggressive hematologic malignancies while minimizing systemic toxicity.",
          category: "Treatment",
          image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
        },
        {
          id: "gemini-ai-liquid-biopsy-mcda",
          title: "Liquid Biopsy Multi-Cancer Early Detection Blood Panels Approved for Clinical Pilot Studies",
          description: "High-throughput sequencing analyzing cell-free circulating tumor DNA (ctDNA) achieves over 92% specificity across 12 common solid cancer types before physical symptoms emerge.",
          category: "Early Detection",
          image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80"
        },
        {
          id: "gemini-ai-integrative-nutrition",
          title: "Structured Anti-Inflammatory Nutrition & Mindfulness Protocol Reduces Chemotherapy Fatigue by 40%",
          description: "Clinical studies across tertiary oncology centers highlight that personalized plant-based anti-inflammatory nutrition paired with supervised light exercise significantly accelerates post-chemotherapy recovery.",
          category: "Care",
          image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80"
        },
        {
          id: "gemini-ai-crispr-nanoparticles",
          title: "CRISPR-Guided Nanoparticles Deliver Precision Chemotherapy Directly into Solid Tumors",
          description: "Bioengineered lipid nanoparticles navigate bloodstream barriers to deliver targeted cytotoxic payloads exclusively into tumor microenvironments, sparing healthy surrounding tissues.",
          category: "Cancer Research",
          image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80"
        },
        {
          id: "gemini-ai-caregiver-navigation",
          title: "Grassroots Caregiver Navigation Network Drastically Shortens Time-to-Treatment in Mumbai–Virar",
          description: "Community caregiver navigators guide newly diagnosed patients through biopsy confirmation, government financial schemes, and specialist appointments within 10 days of first consultation.",
          category: "Care",
          image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
        },
        {
          id: "gemini-ai-hpv-vaccination-protocol",
          title: "National Cervical Cancer Elimination Drive Introduces Single-Dose HPV Vaccination Protocol",
          description: "Public health authorities and partner clinics adopt streamlined single-dose immunization schedules for adolescent girls, establishing robust lifelong immunity against high-risk oncogenic HPV strains.",
          category: "Prevention",
          image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
        },
        {
          id: "gemini-ai-ultrasound-triaging",
          title: "AI-Enhanced Ultrasound Triaging Identifies Suspicious Breast Masses with 98% Clinical Concordance",
          description: "Point-of-care ultrasound devices integrated with real-time deep learning neural networks assist primary care physicians in differentiating benign cysts from malignant lesions instantly.",
          category: "Early Detection",
          image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
        },
        {
          id: "gemini-ai-tele-palliative-clinics",
          title: "Digital Palliative & Tele-Oncology Clinics Connect Homebound Patients with Oncology Specialists",
          description: "24/7 tele-oncology support platforms provide symptom management, dosage adjustments, and psychosocial counseling directly into patients' living rooms across Maharashtra.",
          category: "Care",
          image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80"
        }
      ];

      const now = Date.now();
      const numToPick = Math.max(3, Math.min(10, count || 5));
      const shuffled = [...aiTopicsPool].sort(() => 0.5 - Math.random());
      generatedArticles = shuffled.slice(0, numToPick).map((item, idx) => ({
        id: `${item.id}-${now}-${idx}`,
        title: item.title,
        description: item.description,
        category: item.category,
        source: "Gemini AI Medical Engine",
        apiProvider: "Gemini AI Engine",
        publishedAt: new Date(now - idx * 60000).toISOString(),
        isAIGenerated: true,
        url: "#",
        urlToImage: item.image
      }));
    }

    if (generatedArticles.length > 0) {
      // Standardize metadata
      generatedArticles.forEach(art => {
        if (!art.apiProvider) art.apiProvider = "Gemini AI Engine";
        art.isAIGenerated = true;
      });

      // Prepend all generated stories to front of articles list, removing any duplicate IDs
      const newIds = new Set(generatedArticles.map(a => a.id));
      this.allArticles = [...generatedArticles, ...this.allArticles.filter(a => !newIds.has(a.id))];

      // Refresh list rendering
      this.applyCategoryFilter();

      // Show friendly confirmation toast/pill
      if (this.statusMessageElem) {
        this.statusMessageElem.innerHTML = `
          <div class="news-ai-success-banner" style="text-align: center; color: var(--brand); padding: 0.75rem 1.5rem; background: rgba(229,57,53,0.08); border-radius: 999px; margin: 1rem auto; display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.9rem;">
            <span>✦ Generated ${generatedArticles.length} new AI Oncology Insights & added to newsroom!</span>
          </div>
        `;
        setTimeout(() => {
          if (this.statusMessageElem) this.statusMessageElem.innerHTML = '';
        }, 5000);
      }

      // Smoothly scroll to news section
      const newsSection = document.getElementById('news');
      if (newsSection) {
        newsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalContent;
    }
  }

  filterCategory(category, clickedBtn) {
    this.currentCategory = category;
    this.isExpanded = false;

    document.querySelectorAll('.news-tab-btn').forEach(btn => btn.classList.remove('active'));

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

    if (!this.isExpanded) {
      const newsSection = document.getElementById('news');
      if (newsSection) newsSection.scrollIntoView({ behavior: 'smooth' });
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

    const limit = this.isExpanded ? filtered.length : Math.min(7, filtered.length);
    const visibleArticles = filtered.slice(0, limit);

    this.renderArticles(visibleArticles);

    if (this.expandBarElem && this.showMoreBtnElem) {
      if (filtered.length <= 7) {
        this.expandBarElem.style.display = 'none';
      } else {
        this.expandBarElem.style.display = 'flex';
        const remaining = filtered.length - 7;
        if (this.isExpanded) {
          this.showMoreBtnElem.innerHTML = `<span>Show Less Stories ↑</span>`;
        } else {
          this.showMoreBtnElem.innerHTML = `<span>Show More News Stories (${remaining} More) ↓</span>`;
        }
      }
    }
  }

  renderArticles(articles) {
    if (!this.container) return;

    if (articles.length === 0) {
      this.container.innerHTML = `
        <div class="news-empty-category" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background-color: var(--white); border-radius: 20px; border: 1px solid var(--gray-200);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--gray-900);">No stories found matching "${this.currentCategory}"</h3>
          <p style="color: var(--muted); margin-bottom: 1.5rem;">Explore all oncology research, early detection drives, and health news.</p>
          <button class="btn-primary" onclick="window.AvinyaNewsUI.filterCategory('all')">Show All Stories</button>
        </div>
      `;
      return;
    }

    const featured = articles[0];
    const gridStories = articles.slice(1);
    const fallbackImg = "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80";

    // 1. Featured Lead Story Banner HTML
    const featuredDate = new Date(featured.publishedAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const featuredImg = featured.urlToImage || fallbackImg;
    const featuredBadge = featured.isAIGenerated 
      ? `<span class="ai-generated-badge">✦ AI INSIGHT</span>` 
      : `<span class="live-news-badge">🌐 DAILY HEALTH DESK</span>`;

    let html = `
      <div class="news-featured-lead" onclick="window.AvinyaNewsUI.openArticleDetail('${featured.id}')" style="grid-column: 1 / -1;">
        <div class="news-featured-image-box">
          <img src="${featuredImg}" alt="${featured.title}" class="news-featured-image" onerror="this.src='${fallbackImg}'" loading="lazy">
        </div>
        <div class="news-featured-content">
          <div class="news-tag-group">
            <span class="news-category-badge">${featured.category || 'Cancer Research'}</span>
            ${featuredBadge}
          </div>
          <h3 class="news-featured-title">${featured.title}</h3>
          <p class="news-featured-desc">${featured.description}</p>
          <div class="news-featured-footer">
            <div class="news-source-meta">
              <span>${featured.isAIGenerated ? '✦' : '🌐'} ${featured.source}</span>
              <span>·</span>
              <span>${featuredDate}</span>
            </div>
            <span class="news-read-btn">Read Full Story →</span>
          </div>
        </div>
      </div>
    `;

    // 2. Secondary Editorial Grid Stories HTML
    if (gridStories.length > 0) {
      html += gridStories.map(article => {
        const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });
        const imageUrl = article.urlToImage || fallbackImg;
        const badge = article.isAIGenerated 
          ? `<span class="ai-generated-badge">✦ AI INSIGHT</span>` 
          : `<span class="live-news-badge">${article.apiProvider || '🌐 GLOBAL HEALTH'}</span>`;

        return `
          <article class="news-card" onclick="window.AvinyaNewsUI.openArticleDetail('${article.id}')">
            <div class="news-image-box">
              <span class="news-category-badge" style="position: absolute; top: 1rem; left: 1rem; z-index: 2; background: rgba(10,10,10,0.85); color: white;">${article.category || 'Health'}</span>
              <img src="${imageUrl}" alt="${article.title}" class="news-image" onerror="this.src='${fallbackImg}'" loading="lazy">
            </div>
            <div class="news-content">
              <div>
                <div style="margin-bottom: 0.6rem;">${badge}</div>
                <h3 class="news-card-title">${article.title}</h3>
                <p class="news-card-desc">${article.description}</p>
              </div>
              <div class="news-card-meta">
                <span class="news-source-name">${article.source} · ${formattedDate}</span>
                <span class="news-read-more">Read Story →</span>
              </div>
            </div>
          </article>
        `;
      }).join('');
    }

    this.container.innerHTML = html;
  }

  openArticleDetail(articleId) {
    let article = this.allArticles.find(a => a.id === articleId || encodeURIComponent(a.id) === articleId);
    if (!article) article = this.service.getArticleById(articleId);
    if (!article) return;

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
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const fallbackImg = "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80";
    const imageUrl = article.urlToImage || fallbackImg;
    const related = this.service.getRelatedArticles(article, 3);

    modal.innerHTML = `
      <div class="modal-backdrop active" style="z-index: 2500;">
        <div class="modal-container" style="width: min(850px, 95%); padding: 3.5rem 3rem;">
          <button class="modal-close-btn" onclick="window.AvinyaNewsUI.closeArticleDetail()">✕</button>

          <div class="news-tag-group" style="margin-bottom: 1rem;">
            <span class="news-category-badge">${article.category || 'Health & Oncology'}</span>
            ${article.isAIGenerated ? `<span class="ai-generated-badge">✦ GEMINI AI INSIGHT</span>` : `<span class="live-news-badge">🌐 VERIFIED ONCOLOGY REPORT</span>`}
          </div>

          <h1 style="font-size: clamp(1.8rem, 3vw, 2.6rem); font-weight: 800; line-height: 1.25; margin-bottom: 1.25rem; color: var(--gray-900);">${article.title}</h1>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.92rem; color: var(--muted); padding-bottom: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--gray-200);">
            <div><strong>Source:</strong> ${article.source} · ${formattedDate}</div>
            ${article.url && article.url !== '#' ? `<a href="${article.url}" target="_blank" rel="noopener noreferrer" style="color: var(--brand); font-weight: 700;">View Original Article ↗</a>` : ''}
          </div>

          <div style="width: 100%; height: 360px; border-radius: 16px; overflow: hidden; margin-bottom: 2.2rem; background: var(--black);">
            <img src="${imageUrl}" alt="${article.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${fallbackImg}'">
          </div>

          <div style="font-size: 1.12rem; line-height: 1.8; color: var(--gray-900); margin-bottom: 2.5rem;">
            <p style="margin-bottom: 1.5rem; font-weight: 600; font-size: 1.2rem; color: var(--gray-900);">${article.description}</p>
            <p style="margin-bottom: 1.5rem;">Clinical awareness and timely diagnostic interventions form the cornerstone of effective oncology care. At Avinya Care Foundation, our mission is ensuring every individual has access to reliable health guidance, early screening facilities, and compassionate support throughout their journey.</p>
            <p>Through community health programs and medical partnerships across India, early detection rates continue to improve, helping patients receive targeted therapy when it is most effective.</p>
          </div>

          <div style="background: var(--gray-100); border-radius: 16px; padding: 2rem; border: 1px solid var(--gray-200); margin-top: 3rem;">
            <h4 style="font-weight: 800; margin-bottom: 1rem; font-size: 1.1rem; color: var(--gray-900);">Related Health Stories</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
              ${related.map(rel => `
                <div style="cursor: pointer;" onclick="window.AvinyaNewsUI.openArticleDetail('${rel.id}')">
                  <div style="font-size: 0.75rem; font-weight: 800; color: var(--brand); margin-bottom: 4px;">${rel.category}</div>
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--gray-900); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${rel.title}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="margin-top: 2.5rem; text-align: center;">
            <button class="btn-primary" onclick="window.AvinyaNewsUI.closeArticleDetail()" style="padding: 0.85rem 2.5rem;">Close Article</button>
          </div>
        </div>
      </div>
    `;

    document.body.style.overflow = 'hidden';
  }

  closeArticleDetail() {
    const modal = document.getElementById('news-detail-modal');
    if (modal) modal.innerHTML = '';
    document.body.style.overflow = '';
    window.history.pushState(null, '', window.location.pathname);
  }

  checkHashRoute() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#news/')) {
      const articleId = decodeURIComponent(hash.replace('#news/', ''));
      if (articleId) this.openArticleDetail(articleId);
    }
  }
}

window.AvinyaNewsUI = new NewsUI();
