const TopAssetsService = require('../services/topAssetsService');
const RealtimeCacheService = require('../services/realtimeCacheService');

class TopAssetsController {
    constructor() {
        this.topAssetsService = new TopAssetsService();
        this.cacheService = new RealtimeCacheService();
    }

    /**
     * Get comprehensive DEX data
     */
    async getDEXData(req, res) {
        try {
            console.log('📊 Fetching DEX data...');
            
            const dexData = await this.topAssetsService.getDEXData();
            
            // Store in real-time cache
            this.cacheService.storeMarketData('dex_overview', dexData);
            
            res.json({
                success: true,
                data: dexData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching DEX data:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch DEX data',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get top assets only
     */
    async getTopAssets(req, res) {
        try {
            console.log('📊 Fetching top assets...');
            
            const topAssets = await this.topAssetsService.getTopAssets();
            
            res.json({
                success: true,
                data: topAssets,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching top assets:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch top assets',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get valid trading pairs
     */
    async getValidTradingPairs(req, res) {
        try {
            console.log('📊 Fetching valid trading pairs...');
            
            const validPairs = await this.topAssetsService.generateValidTradingPairs();
            
            res.json({
                success: true,
                data: validPairs,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching valid trading pairs:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch valid trading pairs',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Check pair liquidity
     */
    async checkPairLiquidity(req, res) {
        try {
            const { baseAsset, counterAsset } = req.params;
            
            if (!baseAsset || !counterAsset) {
                return res.status(400).json({
                    success: false,
                    error: 'Base asset and counter asset are required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`📊 Checking liquidity for ${baseAsset}/${counterAsset}...`);
            
            const liquidity = await this.topAssetsService.checkPairLiquidity(baseAsset, counterAsset);
            
            res.json({
                success: true,
                data: liquidity,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error checking pair liquidity:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to check pair liquidity',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStats(req, res) {
        try {
            const cacheStats = this.topAssetsService.getCacheStats();
            
            res.json({
                success: true,
                data: cacheStats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching cache stats:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch cache statistics',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Clear cache
     */
    async clearCache(req, res) {
        try {
            const { type } = req.query;
            
            this.topAssetsService.clearCache(type);
            
            res.json({
                success: true,
                message: `Cache cleared${type ? ` for ${type}` : ''}`,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error clearing cache:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to clear cache',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get asset information
     */
    async getAssetInfo(req, res) {
        try {
            const { assetCode } = req.params;
            
            if (!assetCode) {
                return res.status(400).json({
                    success: false,
                    error: 'Asset code is required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`📊 Fetching asset info for ${assetCode}...`);
            
            // Get top assets to find the requested asset
            const { assets } = await this.topAssetsService.getTopAssets();
            const asset = assets.find(a => a.code === assetCode.toUpperCase());
            
            if (!asset) {
                return res.status(404).json({
                    success: false,
                    error: 'Asset not found',
                    timestamp: new Date().toISOString()
                });
            }

            // Get additional asset information
            const assetInfo = {
                code: asset.code,
                volume: asset.volume,
                issuer: this.topAssetsService.getAssetIssuer(asset.code),
                isNative: asset.code === 'XLM',
                lastUpdated: new Date().toISOString()
            };
            
            res.json({
                success: true,
                data: assetInfo,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching asset info:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch asset information',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get market overview
     */
    async getMarketOverview(req, res) {
        try {
            console.log('📊 Fetching market overview...');
            
            const [dexData, cacheStats] = await Promise.all([
                this.topAssetsService.getDEXData(),
                this.topAssetsService.getCacheStats()
            ]);

            const marketOverview = {
                summary: dexData.summary,
                topAssets: dexData.topAssets.assets.slice(0, 10), // Top 10
                validPairs: dexData.validPairs.pairs.slice(0, 20), // Top 20
                cache: {
                    hitRate: cacheStats.hitRate,
                    memoryUsage: cacheStats.memoryUsage
                },
                timestamp: new Date().toISOString()
            };
            
            res.json({
                success: true,
                data: marketOverview,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching market overview:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch market overview',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Health check endpoint
     */
    async healthCheck(req, res) {
        try {
            const health = {
                status: 'healthy',
                service: 'topAssets',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            };
            
            res.json({
                success: true,
                data: health,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Health check failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = TopAssetsController;
