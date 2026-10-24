<?php
/**
 * AvinyaCareFoundation - Public Crowdfunding Campaigns API
 * Serves verified dynamic crowdfunding campaigns and spotlight infrastructure projects.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (isset($_GET['_t'])) {
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
} else {
    header('Cache-Control: public, max-age=60');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cache-manager.php';

$pdo = getDatabaseConnection();
$category = strtolower(trim((string) ($_GET['category'] ?? '')));

$cacheKey = 'crowdfunding:pub:v2:' . md5($category);

$result = AvinyaCache::remember($cacheKey, ['crowdfunding', 'homepage'], 300, function() use ($pdo, $category) {
    if ($pdo === null) return null;
    try {
        $sql = "SELECT
                    id,
                    campaign_id,
                    title,
                    slug,
                    category,
                    category_label,
                    tag_label,
                    location,
                    hospital_name,
                    goal_amount,
                    raised_amount,
                    donor_count,
                    target_timeline,
                    description,
                    image,
                    alt_text,
                    whatsapp_text,
                    donation_category,
                    is_spotlight,
                    is_tax_exempt,
                    is_published,
                    sort_order,
                    created_at,
                    updated_at
                FROM `crowdfunding_campaigns`
                WHERE `is_published` = 1 AND `deleted_at` IS NULL";

        $params = [];
        if ($category !== '' && $category !== 'all') {
            $sql .= " AND LOWER(`category`) = :cat";
            $params[':cat'] = $category;
        }

        $sql .= " ORDER BY `is_spotlight` DESC, `sort_order` ASC, `created_at` DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format numeric types
        $formatted = array_map(function($r) {
            $copy = json_decode(file_get_contents(dirname(__DIR__) . '/data/campaign-copy-overrides.json'), true) ?: [];
            $r = array_merge($r, $copy[$r['campaign_id']] ?? []);
            $r['goal_amount'] = (float)$r['goal_amount'];
            $r['raised_amount'] = (float)$r['raised_amount'];
            $r['donor_count'] = (int)$r['donor_count'];
            $r['is_spotlight'] = (int)$r['is_spotlight'];
            $r['is_tax_exempt'] = (int)$r['is_tax_exempt'];
            $r['is_published'] = (int)$r['is_published'];
            $r['sort_order'] = (int)$r['sort_order'];
            return $r;
        }, $rows);

        $spotlight = null;
        $campaigns = [];

        foreach ($formatted as $item) {
            if ($item['is_spotlight'] === 1 && $spotlight === null) {
                $spotlight = $item;
            } else {
                $campaigns[] = $item;
            }
        }

        // Automatic Fallback: If no campaign is marked as spotlight, choose the first published one
        if ($spotlight === null && !empty($formatted)) {
            $spotlight = $formatted[0];
            $campaigns = array_slice($formatted, 1);
        }

        return [
            'spotlight' => $spotlight,
            'campaigns' => $campaigns,
            'all' => $formatted,
            'count' => count($formatted)
        ];
    } catch (Throwable $e) {
        error_log('Crowdfunding Public API Exception: ' . $e->getMessage());
        return null;
    }
});

if ($result !== null && is_array($result)) {
    echo json_encode([
        'status' => 'ok',
        'count' => $result['count'] ?? 0,
        'spotlight' => $result['spotlight'] ?? null,
        'campaigns' => $result['campaigns'] ?? [],
        'data' => $result['all'] ?? []
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit(0);
}

// Fallback to seed_crowdfunding.json if DB is unavailable
$seedFile = dirname(__DIR__) . '/data/seed_crowdfunding.json';
$items = [];
if (file_exists($seedFile)) {
    $raw = json_decode((string) file_get_contents($seedFile), true);
    if (is_array($raw)) {
        $items = array_values(array_filter($raw, function($item) use ($category) {
            if (isset($item['is_published']) && !$item['is_published']) return false;
            if ($category === '' || $category === 'all') return true;
            return strtolower((string) ($item['category'] ?? '')) === $category;
        }));
    }
}

$spotlight = null;
$campaigns = [];
foreach ($items as $item) {
    if (!empty($item['is_spotlight']) && $spotlight === null) {
        $spotlight = $item;
    } else {
        $campaigns[] = $item;
    }
}

if ($spotlight === null && !empty($items)) {
    $spotlight = $items[0];
    $campaigns = array_slice($items, 1);
}

echo json_encode([
    'status' => 'ok',
    'fallback' => true,
    'count' => count($items),
    'spotlight' => $spotlight,
    'campaigns' => $campaigns,
    'data' => $items
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
