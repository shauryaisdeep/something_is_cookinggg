const NodeCache = require('node-cache');

class CacheManager {
    constructor() {
        this.caches = new Map();
        this.defaultTTL = 300; // 5 minutes
        this.defaultCheckPeriod = 60; // 1 minute
    }

    /**
     * Create a new cache instance
     */
    createCache(name, options = {}) {
        const config = {
            stdTTL: options.ttl || this.defaultTTL,
            checkperiod: options.checkPeriod || this.defaultCheckPeriod,
            useClones: options.useClones !== false,
            deleteOnExpire: options.deleteOnExpire !== false,
            ...options
        };

        const cache = new NodeCache(config);
        this.caches.set(name, cache);

        // Setup event listeners
        cache.on('set', (key, value) => {
            console.log(`📦 Cache [${name}] SET: ${key}`);
        });

        cache.on('del', (key, value) => {
            console.log(`🗑️ Cache [${name}] DEL: ${key}`);
        });

        cache.on('expired', (key, value) => {
            console.log(`⏰ Cache [${name}] EXPIRED: ${key}`);
        });

        cache.on('flush', () => {
            console.log(`🧹 Cache [${name}] FLUSHED`);
        });

        return cache;
    }

    /**
     * Get cache instance by name
     */
    getCache(name) {
        return this.caches.get(name);
    }

    /**
     * Set value in cache
     */
    set(name, key, value, ttl = null) {
        const cache = this.getCache(name);
        if (!cache) {
            throw new Error(`Cache '${name}' not found`);
        }

        if (ttl) {
            return cache.set(key, value, ttl);
        } else {
            return cache.set(key, value);
        }
    }

    /**
     * Get value from cache
     */
    get(name, key) {
        const cache = this.getCache(name);
        if (!cache) {
            return undefined;
        }

        return cache.get(key);
    }

    /**
     * Delete value from cache
     */
    del(name, key) {
        const cache = this.getCache(name);
        if (!cache) {
            return false;
        }

        return cache.del(key);
    }

    /**
     * Check if key exists in cache
     */
    has(name, key) {
        const cache = this.getCache(name);
        if (!cache) {
            return false;
        }

        return cache.has(key);
    }

    /**
     * Get all keys in cache
     */
    keys(name) {
        const cache = this.getCache(name);
        if (!cache) {
            return [];
        }

        return cache.keys();
    }

    /**
     * Get cache statistics
     */
    getStats(name) {
        const cache = this.getCache(name);
        if (!cache) {
            return null;
        }

        return cache.getStats();
    }

    /**
     * Flush cache
     */
    flush(name) {
        const cache = this.getCache(name);
        if (!cache) {
            return false;
        }

        cache.flushAll();
        return true;
    }

    /**
     * Flush all caches
     */
    flushAll() {
        this.caches.forEach((cache, name) => {
            cache.flushAll();
            console.log(`🧹 Flushed cache: ${name}`);
        });
    }

    /**
     * Close cache
     */
    close(name) {
        const cache = this.getCache(name);
        if (!cache) {
            return false;
        }

        cache.close();
        this.caches.delete(name);
        return true;
    }

    /**
     * Close all caches
     */
    closeAll() {
        this.caches.forEach((cache, name) => {
            cache.close();
        });
        this.caches.clear();
    }

    /**
     * Get all cache names
     */
    getCacheNames() {
        return Array.from(this.caches.keys());
    }

    /**
     * Get comprehensive statistics for all caches
     */
    getAllStats() {
        const stats = {};
        
        this.caches.forEach((cache, name) => {
            stats[name] = {
                ...cache.getStats(),
                keys: cache.keys().length
            };
        });

        return stats;
    }

    /**
     * Create specialized caches for the application
     */
    initializeApplicationCaches() {
        // Market data cache (30 seconds TTL)
        this.createCache('marketData', {
            ttl: 30,
            checkPeriod: 10
        });

        // Order book cache (15 seconds TTL)
        this.createCache('orderBooks', {
            ttl: 15,
            checkPeriod: 5
        });

        // Arbitrage cache (2 minutes TTL)
        this.createCache('arbitrage', {
            ttl: 120,
            checkPeriod: 30
        });

        // Trade execution cache (5 minutes TTL)
        this.createCache('trades', {
            ttl: 300,
            checkPeriod: 60
        });

        // Top assets cache (30 minutes TTL)
        this.createCache('topAssets', {
            ttl: 1800,
            checkPeriod: 300
        });

        // Liquidity cache (5 minutes TTL)
        this.createCache('liquidity', {
            ttl: 300,
            checkPeriod: 60
        });

        console.log('✅ Application caches initialized');
    }

    /**
     * Cache middleware for Express
     */
    middleware(name, ttl = null) {
        return (req, res, next) => {
            const cache = this.getCache(name);
            if (!cache) {
                return next();
            }

            const key = `${req.method}:${req.originalUrl}`;
            const cached = cache.get(key);

            if (cached) {
                console.log(`📦 Cache HIT: ${key}`);
                return res.json(cached);
            }

            // Store original res.json
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = (data) => {
                if (res.statusCode === 200) {
                    if (ttl) {
                        cache.set(key, data, ttl);
                    } else {
                        cache.set(key, data);
                    }
                    console.log(`📦 Cache SET: ${key}`);
                }
                return originalJson(data);
            };

            next();
        };
    }

    /**
     * Memory usage monitoring
     */
    getMemoryUsage() {
        const usage = process.memoryUsage();
        const cacheStats = this.getAllStats();
        
        let totalCacheKeys = 0;
        Object.values(cacheStats).forEach(stats => {
            totalCacheKeys += stats.keys || 0;
        });

        return {
            ...usage,
            totalCacheKeys,
            cacheCount: this.caches.size
        };
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        this.caches.forEach((cache, name) => {
            const keys = cache.keys();
            let cleaned = 0;
            
            keys.forEach(key => {
                if (!cache.has(key)) {
                    cleaned++;
                }
            });
            
            if (cleaned > 0) {
                console.log(`🧹 Cleaned ${cleaned} expired entries from cache: ${name}`);
            }
        });
    }
}

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
