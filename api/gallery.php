<?php
/**
 * Avinya Care Foundation - Public Gallery API
 * Serves published gallery records with optional category filtering.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/db.php';

$pdo = getDatabaseConnection();

$category = strtolower(trim((string) ($_GET['category'] ?? '')));

if ($pdo !== null) {
    try {
        $sql = "SELECT 
                    gallery_id AS id,
                    gallery_id,
                    title,
                    slug,
                    short_description,
                    description,
                    image,
                    alt_text,
                    category,
                    event_date,
                    location,
                    photographer,
                    created_by,
                    updated_by,
                    external_link,
                    has_details,
                    image_only,
                    is_featured,
                    is_published,
                    sort_order,
                    created_at,
                    updated_at
                FROM `galleries`
                WHERE `is_published` = 1 AND `deleted_at` IS NULL";
        
        $params = [];
        if ($category !== '' && $category !== 'all') {
            $sql .= " AND LOWER(`category`) = :cat";
            $params[':cat'] = $category;
        }

        $sql .= " ORDER BY COALESCE(updated_at, created_at, event_date) DESC, created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Cast boolean types properly
        $galleries = array_map(function($r) {
            $r['has_details'] = (bool) $r['has_details'];
            $r['image_only'] = (bool) ($r['image_only'] ?? false);
            $r['is_featured'] = (bool) $r['is_featured'];
            $r['is_published'] = (bool) $r['is_published'];
            $r['sort_order'] = (int) $r['sort_order'];
            return $r;
        }, $rows);

        echo json_encode([
            'status' => 'ok',
            'count' => count($galleries),
            'data' => $galleries
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit(0);

    } catch (Throwable $e) {
        error_log('Gallery API Error: ' . $e->getMessage());
    }
}

// Fallback to seed_galleries.json if DB unavailable
$seedFile = dirname(__DIR__) . '/data/seed_galleries.json';
$galleries = [];
if (file_exists($seedFile)) {
    $raw = json_decode((string) file_get_contents($seedFile), true);
    if (is_array($raw)) {
        $galleries = array_values(array_filter($raw, function($item) use ($category) {
            if (empty($item['is_published'])) return false;
            if ($category !== '' && $category !== 'all') {
                return strtolower($item['category'] ?? '') === $category;
            }
            return true;
        }));

        usort($galleries, function($a, $b) {
            $tA = strtotime($a['updated_at'] ?? $a['created_at'] ?? $a['event_date'] ?? '0');
            $tB = strtotime($b['updated_at'] ?? $b['created_at'] ?? $b['event_date'] ?? '0');
            return $tB - $tA;
        });
    }
}

echo json_encode([
    'status' => 'ok',
    'count' => count($galleries),
    'data' => $galleries
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
