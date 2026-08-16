import http.server
import socketserver
import json
import urllib.request
import urllib.error
import time
import re
from datetime import datetime, timezone

PORT = 3000
CACHE_TTL = 3600 # 1 hour in seconds
news_cache = {
    "timestamp": 0,
    "articles": []
}

CANCER_KEYWORDS = [
    'cancer', 'oncology', 'tumor', 'tumour', 'leukemia', 'lymphoma', 'melanoma',
    'chemotherapy', 'radiotherapy', 'immunotherapy', 'mammogram', 'screening',
    'carcinoma', 'sarcoma', 'biomarker', 'survivor', 'survivorship', 'remission',
    'oncologist', 'breast cancer', 'lung cancer', 'prostate cancer', 'colorectal',
    'palliative', 'biopsy', 'early detection', 'clinical trial', 'medical research'
]

UNRELATED_KEYWORDS = [
    'politics', 'election', 'trump', 'biden', 'nfl', 'nba', 'football', 'basketball',
    'hollywood', 'celebrity', 'stocks', 'bitcoin', 'crypto', 'crime', 'shooting',
    'weather', 'storm', 'movie', 'box office'
]

FALLBACK_CANCER_NEWS = [
  {
    "id": "cancer-news-1",
    "title": "Advancements in Targeted Immunotherapy Show Promise for Early Cancer Interventions",
    "description": "New clinical research demonstrates how targeted immunotherapy approaches can significantly enhance survival outcomes and minimize side effects for early-stage oncology patients.",
    "category": "Cancer Research",
    "source": "National Cancer Institute",
    "publishedAt": "2026-08-16T18:00:00Z",
    "url": "https://www.cancer.gov/news-events",
    "urlToImage": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "cancer-news-2",
    "title": "Global Awareness Campaigns Driving Record Early Screening Participation",
    "description": "Community health initiatives and mobile diagnostic clinics reach underserved populations, empowering individuals to take proactive steps in routine breast and colorectal screenings.",
    "category": "Awareness & Detection",
    "source": "World Health Organization",
    "publishedAt": "2026-08-16T15:00:00Z",
    "url": "https://www.who.int/health-topics/cancer",
    "urlToImage": "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "cancer-news-3",
    "title": "The Critical Role of Comprehensive Caregiver Support During Treatment",
    "description": "Studies highlight how emotional counseling, respite care, and financial navigation for family caregivers directly improve patient resilience and recovery quality.",
    "category": "Caregiver Support",
    "source": "Journal of Clinical Oncology",
    "publishedAt": "2026-08-16T10:00:00Z",
    "url": "https://ascopubs.org/journal/jco",
    "urlToImage": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "cancer-news-4",
    "title": "Breakthrough Blood Tests Enable Multi-Cancer Early Detection Before Symptoms Appear",
    "description": "Liquid biopsy technology shows high accuracy in detecting circulating tumor DNA across multiple cancer types, offering hope for earlier clinical diagnosis.",
    "category": "Early Detection",
    "source": "American Cancer Society",
    "publishedAt": "2026-08-16T04:00:00Z",
    "url": "https://www.cancer.org/research",
    "urlToImage": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "cancer-news-5",
    "title": "Nutritional and Lifestyle Interventions Support Long-Term Cancer Survivorship",
    "description": "Integrative health guidelines emphasize tailored physical activity and clinical nutrition plans to enhance energy levels and reduce recurrence risk post-treatment.",
    "category": "Survivorship",
    "source": "Harvard Health Publishing",
    "publishedAt": "2026-08-15T20:00:00Z",
    "url": "https://www.health.harvard.edu",
    "urlToImage": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "cancer-news-6",
    "title": "Expanding Access to Affordable Diagnostic Imaging in Rural Healthcare Clinics",
    "description": "Non-profit partnerships deploy portable ultrasound and digital mammography units to ensure geographic location does not limit life-saving early detection.",
    "category": "Healthcare Policy",
    "source": "Global Health Journal",
    "publishedAt": "2026-08-15T14:00:00Z",
    "url": "https://www.sciencedirect.com/journal/global-health-journal",
    "urlToImage": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "cancer-news-7",
    "title": "Understanding Mammography Guidelines: When and How Often to Screen",
    "description": "Clinical guidelines highlight how annual mammograms for women starting at age 40 significantly reduce mortality through timely, localized detection.",
    "category": "Early Detection",
    "source": "Radiology Health Insights",
    "publishedAt": "2026-08-15T09:00:00Z",
    "url": "https://www.cancer.gov/types/breast/mammograms-fact-sheet",
    "urlToImage": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "cancer-news-8",
    "title": "Genetic Biomarkers Revolutionize Targeted Oncology Treatment Plans",
    "description": "Next-generation genomic sequencing enables oncologists to tailor therapies to individual tumor mutations, improving efficacy and patient comfort.",
    "category": "Cancer Research",
    "source": "Journal of Clinical Genomics",
    "publishedAt": "2026-08-14T21:00:00Z",
    "url": "https://www.genome.gov/about-genomics/fact-sheets/Sequencing-Human-Genome",
    "urlToImage": "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "cancer-news-9",
    "title": "Pediatric Oncology Breakthroughs Improve Long-Term Survival and Quality of Life",
    "description": "Advances in gentle, targeted pediatric therapies allow children undergoing leukemia and lymphoma treatment to achieve high cure rates with fewer long-term side effects.",
    "category": "Immunotherapy",
    "source": "Pediatric Health International",
    "publishedAt": "2026-08-14T16:00:00Z",
    "url": "https://www.stjude.org/research.html",
    "urlToImage": "https://images.unsplash.com/photo-1581595220892-6e8e5f37da44?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "cancer-news-10",
    "title": "Mobile Screening Vans Bring Diagnostic Mammograms to Remote Rural Communities",
    "description": "Equipped with digital imaging equipment and volunteer nurses, mobile screening units overcome geographic barriers to provide free health check-ups.",
    "category": "Early Detection",
    "source": "Rural Health Alliance",
    "publishedAt": "2026-08-14T11:00:00Z",
    "url": "https://www.who.int/news-room/fact-sheets/detail/cancer",
    "urlToImage": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "cancer-news-11",
    "title": "Nutritional Support and Physical Wellness Reduce Fatigue During Radiation Therapy",
    "description": "Evidence-based wellness programs combine gentle movement and clinical nutrition to help oncology patients maintain stamina and mental well-being.",
    "category": "Prevention",
    "source": "Integrative Health Review",
    "publishedAt": "2026-08-14T08:00:00Z",
    "url": "https://www.cancer.org/treatment/survivorship-during-and-after-treatment.html",
    "urlToImage": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "cancer-news-12",
    "title": "Liquid Biopsy Blood Tests Detect Tumor Recurrence Months Before Scans",
    "description": "Sensitive blood analysis measuring cell-free DNA gives oncologists advance notice to adjust therapeutic protocols early, improving long-term outcomes.",
    "category": "Cancer Research",
    "source": "Oncology Times",
    "publishedAt": "2026-08-13T19:00:00Z",
    "url": "https://www.cancer.gov/about-cancer/treatment/types/immunotherapy",
    "urlToImage": "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80"
  }
]

def is_cancer_news(article):
    text = (article.get('title', '') + ' ' + article.get('description', '')).lower()
    for word in UNRELATED_KEYWORDS:
        if word in text:
            return False
    for word in CANCER_KEYWORDS:
        if word in text:
            return True
    return False

def get_news():
    now = time.time()
    if news_cache["articles"] and (now - news_cache["timestamp"]) < CACHE_TTL:
        return {
            "status": "ok",
            "cached": True,
            "lastUpdated": int(news_cache["timestamp"] * 1000),
            "articles": news_cache["articles"]
        }

    live_articles = []
    try:
        req = urllib.request.Request(
            'https://saurav.tech/NewsAPI/top-headlines/category/health/us.json',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=4) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                if 'articles' in data and isinstance(data['articles'], list):
                    for idx, item in enumerate(data['articles']):
                        title = item.get('title', '')
                        if ' - ' in title:
                            title = title.split(' - ')[0]
                        live_articles.append({
                            "id": f"api-news-{idx}-{int(now)}",
                            "title": title or "Health Update",
                            "description": item.get('description') or "Read full details regarding this health disclosure.",
                            "category": "Cancer Research" if "cancer" in title.lower() else "Health & Oncology",
                            "source": item.get('source', {}).get('name') if isinstance(item.get('source'), dict) else "Medical News",
                            "publishedAt": item.get('publishedAt') or datetime.now(timezone.utc).isoformat(),
                            "url": item.get('url') or "#",
                            "urlToImage": item.get('urlToImage')
                        })
    except Exception as e:
        print("External news fetch warning:", e)

    filtered = [a for a in live_articles if is_cancer_news(a)]
    combined = filtered + FALLBACK_CANCER_NEWS

    # Deduplicate
    seen = set()
    dedup = []
    for a in combined:
        clean = re.sub(r'[^a-z0-9]', '', a['title'].lower())
        if clean not in seen:
            seen.add(clean)
            dedup.append(a)

    final_articles = dedup[:12]
    news_cache["timestamp"] = now
    news_cache["articles"] = final_articles

    return {
        "status": "ok",
        "cached": False,
        "lastUpdated": int(now * 1000),
        "articles": final_articles
    }

class AvinyaHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        clean_path = self.path.split('?')[0]
        if clean_path == '/api/news':
            data = get_news()
            body = json.dumps(data).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'public, max-age=3600, s-maxage=3600')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
            return

        super().do_GET()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), AvinyaHTTPRequestHandler) as httpd:
        print(f"Avinya Care website running at http://127.0.0.1:{PORT}")
        httpd.serve_forever()
