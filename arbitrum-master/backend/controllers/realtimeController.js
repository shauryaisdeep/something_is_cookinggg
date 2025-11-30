const RealtimeCacheService = require('../services/realtimeCacheService');
const WebSocketService = require('../services/websocketService');

class RealtimeController {
    constructor() {
        this.cacheService = new RealtimeCacheService();
        this.websocketService = null; // Will be injected
    }

    /**
     * Set WebSocket service reference
     */
    setWebSocketService(websocketService) {
        this.websocketService = websocketService;
    }

    /**
     * Get real-time market data
     */
    async getMarketData(req, res) {
        try {
            const { pair } = req.params;
            
            if (!pair) {
                return res.status(400).json({
                    success: false,
                    error: 'Trading pair is required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`📊 Fetching real-time market data for ${pair}...`);
            
            const marketData = this.cacheService.getMarketData(pair);
            
            if (!marketData) {
                return res.status(404).json({
                    success: false,
                    error: 'Market data not found',
                    message: 'No cached data available for this pair',
                    timestamp: new Date().toISOString()
                });
            }
            
            res.json({
                success: true,
                data: marketData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching market data:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch market data',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get real-time order book
     */
    async getOrderBook(req, res) {
        try {
            const { pair } = req.params;
            
            if (!pair) {
                return res.status(400).json({
                    success: false,
                    error: 'Trading pair is required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`📊 Fetching real-time order book for ${pair}...`);
            
            const orderBook = this.cacheService.getOrderBook(pair);
            
            if (!orderBook) {
                return res.status(404).json({
                    success: false,
                    error: 'Order book not found',
                    message: 'No cached data available for this pair',
                    timestamp: new Date().toISOString()
                });
            }
            
            res.json({
                success: true,
                data: orderBook,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching order book:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch order book',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get real-time arbitrage opportunities
     */
    async getArbitrageOpportunities(req, res) {
        try {
            console.log('📊 Fetching real-time arbitrage opportunities...');
            
            const opportunities = this.cacheService.getArbitrageOpportunities();
            
            if (!opportunities) {
                return res.status(404).json({
                    success: false,
                    error: 'Arbitrage opportunities not found',
                    message: 'No cached opportunities available',
                    timestamp: new Date().toISOString()
                });
            }
            
            res.json({
                success: true,
                data: opportunities,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching arbitrage opportunities:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch arbitrage opportunities',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get WebSocket connection info
     */
    async getWebSocketInfo(req, res) {
        try {
            if (!this.websocketService) {
                return res.status(503).json({
                    success: false,
                    error: 'WebSocket service not available',
                    timestamp: new Date().toISOString()
                });
            }

            const clientsInfo = this.websocketService.getClientsInfo();
            const stats = this.websocketService.getStats();
            
            res.json({
                success: true,
                data: {
                    clients: clientsInfo,
                    stats,
                    endpoint: 'ws://localhost:5000/ws'
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching WebSocket info:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch WebSocket info',
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
            console.log('📊 Fetching cache statistics...');
            
            const stats = this.cacheService.getCacheStats();
            const sizes = this.cacheService.getCacheSizes();
            
            res.json({
                success: true,
                data: {
                    stats,
                    sizes,
                    memory: this.cacheService.getMemoryUsage()
                },
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
     * Clear specific cache
     */
    async clearCache(req, res) {
        try {
            const { type } = req.query;
            
            this.cacheService.clearCache(type);
            
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
     * Start real-time updates
     */
    async startRealtimeUpdates(req, res) {
        try {
            console.log('🚀 Starting real-time updates...');
            
            // This would typically start background processes
            // For now, we'll just return success
            
            res.json({
                success: true,
                message: 'Real-time updates started',
                data: {
                    status: 'active',
                    channels: ['market_data', 'arbitrage', 'trades'],
                    endpoint: 'ws://localhost:5000/ws'
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error starting real-time updates:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to start real-time updates',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Stop real-time updates
     */
    async stopRealtimeUpdates(req, res) {
        try {
            console.log('🛑 Stopping real-time updates...');
            
            // This would typically stop background processes
            // For now, we'll just return success
            
            res.json({
                success: true,
                message: 'Real-time updates stopped',
                data: {
                    status: 'inactive'
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error stopping real-time updates:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to stop real-time updates',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Broadcast message to WebSocket clients
     */
    async broadcastMessage(req, res) {
        try {
            const { message, channel } = req.body;
            
            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Message is required',
                    timestamp: new Date().toISOString()
                });
            }

            if (!this.websocketService) {
                return res.status(503).json({
                    success: false,
                    error: 'WebSocket service not available',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`📢 Broadcasting message${channel ? ` to channel ${channel}` : ''}...`);
            
            const sentCount = channel ? 
                this.websocketService.broadcastToChannel(channel, message) :
                this.websocketService.broadcast(message);
            
            res.json({
                success: true,
                message: 'Message broadcasted',
                data: {
                    sentCount,
                    channel: channel || 'all'
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error broadcasting message:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to broadcast message',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get real-time system status
     */
    async getSystemStatus(req, res) {
        try {
            const cacheStats = this.cacheService.getCacheStats();
            const websocketInfo = this.websocketService ? 
                this.websocketService.getClientsInfo() : null;
            
            const status = {
                realtime: {
                    active: true,
                    cache: {
                        hitRate: cacheStats.overall.hitRate,
                        totalKeys: Object.values(cacheStats.caches).reduce((sum, cache) => sum + cache.keys, 0)
                    },
                    websocket: websocketInfo ? {
                        connectedClients: websocketInfo.total,
                        maxClients: websocketInfo.maxClients
                    } : null
                },
                memory: this.cacheService.getMemoryUsage(),
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            };
            
            res.json({
                success: true,
                data: status,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching system status:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch system status',
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
                service: 'realtime',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cache: {
                    active: true,
                    stats: this.cacheService.getCacheStats()
                },
                websocket: this.websocketService ? {
                    active: true,
                    clients: this.websocketService.getClientsInfo().total
                } : {
                    active: false
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

module.exports = RealtimeController;
