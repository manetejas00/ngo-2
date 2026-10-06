/**
 * Avinya Care Foundation - Immersive GSAP Digital Photography Exhibition Controller
 * Features:
 * - Dynamic API integration with /api/gallery
 * - Hero Word Reveal & Editorial Typography GSAP Entrance
 * - Scattered Intro Collage -> Grid Docking ScrollTrigger scrubbed animation
 * - Scrubbed Bento Gallery with differential parallax, scale (1.08 -> 1), and clip-path mask reveals
 * - Full-Bleed Expanding Featured Moments (78vw -> 94vw & border-radius 36px -> 12px)
 * - Custom Magnetic Follow Pointer Cursor ("VIEW") using GSAP quickTo
 * - Scroll Velocity Skew Effect on fast scroll
 * - Immersive Fullscreen Lightbox Modal with Photo Counter, Arrow & Touch Swipe Navigation
 * - GSAP Context cleanup for leak-free category filtering
 */

(function () {
  'use strict';

  let galleryItems = [];
  let currentCategory = 'all';
  let currentFilteredItems = [];
  let currentLightboxIndex = -1;
  let displayedMasonryCount = 12;
  let gsapCtx = null;
  let quickX = null;
  let quickY = null;

  document.addEventListener('DOMContentLoaded', () => {
    initGalleryApp();
  });

  async function initGalleryApp() {
    showSkeleton(true);
    await fetchGalleryData();
    showSkeleton(false);

    if (!galleryItems || galleryItems.length === 0) {
      showEmptyState(true);
      return;
    }

    renderCategoryFilters();
    initCustomCursor();
    renderGalleryExperience();
    initLightboxListeners();
  }

  function showSkeleton(show) {
    const skeleton = document.getElementById('gallerySkeleton');
    if (skeleton) {
      if (show) {
        skeleton.classList.remove('hidden');
      } else {
        skeleton.classList.add('hidden');
      }
    }
  }

  function showEmptyState(show) {
    const emptyState = document.getElementById('galleryEmptyState');
    if (emptyState) {
      if (show) {
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
      }
    }
  }

  // 1. Fetch Published Gallery Items from API
  async function fetchGalleryData() {
    let apiSuccess = false;
    try {
      const res = await fetch('/api/gallery');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status === 'ok' && Array.isArray(json.data)) {
        galleryItems = json.data;
        apiSuccess = true;
      } else if (Array.isArray(json)) {
        galleryItems = json;
        apiSuccess = true;
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      console.warn('[Gallery API Notice] Primary endpoint unreachable, checking fallback...', err.message);
      try {
        const fallbackRes = await fetch('/api/gallery.php');
        const fallbackJson = await fallbackRes.json();
        if (fallbackJson.status === 'ok' && Array.isArray(fallbackJson.data)) {
          galleryItems = fallbackJson.data;
          apiSuccess = true;
        }
      } catch (e) {
        console.error('[Gallery API Error] Failed to load gallery dataset:', e);
      }
    }

    if (!apiSuccess && (!galleryItems || galleryItems.length === 0)) {
      galleryItems = getFallbackDemoData();
    }

    // Ensure items are sorted latest first by updated_at or created_at
    if (galleryItems && galleryItems.length > 0) {
      galleryItems.sort((a, b) => {
        const dA = new Date(a.updated_at || a.created_at || a.event_date || 0);
        const dB = new Date(b.updated_at || b.created_at || b.event_date || 0);
        return dB - dA;
      });
    }
  }

  // Fallback demo dataset with 30 high-impact gallery records
  function getFallbackDemoData() {
    return [
    {
        "id": "gal-avinya-009",
        "gallery_id": "gal-avinya-009",
        "title": "Volunteer Hydration & Recovery Assistance",
        "slug": "volunteer-hydration-recovery-assistance",
        "short_description": "Providing immediate hydration and attentive care to voluntary donors post-donation.",
        "description": "At our voluntary blood donation drive, Avinya Care Foundation volunteers ensured every donor received immediate post-donation hydration, snacks, and personalized attention during their recovery period.",
        "image": "/assets/gallery/avinya-volunteer-hydration-care-2026.webp",
        "alt_text": "Avinya Care volunteer handing water bottle to blood donor during recovery",
        "category": "Blood Donation",
        "event_date": "2026-10-06",
        "location": "Borivali East, Mumbai",
        "photographer": "Avinya Media Team",
        "created_by": "Admin User",
        "updated_by": "Admin User",
        "created_at": "2026-10-06T10:00:00.000Z",
        "updated_at": "2026-10-06T10:00:00.000Z",
        "external_link": "https://avinyacarefoundation.org",
        "has_details": true,
        "image_only": false,
        "is_featured": true,
        "is_published": true,
        "sort_order": 1009
    },
    {
        "id": "gal-avinya-010",
        "gallery_id": "gal-avinya-010",
        "title": "Donor Post-Donation Support & Wellness Monitoring",
        "slug": "donor-post-donation-support-wellness-monitoring",
        "short_description": "Medical pre-checks and post-donation care ensuring safe voluntary blood drives.",
        "description": "Our trained community volunteers and attending medical staff closely monitored donors during and after voluntary blood donation to ensure maximum safety, comfort, and positive healthcare experiences.",
        "image": "/assets/gallery/avinya-donor-post-care-support-2026.webp",
        "alt_text": "Avinya Care volunteer and healthcare team attending to donor on reclining chair",
        "category": "Blood Donation",
        "event_date": "2026-10-06",
        "location": "Borivali East, Mumbai",
        "photographer": "Avinya Media Team",
        "created_by": "Admin User",
        "updated_by": "Admin User",
        "created_at": "2026-10-06T10:00:00.000Z",
        "updated_at": "2026-10-06T10:00:00.000Z",
        "external_link": "https://avinyacarefoundation.org",
        "has_details": true,
        "image_only": false,
        "is_featured": true,
        "is_published": true,
        "sort_order": 1010
    },
    {
        "id": "gal-avinya-001",
        "gallery_id": "gal-avinya-001",
        "title": "Voluntary Blood Donation & Donor Registration Drive",
        "slug": "voluntary-blood-donation-donor-registration-drive",
        "short_description": "Community blood donation initiative encouraging voluntary participation and health awareness.",
        "description": "Avinya Care Foundation organized a voluntary blood donation drive in a Mumbai community center. Dedicated volunteers wearing official Avinya vests assisted donors with registration, health pre-checks, and comfortable recovery support.",
        "image": "/assets/gallery/avinya-blood-donation-camp-2026.webp",
        "alt_text": "Avinya Care Foundation volunteers facilitating voluntary blood donation camp in Mumbai",
        "category": "Blood Donation",
        "event_date": "2026-10-05",
        "location": "Borivali East, Mumbai",
        "photographer": "Avinya Media Team",
        "created_by": "Admin User",
        "updated_by": "Admin User",
        "created_at": "2026-10-05T10:00:00.000Z",
        "updated_at": "2026-10-05T10:00:00.000Z",
        "external_link": "https://avinyacarefoundation.org",
        "has_details": true,
        "image_only": false,
        "is_featured": true,
        "is_published": true,
        "sort_order": 1001
    },
    {
        "id": "gal-avinya-002",
        "gallery_id": "gal-avinya-002",
        "title": "Free Community Healthcare Check-up Camp",
        "slug": "free-community-healthcare-checkup-camp",
        "short_description": "Free preventive medical consultations and diagnostic screenings for underserved families.",
        "description": "Our team of doctors and trained volunteers set up a comprehensive outpatient health camp providing blood pressure monitoring, consultations, and basic diagnostics for senior citizens and local residents.",
        "image": "/assets/gallery/avinya-community-health-camp-2026.webp",
        "alt_text": "Avinya Care doctor and volunteer conducting free health consultations in semi-urban Mumbai",
        "category": "Healthcare",
        "event_date": "2026-10-04",
        "location": "Virar West, Mumbai",
        "photographer": "Avinya Media Team",
        "created_by": "Admin User",
        "updated_by": "Admin User",
        "created_at": "2026-10-04T10:00:00.000Z",
        "updated_at": "2026-10-04T10:00:00.000Z",
        "external_link": "https://avinyacarefoundation.org",
        "has_details": true,
        "image_only": false,
        "is_featured": true,
        "is_published": true,
        "sort_order": 1002
    },
    {
        "id": "gal-avinya-003",
        "gallery_id": "gal-avinya-003",
        "title": "Community Cancer Early Screening & Awareness Seminar",
        "slug": "community-cancer-early-screening-awareness-seminar",
        "short_description": "Interactive session promoting early detection, self-examination, and preventive oncology.",
        "description": "Medical specialists from Avinya Care Foundation conducted a community awareness seminar focused on early warning signs, self-examination techniques, and accessible screening services for women.",
        "image": "/assets/gallery/avinya-cancer-awareness-session-2026.webp",
        "alt_text": "Avinya Care Foundation physician conducting cancer awareness lecture for women",
        "category": "Cancer Awareness",
        "event_date": "2026-10-03",
        "location": "Malad West, Mumbai",
        "photographer": "Avinya Media Team",
        "created_by": "Admin User",
        "updated_by": "Admin User",
        "created_at": "2026-10-03T10:00:00.000Z",
        "updated_at": "2026-10-03T10:00:00.000Z",
        "external_link": "https://avinyacarefoundation.org",
        "has_details": true,
        "image_only": false,
        "is_featured": true,
        "is_published": true,
        "sort_order": 1003
    },
    {
        "id": "gal-avinya-004",
        "gallery_id": "gal-avinya-004",
        "title": "Volunteer Help Desk & Health Program Registration",
        "slug": "volunteer-help-desk-health-program-registration",
        "short_description": "On-ground enrollment counter connecting citizens to free diagnostic care and volunteer programs.",
        "description": "Avinya Care Foundation volunteers managed an interactive help desk to register local residents for upcoming diagnostic checkup drives and onboard new community youth volunteers.",
        "image": "/assets/gallery/avinya-volunteer-registration-desk-2026.webp",
        "alt_text": "Avinya Care Foundation volunteer desk handling community program enrollments",
        "category": "Community",
        "event_date": "2026-10-02",
        "location": "Kandivali, Mumbai",
        "photographer": "Avinya Media Team",
        "created_by": "Admin User",
        "updated_by": "Admin User",
        "created_at": "2026-10-02T10:00:00.000Z",
        "updated_at": "2026-10-02T10:00:00.000Z",
        "external_link": "https://avinyacarefoundation.org",
        "has_details": true,
        "image_only": false,
        "is_featured": false,
        "is_published": true,
        "sort_order": 1004
    },
    {
        "id": "gal-avinya-005",
        "gallery_id": "gal-avinya-005",
        "title": "Preventive Hygiene & Community Outreach Drive",
        "slug": "preventive-hygiene-community-outreach-drive",
        "short_description": "Door-to-door distribution of health kits, hygiene essentials, and medical guidance booklets.",
        "description": "Volunteers visited community households to distribute essential hygiene care packs, wellness guidelines, and contact vouchers for subsidized partner clinic appointments.",
        "image": "/assets/gallery/avinya-community-outreach-drive-2026.webp",
        "alt_text": "Avinya Care Foundation volunteer team distributing healthcare kits in neighborhood",
        "category": "Campaigns",
        "event_date": "2026-10-01",
        "location": "Dharavi, Mumbai",
        "photographer": "Avinya Media Team",
        "created_by": "Admin User",
        "updated_by": "Admin User",
        "created_at": "2026-10-01T10:00:00.000Z",
        "updated_at": "2026-10-01T10:00:00.000Z",
        "external_link": "https://avinyacarefoundation.org",
        "has_details": true,
        "image_only": false,
        "is_featured": false,
        "is_published": true,
        "sort_order": 1005
    },
    {
        "id": "gal-avinya-006",
        "gallery_id": "gal-avinya-006",
        "title": "Student Health Education & Sanitation Workshop",
        "slug": "student-health-education-sanitation-workshop",
        "short_description": "Interactive session educating primary school students on personal hygiene and nutrition.",
        "description": "Our youth health wing conducted an engaging workshop at a local school to teach proper handwashing techniques, oral hygiene habits, and balanced nutritional awareness.",
        "image": "/assets/gallery/avinya-educational-health-workshop-2026.webp",
        "alt_text": "Avinya Care Foundation volunteer leading classroom health and hygiene workshop",
        "category": "Education",
        "event_date": "2026-09-30",
        "location": "Palghar, Maharashtra",
        "photographer": "Avinya Media Team",
        "created_by": "Admin User",
        "updated_by": "Admin User",
        "created_at": "2026-09-30T10:00:00.000Z",
        "updated_at": "2026-09-30T10:00:00.000Z",
        "external_link": "https://avinyacarefoundation.org",
        "has_details": true,
        "image_only": false,
        "is_featured": false,
        "is_published": true,
        "sort_order": 1006
    },
    {
        "id": "gal-avinya-007",
        "gallery_id": "gal-avinya-007",
        "title": "Healthcare Financial Literacy & Insurance Guidance Session",
        "slug": "healthcare-financial-literacy-insurance-guidance-session",
        "short_description": "Financial planning, government scheme guidance, and emergency health fund counseling.",
        "description": "Avinya Care Foundation financial counselors guided patient families on utilizing government healthcare schemes, Ayushman Bharat benefits, and foundation emergency aid for critical care.",
        "image": "/assets/gallery/avinya-financial-literacy-session-2026.webp",
        "alt_text": "Avinya Care Foundation counselor explaining cashless medical support options",
        "category": "Awareness",
        "event_date": "2026-09-28",
        "location": "Thane West, Mumbai",
        "photographer": "Avinya Media Team",
        "created_by": "Admin User",
        "updated_by": "Admin User",
        "created_at": "2026-09-28T10:00:00.000Z",
        "updated_at": "2026-09-28T10:00:00.000Z",
        "external_link": "https://avinyacarefoundation.org",
        "has_details": true,
        "image_only": false,
        "is_featured": false,
        "is_published": true,
        "sort_order": 1007
    },
    {
        "id": "gal-avinya-008",
        "gallery_id": "gal-avinya-008",
        "title": "Essential Nutrition & Food Care-Box Distribution",
        "slug": "essential-nutrition-food-care-box-distribution",
        "short_description": "Providing high-protein ration hampers to recovering patients and vulnerable households.",
        "description": "In partnership with local community leaders, Avinya Care Foundation distributed fortified ration kits and nutritional care boxes to families under long-term oncology care.",
        "image": "/assets/gallery/avinya-food-distribution-drive-2026.webp",
        "alt_text": "Avinya Care team handing over essential nutritional boxes to patient families",
        "category": "Events",
        "event_date": "2026-09-25",
        "location": "Andheri East, Mumbai",
        "photographer": "Avinya Media Team",
        "created_by": "Admin User",
        "updated_by": "Admin User",
        "created_at": "2026-09-25T10:00:00.000Z",
        "updated_at": "2026-09-25T10:00:00.000Z",
        "external_link": "https://avinyacarefoundation.org",
        "has_details": true,
        "image_only": false,
        "is_featured": true,
        "is_published": true,
        "sort_order": 1008
    }
];
  }

  function renderCategoryFilters() {
    const container = document.getElementById('galleryCategoryBar');
    if (!container) return;

    const categoriesSet = new Set();
    galleryItems.forEach(g => {
      if (g.category && g.category.trim()) categoriesSet.add(g.category.trim());
    });

    const categories = ['All', ...Array.from(categoriesSet)];

    container.innerHTML = categories.map(cat => {
      const catKey = cat.toLowerCase();
      const isActive = currentCategory === catKey;
      let icon = 'fa-layer-group';
      if (catKey.includes('health') || catKey.includes('medical')) icon = 'fa-stethoscope';
      else if (catKey.includes('event')) icon = 'fa-calendar-star';
      else if (catKey.includes('awareness')) icon = 'fa-bullhorn';
      else if (catKey.includes('campaign')) icon = 'fa-flag';
      else if (catKey.includes('community')) icon = 'fa-hand-holding-heart';

      return `
        <button class="gallery-category-pill ${isActive ? 'active' : ''}" data-category="${catKey}" role="tab" aria-selected="${isActive}">
          <i class="fa-solid ${icon}"></i> <span>${escapeHtml(cat)}</span>
        </button>
      `;
    }).join('');

    // Attach click listeners with smooth GSAP transition
    container.querySelectorAll('.gallery-category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-category');
        if (selected === currentCategory) return;

        container.querySelectorAll('.gallery-category-pill').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        currentCategory = selected;
        displayedMasonryCount = 12;
        animateCategorySwitch();
      });
    });
  }

  // Category switch animation: scale/fade out, re-render, scale/fade in
  function animateCategorySwitch() {
    const mainWrap = document.getElementById('galleryContent');
    if (typeof gsap !== 'undefined' && mainWrap) {
      gsap.to(['#introCollageSection', '#bentoExhibitionSection', '#fullBleedSection1', '#editorialMasonrySection', '#fullBleedSection2'], {
        opacity: 0,
        y: 20,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          renderGalleryExperience();
          gsap.to(['#introCollageSection', '#bentoExhibitionSection', '#fullBleedSection1', '#editorialMasonrySection', '#fullBleedSection2'], {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power2.out'
          });
        }
      });
    } else {
      renderGalleryExperience();
    }
  }

  // 4. Main Gallery Experience Controller
  function renderGalleryExperience() {
    // Revert previous GSAP animations cleanly
    if (gsapCtx) {
      gsapCtx.revert();
      gsapCtx = null;
    }

    // Filter dataset
    currentFilteredItems = galleryItems.filter(item => {
      if (currentCategory === 'all') return true;
      return (item.category || '').toLowerCase() === currentCategory;
    });

    if (currentFilteredItems.length === 0) {
      showEmptyState(true);
      hideAllSections();
      return;
    }
    showEmptyState(false);

    const totalItems = currentFilteredItems.length;

    // Section 1: Intro Scattered Collage (first 5 items)
    const collageItems = currentFilteredItems.slice(0, Math.min(5, totalItems));
    renderIntroCollage(collageItems);

    // Section 2: GSAP Scrubbed Bento Exhibition (items 5 -> 10)
    const bentoItems = totalItems > 5 ? currentFilteredItems.slice(5, 11) : [];
    renderScrubbedBento(bentoItems);

    // Section 3: Full-Bleed Featured Moments
    const featuredItems = currentFilteredItems.filter(i => i.is_featured);
    renderFullBleedSections(featuredItems.length > 0 ? featuredItems : currentFilteredItems.slice(0, 2));

    // Section 4: Editorial Masonry Archive (items 11 onwards)
    const masonryItems = totalItems > 10 ? currentFilteredItems.slice(10) : [];
    if (masonryItems.length > 0) {
      renderEditorialMasonry(masonryItems);
    } else {
      const masonrySec = document.getElementById('editorialMasonrySection');
      if (masonrySec) masonrySec.classList.add('hidden');
    }

    // Attach card click handlers for fullscreen lightbox
    attachLightboxCardTriggers();

    // Initialize GSAP Animations inside context
    initGSAPExhibition();
  }

  function hideAllSections() {
    ['introCollageSection', 'bentoExhibitionSection', 'fullBleedSection1', 'editorialMasonrySection', 'fullBleedSection2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  // Render 1: Scattered Intro Collage
  function renderIntroCollage(items) {
    const sec = document.getElementById('introCollageSection');
    const grid = document.getElementById('introCollageGrid');
    if (!sec || !grid) return;

    if (items.length === 0) {
      sec.classList.add('hidden');
      return;
    }
    sec.classList.remove('hidden');

    grid.innerHTML = items.map((item, idx) => {
      const id = item.gallery_id || item.id || `col-${idx}`;
      const title = escapeHtml(item.title || '');
      const cat = escapeHtml(item.category || '');
      const img = escapeHtml(item.image);
      const alt = escapeHtml(item.alt_text || title);
      const date = escapeHtml(item.event_date ? new Date(item.event_date).getFullYear() : '');

      return `
        <div class="collage-card collage-item-${idx + 1} gallery-item" data-gallery-id="${id}" role="button" tabindex="0" aria-label="${alt}">
          <img src="${img}" alt="${alt}" class="collage-card-img" loading="lazy">
          <div class="gallery-hover-overlay">
            ${cat ? `<span class="hover-cat">${cat}</span>` : ''}
            ${title ? `<h3 class="hover-title">${title}</h3>` : ''}
            ${date ? `<div class="hover-meta"><span>${date}</span></div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Render 2: GSAP Scrubbed Bento Exhibition
  function renderScrubbedBento(items) {
    const sec = document.getElementById('bentoExhibitionSection');
    const grid = document.getElementById('scrubbedBentoGrid');
    if (!sec || !grid) return;

    if (items.length === 0) {
      sec.classList.add('hidden');
      return;
    }
    sec.classList.remove('hidden');

    const spanClasses = [
      'bento-span-8-wide',
      'bento-span-4-portrait',
      'bento-span-4-square',
      'bento-span-4-tall',
      'bento-span-6-wide',
      'bento-span-12-banner'
    ];

    grid.innerHTML = items.map((item, idx) => {
      const id = item.gallery_id || item.id || `bento-${idx}`;
      const title = escapeHtml(item.title || '');
      const cat = escapeHtml(item.category || '');
      const img = escapeHtml(item.image);
      const alt = escapeHtml(item.alt_text || title);
      const date = escapeHtml(item.event_date ? new Date(item.event_date).getFullYear() : '');
      const spanClass = spanClasses[idx % spanClasses.length];

      return `
        <div class="bento-card ${spanClass} gallery-item" data-gallery-id="${id}" role="button" tabindex="0" aria-label="${alt}">
          <div class="bento-card-media">
            <img src="${img}" alt="${alt}" class="bento-card-img" loading="lazy">
            <div class="gallery-hover-overlay">
              ${cat ? `<span class="hover-cat">${cat}</span>` : ''}
              ${title ? `<h3 class="hover-title">${title}</h3>` : ''}
              ${date ? `<div class="hover-meta"><span><i class="fa-regular fa-calendar"></i> ${date}</span></div>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render 3 & 5: Full-Bleed Featured Moments
  function renderFullBleedSections(featuredItems) {
    const sec1 = document.getElementById('fullBleedSection1');
    const sec2 = document.getElementById('fullBleedSection2');

    const item1 = featuredItems[0] || galleryItems[0];
    const item2 = featuredItems[1] || galleryItems[1] || item1;

    if (item1 && sec1) {
      sec1.classList.remove('hidden');
      setupFullBleedContent(1, item1);
    } else if (sec1) sec1.classList.add('hidden');

    if (item2 && sec2 && item2 !== item1) {
      sec2.classList.remove('hidden');
      setupFullBleedContent(2, item2);
    } else if (sec2) sec2.classList.add('hidden');
  }

  function setupFullBleedContent(num, item) {
    const imgEl = document.getElementById(`fullBleedImage${num}`);
    const badgeEl = document.getElementById(`fullBleedBadge${num}`);
    const titleEl = document.getElementById(`fullBleedTitle${num}`);
    const subEl = document.getElementById(`fullBleedSub${num}`);
    const btnEl = document.getElementById(`fullBleedBtn${num}`);
    const container = document.getElementById(`fullBleedContainer${num}`);

    const id = item.gallery_id || item.id || `fullbleed-${num}`;
    const title = item.title || '';
    const cat = item.category || 'FEATURED';
    const sub = item.short_description || item.description || '';

    if (imgEl) { imgEl.src = item.image; imgEl.alt = item.alt_text || title; }
    if (badgeEl) badgeEl.innerHTML = `<i class="fa-solid fa-star"></i> ${escapeHtml(cat.toUpperCase())} SPOTLIGHT`;
    if (titleEl) titleEl.innerText = title;
    if (subEl) subEl.innerText = sub;

    if (container) {
      container.setAttribute('data-gallery-id', id);
      container.onclick = () => openLightboxById(id);
    }
    if (btnEl) {
      btnEl.onclick = (e) => {
        e.stopPropagation();
        openLightboxById(id);
      };
    }
  }

  // Render 4: Editorial Masonry Archive Grid
  function renderEditorialMasonry(items, prevCount = 0) {
    const sec = document.getElementById('editorialMasonrySection');
    const grid = document.getElementById('editorialMasonryGrid');
    const loadMoreWrapper = document.getElementById('galleryLoadMoreWrapper');
    const loadMoreBtn = document.getElementById('galleryLoadMoreBtn');
    if (!sec || !grid) return;

    if (items.length === 0) {
      sec.classList.add('hidden');
      return;
    }
    sec.classList.remove('hidden');

    const visibleItems = items.slice(0, displayedMasonryCount);
    const spanClasses = ['masonry-span-4', 'masonry-span-8', 'masonry-span-6', 'masonry-span-6', 'masonry-span-8', 'masonry-span-4'];

    grid.innerHTML = visibleItems.map((item, idx) => {
      const id = item.gallery_id || item.id || `masonry-${idx}`;
      const title = escapeHtml(item.title || '');
      const cat = escapeHtml(item.category || '');
      const img = escapeHtml(item.image);
      const alt = escapeHtml(item.alt_text || title);
      const date = escapeHtml(item.event_date ? new Date(item.event_date).getFullYear() : '');
      const spanClass = spanClasses[idx % spanClasses.length];

      return `
        <div class="masonry-card ${spanClass} gallery-item" data-gallery-id="${id}" role="button" tabindex="0" aria-label="${alt}">
          <img src="${img}" alt="${alt}" class="masonry-card-img" loading="lazy">
          <div class="gallery-hover-overlay">
            ${cat ? `<span class="hover-cat">${cat}</span>` : ''}
            ${title ? `<h3 class="hover-title">${title}</h3>` : ''}
            ${date ? `<div class="hover-meta"><span>${date}</span></div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    attachLightboxCardTriggers();

    // GSAP Entrance animation for newly loaded masonry cards on "Explore More Photography"
    const allCards = Array.from(grid.querySelectorAll('.masonry-card'));
    if (prevCount > 0 && prevCount < allCards.length && typeof gsap !== 'undefined') {
      const newCards = allCards.slice(prevCount);
      gsap.fromTo(newCards,
        { opacity: 0, y: 50, scale: 0.92, filter: 'brightness(0.7)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'brightness(1)',
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity,filter'
        }
      );
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }

    // Pagination button
    if (loadMoreWrapper && loadMoreBtn) {
      if (items.length > displayedMasonryCount) {
        loadMoreWrapper.classList.remove('hidden');
        loadMoreBtn.onclick = () => {
          const currentCount = grid.querySelectorAll('.masonry-card').length;
          displayedMasonryCount += 12;
          renderEditorialMasonry(items, currentCount);
        };
      } else {
        loadMoreWrapper.classList.add('hidden');
      }
    }
  }

  // Attach Lightbox Trigger Click Listeners
  function attachLightboxCardTriggers() {
    document.querySelectorAll('.gallery-item').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-gallery-id');
        openLightboxById(id);
      });
    });
  }

  function openLightboxById(id) {
    const idx = currentFilteredItems.findIndex(i => (i.gallery_id || i.id) === id);
    if (idx !== -1) openLightbox(idx);
    else {
      const globalIdx = galleryItems.findIndex(i => (i.gallery_id || i.id) === id);
      if (globalIdx !== -1) openLightbox(globalIdx);
    }
  }

  // 5. Custom Magnetic Follow Cursor Setup (GSAP quickTo)
  function initCustomCursor() {
    const cursor = document.getElementById('galleryCustomCursor');
    if (!cursor || typeof gsap === 'undefined') return;

    // Check touch screen
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

    quickX = gsap.quickTo(cursor, 'x', { duration: 0.3, ease: 'power2.out' });
    quickY = gsap.quickTo(cursor, 'y', { duration: 0.3, ease: 'power2.out' });

    window.addEventListener('mousemove', (e) => {
      quickX(e.clientX);
      quickY(e.clientY);
    });

    document.addEventListener('mouseover', (e) => {
      const targetCard = e.target.closest('.gallery-item, .full-bleed-container, .collage-card');
      if (targetCard) {
        cursor.classList.add('active');
      } else {
        cursor.classList.remove('active');
      }
    });
  }

  // 6. GSAP Exhibition Animations (ScrollTrigger Scrubbed & Parallax with matchMedia)
  function initGSAPExhibition() {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || isReducedMotion) {
      console.log('[Gallery GSAP Notice] Static layout applied.');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsapCtx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // DESKTOP (>= 1024px)
      mm.add("(min-width: 1024px)", () => {
        // A. Hero Reveal Animation
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .fromTo('.hero-word',
            { opacity: 0, y: 50, rotateX: -30 },
            { opacity: 1, y: 0, rotateX: 0, duration: 1, stagger: 0.15 }
          )
          .fromTo('.hero-divider',
            { scaleX: 0 },
            { scaleX: 1, duration: 0.8 },
            '-=0.6'
          )
          .fromTo('.gallery-hero-subtitle, .gallery-category-bar',
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.15 },
            '-=0.4'
          );

        // B. Intro Scattered Collage -> Docking Animation
        const collageCards = gsap.utils.toArray('#introCollageGrid .collage-card');
        if (collageCards.length > 0) {
          const transforms = [
            { rotate: -8, y: 50, x: -30, scale: 0.94 },
            { rotate: 6, y: 70, x: 20, scale: 0.92 },
            { rotate: -5, y: 40, x: 40, scale: 0.95 },
            { rotate: 7, y: 60, x: -20, scale: 0.93 },
            { rotate: -6, y: 50, x: 30, scale: 0.94 }
          ];

          collageCards.forEach((card, i) => {
            const t = transforms[i % transforms.length];
            gsap.set(card, { rotate: t.rotate, y: t.y, x: t.x, scale: t.scale, opacity: 0.8 });

            gsap.to(card, {
              rotate: 0,
              y: 0,
              x: 0,
              scale: 1,
              opacity: 1,
              scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                end: 'top 40%',
                scrub: 1.2,
                invalidateOnRefresh: true
              }
            });
          });
        }

        // C. GSAP Scrubbed Bento Gallery
        const bentoCards = gsap.utils.toArray('#scrubbedBentoGrid .bento-card');
        bentoCards.forEach((card, idx) => {
          const img = card.querySelector('.bento-card-img');
          if (img) {
            gsap.fromTo(img,
              { scale: 1.15, filter: 'brightness(0.7)' },
              {
                scale: 1,
                filter: 'brightness(1)',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 88%',
                  end: 'bottom 45%',
                  scrub: 1,
                  invalidateOnRefresh: true
                }
              }
            );
          }

          const parallaxY = (idx % 2 === 0) ? -35 : 35;
          gsap.fromTo(card,
            { y: (idx % 3 === 0) ? 40 : 0 },
            {
              y: parallaxY,
              scrollTrigger: {
                trigger: card,
                start: 'top 95%',
                end: 'bottom 15%',
                scrub: 1.5,
                invalidateOnRefresh: true
              }
            }
          );
        });

        // D. Full-Bleed Expanding Featured Moments (78vw -> 94vw)
        [1, 2].forEach(num => {
          const container = document.getElementById(`fullBleedContainer${num}`);
          if (!container) return;

          gsap.fromTo(container,
            { width: '78vw', borderRadius: '36px' },
            {
              width: '94vw',
              borderRadius: '12px',
              ease: 'none',
              scrollTrigger: {
                trigger: container,
                start: 'top 85%',
                end: 'center 45%',
                scrub: 1,
                invalidateOnRefresh: true
              }
            }
          );
        });
      });

      // TABLET (768px – 1023px)
      mm.add("(min-width: 768px) and (max-width: 1023px)", () => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .fromTo('.hero-word', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 })
          .fromTo('.gallery-hero-subtitle, .gallery-category-bar', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, '-=0.3');

        const collageCards = gsap.utils.toArray('#introCollageGrid .collage-card');
        collageCards.forEach((card) => {
          gsap.fromTo(card,
            { opacity: 0, y: 30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, scrollTrigger: { trigger: card, start: 'top 90%', end: 'top 55%', scrub: 1, invalidateOnRefresh: true } }
          );
        });

        const bentoCards = gsap.utils.toArray('#scrubbedBentoGrid .bento-card');
        bentoCards.forEach((card) => {
          const img = card.querySelector('.bento-card-img');
          if (img) {
            gsap.fromTo(img,
              { scale: 1.1, filter: 'brightness(0.8)' },
              { scale: 1, filter: 'brightness(1)', scrollTrigger: { trigger: card, start: 'top 90%', end: 'bottom 50%', scrub: 1, invalidateOnRefresh: true } }
            );
          }
        });

        [1, 2].forEach(num => {
          const container = document.getElementById(`fullBleedContainer${num}`);
          if (!container) return;
          gsap.fromTo(container,
            { width: '88vw', borderRadius: '24px' },
            { width: '96vw', borderRadius: '12px', ease: 'none', scrollTrigger: { trigger: container, start: 'top 88%', end: 'center 50%', scrub: 1, invalidateOnRefresh: true } }
          );
        });
      });

      // MOBILE (< 768px)
      mm.add("(max-width: 767px)", () => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .fromTo('.hero-word', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 })
          .fromTo('.gallery-hero-subtitle, .gallery-category-bar', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');

        const collageCards = gsap.utils.toArray('#introCollageGrid .collage-card');
        collageCards.forEach((card) => {
          gsap.fromTo(card,
            { opacity: 0, y: 25, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, scrollTrigger: { trigger: card, start: 'top 92%', end: 'top 65%', scrub: 0.8, invalidateOnRefresh: true } }
          );
        });

        const bentoCards = gsap.utils.toArray('#scrubbedBentoGrid .bento-card');
        bentoCards.forEach((card) => {
          const img = card.querySelector('.bento-card-img');
          if (img) {
            gsap.fromTo(img,
              { scale: 1.08, filter: 'brightness(0.85)' },
              { scale: 1, filter: 'brightness(1)', scrollTrigger: { trigger: card, start: 'top 92%', end: 'top 60%', scrub: 0.8, invalidateOnRefresh: true } }
            );
          }
        });

        [1, 2].forEach(num => {
          const container = document.getElementById(`fullBleedContainer${num}`);
          if (!container) return;
          gsap.fromTo(container,
            { width: '92vw', borderRadius: '20px' },
            { width: '98vw', borderRadius: '10px', ease: 'none', scrollTrigger: { trigger: container, start: 'top 90%', end: 'center 55%', scrub: 0.8, invalidateOnRefresh: true } }
          );
        });
      });

      // E. Editorial Masonry Batch Fade Reveal (All Screen Sizes)
      const masonryCards = gsap.utils.toArray('#editorialMasonryGrid .masonry-card');
      if (masonryCards.length > 0) {
        ScrollTrigger.batch(masonryCards, {
          interval: 0.1,
          batchMax: 6,
          onEnter: batch => gsap.fromTo(batch,
            { opacity: 0, y: 30, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.08, ease: 'power2.out', overwrite: 'auto', clearProps: 'transform,opacity' }
          )
        });
      }

      // F. Scroll Velocity Skew Effect during fast scroll (Desktop & Tablet)
      if (window.innerWidth >= 768) {
        let proxy = { skew: 0 };
        let skewSetter = gsap.quickSetter('.gallery-item', 'skewY', 'deg');
        let clamp = gsap.utils.clamp(-3, 3);

        ScrollTrigger.create({
          onUpdate: (self) => {
            let skew = clamp(self.getVelocity() / -400);
            if (Math.abs(skew) > Math.abs(proxy.skew)) {
              proxy.skew = skew;
              gsap.to(proxy, {
                skew: 0,
                duration: 0.8,
                ease: 'power3.out',
                overwrite: true,
                onUpdate: () => skewSetter(proxy.skew)
              });
            }
          }
        });
      }

      ScrollTrigger.refresh();
    });
  }

  // 7. IMMERSIVE FULLSCREEN LIGHTBOX HANDLERS & ACCESSIBILITY
  function initLightboxListeners() {
    const overlay = document.getElementById('galleryLightbox');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.id === 'lightboxOverlay') closeLightbox();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
      });
    }

    // Keyboard Arrow & ESC navigation
    document.addEventListener('keydown', (e) => {
      if (!overlay || !overlay.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    // Mobile Touch Swipe Navigation
    let touchStartX = 0;
    let touchEndX = 0;

    if (overlay) {
      overlay.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      overlay.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
      }, { passive: true });
    }

    function handleSwipeGesture() {
      const swipeThreshold = 50;
      if (touchEndX < touchStartX - swipeThreshold) {
        navigateLightbox(1); // Swipe left -> Next
      } else if (touchEndX > touchStartX + swipeThreshold) {
        navigateLightbox(-1); // Swipe right -> Prev
      }
    }
  }

  function openLightbox(index) {
    const dataset = currentFilteredItems.length > 0 ? currentFilteredItems : galleryItems;
    if (index < 0 || index >= dataset.length) return;
    currentLightboxIndex = index;
    const item = dataset[index];

    const overlay = document.getElementById('galleryLightbox');
    if (!overlay) return;

    const counterEl = document.getElementById('lightboxCounter');
    const imgEl = document.getElementById('lightboxImage');
    const titleEl = document.getElementById('lightboxTitle');
    const catEl = document.getElementById('lightboxCategory');
    const dateEl = document.getElementById('lightboxDate');
    const locEl = document.getElementById('lightboxLocation');
    const photogEl = document.getElementById('lightboxPhotographer');
    const authorEl = document.getElementById('lightboxAuthor');
    const descEl = document.getElementById('lightboxDescription');

    const title = item.title || item.category || 'Avinya Care Foundation Photo';
    const cat = item.category || 'Impact Story';
    const currentNum = String(index + 1).padStart(2, '0');
    const totalNum = String(dataset.length).padStart(2, '0');

    if (counterEl) counterEl.innerText = `${currentNum} / ${totalNum}`;

    if (imgEl) {
      imgEl.src = item.image;
      imgEl.alt = item.alt_text || title;
    }

    if (titleEl) titleEl.innerText = title;
    if (catEl) catEl.innerText = cat;
    if (dateEl) dateEl.innerHTML = item.event_date ? `<i class="fa-regular fa-calendar"></i> <span>${escapeHtml(item.event_date)}</span>` : '';
    if (locEl) locEl.innerHTML = item.location ? `<i class="fa-solid fa-location-dot"></i> <span>${escapeHtml(item.location)}</span>` : '';
    if (photogEl) photogEl.innerHTML = item.photographer ? `<i class="fa-solid fa-camera"></i> <span>${escapeHtml(item.photographer)}</span>` : '';
    
    const authorText = item.created_by ? `By ${item.created_by}` : (item.updated_by ? `Updated by ${item.updated_by}` : 'Admin User');
    if (authorEl) authorEl.innerHTML = `<i class="fa-solid fa-user-pen"></i> <span>${escapeHtml(authorText)}</span>`;

    if (descEl) {
      if (item.image_only || (!item.description && !item.short_description)) {
        descEl.style.display = 'none';
        descEl.innerText = '';
      } else {
        descEl.style.display = 'block';
        descEl.innerText = item.description || item.short_description;
      }
    }

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Animate image entrance
    if (typeof gsap !== 'undefined' && imgEl) {
      gsap.fromTo(imgEl, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' });
    }
  }

  function navigateLightbox(direction) {
    const dataset = currentFilteredItems.length > 0 ? currentFilteredItems : galleryItems;
    if (dataset.length === 0) return;
    let newIndex = currentLightboxIndex + direction;
    if (newIndex < 0) newIndex = dataset.length - 1;
    if (newIndex >= dataset.length) newIndex = 0;
    openLightbox(newIndex);
  }

  function closeLightbox() {
    const overlay = document.getElementById('galleryLightbox');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    currentLightboxIndex = -1;
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

})();
