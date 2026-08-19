# Avinya Care Foundation — Website Summary & Design System

A complete overview of the **Avinya Care Foundation** web application, including its brand identity, color tokens, typography scale, section-by-section breakdown, interactive modal systems, and technical architecture.

---

## 1. Brand Identity & Purpose

* **Organization:** Avinya Care Foundation
* **Tagline:** *"No one should face cancer alone."*
* **Mission:** A humanitarian Indian oncology non-profit dedicated to cancer awareness, early screening drives, patient navigation, and caregiver support.
* **Tax Status:** 80G & 12A Tax Exempted under the Indian IT Act.
* **Core Helpline:** +91 98765 43210 (24/7 Confidential Support).

---

## 2. Design System & Color Palette

The visual design system combines a cinematic dark aesthetic with clean white surfaces, vibrant ruby-red accents, emerald teal diagnostic highlights, and warm ember brand touches.

### Color Tokens & Hex Codes

| Token / Variable | Hex Code | Color Role & Description |
| :--- | :--- | :--- |
| `--brand` | `#F47528` | **Primary Brand Red** — CTA buttons, active states, badges, glowing accents |
| `--brand-hover` | `#D95F16` | **Red Hover State** — Darker crimson on hover and button clicks |
| `--brand-light` | `#FFF1E8` | **Brand Tint** — Soft light pink/red background for badges and pills |
| `--brand-ember` | `#F58220` | **Warm Ember Orange** — Emblem glow, sub-tag (*"Foundation"*) accent |
| `--teal-accent` | `#62B59F` | **Healing Teal** — Ambient 3D graphics, secondary card highlights |
| `--teal-dark` | `#087F73` | **Diagnostic Teal** — Early screening feature panel background |
| `--black` | `#0A0A0A` | **Deep Black** — Hero section, typography transition, story sections, footer |
| `--background` | `#FAFAFA` | **Off-White Background** — Light theme sections (News, Community, Testimonials) |
| `--white` | `#FFFFFF` | **Pure White** — Cards, modal containers, light buttons |
| `--gray-100` | `#F1F1F1` | **Soft Gray** — Input field backgrounds, secondary badges |
| `--gray-200` | `#E5E5E5` | **Border Light** — Subtle dividers, form field borders |
| `--gray-800` | `#262626` | **Dark Charcoal** — Scrollbar thumbs, dark surface borders |
| `--gray-900` / `--text` | `#171717` | **Main Dark Text** — Primary typography on light backgrounds |
| `--muted` | `#737373` | **Muted Text** — Subtitles and secondary body descriptions |
| `--text-light` | `#FFFFFF` | **Light Text** — Primary typography on dark surfaces |
| `--text-light-muted` | `#A3A3A3` | **Muted Light Text** — Secondary body text on dark surfaces |

### Typography Scale & Motion

* **Typography Families:** Google Fonts `Inter` (sans-serif) & `Manrope` (modern headings).
* **Scale (Fluid via CSS clamp):**
  * Hero Title: `clamp(3.5rem, 7.2vw, 7rem)`
  * Section Titles: `clamp(2.5rem, 5vw, 5rem)`
  * Card Titles: `clamp(1.4rem, 2.2vw, 2.1rem)`
  * Body Text: `clamp(1rem, 1.2vw, 1.15rem)`
* **Motion & Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (Expo Out), smooth 3D tilt effects, spring hover transitions, and sticky scroll-driven canvas sequencing.

---

## 3. Website Sections Breakdown

### 1. Minimal Dock Navigation (`<header>`)
* **Type:** Fixed floating pill dock with dynamic backdrop blur.
* **Scroll Response:** Seamlessly shifts between dark mode (`rgba(10, 10, 10, 0.85)`) and light mode (`rgba(255, 255, 255, 0.92)`).
* **Navigation Links:** *About, Awareness, Care, Stories, Impact, News*.
* **Actions:** Donate CTA button + Fullscreen mobile navigation drawer.

### 2. Centerpiece Canvas Hero (`#hero`)
* **Engine:** HTML5 Canvas sequence loader playing a 120-frame cinematic image sequence synced to scroll depth.
* **Narrative Stages:**
  * **Frame 1 (0–15%):** *No one should face cancer alone.* (Get Support & Mission CTAs)
  * **Frame 2 (15–30%):** *01 / Awareness sparks early action.*
  * **Frame 3 (30–45%):** *02 / Catching signs before symptoms appear.*
  * **Frame 4 (45–60%):** *03 / Guiding every step of the medical journey.*
  * **Frame 5 (60–75%):** *04 / Standing beside those who care.*
  * **Frame 6 (75–90%):** *05 / A united community creates hope.*
  * **Frame 7 (90–100%):** *Together for India — No one should face cancer alone.*

### 3. Kinetic Scroll Typography Section (`#hero-transition`)
* **Engine:** Ambient starry particle canvas background.
* **Sequence:** 6 progressive full-width typographic reveal stages:
  1. *"Cancer can feel overwhelming."*
  2. *"But no one should face it alone."*
  3. *"Awareness creates understanding."*
  4. *"Early detection creates possibilities."*
  5. *"Support creates strength."*
  6. *"Together, we create hope."*

### 4. Interactive 7-Card Overlapping Fan Stack (`#what-we-do`)
* **Engine:** 3D interactive fan stack with cursor tracking, metallic rim lighting, and hover lift.
* **Continuum Stages:**
  1. `01 / Awareness` (Risk understanding, prevention, warning signs)
  2. `02 / Screening` (Timely detection in underserved communities)
  3. `03 / Diagnosis` (Navigating clinical terms & immediate next steps)
  4. `04 / Treatment` (Connecting with clinical companions and resources)
  5. `05 / Caregiving` (Respite care, family emotional counseling)
  6. `06 / Recovery` (Rehabilitation, long-term surveillance)
  7. `07 / Community` (Compassionate united support ecosystem)

### 5. Sticky Stacked Feature Panels (`#deep-dives`)
* **Engine:** Sticky stacking feature cards locking in place on scroll with subtle image parallax.
* **Panels:**
  * **Panel 01 (Deep Charcoal):** *01 / Awareness & Knowledge — "Know earlier."*
  * **Panel 02 (Emerald Teal):** *02 / Early Screening — "Don't wait for symptoms."*
  * **Panel 03 (Warm Light):** *03 / Human Care — "Care doesn't end with diagnosis."*

### 6. Continuum of Care 3D Deck Carousel (`#journey`)
* **Engine:** 5-stage interactive card deck carousel with prev/next controls, dot indicators, and direct modal integration.
* **Stages:**
  * `01 / Stage`: Awareness & Education
  * `02 / Stage`: Early Detection & Mobile Diagnostic Vans
  * `03 / Stage`: Clinical Navigation & 80G Financial Aid
  * `04 / Stage`: Treatment Support & Bedside Companions
  * `05 / Stage`: Survivorship & Survivor Circles

### 7. Human Stories Section (`#stories`)
* **Theme:** Deep black background with 3 featured biographical quote cards that trigger the story reader modal:
  * **Ananya Roy** (5-Year Breast Cancer Survivor • Mumbai)
  * **Marcus Vance** (Family Caregiver • Pune)
  * **Dr. Priya Sharma** (Volunteer Oncologist • Delhi)

### 8. Measurable Impact Metrics (`#impact`)
* **Engine:** Intersection-Observer powered live counters.
* **Metrics:**
  * **10,000+** People Reached
  * **5,000+** Awareness Interactions
  * **1,200+** Screening Initiatives
  * **500+** Volunteers

### 9. Community Visual Mosaic
* Visual grid displaying real survivor, caregiver, and oncologist network profiles (Elena R., David K., Dr. Alisha M., Rohan S.).

### 10. Health & Oncology Newsroom (`#news`)
* **Engine:** Real-time oncology journal with category filters, dynamic news grid, and expandable list.
* **Categories:** *All, Cancer Research, Early Detection, Prevention, Treatment, Care*.
* **✦ AI Insight Button:** Queries the backend Google Gemini AI endpoint to generate instant oncology research summaries.

### 11. Testimonials & Community Trust
* Multi-column verified testimonial quotes from caregivers, survivors, and senior hospital oncologists.

### 12. Get Involved & Donation Hub (`#get-involved`)
* **3 Action Pillars:**
  1. **Donate Support:** Pre-configured payment badges (₹ INR, UPI, GPay, PhonePe, Net Banking, 80G Tax Receipt).
  2. **Become a Volunteer:** Applications for care navigation and screening camps.
  3. **Partner With Us:** Corporate CSR & diagnostic van sponsorships.

### 13. Finale CTA & Minimalist Footer (`<footer>`)
* **Display Banner:** High-contrast CTA section with direct action buttons.
* **Footer:** 5-column navigation layout (*Brand, Explore, Get Involved, Support, Legal*) with 80G/12A tax exemption notices.
* **Floating WhatsApp Button:** Direct WhatsApp link (`https://wa.me/...`) for instant patient assistance.

---

## 4. Interactive Modal Systems (9 Dialogs)

| Modal Name | ID | Primary Function |
| :--- | :--- | :--- |
| **Donate Modal** | `#donate-modal` | One-Time / Monthly toggle, predefined amounts (₹500, ₹1k, ₹2.5k, ₹5k, ₹10k), real-time impact calculator, and PAN 80G fields. |
| **Story Reader Modal** | `#story-modal` | Expanded biographical reader with author image, quote, and clinical journey story. |
| **Volunteer Modal** | `#volunteer-modal` | Volunteer role selection (Care Companion, Oncologist, Community Organizer, Event Helper). |
| **Guide & Toolkit Modal** | `#guide-modal` | Email-based download delivery for multi-lingual cancer screening guide PDFs. |
| **Confidential Support Modal** | `#support-modal` | Priority callback form for patients and caregivers needing navigation assistance. |
| **Contact Modal** | `#contact-modal` | Direct message submission to foundation coordinators. |
| **CSR Partnership Modal** | `#csr-modal` | Corporate partnership and employee wellness drive proposals. |
| **Newsletter Modal** | `#newsletter-modal` | Monthly oncology research and story subscription. |
| **Feedback Modal** | `#feedback-modal` | Community experience and feedback collection. |

---

## 5. Technical & Backend Architecture

* **Frontend:** Vanilla HTML5, Modern CSS (Custom Properties, Glassmorphism, 3D CSS), Vanilla ES6 Modules.
* **Canvas Engines:** 120-frame image sequence loader (`js/canvas-hero.js`) + Starry particle animation (`js/components/scroll-typography.js`).
* **Node.js Backend:** `server.mjs` (Express REST APIs for news fetching, AI generation, and form processing).
* **PHP API Bridge:** `api/submit-form.php` (Fallback backend for standard Apache/Hostinger environments).
* **Email Infrastructure:**
  * `services/email/emailService.mjs` — Transactional email engine with responsive HTML templates.
  * `services/email/mailhogServer.mjs` — Local SMTP testing mock server.
* **AI Provider:** `services/ai/aiProvider.mjs` & `services/ai/emailGenerator.mjs` (Google Gemini AI integration with offline heuristic fallbacks).
