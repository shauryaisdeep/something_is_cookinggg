const NodeCache = require('node-cache');

class RateLimiter {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 60, // 1 minute
            checkperiod: 10
        });
        
        this.defaultLimits = {
            windowMs: 60000, // 1 minute
            maxRequests: 100,
            skipSuccessfulRequests: false,
            skipFailedRequests: false
        };
    }

    /**
     * Create rate limiter middleware
     */
    createLimiter(options = {}) {
        const config = { ...this.defaultLimits, ...options };
        
        return (req, res, next) => {
            const key = this.getKey(req, config);
            const now = Date.now();
            const windowStart = now - config.windowMs;
            
            // Get existing requests for this key
            let requests = this.cache.get(key) || [];
            
            // Filter out old requests outside the window
            requests = requests.filter(timestamp => timestamp > windowStart);
            
            // Check if limit exceeded
            if (requests.length >= config.maxRequests) {
                const resetTime = Math.ceil((requests[0] + config.windowMs) / 1000);
                
                res.set({
                    'X-RateLimit-Limit': config.maxRequests,
                    'X-RateLimit-Remaining': 0,
                    'X-RateLimit-Reset': resetTime,
                    'Retry-After': Math.ceil((requests[0] + config.windowMs - now) / 1000)
                });
                
                return res.status(429).json({
                    success: false,
                    error: 'Too Many Requests',
                    message: `Rate limit exceeded. Try again in ${Math.ceil((requests[0] + config.windowMs - now) / 1000)} seconds.`,
                    retryAfter: Math.ceil((requests[0] + config.windowMs - now) / 1000),
                    timestamp: new Date().toISOString()
                });
            }
            
            // Add current request
            requests.push(now);
            this.cache.set(key, requests, Math.ceil(config.windowMs / 1000));
            
            // Set rate limit headers
            const remaining = Math.max(0, config.maxRequests - requests.length);
            const resetTime = Math.ceil((now + config.windowMs) / 1000);
            
            res.set({
                'X-RateLimit-Limit': config.maxRequests,
                'X-RateLimit-Remaining': remaining,
                'X-RateLimit-Reset': resetTime
            });
            
            next();
        };
    }

    /**
     * Get rate limit key for request
     */
    getKey(req, config) {
        // Use IP address as default key
        let key = req.ip || req.connection.remoteAddress;
        
        // Add user ID if available
        if (req.user && req.user.id) {
            key += `:user:${req.user.id}`;
        }
        
        // Add custom key if provided
        if (config.keyGenerator) {
            key += `:${config.keyGenerator(req)}`;
        }
        
        return key;
    }

    /**
     * API rate limiter (100 requests per minute)
     */
    apiLimiter() {
        return this.createLimiter({
            windowMs: 60000, // 1 minute
            maxRequests: 100
        });
    }

    /**
     * Strict rate limiter (10 requests per minute)
     */
    strictLimiter() {
        return this.createLimiter({
            windowMs: 60000, // 1 minute
            maxRequests: 10
        });
    }

    /**
     * Burst rate limiter (1000 requests per minute)
     */
    burstLimiter() {
        return this.createLimiter({
            windowMs: 60000, // 1 minute
            maxRequests: 1000
        });
    }

    /**
     * WebSocket rate limiter
     */
    websocketLimiter() {
        return this.createLimiter({
            windowMs: 60000, // 1 minute
            maxRequests: 200
        });
    }

    /**
     * Arbitrage analysis rate limiter
     */
    arbitrageLimiter() {
        return this.createLimiter({
            windowMs: 300000, // 5 minutes
            maxRequests: 10
        });
    }

    /**
     * Trade execution rate limiter
     */
    tradeLimiter() {
        return this.createLimiter({
            windowMs: 60000, // 1 minute
            maxRequests: 5
        });
    }

    /**
     * Get rate limit status for a key
     */
    getStatus(key) {
        const requests = this.cache.get(key) || [];
        const now = Date.now();
        const windowStart = now - this.defaultLimits.windowMs;
        
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        return {
            key,
            requests: validRequests.length,
            limit: this.defaultLimits.maxRequests,
            remaining: Math.max(0, this.defaultLimits.maxRequests - validRequests.length),
            resetTime: validRequests.length > 0 ? 
                Math.ceil((validRequests[0] + this.defaultLimits.windowMs) / 1000) : 
                Math.ceil((now + this.defaultLimits.windowMs) / 1000)
        };
    }

    /**
     * Reset rate limit for a key
     */
    reset(key) {
        this.cache.del(key);
        return true;
    }

    /**
     * Get all rate limit keys
     */
    getAllKeys() {
        return this.cache.keys();
    }

    /**
     * Get rate limiter statistics
     */
    getStats() {
        const stats = this.cache.getStats();
        const keys = this.cache.keys();
        
        let totalRequests = 0;
        keys.forEach(key => {
            const requests = this.cache.get(key) || [];
            totalRequests += requests.length;
        });
        
        return {
            ...stats,
            totalKeys: keys.length,
            totalRequests,
            averageRequestsPerKey: keys.length > 0 ? totalRequests / keys.length : 0
        };
    }

    /**
     * Cleanup old entries
     */
    cleanup() {
        const keys = this.cache.keys();
        const now = Date.now();
        let cleaned = 0;
        
        keys.forEach(key => {
            const requests = this.cache.get(key) || [];
            const validRequests = requests.filter(timestamp => 
                timestamp > now - this.defaultLimits.windowMs
            );
            
            if (validRequests.length === 0) {
                this.cache.del(key);
                cleaned++;
            } else if (validRequests.length !== requests.length) {
                this.cache.set(key, validRequests);
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} expired rate limit entries`);
        }
        
        return cleaned;
    }

    /**
     * Middleware to skip rate limiting for certain conditions
     */
    skipLimiter(condition) {
        return (req, res, next) => {
            if (condition(req)) {
                return next();
            }
            
            // Apply default rate limiting
            return this.apiLimiter()(req, res, next);
        };
    }

    /**
     * Custom rate limiter with dynamic limits
     */
    dynamicLimiter(getLimits) {
        return (req, res, next) => {
            const limits = getLimits(req);
            const limiter = this.createLimiter(limits);
            return limiter(req, res, next);
        };
    }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

module.exports = rateLimiter;
