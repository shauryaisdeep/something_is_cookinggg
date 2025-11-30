const NodeCache = require('node-cache');
const EventEmitter = require('events');

class RealtimeCacheService extends EventEmitter {
    constructor() {
        super();
        
        // Initialize caches with different TTLs
        this.caches = {
            marketData: new NodeCache({
                stdTTL: 30, // 30 seconds
                checkperiod: 10,
                useClones: false
            }),
            orderBooks: new NodeCache({
                stdTTL: 15, // 15 seconds
                checkperiod: 5,
                useClones: false
            }),
            arbitrage: new NodeCache({
                stdTTL: 60, // 1 minute
                checkperiod: 15,
                useClones: false
            }),
            trades: new NodeCache({
                stdTTL: 300, // 5 minutes
                checkperiod: 30,
                useClones: false
            })
        };
        
        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            startTime: Date.now()
        };
        
        // Smart cache configuration
        this.config = {
            maxMemoryUsage: 100 * 1024 * 1024, // 100MB
            compressionThreshold: 1024, // 1KB
            enableCompression: true,
            enableStats: true
        };
        
        this.startTime = Date.now();
        this.setupEventListeners();
    }

    /**
     * Setup cache event listeners
     */
    setupEventListeners() {
        Object.keys(this.caches).forEach(cacheName => {
            const cache = this.caches[cacheName];
            
            cache.on('set', (key, value) => {
                this.stats.sets++;
                this.emit('cacheSet', { cacheName, key, value });
            });
            
            cache.on('del', (key, value) => {
                this.stats.deletes++;
                this.emit('cacheDelete', { cacheName, key, value });
            });
            
            cache.on('expired', (key, value) => {
                this.emit('cacheExpired', { cacheName, key, value });
            });
        });
    }

    /**
     * Store market data
     */
    storeMarketData(pair, data) {
        const key = `market_${pair}`;
        const compressedData = this.compressData(data);
        
        this.caches.marketData.set(key, {
            data: compressedData,
            timestamp: Date.now(),
            size: JSON.stringify(data).length
        });
        
        this.emit('marketDataUpdated', { pair, data });
    }

    /**
     * Get market data
     */
    getMarketData(pair) {
        const key = `market_${pair}`;
        const cached = this.caches.marketData.get(key);
        
        if (cached) {
            this.stats.hits++;
            return {
                ...this.decompressData(cached.data),
                cached: true,
                age: Date.now() - cached.timestamp
            };
        }
        
        this.stats.misses++;
        return null;
    }

    /**
     * Store order book data
     */
    storeOrderBook(pair, orderBook) {
        const key = `orderbook_${pair}`;
        const compressedData = this.compressData(orderBook);
        
        this.caches.orderBooks.set(key, {
            data: compressedData,
            timestamp: Date.now(),
            size: JSON.stringify(orderBook).length
        });
        
        this.emit('orderBookUpdated', { pair, orderBook });
    }

    /**
     * Get order book data
     */
    getOrderBook(pair) {
        const key = `orderbook_${pair}`;
        const cached = this.caches.orderBooks.get(key);
        
        if (cached) {
            this.stats.hits++;
            return {
                ...this.decompressData(cached.data),
                cached: true,
                age: Date.now() - cached.timestamp
            };
        }
        
        this.stats.misses++;
        return null;
    }

    /**
     * Store arbitrage opportunities
     */
    storeArbitrageOpportunities(opportunities) {
        const key = 'arbitrage_opportunities';
        const compressedData = this.compressData(opportunities);
        
        this.caches.arbitrage.set(key, {
            data: compressedData,
            timestamp: Date.now(),
            count: opportunities.length,
            size: JSON.stringify(opportunities).length
        });
        
        this.emit('arbitrageUpdated', { opportunities });
    }

    /**
     * Get arbitrage opportunities
     */
    getArbitrageOpportunities() {
        const key = 'arbitrage_opportunities';
        const cached = this.caches.arbitrage.get(key);
        
        if (cached) {
            this.stats.hits++;
            return {
                opportunities: this.decompressData(cached.data),
                cached: true,
                count: cached.count,
                age: Date.now() - cached.timestamp
            };
        }
        
        this.stats.misses++;
        return null;
    }

    /**
     * Store trade execution
     */
    storeTradeExecution(tradeId, execution) {
        const key = `trade_${tradeId}`;
        const compressedData = this.compressData(execution);
        
        this.caches.trades.set(key, {
            data: compressedData,
            timestamp: Date.now(),
            size: JSON.stringify(execution).length
        });
        
        this.emit('tradeExecuted', { tradeId, execution });
    }

    /**
     * Get trade execution
     */
    getTradeExecution(tradeId) {
        const key = `trade_${tradeId}`;
        const cached = this.caches.trades.get(key);
        
        if (cached) {
            this.stats.hits++;
            return {
                ...this.decompressData(cached.data),
                cached: true,
                age: Date.now() - cached.timestamp
            };
        }
        
        this.stats.misses++;
        return null;
    }

    /**
     * Get all recent trades
     */
    getRecentTrades(limit = 50) {
        const keys = this.caches.trades.keys();
        const trades = [];
        
        keys.forEach(key => {
            const cached = this.caches.trades.get(key);
            if (cached) {
                trades.push({
                    tradeId: key.replace('trade_', ''),
                    ...this.decompressData(cached.data),
                    timestamp: cached.timestamp
                });
            }
        });
        
        return trades
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Compress data if enabled and above threshold
     */
    compressData(data) {
        if (!this.config.enableCompression) {
            return data;
        }
        
        const jsonString = JSON.stringify(data);
        if (jsonString.length < this.config.compressionThreshold) {
            return data;
        }
        
        // Simple compression using gzip (in production, use zlib)
        try {
            const compressed = Buffer.from(jsonString).toString('base64');
            return {
                compressed: true,
                data: compressed,
                originalSize: jsonString.length,
                compressedSize: compressed.length
            };
        } catch (error) {
            console.warn('⚠️ Compression failed, storing uncompressed:', error.message);
            return data;
        }
    }

    /**
     * Decompress data if compressed
     */
    decompressData(data) {
        if (!data || typeof data !== 'object' || !data.compressed) {
            return data;
        }
        
        try {
            const decompressed = Buffer.from(data.data, 'base64').toString('utf8');
            return JSON.parse(decompressed);
        } catch (error) {
            console.warn('⚠️ Decompression failed:', error.message);
            return data;
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const cacheStats = {};
        
        Object.keys(this.caches).forEach(cacheName => {
            const cache = this.caches[cacheName];
            const stats = cache.getStats();
            
            cacheStats[cacheName] = {
                keys: stats.keys,
                hits: stats.hits,
                misses: stats.misses,
                hitRate: stats.hits / (stats.hits + stats.misses) * 100,
                ttl: cache.options.stdTTL
            };
        });
        
        const totalHits = Object.values(cacheStats).reduce((sum, stats) => sum + stats.hits, 0);
        const totalMisses = Object.values(cacheStats).reduce((sum, stats) => sum + stats.misses, 0);
        
        return {
            caches: cacheStats,
            overall: {
                hits: totalHits,
                misses: totalMisses,
                hitRate: totalHits / (totalHits + totalMisses) * 100,
                uptime: Date.now() - this.startTime
            },
            memory: this.getMemoryUsage(),
            config: this.config
        };
    }

    /**
     * Get memory usage
     */
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: usage.rss,
            heapTotal: usage.heapTotal,
            heapUsed: usage.heapUsed,
            external: usage.external,
            arrayBuffers: usage.arrayBuffers
        };
    }

    /**
     * Clear specific cache
     */
    clearCache(cacheName) {
        if (cacheName && this.caches[cacheName]) {
            this.caches[cacheName].flushAll();
            console.log(`🗑️ Cleared ${cacheName} cache`);
        } else {
            Object.keys(this.caches).forEach(name => {
                this.caches[name].flushAll();
            });
            console.log('🗑️ Cleared all caches');
        }
    }

    /**
     * Get cache size information
     */
    getCacheSizes() {
        const sizes = {};
        
        Object.keys(this.caches).forEach(cacheName => {
            const cache = this.caches[cacheName];
            const keys = cache.keys();
            let totalSize = 0;
            
            keys.forEach(key => {
                const value = cache.get(key);
                if (value && value.size) {
                    totalSize += value.size;
                }
            });
            
            sizes[cacheName] = {
                keys: keys.length,
                totalSize,
                averageSize: keys.length > 0 ? totalSize / keys.length : 0
            };
        });
        
        return sizes;
    }

    /**
     * Optimize cache performance
     */
    optimizeCache() {
        const memoryUsage = this.getMemoryUsage();
        
        // If memory usage is high, clear oldest entries
        if (memoryUsage.heapUsed > this.config.maxMemoryUsage) {
            console.log('🔧 Optimizing cache due to high memory usage...');
            
            Object.keys(this.caches).forEach(cacheName => {
                const cache = this.caches[cacheName];
                const keys = cache.keys();
                
                // Remove oldest 25% of entries
                const keysToRemove = keys.slice(0, Math.floor(keys.length * 0.25));
                keysToRemove.forEach(key => cache.del(key));
            });
            
            this.emit('cacheOptimized', { memoryUsage });
        }
    }

    /**
     * Start cache optimization interval
     */
    startOptimization() {
        setInterval(() => {
            this.optimizeCache();
        }, 60000); // Check every minute
    }

    /**
     * Shutdown cache service
     */
    shutdown() {
        console.log('🔌 Shutting down cache service...');
        
        Object.keys(this.caches).forEach(cacheName => {
            this.caches[cacheName].close();
        });
        
        console.log('✅ Cache service shutdown complete');
    }
}

module.exports = RealtimeCacheService;
