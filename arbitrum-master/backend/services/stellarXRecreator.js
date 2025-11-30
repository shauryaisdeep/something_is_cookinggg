const axios = require('axios');
const NodeCache = require('node-cache');

class StellarXRecreator {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 300, // 5 minutes
            checkperiod: 60
        });
        
        this.STELLARX_API = 'https://api.stellarx.com/api';
        this.HORIZON_API = 'https://horizon-testnet.stellar.org';
        
        // Rate limiting
        this.rateLimit = {
            requests: 0,
            resetTime: Date.now() + 60000, // Reset every minute
            maxRequests: 30
        };
    }

    /**
     * Recreate StellarX market data
     */
    async recreateStellarXData() {
        const cacheKey = 'stellarx_data';
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log('📊 Using cached StellarX data');
            return cached;
        }

        try {
            console.log('🔍 Recreating StellarX market data...');
            
            // Check rate limit
            if (!this.checkRateLimit()) {
                throw new Error('Rate limit exceeded');
            }

            // Fetch data from multiple sources
            const [markets, orderBooks, assets] = await Promise.all([
                this.fetchMarkets(),
                this.fetchOrderBooks(),
                this.fetchAssets()
            ]);

            // Combine and format data
            const stellarXData = {
                markets: this.formatMarkets(markets),
                orderBooks: this.formatOrderBooks(orderBooks),
                assets: this.formatAssets(assets),
                summary: {
                    totalMarkets: markets.length,
                    totalAssets: assets.length,
                    activeOrderBooks: orderBooks.length
                },
                timestamp: new Date().toISOString(),
                source: 'stellarx_recreated'
            };

            // Cache for 5 minutes
            this.cache.set(cacheKey, stellarXData, 300);
            
            console.log(`✅ StellarX data recreated: ${markets.length} markets, ${assets.length} assets`);
            return stellarXData;

        } catch (error) {
            console.error('❌ Error recreating StellarX data:', error.message);
            
            // Return fallback data
            return this.getFallbackData();
        }
    }

    /**
     * Fetch markets from StellarX API
     */
    async fetchMarkets() {
        try {
            const response = await axios.get(`${this.STELLARX_API}/markets`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Stellar-Arbitrage-Bot/1.0'
                }
            });

            this.rateLimit.requests++;
            return response.data || [];

        } catch (error) {
            console.error('❌ Error fetching StellarX markets:', error.message);
            
            // Fallback to Horizon API
            return this.fetchMarketsFromHorizon();
        }
    }

    /**
     * Fetch markets from Horizon as fallback
     */
    async fetchMarketsFromHorizon() {
        try {
            const response = await axios.get(`${this.HORIZON_API}/order_book`, {
                params: {
                    limit: 200
                },
                timeout: 8000
            });

            // Convert Horizon order books to market format
            const markets = [];
            const seenPairs = new Set();

            response.data.records.forEach(record => {
                const pair = `${record.base.asset_code || 'XLM'}_${record.counter.asset_code || 'XLM'}`;
                
                if (!seenPairs.has(pair)) {
                    seenPairs.add(pair);
                    markets.push({
                        id: pair,
                        base: record.base,
                        counter: record.counter,
                        volume24h: 0, // Not available from Horizon
                        price: 0, // Will be calculated from order book
                        change24h: 0
                    });
                }
            });

            return markets;

        } catch (error) {
            console.error('❌ Error fetching markets from Horizon:', error.message);
            return [];
        }
    }

    /**
     * Fetch order books
     */
    async fetchOrderBooks() {
        try {
            // Get top trading pairs
            const markets = await this.fetchMarkets();
            const topPairs = markets.slice(0, 20); // Top 20 pairs
            
            const orderBooks = [];
            
            for (const market of topPairs) {
                try {
                    const orderBook = await this.fetchOrderBook(market);
                    if (orderBook) {
                        orderBooks.push(orderBook);
                    }
                    
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    console.warn(`⚠️ Failed to fetch order book for ${market.id}:`, error.message);
                }
            }
            
            return orderBooks;

        } catch (error) {
            console.error('❌ Error fetching order books:', error.message);
            return [];
        }
    }

    /**
     * Fetch single order book
     */
    async fetchOrderBook(market) {
        try {
            const response = await axios.get(`${this.HORIZON_API}/order_book`, {
                params: {
                    selling_asset_type: market.base.asset_type || 'native',
                    selling_asset_code: market.base.asset_code,
                    selling_asset_issuer: market.base.asset_issuer,
                    buying_asset_type: market.counter.asset_type || 'native',
                    buying_asset_code: market.counter.asset_code,
                    buying_asset_issuer: market.counter.asset_issuer,
                    limit: 100
                },
                timeout: 5000
            });

            return {
                market: market.id,
                base: market.base,
                counter: market.counter,
                bids: response.data.bids.map(bid => ({
                    price: parseFloat(bid.price),
                    amount: parseFloat(bid.amount)
                })),
                asks: response.data.asks.map(ask => ({
                    price: parseFloat(ask.price),
                    amount: parseFloat(ask.amount)
                })),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Error fetching order book for ${market.id}:`, error.message);
            return null;
        }
    }

    /**
     * Fetch assets information
     */
    async fetchAssets() {
        try {
            const response = await axios.get(`${this.STELLARX_API}/assets`, {
                timeout: 10000
            });

            this.rateLimit.requests++;
            return response.data || [];

        } catch (error) {
            console.error('❌ Error fetching StellarX assets:', error.message);
            
            // Return common Stellar assets as fallback
            return this.getCommonAssets();
        }
    }

    /**
     * Get common Stellar assets as fallback
     */
    getCommonAssets() {
        return [
            {
                code: 'XLM',
                name: 'Stellar Lumens',
                type: 'native',
                issuer: null,
                supply: '50000000000',
                decimals: 7
            },
            {
                code: 'USDC',
                name: 'USD Coin',
                type: 'credit_alphanum4',
                issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                supply: '1000000000',
                decimals: 7
            },
            {
                code: 'USDT',
                name: 'Tether USD',
                type: 'credit_alphanum4',
                issuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROQDIEDF43RLHOPUZQX3MK2V',
                supply: '1000000000',
                decimals: 7
            },
            {
                code: 'BTC',
                name: 'Bitcoin',
                type: 'credit_alphanum4',
                issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF',
                supply: '21000000',
                decimals: 7
            },
            {
                code: 'ETH',
                name: 'Ethereum',
                type: 'credit_alphanum4',
                issuer: 'GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYEFLFKRQ76D6D3RSPZXHESM6YGFU',
                supply: '120000000',
                decimals: 7
            }
        ];
    }

    /**
     * Format markets data
     */
    formatMarkets(markets) {
        return markets.map(market => ({
            id: market.id,
            base: {
                code: market.base.asset_code || 'XLM',
                type: market.base.asset_type || 'native',
                issuer: market.base.asset_issuer
            },
            counter: {
                code: market.counter.asset_code || 'XLM',
                type: market.counter.asset_type || 'native',
                issuer: market.counter.asset_issuer
            },
            volume24h: market.volume24h || 0,
            price: market.price || 0,
            change24h: market.change24h || 0,
            lastUpdated: new Date().toISOString()
        }));
    }

    /**
     * Format order books data
     */
    formatOrderBooks(orderBooks) {
        return orderBooks.map(orderBook => {
            const bestBid = orderBook.bids[0];
            const bestAsk = orderBook.asks[0];
            const midPrice = bestBid && bestAsk ? 
                (bestBid.price + bestAsk.price) / 2 : 0;
            
            const bidLiquidity = orderBook.bids.reduce((sum, bid) => sum + bid.amount, 0);
            const askLiquidity = orderBook.asks.reduce((sum, ask) => sum + ask.amount, 0);
            
            return {
                market: orderBook.market,
                base: orderBook.base,
                counter: orderBook.counter,
                bestBid: bestBid ? bestBid.price : 0,
                bestAsk: bestAsk ? bestAsk.price : 0,
                midPrice,
                spread: bestBid && bestAsk ? bestAsk.price - bestBid.price : 0,
                spreadPercent: bestBid && bestAsk ? 
                    ((bestAsk.price - bestBid.price) / midPrice) * 100 : 0,
                bidLiquidity,
                askLiquidity,
                minLiquidity: Math.min(bidLiquidity, askLiquidity),
                orderBookDepth: orderBook.bids.length + orderBook.asks.length,
                bids: orderBook.bids.slice(0, 10), // Top 10 bids
                asks: orderBook.asks.slice(0, 10), // Top 10 asks
                timestamp: orderBook.timestamp
            };
        });
    }

    /**
     * Format assets data
     */
    formatAssets(assets) {
        return assets.map(asset => ({
            code: asset.code,
            name: asset.name || asset.code,
            type: asset.type || 'credit_alphanum4',
            issuer: asset.issuer,
            supply: asset.supply || '0',
            decimals: asset.decimals || 7,
            isNative: asset.type === 'native',
            lastUpdated: new Date().toISOString()
        }));
    }

    /**
     * Check rate limit
     */
    checkRateLimit() {
        const now = Date.now();
        
        // Reset counter if minute has passed
        if (now > this.rateLimit.resetTime) {
            this.rateLimit.requests = 0;
            this.rateLimit.resetTime = now + 60000;
        }
        
        return this.rateLimit.requests < this.rateLimit.maxRequests;
    }

    /**
     * Get fallback data when APIs fail
     */
    getFallbackData() {
        return {
            markets: [],
            orderBooks: [],
            assets: this.getCommonAssets(),
            summary: {
                totalMarkets: 0,
                totalAssets: 5,
                activeOrderBooks: 0
            },
            timestamp: new Date().toISOString(),
            source: 'fallback',
            error: 'API unavailable'
        };
    }

    /**
     * Get market statistics
     */
    getMarketStats() {
        const stats = this.cache.getStats();
        return {
            cacheHits: stats.hits,
            cacheMisses: stats.misses,
            hitRate: stats.hits / (stats.hits + stats.misses) * 100,
            rateLimit: {
                requests: this.rateLimit.requests,
                maxRequests: this.rateLimit.maxRequests,
                resetTime: this.rateLimit.resetTime
            },
            uptime: Date.now() - this.startTime
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.flushAll();
        console.log('🗑️ Cleared StellarX cache');
    }
}

module.exports = StellarXRecreator;
