# AvinyaCareFoundation - Crowdfunding Admin Panel & Dynamic DB Management Guide

This document explains the Crowdfunding architecture, database schema, Admin Panel interface, and automated deployment workflow so you can manage or replicate it on any system.

---

## 1. System Overview

All Crowdfunding campaigns displayed on [`https://avinyacarefoundation.org/crowdfunding.html`](https://avinyacarefoundation.org/crowdfunding.html) are **100% dynamic and database-driven**, managed via the Admin Panel at [`https://avinyacarefoundation.org/admin.html`](https://avinyacarefoundation.org/admin.html).

- **Database Table**: `crowdfunding_campaigns` in Hostinger MySQL (`u382139760_ngo_staging`).
- **Public API**: `GET /api/crowdfunding.php` (Serves cached JSON with spotlight campaign & categorized active campaigns).
- **Admin API**: `POST /api/admin-data.php` (CRUD actions: save, delete, toggle publish, toggle spotlight, reorder).
- **Public Frontend**: `crowdfunding.html` + `js/crowdfunding-page.js` (Renders urgent spotlight card + grid campaigns dynamically with fallback protection).
- **Location Constraints**: Strictly **Virar / Vasai** locations across all campaigns.

---

## 2. MySQL Database Schema

The table `crowdfunding_campaigns` is automatically migrated and verified by `api/db.php` and `api/migrate.php`:

```sql
CREATE TABLE IF NOT EXISTS `crowdfunding_campaigns` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `campaign_id` VARCHAR(100) UNIQUE NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) UNIQUE,
    `category` VARCHAR(100) DEFAULT 'infrastructure',
    `category_label` VARCHAR(150),
    `tag_label` VARCHAR(100) DEFAULT '80G Tax Saver',
    `location` VARCHAR(150) DEFAULT 'Virar, Vasai-Virar',
    `hospital_name` VARCHAR(200),
    `goal_amount` DECIMAL(12, 2) NOT NULL DEFAULT 500000.00,
    `raised_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `donor_count` INT NOT NULL DEFAULT 0,
    `target_timeline` VARCHAR(100) DEFAULT 'Target: Next 30 Days',
    `description` TEXT,
    `image` VARCHAR(255),
    `alt_text` VARCHAR(255),
    `whatsapp_text` TEXT,
    `donation_category` VARCHAR(150),
    `is_spotlight` TINYINT(1) DEFAULT 0,
    `is_tax_exempt` TINYINT(1) DEFAULT 1,
    `is_published` TINYINT(1) DEFAULT 1,
    `sort_order` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    INDEX `idx_cf_published` (`is_published`),
    INDEX `idx_cf_spotlight` (`is_spotlight`),
    INDEX `idx_cf_category` (`category`),
    INDEX `idx_cf_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Pre-Seeded Default Campaigns (All in Virar & Vasai)

1. **Spotlight Urgent Infrastructure**:
   - **Title**: `Deploying a fully-equipped Mobile Medical Ambulance across Vasai-Virar`
   - **Location**: `Vasai-Virar Region`
   - **Goal**: ₹25,00,000 | **Tag**: AvinyaCareFoundation Official Project
   - **Spotlight Flag**: `1` (Renders in top Urgent Spotlight Hero section)

2. **Hospital Construction**:
   - **Title**: `Construction of 100-Bed Multi-Speciality Hospital`
   - **Location**: `Virar East, Vasai-Virar`
   - **Hospital**: `Avinya Multi-Speciality Hospital, Virar East`
   - **Goal**: ₹50,00,000 | **Tag**: 80G Tax Saver

3. **Children Care & Wards**:
   - **Title**: `Equipping New Children Care Hospital & NICU`
   - **Location**: `Vasai West, Vasai-Virar`
   - **Hospital**: `Avinya Children Care Hospital, Vasai West`
   - **Goal**: ₹15,00,000 | **Tag**: 80G Tax Saver

4. **Specialized Dialysis Center**:
   - **Title**: `Setting up a 10-Bed Free Dialysis Center`
   - **Location**: `Virar West`
   - **Hospital**: `Avinya Community Dialysis Unit, Virar West`
   - **Goal**: ₹30,00,000 | **Tag**: 80G Tax Saver

5. **Community Health Camps**:
   - **Title**: `Mega Free Health & Diagnostics Camp across Vasai-Virar`
   - **Location**: `Vasai-Virar Rural Belt`
   - **Hospital**: `Avinya Mobile Diagnostic Outreach`
   - **Goal**: ₹5,00,000 | **Tag**: 80G Tax Saver

---

## 4. How to Manage Campaigns from Admin Panel

1. Go to [`https://avinyacarefoundation.org/admin.html`](https://avinyacarefoundation.org/admin.html).
2. Sign in with admin credentials:
   - **Email**: `admin@avinyacarefoundation.org`
   - **Password**: `Demo@Avinya2026`
3. Click **"Crowdfunding"** in the sidebar.
4. Available Actions:
   - **Add Campaign**: Click `🎗️ Add Campaign` at the top right to create a new campaign with banner upload, target goal, Virar/Vasai location, description, and WhatsApp share message.
   - **Edit Campaign**: Click `✏️ Edit` on any campaign row to update goals, raised amounts, donors, timeline, or images.
   - **Toggle Spotlight**: Click the `Standard` or `🌟 Spotlight` badge to set any campaign as the primary hero spotlight banner on `/crowdfunding.html`.
   - **Toggle Publish / Draft**: Click `🟢 Published` or `🟡 Draft` to instantly show/hide campaigns on the live site.
   - **Reorder**: Change the number in the `Sort` column to reorder campaigns.
   - **Delete**: Click `🗑️ Delete` to soft-delete any campaign.
   - **Export**: Click `📥 Export CSV` or `📄 Export PDF Report` to download complete campaign audit reports.

---

## 5. One-Command Push to Live Deployment

To deploy from any computer or terminal:

```bash
# 1. Run local verification
node scripts/preflight.mjs

# 2. Stage and commit
git add -A
git commit -m "feat: update crowdfunding data"

# 3. Deploy live (pushes to origin/main, pulls on Hostinger, runs migrations, smoke tests)
node scripts/deploy-remote.mjs
```
