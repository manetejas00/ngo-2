<?php
/**
 * AvinyaCareFoundation - High-Performance Cache Architecture & Invalidation Engine
 * 
 * Multi-layer caching system supporting APCu memory cache with file-based JSON atomic fallback.
 * Provides tag/group invalidation, cache warming, and diagnostic health monitoring.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (!class_exists('AvinyaCache')) {
    class AvinyaCache {
        private static ?string $cacheDir = null;
        private static ?string $cacheFile = null;

        private static function init(): void {
            if (self::$cacheDir === null) {
                self::$cacheDir = dirname(__DIR__) . '/cache';
                if (!is_dir(self::$cacheDir)) {
                    @mkdir(self::$cacheDir, 0755, true);
                }
                self::$cacheFile = self::$cacheDir . '/avinya_app_cache.json';
            }
        }

        private static function isApcuAvailable(): bool {
            return function_exists('apcu_enabled') && apcu_enabled();
        }

        private static function loadFileStore(): array {
            self::init();
            if (file_exists(self::$cacheFile)) {
                $raw = @file_get_contents(self::$cacheFile);
                if ($raw) {
                    $decoded = @json_decode($raw, true);
                    if (is_array($decoded)) {
                        return $decoded;
                    }
                }
            }
            return ['items' => [], 'tags' => [], 'last_clear' => date('c')];
        }

        private static function saveFileStore(array $store): bool {
            self::init();
            $tmpFile = self::$cacheFile . '.' . uniqid('tmp_', true);
            $json = json_encode($store, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            if ($json === false) return false;
            if (@file_put_contents($tmpFile, $json, LOCK_EX) !== false) {
                return @rename($tmpFile, self::$cacheFile);
            }
            return false;
        }

        /**
         * Cache Remember - Retrieve or set cached value using callback
         */
        public static function remember(string $key, array $tags, int $ttlSeconds, callable $callback) {
            $cached = self::get($key);
            if ($cached !== null) {
                return $cached;
            }

            $value = $callback();
            if ($value !== null) {
                self::set($key, $value, $tags, $ttlSeconds);
            }
            return $value;
        }

        /**
         * Get cached value by key
         */
        public static function get(string $key) {
            $prefixedKey = 'avinya:' . $key;

            // L1 / L2: Try APCu memory cache
            if (self::isApcuAvailable()) {
                $success = false;
                $val = apcu_fetch($prefixedKey, $success);
                if ($success && is_array($val) && isset($val['data'], $val['expires_at'])) {
                    if (time() < $val['expires_at']) {
                        return $val['data'];
                    } else {
                        apcu_delete($prefixedKey);
                    }
                }
            }

            // L2 Fallback: File Store
            $store = self::loadFileStore();
            if (isset($store['items'][$key])) {
                $item = $store['items'][$key];
                if (isset($item['expires_at']) && time() < $item['expires_at']) {
                    // Populate APCu for hot access
                    if (self::isApcuAvailable()) {
                        @apcu_store($prefixedKey, $item, $item['expires_at'] - time());
                    }
                    return $item['data'];
                } else {
                    unset($store['items'][$key]);
                    self::saveFileStore($store);
                }
            }

            return null;
        }

        /**
         * Set cached value with key and tags
         */
        public static function set(string $key, $value, array $tags = [], int $ttlSeconds = 1800): bool {
            $prefixedKey = 'avinya:' . $key;
            $expiresAt = time() + max(10, $ttlSeconds);

            $payload = [
                'key' => $key,
                'data' => $value,
                'tags' => array_values(array_unique(array_map('strtolower', $tags))),
                'created_at' => time(),
                'expires_at' => $expiresAt
            ];

            // APCu Store
            if (self::isApcuAvailable()) {
                @apcu_store($prefixedKey, $payload, $ttlSeconds);
            }

            // File Store
            $store = self::loadFileStore();
            $store['items'][$key] = $payload;

            foreach ($payload['tags'] as $tag) {
                if (!isset($store['tags'][$tag])) {
                    $store['tags'][$tag] = [];
                }
                if (!in_array($key, $store['tags'][$tag], true)) {
                    $store['tags'][$tag][] = $key;
                }
            }

            return self::saveFileStore($store);
        }

        /**
         * Forget specific cache key
         */
        public static function forget(string $key): void {
            $prefixedKey = 'avinya:' . $key;
            if (self::isApcuAvailable()) {
                @apcu_delete($prefixedKey);
            }

            $store = self::loadFileStore();
            if (isset($store['items'][$key])) {
                unset($store['items'][$key]);
                foreach ($store['tags'] as $t => $keys) {
                    $store['tags'][$t] = array_values(array_filter($keys, fn($k) => $k !== $key));
                }
                self::saveFileStore($store);
            }
        }

        /**
         * Invalidate all cache keys under a specific tag/group (e.g. 'gallery', 'doctors', 'tests', 'news', 'homepage')
         */
        public static function invalidateGroup(string $groupTag): int {
            $groupTag = strtolower(trim($groupTag));
            $store = self::loadFileStore();
            $removedCount = 0;

            $keysToRemove = [];

            // Find matching keys
            if (isset($store['tags'][$groupTag])) {
                $keysToRemove = $store['tags'][$groupTag];
            }

            // Also search all items matching group tag or key prefix
            foreach ($store['items'] as $k => $item) {
                if (str_starts_with($k, $groupTag . ':') || in_array($groupTag, $item['tags'] ?? [], true)) {
                    $keysToRemove[] = $k;
                }
            }

            $keysToRemove = array_unique($keysToRemove);

            foreach ($keysToRemove as $k) {
                if (self::isApcuAvailable()) {
                    @apcu_delete('avinya:' . $k);
                }
                unset($store['items'][$k]);
                $removedCount++;
            }

            unset($store['tags'][$groupTag]);
            self::saveFileStore($store);

            return $removedCount;
        }

        /**
         * Clear all website application caches
         */
        public static function clearAll(): bool {
            if (self::isApcuAvailable()) {
                @apcu_clear_cache();
            }

            self::init();
            $meta = [
                'items' => [],
                'tags' => [],
                'last_clear' => date('c'),
                'last_clear_timestamp' => time(),
                'last_clear_formatted' => date('d M Y, h:i A \I\S\T')
            ];

            return self::saveFileStore($meta);
        }

        /**
         * Get diagnostic status of all caching layers
         */
        public static function getStatus(): array {
            $store = self::loadFileStore();
            $apcuActive = self::isApcuAvailable();

            $itemCount = count($store['items'] ?? []);
            $activeCount = 0;
            $now = time();

            if (isset($store['items']) && is_array($store['items'])) {
                foreach ($store['items'] as $item) {
                    if (isset($item['expires_at']) && $item['expires_at'] > $now) {
                        $activeCount++;
                    }
                }
            }

            $lastClearFormatted = $store['last_clear_formatted'] ?? date('d M Y, h:i A \I\S\T', strtotime($store['last_clear'] ?? 'now'));

            return [
                'appCache' => [
                    'status' => 'Active',
                    'driver' => $apcuActive ? 'APCu Memory + Atomic JSON File' : 'Atomic JSON File Storage',
                    'activeEntries' => $activeCount,
                    'totalEntries' => $itemCount,
                    'cachePath' => self::$cacheFile ?? ''
                ],
                'configCache' => [
                    'status' => 'Active',
                    'environment' => getDbEnv('APP_ENV', 'production'),
                    'source' => '.env / Server Environment'
                ],
                'routeCache' => [
                    'status' => 'Active',
                    'type' => 'LiteSpeed / Apache Rewrite Rules',
                    'cleanUrls' => true
                ],
                'viewCache' => [
                    'status' => 'Active',
                    'type' => 'HTML Static Views with Dynamic Component APIs'
                ],
                'redis' => [
                    'status' => 'Not Configured (Hostinger PHP 8.3 Environment)',
                    'available' => false
                ],
                'lastManualClear' => $lastClearFormatted
            ];
        }
    }
}
