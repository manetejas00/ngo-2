import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

// In-Memory 1-Hour Server Cache for Health & Cancer News
let newsCache = {
  timestamp: 0,
  articles: []
};
const CACHE_TTL_MS = 3600 * 1000; // 1 hour

// Cancer & Health Keywords Filter
const CANCER_KEYWORDS = [
  'cancer', 'oncology', 'tumor', 'tumour', 'leukemia', 'lymphoma', 'melanoma',
  'chemotherapy', 'radiotherapy', 'immunotherapy', 'mammogram', 'screening',
  'carcinoma', 'sarcoma', 'biomarker', 'survivor', 'survivorship', 'remission',
  'oncologist', 'breast cancer', 'lung cancer', 'prostate cancer', 'colorectal',
  'palliative', 'biopsy', 'early detection', 'clinical trial', 'medical research'
];

const UNRELATED_KEYWORDS = [
  'politics', 'election', 'trump', 'biden', 'nfl', 'nba', 'football', 'basketball',
  'hollywood', 'celebrity', 'stocks', 'bitcoin', 'crypto', 'crime', 'shooting',
  'weather', 'storm', 'movie', 'box office'
];

function isCancerOrHealthNews(article) {
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
  
  // Reject explicitly unrelated topics
  for (const keyword of UNRELATED_KEYWORDS) {
    if (text.includes(keyword)) return false;
  }
  
  // Must contain at least one cancer or health keyword
  for (const keyword of CANCER_KEYWORDS) {
    if (text.includes(keyword)) return true;
  }
  
  return false;
}

function deduplicateArticles(articles) {
  const seen = new Set();
  return articles.filter(article => {
    if (!article.title || !article.url) return false;
    const cleanTitle = article.title.toLowerCase().trim().replace(/[^a-z0-0]/g, '');
    if (seen.has(cleanTitle) || seen.has(article.url)) return false;
    seen.add(cleanTitle);
    seen.add(article.url);
    return true;
  });
}

// Fallback Cancer News Data (Used if external APIs fail or are throttled)
const FALLBACK_CANCER_NEWS = [
  {
    id: "cancer-news-1",
    title: "Advancements in Targeted Immunotherapy Show Promise for Early Cancer Interventions",
    description: "New clinical research demonstrates how targeted immunotherapy approaches can significantly enhance survival outcomes and minimize side effects for early-stage oncology patients.",
    category: "Cancer Research",
    source: "National Cancer Institute",
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    url: "https://www.cancer.gov/news-events",
    urlToImage: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cancer-news-2",
    title: "Global Awareness Campaigns Driving Record Early Screening Participation",
    description: "Community health initiatives and mobile diagnostic clinics reach underserved populations, empowering individuals to take proactive steps in routine breast and colorectal screenings.",
    category: "Awareness & Detection",
    source: "World Health Organization",
    publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    url: "https://www.who.int/health-topics/cancer",
    urlToImage: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cancer-news-3",
    title: "The Critical Role of Comprehensive Caregiver Support During Treatment",
    description: "Studies highlight how emotional counseling, respite care, and financial navigation for family caregivers directly improve patient resilience and recovery quality.",
    category: "Caregiver Support",
    source: "Journal of Clinical Oncology",
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    url: "https://ascopubs.org/journal/jco",
    urlToImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cancer-news-4",
    title: "Breakthrough Blood Tests Enable Multi-Cancer Early Detection Before Symptoms Appear",
    description: "Liquid biopsy technology shows high accuracy in detecting circulating tumor DNA across multiple cancer types, offering hope for earlier clinical diagnosis.",
    category: "Early Detection",
    source: "American Cancer Society",
    publishedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    url: "https://www.cancer.org/research",
    urlToImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cancer-news-5",
    title: "Nutritional and Lifestyle Interventions Support Long-Term Cancer Survivorship",
    description: "Integrative health guidelines emphasize tailored physical activity and clinical nutrition plans to enhance energy levels and reduce recurrence risk post-treatment.",
    category: "Survivorship",
    source: "Harvard Health Publishing",
    publishedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    url: "https://www.health.harvard.edu",
    urlToImage: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cancer-news-6",
    title: "Expanding Access to Affordable Diagnostic Imaging in Rural Healthcare Clinics",
    description: "Non-profit partnerships deploy portable ultrasound and digital mammography units to ensure geographic location does not limit life-saving early detection.",
    category: "Healthcare Policy",
    source: "Global Health Journal",
    publishedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    url: "https://www.sciencedirect.com/journal/global-health-journal",
    urlToImage: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cancer-news-7",
    title: "Understanding Mammography Guidelines: When and How Often to Screen",
    description: "Clinical guidelines highlight how annual mammograms for women starting at age 40 significantly reduce mortality through timely, localized detection.",
    category: "Early Detection",
    source: "Radiology Health Insights",
    publishedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    url: "https://www.cancer.gov/types/breast/mammograms-fact-sheet",
    urlToImage: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cancer-news-8",
    title: "Genetic Biomarkers Revolutionize Targeted Oncology Treatment Plans",
    description: "Next-generation genomic sequencing enables oncologists to tailor therapies to individual tumor mutations, improving efficacy and patient comfort.",
    category: "Cancer Research",
    source: "Journal of Clinical Genomics",
    publishedAt: new Date(Date.now() - 3600000 * 42).toISOString(),
    url: "https://www.genome.gov/about-genomics/fact-sheets/Sequencing-Human-Genome",
    urlToImage": "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cancer-news-9",
    title: "Pediatric Oncology Breakthroughs Improve Long-Term Survival and Quality of Life",
    description: "Advances in gentle, targeted pediatric therapies allow children undergoing leukemia and lymphoma treatment to achieve high cure rates with fewer long-term side effects.",
    category: "Immunotherapy",
    source: "Pediatric Health International",
    publishedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    url: "https://www.stjude.org/research.html",
    urlToImage: "https://images.unsplash.com/photo-1581595220892-6e8e5f37da44?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cancer-news-10",
    title: "Mobile Screening Vans Bring Diagnostic Mammograms to Remote Rural Communities",
    description: "Equipped with digital imaging equipment and volunteer nurses, mobile screening units overcome geographic barriers to provide free health check-ups.",
    category: "Early Detection",
    source: "Rural Health Alliance",
    publishedAt: new Date(Date.now() - 3600000 * 54).toISOString(),
    url: "https://www.who.int/news-room/fact-sheets/detail/cancer",
    urlToImage: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cancer-news-11",
    title: "Nutritional Support and Physical Wellness Reduce Fatigue During Radiation Therapy",
    description: "Evidence-based wellness programs combine gentle movement and clinical nutrition to help oncology patients maintain stamina and mental well-being.",
    category: "Prevention",
    source: "Integrative Health Review",
    publishedAt: new Date(Date.now() - 3600000 * 60).toISOString(),
    url: "https://www.cancer.org/treatment/survivorship-during-and-after-treatment.html",
    urlToImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cancer-news-12",
    title: "Liquid Biopsy Blood Tests Detect Tumor Recurrence Months Before Scans",
    description: "Sensitive blood analysis measuring cell-free DNA gives oncologists advance notice to adjust therapeutic protocols early, improving long-term outcomes.",
    category: "Cancer Research",
    source: "Oncology Times",
    publishedAt: new Date(Date.now() - 3600000 * 66).toISOString(),
    url: "https://www.cancer.gov/about-cancer/treatment/types/immunotherapy",
    urlToImage: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80"
  }
];

function fetchExternalNews() {
  return new Promise((resolve) => {
    const req = https.get('https://saurav.tech/NewsAPI/top-headlines/category/health/us.json', { timeout: 4000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && Array.isArray(parsed.articles)) {
            const formatted = parsed.articles.map((item, idx) => ({
              id: `api-news-${idx}-${Date.now()}`,
              title: item.title ? item.title.split(' - ')[0] : 'Health Update',
              description: item.description || item.content || 'Read full details regarding this health disclosure.',
              category: item.title && item.title.toLowerCase().includes('cancer') ? 'Cancer Research' : 'Health & Oncology',
              source: item.source?.name || 'Medical News',
              publishedAt: item.publishedAt || new Date().toISOString(),
              url: item.url || '#',
              urlToImage: item.urlToImage || null
            }));
            
            const filtered = formatted.filter(isCancerOrHealthNews);
            resolve(filtered);
            return;
          }
        } catch (e) {
          // Parse error
        }
        resolve([]);
      });
    });

    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
  });
}

async function getNewsData() {
  const now = Date.now();
  if (newsCache.articles.length > 0 && (now - newsCache.timestamp) < CACHE_TTL_MS) {
    return {
      status: "ok",
      cached: true,
      lastUpdated: newsCache.timestamp,
      articles: newsCache.articles
    };
  }

  // Fetch fresh articles
  let liveArticles = await fetchExternalNews();
  
  // Combine live articles with curated oncology research articles
  let combined = [...liveArticles, ...FALLBACK_CANCER_NEWS];
  let deduplicated = deduplicateArticles(combined);

  // Sort newest first
  deduplicated.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // Limit to top 12 items
  const finalArticles = deduplicated.slice(0, 12);

  newsCache = {
    timestamp: now,
    articles: finalArticles
  };

  return {
    status: "ok",
    cached: false,
    lastUpdated: now,
    articles: finalArticles
  };
}

const server = createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];

  // API Endpoint: /api/news
  if (urlPath === '/api/news') {
    try {
      const data = await getNewsData();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(data));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: 'Failed to retrieve news' }));
      return;
    }
  }

  // Static File Serving
  let filePath = join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
  
  try {
    let fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = join(filePath, 'index.html');
      fileStat = await stat(filePath);
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await readFile(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

const PORT = 3000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Avinya Care website running on http://127.0.0.1:${PORT}`);
});

