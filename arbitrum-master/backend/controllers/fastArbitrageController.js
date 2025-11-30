const FastArbitrageService = require('../services/fastArbitrageService');
const RealtimeCacheService = require('../services/realtimeCacheService');

class FastArbitrageController {
    constructor() {
        this.fastArbitrageService = new FastArbitrageService();
        this.cacheService = new RealtimeCacheService();
    }

    /**
     * Run fast arbitrage analysis
     */
    async runAnalysis(req, res) {
        try {
            console.log('🚀 Starting fast arbitrage analysis...');
            
            const startTime = Date.now();
            const analysis = await this.fastArbitrageService.runFastAnalysis();
            const analysisTime = Date.now() - startTime;
            
            // Store in real-time cache
            this.cacheService.storeArbitrageOpportunities(analysis.opportunities);
            
            // Add analysis time to response
            analysis.analysis.analysisTimeMs = analysisTime;
            
            res.json({
                success: true,
                data: analysis,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error running arbitrage analysis:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to run arbitrage analysis',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get cached arbitrage opportunities
     */
    async getOpportunities(req, res) {
        try {
            console.log('📊 Fetching cached arbitrage opportunities...');
            
            const cached = this.cacheService.getArbitrageOpportunities();
            
            if (!cached) {
                return res.status(404).json({
                    success: false,
                    error: 'No cached opportunities found',
                    message: 'Run analysis first to generate opportunities',
                    timestamp: new Date().toISOString()
                });
            }
            
            res.json({
                success: true,
                data: cached,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching opportunities:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch opportunities',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Validate specific opportunity
     */
    async validateOpportunity(req, res) {
        try {
            const { opportunity } = req.body;
            
            if (!opportunity) {
                return res.status(400).json({
                    success: false,
                    error: 'Opportunity data is required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`🔍 Validating opportunity: ${opportunity.loop?.join(' → ')}...`);
            
            const isValid = await this.fastArbitrageService.validateOpportunity(opportunity);
            
            res.json({
                success: true,
                data: {
                    isValid,
                    opportunity: opportunity.loop?.join(' → '),
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error validating opportunity:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to validate opportunity',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get current prices for a trading path
     */
    async getCurrentPrices(req, res) {
        try {
            const { path } = req.body;
            
            if (!path || !Array.isArray(path) || path.length < 3) {
                return res.status(400).json({
                    success: false,
                    error: 'Valid trading path is required (minimum 3 assets)',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`📊 Fetching current prices for path: ${path.join(' → ')}...`);
            
            const prices = await this.fastArbitrageService.getCurrentPrices(path);
            
            res.json({
                success: true,
                data: {
                    path,
                    prices,
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching current prices:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch current prices',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get analysis status
     */
    async getAnalysisStatus(req, res) {
        try {
            const stats = this.fastArbitrageService.getAnalysisStats();
            const cached = this.cacheService.getArbitrageOpportunities();
            
            const status = {
                isRunning: false, // Analysis is synchronous for now
                lastAnalysis: cached ? cached.timestamp : null,
                opportunitiesCount: cached ? cached.count : 0,
                cacheStats: stats,
                timestamp: new Date().toISOString()
            };
            
            res.json({
                success: true,
                data: status,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching analysis status:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch analysis status',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Clear arbitrage cache
     */
    async clearCache(req, res) {
        try {
            this.fastArbitrageService.clearCache();
            this.cacheService.clearCache('arbitrage');
            
            res.json({
                success: true,
                message: 'Arbitrage cache cleared',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error clearing arbitrage cache:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to clear arbitrage cache',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get analysis configuration
     */
    async getConfig(req, res) {
        try {
            const config = {
                minProfitThreshold: this.fastArbitrageService.MIN_PROFIT_THRESHOLD,
                minLiquidity: this.fastArbitrageService.MIN_LIQUIDITY,
                maxSlippage: this.fastArbitrageService.MAX_SLIPPAGE,
                rateLimits: this.fastArbitrageService.RATE_LIMITS,
                timestamp: new Date().toISOString()
            };
            
            res.json({
                success: true,
                data: config,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching config:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch configuration',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Update analysis configuration
     */
    async updateConfig(req, res) {
        try {
            const { minProfitThreshold, minLiquidity, maxSlippage } = req.body;
            
            if (minProfitThreshold !== undefined) {
                this.fastArbitrageService.MIN_PROFIT_THRESHOLD = minProfitThreshold;
            }
            
            if (minLiquidity !== undefined) {
                this.fastArbitrageService.MIN_LIQUIDITY = minLiquidity;
            }
            
            if (maxSlippage !== undefined) {
                this.fastArbitrageService.MAX_SLIPPAGE = maxSlippage;
            }
            
            res.json({
                success: true,
                message: 'Configuration updated',
                data: {
                    minProfitThreshold: this.fastArbitrageService.MIN_PROFIT_THRESHOLD,
                    minLiquidity: this.fastArbitrageService.MIN_LIQUIDITY,
                    maxSlippage: this.fastArbitrageService.MAX_SLIPPAGE
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error updating config:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to update configuration',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get analysis history
     */
    async getAnalysisHistory(req, res) {
        try {
            const { limit = 10 } = req.query;
            
            // Get recent trades from cache
            const recentTrades = this.cacheService.getRecentTrades(parseInt(limit));
            
            res.json({
                success: true,
                data: {
                    analyses: recentTrades,
                    count: recentTrades.length,
                    limit: parseInt(limit)
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching analysis history:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch analysis history',
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
                service: 'fastArbitrage',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                config: {
                    minProfitThreshold: this.fastArbitrageService.MIN_PROFIT_THRESHOLD,
                    minLiquidity: this.fastArbitrageService.MIN_LIQUIDITY,
                    maxSlippage: this.fastArbitrageService.MAX_SLIPPAGE
                },
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

module.exports = FastArbitrageController;
