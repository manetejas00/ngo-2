// Universal IP-Based Rate Limiting Store & Middleware
const rateLimitStore = new Map();

// Periodic cleanup of stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.startTime > 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function checkRateLimit(req, res) {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const clientIp = rawIp.split(',')[0].trim();
  const urlPath = (req.url || '').split('?')[0];

  // Determine threshold per route type
  let maxRequests = 180; // Default for static files (html, css, js, assets)
  const windowMs = 60 * 1000; // 1 minute window

  if (urlPath === '/api/submit-form' || urlPath === '/api/admin-auth' || urlPath === '/api/admin-auth.php' || urlPath === '/api/news/generate') {
    maxRequests = 15; // Strict 15 req/min for auth, form submissions, and AI generation
  } else if (urlPath.startsWith('/api/')) {
    maxRequests = 60; // Standard 60 req/min for general API endpoints
  }

  const categoryKey = urlPath.startsWith('/api/') ? 'api' : 'static';
  const key = `${clientIp}:${categoryKey}:${urlPath}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);
  if (!record || now - record.startTime > windowMs) {
    record = { count: 1, startTime: now };
    rateLimitStore.set(key, record);
  } else {
    record.count++;
  }

  const remaining = Math.max(0, maxRequests - record.count);
  const resetSeconds = Math.ceil((record.startTime + windowMs - now) / 1000);

  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetSeconds);

  if (record.count > maxRequests) {
    res.setHeader('Retry-After', resetSeconds);
    res.writeHead(429, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      status: 'error',
      message: `Too many requests to ${urlPath}. Please slow down and try again in ${resetSeconds} seconds.`
    }));
    return false;
  }

  return true;
}
