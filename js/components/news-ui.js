/**
 * AvinyaCareFoundation - Modern Editorial Health & Medical Newsroom
 * NestJS Editorial Layout featuring Lead Banner Article, Grid Stories, Category Tabs, and Full-Screen Reader Modal.
 */

const NEWS_TEMPLATE_IMAGE = '/assets/images/news/news-placeholder.webp';

function resolveNewsImage(apiImage) {
  if (typeof apiImage !== 'string' || !apiImage.trim()) return NEWS_TEMPLATE_IMAGE;

  try {
    const url = new URL(apiImage.trim(), window.location.origin);
    return url.protocol === 'https:' ? url.href : NEWS_TEMPLATE_IMAGE;
  } catch (_) {
    return NEWS_TEMPLATE_IMAGE;
  }
}

function renderNewsImage(apiImage, alt, className) {
  const imageUrl = resolveNewsImage(apiImage);
  return `<img src="${imageUrl}" alt="${alt}" class="${className}" loading="lazy" decoding="async"
    onload="this.closest('.news-image-box, .news-featured-image-box, .news-detail-image-box')?.classList.remove('is-loading')"
    onerror="if (this.dataset.fallbackApplied) return; this.dataset.fallbackApplied = 'true'; this.src = '${NEWS_TEMPLATE_IMAGE}';">`;
}

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
    this.initialVisibleCount = 7;
    this.visibleCount = 0;
    this.isExpanded = false;
    this.isToggling = false;
    this.init();
  }

  async init() {
    if (!this.container) return;
    this.renderSkeletons();
    await this.loadAndRenderNews();

    // Check hash URL for direct article deep links (e.g. #news/article-id)
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

    // Ensure articles are ALWAYS ordered with the newest published stories first
    this.allArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();
      return dateB - dateA;
    });

    if (this.timestampElem && data.lastUpdated) {
      this.timestampElem.textContent = this.service.getFormattedTimeAgo(data.lastUpdated);
    }

    if (this.allArticles.length === 0) {
      if (this.statusMessageElem) {
        this.statusMessageElem.innerHTML = `
          <div class="news-error-banner" style="text-align: center; color: var(--brand); padding: 1rem;">
            <span>🌐 Live health news desk loading... Please check connection.</span>
          </div>
        `;
      }
    } else {
      this.renderDynamicCategoryTabs();
    }

    this.applyCategoryFilter();
  }

  renderDynamicCategoryTabs() {
    const tabContainer = document.querySelector('.news-category-tabs');
    if (!tabContainer || !this.allArticles || this.allArticles.length === 0) return;

    // Collect all unique categories and count total articles per category
    const counts = {};
    this.allArticles.forEach(art => {
      const cat = art.category || 'Global Health';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const categories = Object.keys(counts);

    let html = `
      <button type="button" class="news-tab-btn ${this.currentCategory === 'all' ? 'active' : ''}" data-category="all" onclick="window.AvinyaNewsUI.filterCategory('all', this)">
        All (${this.allArticles.length})
      </button>
    `;

    categories.forEach(cat => {
      const isSel = this.currentCategory.toLowerCase() === cat.toLowerCase();
      const escapedCat = cat.replace(/'/g, "\\'");
      html += `
        <button type="button" class="news-tab-btn ${isSel ? 'active' : ''}" data-category="${cat}" onclick="window.AvinyaNewsUI.filterCategory('${escapedCat}', this)">
          ${cat} (${counts[cat]})
        </button>
      `;
    });

    tabContainer.innerHTML = html;
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

  toggleShowMore(event) {
    event?.preventDefault();

    if (this.isToggling) return;

    const filtered = this.getFilteredArticles();
    const collapsedCount = Math.min(this.initialVisibleCount, filtered.length);
    if (filtered.length <= collapsedCount) return;

    const viewportAnchor = this.captureViewportAnchor(this.showMoreBtnElem);
    this.isToggling = true;
    this.updateExpandControl(filtered.length);

    if (this.isExpanded) {
      this.removeAppendedArticles();
      this.visibleCount = collapsedCount;
      this.isExpanded = false;
    } else {
      const newArticles = filtered.slice(this.visibleCount, filtered.length);
      this.appendArticles(newArticles);
      this.visibleCount = filtered.length;
      this.isExpanded = true;
    }

    this.updateExpandControl(filtered.length);
    this.restoreViewportAnchor(viewportAnchor, () => {
      this.isToggling = false;
      this.updateExpandControl(filtered.length);
    });
  }

  applyCategoryFilter() {
    if (!this.allArticles || this.allArticles.length === 0) return;

    const filtered = this.getFilteredArticles();
    const limit = Math.min(this.initialVisibleCount, filtered.length);
    const visibleArticles = filtered.slice(0, limit);

    this.isExpanded = false;
    this.visibleCount = limit;
    this.renderArticles(visibleArticles);
    this.updateExpandControl(filtered.length);
  }

  getFilteredArticles() {
    if (this.currentCategory === 'all') return this.allArticles;

    const category = this.currentCategory.toLowerCase();
    return this.allArticles.filter(article => {
      const articleCategory = (article.category || '').toLowerCase();
      const articleTitle = (article.title || '').toLowerCase();
      const articleDescription = (article.description || '').toLowerCase();
      return articleCategory.includes(category)
        || articleTitle.includes(category)
        || articleDescription.includes(category);
    });
  }

  updateExpandControl(totalArticles) {
    if (!this.expandBarElem || !this.showMoreBtnElem) return;

    if (totalArticles <= this.initialVisibleCount) {
      this.expandBarElem.style.display = 'none';
      return;
    }

    this.expandBarElem.style.display = 'flex';
    this.showMoreBtnElem.disabled = this.isToggling;
    this.showMoreBtnElem.setAttribute('aria-busy', String(this.isToggling));

    if (this.isToggling) {
      this.showMoreBtnElem.innerHTML = '<span>Updating stories…</span>';
    } else if (this.isExpanded) {
      this.showMoreBtnElem.innerHTML = '<span>Show Less Stories ↑</span>';
    } else {
      const remaining = totalArticles - this.initialVisibleCount;
      this.showMoreBtnElem.innerHTML = `<span>Show More News Stories (${remaining} More) ↓</span>`;
    }
  }

  captureViewportAnchor(element) {
    if (!element) return null;
    return { element, top: element.getBoundingClientRect().top };
  }

  restoreViewportAnchor(anchor, done) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (anchor?.element?.isConnected) {
          const layoutShift = anchor.element.getBoundingClientRect().top - anchor.top;
          if (Math.abs(layoutShift) > 1) {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const compensatedScroll = Math.max(0, Math.min(maxScroll, window.scrollY + layoutShift));
            window.scrollTo({ top: compensatedScroll, behavior: 'instant' });
          }
        }
        done?.();
      });
    });
  }

  removeAppendedArticles() {
    this.container?.querySelectorAll('[data-news-appended="true"]').forEach(article => article.remove());
  }

  appendArticles(articles) {
    if (!this.container || articles.length === 0) return;

    const html = articles.map((article) => {
      const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      return `
        <article class="news-card" data-news-appended="true" onclick="window.AvinyaNewsUI.openArticleDetail('${article.id}')">
          <div class="news-image-box is-loading">
            <span class="news-category-badge" style="position: absolute; top: 1rem; left: 1rem; z-index: 2; background: rgba(10,10,10,0.85); color: white;">${article.category || 'Health'}</span>
            ${renderNewsImage(article.urlToImage, article.title, 'news-image')}
          </div>
          <div class="news-content">
            <div>
              <div style="margin-bottom: 0.6rem;"><span class="live-news-badge">${article.apiProvider || '🌐 LIVE NEWS'}</span></div>
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

    this.container.insertAdjacentHTML('beforeend', html);
  }

  renderArticles(articles) {
    if (!this.container) return;

    if (articles.length === 0) {
      this.container.innerHTML = `
        <div class="news-empty-category" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background-color: var(--white); border-radius: 20px; border: 1px solid var(--gray-200);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--gray-900);">No stories found matching "${this.currentCategory}"</h3>
          <p style="color: var(--muted); margin-bottom: 1.5rem;">Explore all live healthcare research and news.</p>
          <button class="btn-primary" onclick="window.AvinyaNewsUI.filterCategory('all')">Show All Stories</button>
        </div>
      `;
      return;
    }

    const featured = articles[0];
    const gridStories = articles.slice(1);

    const featuredDate = new Date(featured.publishedAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    let html = `
      <div class="news-featured-lead" onclick="window.AvinyaNewsUI.openArticleDetail('${featured.id}')" style="grid-column: 1 / -1;">
        <div class="news-featured-image-box is-loading">
          ${renderNewsImage(featured.urlToImage, featured.title, 'news-featured-image')}
        </div>
        <div class="news-featured-content">
          <div class="news-tag-group">
            <span class="news-category-badge">${featured.category || 'Global Health'}</span>
            <span class="live-news-badge">🌐 LIVE HEALTH DESK</span>
          </div>
          <h3 class="news-featured-title">${featured.title}</h3>
          <p class="news-featured-desc">${featured.description}</p>
          <div class="news-featured-footer">
            <div class="news-source-meta">
              <span>🌐 ${featured.source}</span>
              <span>·</span>
              <span>${featuredDate}</span>
            </div>
            <span class="news-read-btn">Read Full Story →</span>
          </div>
        </div>
      </div>
    `;

    if (gridStories.length > 0) {
      html += gridStories.map((article) => {
        const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });

        return `
          <article class="news-card" onclick="window.AvinyaNewsUI.openArticleDetail('${article.id}')">
            <div class="news-image-box is-loading">
              <span class="news-category-badge" style="position: absolute; top: 1rem; left: 1rem; z-index: 2; background: rgba(10,10,10,0.85); color: white;">${article.category || 'Health'}</span>
              ${renderNewsImage(article.urlToImage, article.title, 'news-image')}
            </div>
            <div class="news-content">
              <div>
                <div style="margin-bottom: 0.6rem;"><span class="live-news-badge">${article.apiProvider || '🌐 LIVE NEWS'}</span></div>
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

    if (window.AvinyaAnalytics) window.AvinyaAnalytics.event('news_article_viewed');

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

    const related = this.service.getRelatedArticles(article, 3);

    modal.innerHTML = `
      <div class="modal-backdrop active" style="z-index: 99999;">
        <div class="modal-container news-modal-container">
          <button class="modal-close-btn" onclick="window.AvinyaNewsUI.closeArticleDetail()" aria-label="Close article">✕</button>

          <div class="news-tag-group" style="margin-bottom: 0.85rem;">
            <span class="news-category-badge">${article.category || 'Health & Medical'}</span>
            <span class="live-news-badge">🌐 VERIFIED HEALTH REPORT</span>
          </div>

          <h1 class="news-modal-title">${article.title}</h1>

          <div class="news-modal-meta">
            <div><strong>Source:</strong> ${article.source} · ${formattedDate}</div>
            ${article.url && article.url !== '#' ? `<a href="${article.url}" target="_blank" rel="noopener noreferrer" style="color: var(--brand); font-weight: 700;">View Original Article ↗</a>` : ''}
          </div>

          <div class="news-detail-image-box is-loading">
            ${renderNewsImage(article.urlToImage, article.title, 'news-detail-image')}
          </div>

          <div class="news-modal-body">
            <p>${article.description}</p>
          </div>

          <div class="news-related-box">
            <h4 class="news-related-heading">Related Health Stories</h4>
            <div class="news-related-grid">
              ${related.map(rel => `
                <div class="news-related-card" onclick="window.AvinyaNewsUI.openArticleDetail('${rel.id}')">
                  <div class="news-related-category">${rel.category}</div>
                  <div class="news-related-title">${rel.title}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="news-modal-close-footer">
            <button class="btn-primary" onclick="window.AvinyaNewsUI.closeArticleDetail()">Close Article</button>
          </div>
        </div>
      </div>
    `;

    document.body.style.overflow = 'hidden';
    document.body.classList.add('news-modal-open');
  }

  closeArticleDetail() {
    const modal = document.getElementById('news-detail-modal');
    if (modal) modal.innerHTML = '';
    document.body.style.overflow = '';
    document.body.classList.remove('news-modal-open');
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
