/** Gallery data access and presentation-independent record preparation. */
(function (global) {
  'use strict';

  function prepareItems(items) {
    items.forEach(item => {
      item.short_description = 'Archive media — event details and publication permissions require foundation confirmation.';
      item.description = item.short_description;
      item.event_date = null;
      item.location = 'Event details unverified';
      delete item.created_by; delete item.updated_by; delete item.photographer;
      ['title', 'short_description', 'description', 'alt_text', 'photographer'].forEach(field => {
        if (typeof item[field] === 'string') {
          item[field] = item[field].replace(/\bAvinya\s*Care(?:\s*(?:Foundation|Founation|Foundatation))?\b(?![.@/_-])/gi, 'AvinyaCareFoundation');
        }
      });
    });
    return items.sort((a, b) => {
      if (Boolean(a.is_featured) !== Boolean(b.is_featured)) return a.is_featured ? -1 : 1;
      const orderA = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : 0;
      const orderB = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0;
      if (orderA !== orderB) return orderA - orderB;
      const dA = new Date(a.updated_at || a.created_at || a.event_date || 0);
      const dB = new Date(b.updated_at || b.created_at || b.event_date || 0);
      return dB - dA;
    });
  }

  async function load(fetcher = fetch) {
    let items = [];
    try {
      const response = await fetcher('/api/gallery');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.status === 'ok' && Array.isArray(json.data)) items = json.data;
      else if (Array.isArray(json)) items = json;
      else throw new Error('Invalid API response');
    } catch (error) {
      console.warn('[Gallery API Notice] Primary endpoint unreachable, checking fallback...', error.message);
      try {
        const response = await fetcher('/api/gallery.php');
        const json = await response.json();
        if (json.status === 'ok' && Array.isArray(json.data)) items = json.data;
      } catch (fallbackError) {
        console.error('[Gallery API Error] Failed to load gallery dataset:', fallbackError);
      }
    }
    return prepareItems(items);
  }

  global.AvinyaGalleryService = { load, prepareItems };
})(window);
