/** Read-only healthcare API client shared by the platform's views. */
(function (global) {
  'use strict';

  async function fetchJson(endpoint, fetcher = fetch) {
    const response = await fetcher(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${endpoint}`);

    const text = (await response.text()).trim();
    if (!text) throw new Error(`Empty response from ${endpoint}`);
    if (text.startsWith('<')) throw new Error(`Expected JSON from ${endpoint}, received HTML instead`);
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Invalid JSON from ${endpoint}: ${error.message}`);
    }
  }

  async function fetchWithFallback(primary, fallback, label, request = fetchJson) {
    try {
      return await request(primary);
    } catch (error) {
      console.warn(`[Healthcare Platform] ${label} primary endpoint failed:`, error.message);
    }
    if (!fallback) return null;
    try {
      return await request(fallback);
    } catch (error) {
      console.warn(`[Healthcare Platform] ${label} fallback endpoint failed:`, error.message);
      return null;
    }
  }

  global.AvinyaHealthcareApi = { fetchJson, fetchWithFallback };
})(window);
