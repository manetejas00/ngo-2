/** Fetch and validate the donation data consumed by public UI components. */
(function (global) {
  'use strict';

  async function load(fetcher = fetch) {
    const [statsResponse, recentResponse] = await Promise.all([
      fetcher('/api/donations/stats', { cache: 'no-store' }),
      fetcher('/api/donations/recent', { cache: 'no-store' })
    ]);
    if (!statsResponse.ok || !recentResponse.ok) throw new Error('Donation data is temporarily unavailable.');
    const [statsPayload, recentPayload] = await Promise.all([statsResponse.json(), recentResponse.json()]);
    if (statsPayload.status !== 'ok' || !statsPayload.stats || recentPayload.status !== 'ok') {
      throw new Error('Donation data response is invalid.');
    }
    return { stats: statsPayload.stats, donations: recentPayload.donations };
  }

  global.AvinyaDonationService = { load };
})(window);
