/**
 * Avinya Care Foundation - Health & Cancer News Service
 * Handles API calls, 1-hour client/server caching, deduplication, and related story querying.
 */

class NewsService {
  constructor() {
    this.apiEndpoint = '/api/news';
    this.storageKey = 'avinya_health_news_cache';
    this.articles = [];
    this.lastUpdated = null;
  }

  async fetchNews() {
    try {
      // 1. Check local storage cache first if offline or fast render
      const localCache = this.getLocalCache();

      // 2. Fetch from application API route (which has 1-hour server-side cache)
      const res = await fetch(this.apiEndpoint);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

      const data = await res.json();
      if (data && data.articles) {
        this.articles = data.articles;
        this.lastUpdated = data.lastUpdated || Date.now();
        this.setLocalCache(data);
        return {
          articles: this.articles,
          lastUpdated: this.lastUpdated,
          fromCache: data.cached
        };
      }

      if (localCache) return localCache;
      throw new Error('Invalid news payload');
    } catch (err) {
      console.warn('News API network fetch failed, falling back to cache:', err.message);
      const localCache = this.getLocalCache();
      if (localCache) {
        return {
          ...localCache,
          isFallback: true
        };
      }
      return {
        articles: [],
        lastUpdated: null,
        error: true
      };
    }
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
      // Storage error
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
      // Storage full or unavailable
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
        // Priority to matching category
        if (a.category === currentArticle.category) return -1;
        if (b.category === currentArticle.category) return 1;
        return 0;
      })
      .slice(0, count);
  }

  getFormattedTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    const elapsedMinutes = Math.floor((Date.now() - timestamp) / (1000 * 60));
    
    if (elapsedMinutes < 1) return 'Updated just now';
    if (elapsedMinutes === 1) return 'Updated 1 minute ago';
    if (elapsedMinutes < 60) return `Updated ${elapsedMinutes} minutes ago`;
    
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours === 1) return 'Updated 1 hour ago';
    return `Updated ${elapsedHours} hours ago`;
  }
}

window.AvinyaNewsService = new NewsService();
