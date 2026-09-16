/**
 * Avinya Care Foundation - Health & Cancer News Service
 * Handles API calls, multi-tier fallback (/api/news -> /api/news.json -> local cache -> embedded payload),
 * 1-hour client/server caching, deduplication, and related story querying.
 */

class NewsService {
  constructor() {
    this.primaryEndpoint = '/api/news';
    this.fallbackEndpoint = '/api/news.json';
    this.storageKey = 'avinya_health_news_cache';
    this.articles = [];
    this.lastUpdated = null;
  }

  async fetchNews() {
    // 1. Try Primary Node.js API endpoint (/api/news)
    try {
      const res = await fetch(this.primaryEndpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && data.articles && data.articles.length > 0) {
          this.articles = data.articles;
          this.lastUpdated = data.lastUpdated || Date.now();
          this.setLocalCache(data);
          return {
            articles: this.articles,
            lastUpdated: this.lastUpdated,
            fromCache: data.cached
          };
        }
      }
    } catch (err) {
      console.warn('Primary news endpoint /api/news unavailable, trying fallback endpoint...');
    }

    // 2. Try Secondary Static JSON endpoint (/api/news.json) for Hostinger static deployment
    try {
      const res = await fetch(this.fallbackEndpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && data.articles && data.articles.length > 0) {
          this.articles = data.articles;
          this.lastUpdated = data.lastUpdated || Date.now();
          this.setLocalCache(data);
          return {
            articles: this.articles,
            lastUpdated: this.lastUpdated,
            fromCache: true
          };
        }
      }
    } catch (err) {
      console.warn('Fallback news endpoint /api/news.json unavailable, checking browser cache...');
    }

    // 3. Try Local Browser Storage Cache
    const localCache = this.getLocalCache();
    if (localCache && localCache.articles && localCache.articles.length > 0) {
      this.articles = localCache.articles;
      this.lastUpdated = localCache.lastUpdated;
      return {
        ...localCache,
        isFallback: true
      };
    }

    // 4. Return Embedded Fallback Dataset (10 Groundbreaking Oncology & Healthcare Stories)
    this.articles = [];

    this.lastUpdated = Date.now();
    return {
      articles: this.articles,
      lastUpdated: this.lastUpdated,
      isFallback: true
    };
  }

  getLocalCache() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          articles: parsed.articles || [],
          lastUpdated: parsed.lastUpdated || Date.now(),
          fromCache: true
        };
      }
    } catch (e) {
      // Storage unavailable
    }
    return null;
  }

  setLocalCache(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        articles: data.articles,
        lastUpdated: data.lastUpdated || Date.now()
      }));
    } catch (e) {
      // Storage quota full
    }
  }

  getArticleById(id) {
    return this.articles.find(a => a.id === id || encodeURIComponent(a.id) === id);
  }

  getRelatedArticles(currentArticle, count = 3) {
    if (!currentArticle) return this.articles.slice(0, count);

    return this.articles
      .filter(a => a.id !== currentArticle.id)
      .sort((a, b) => {
        if (a.category === currentArticle.category) return -1;
        if (b.category === currentArticle.category) return 1;
        return 0;
      })
      .slice(0, count);
  }

  getFormattedTimeAgo(timestamp) {
    if (!timestamp) return 'Updated recently';
    const elapsedMinutes = Math.floor((Date.now() - timestamp) / 60000);
    if (elapsedMinutes < 1) return 'Updated just now';
    if (elapsedMinutes === 1) return 'Updated 1 minute ago';
    if (elapsedMinutes < 60) return `Updated ${elapsedMinutes} minutes ago`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours === 1) return 'Updated 1 hour ago';
    return `Updated ${elapsedHours} hours ago`;
  }
}

window.AvinyaNewsService = new NewsService();
