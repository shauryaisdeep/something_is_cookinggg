const axios = require('axios');
const NodeCache = require('node-cache');
const TopAssetsService = require('./topAssetsService');

class FastArbitrageService {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 120, // 2 minutes default
            checkperiod: 30
        });
        
        this.topAssetsService = new TopAssetsService();
        this.HORIZON_API = 'https://horizon-testnet.stellar.org';
        
        // Rate limiting configuration
        this.RATE_LIMITS = {
            maxRequestsPerMinute: 30,
            batchSize: 3,           // Process 3 pairs per batch
            delayBetweenBatches: 300, // 300ms delay
            retryAttempts: 3,
            retryDelay: 1000
        };
        
        // Minimum thresholds
        this.MIN_PROFIT_THRESHOLD = 0.001; // 0.1% minimum profit
        this.MIN_LIQUIDITY = 1000;         // Minimum liquidity units
        this.MAX_SLIPPAGE = 0.01;          // 1% maximum slippage
    }

    /**
     * Run complete fast arbitrage analysis
     */
    async runFastAnalysis() {
        const cacheKey = 'fastArbitrageAnalysis';
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log('📊 Using cached arbitrage analysis');
            return cached;
        }

        try {
            console.log('🚀 Starting fast arbitrage analysis...');
            const startTime = Date.now();
            
            // 1. Get valid pairs from top assets
            const { pairs } = await this.topAssetsService.generateValidTradingPairs();
            
            if (pairs.length === 0) {
                throw new Error('No valid trading pairs found');
            }

            console.log(`📊 Analyzing ${pairs.length} valid trading pairs...`);
            
            // 2. Fetch order books for each pair
            const orderBooks = await this.fetchOrderBooksBatch(pairs);
            
            // 3. Build directed graph of trading paths
            const tradingGraph = this.buildTradingGraph(orderBooks);
            
            // 4. Find 3-step arbitrage loops
            const opportunities = this.findArbitrageOpportunitiesFast(tradingGraph);
            
            // 5. Calculate profit ratios with fees
            const opportunitiesWithFees = await this.calculateFeesAndProfits(opportunities);
            
            // 6. Return opportunities sorted by profit
            const sortedOpportunities = opportunitiesWithFees
                .filter(opp => opp.profitPercent >= this.MIN_PROFIT_THRESHOLD)
                .sort((a, b) => b.profitPercent - a.profitPercent);

            const analysisTime = Date.now() - startTime;
            
            const result = {
                opportunities: sortedOpportunities,
                analysis: {
                    totalPairs: pairs.length,
                    validOrderBooks: orderBooks.length,
                    opportunitiesFound: opportunities.length,
                    profitableOpportunities: sortedOpportunities.length,
                    analysisTimeMs: analysisTime,
                    timestamp: new Date().toISOString()
                },
                metadata: {
                    minProfitThreshold: this.MIN_PROFIT_THRESHOLD,
                    minLiquidity: this.MIN_LIQUIDITY,
                    maxSlippage: this.MAX_SLIPPAGE
                }
            };

            // Cache for 2 minutes
            this.cache.set(cacheKey, result, 120);
            
            console.log(`✅ Analysis complete: ${sortedOpportunities.length} profitable opportunities found in ${analysisTime}ms`);
            return result;

        } catch (error) {
            console.error('❌ Error in fast arbitrage analysis:', error.message);
            throw error;
        }
    }

    /**
     * Fetch order books for pairs in batches
     */
    async fetchOrderBooksBatch(pairs) {
        const orderBooks = [];
        const batchSize = this.RATE_LIMITS.batchSize;
        
        for (let i = 0; i < pairs.length; i += batchSize) {
            const batch = pairs.slice(i, i + batchSize);
            
            try {
                const batchPromises = batch.map(pair => this.fetchOrderBook(pair));
                const batchResults = await Promise.allSettled(batchPromises);
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value) {
                        orderBooks.push(result.value);
                    } else {
                        console.warn(`⚠️ Failed to fetch order book for ${batch[index].baseAsset}/${batch[index].counterAsset}`);
                    }
                });
                
                // Delay between batches to avoid rate limiting
                if (i + batchSize < pairs.length) {
                    await new Promise(resolve => setTimeout(resolve, this.RATE_LIMITS.delayBetweenBatches));
                }
                
            } catch (error) {
                console.error(`❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);
            }
        }
        
        return orderBooks;
    }

    /**
     * Fetch order book for a single pair
     */
    async fetchOrderBook(pair) {
        try {
            const response = await axios.get(`${this.HORIZON_API}/order_book`, {
                params: {
                    selling_asset_type: pair.baseAsset === 'XLM' ? 'native' : 'credit_alphanum4',
                    selling_asset_code: pair.baseAsset === 'XLM' ? undefined : pair.baseAsset,
                    selling_asset_issuer: pair.baseAsset === 'XLM' ? undefined : this.getAssetIssuer(pair.baseAsset),
                    buying_asset_type: pair.counterAsset === 'XLM' ? 'native' : 'credit_alphanum4',
                    buying_asset_code: pair.counterAsset === 'XLM' ? undefined : pair.counterAsset,
                    buying_asset_issuer: pair.counterAsset === 'XLM' ? undefined : this.getAssetIssuer(pair.counterAsset),
                    limit: 100
                },
                timeout: 5000
            });

            const orderBook = response.data;
            
            // Calculate liquidity metrics
            const bidLiquidity = orderBook.bids.reduce((total, bid) => total + parseFloat(bid.amount), 0);
            const askLiquidity = orderBook.asks.reduce((total, ask) => total + parseFloat(ask.amount), 0);
            const minLiquidity = Math.min(bidLiquidity, askLiquidity);
            
            // Only return if sufficient liquidity
            if (minLiquidity < this.MIN_LIQUIDITY) {
                return null;
            }

            return {
                baseAsset: pair.baseAsset,
                counterAsset: pair.counterAsset,
                bids: orderBook.bids.map(bid => ({
                    price: parseFloat(bid.price),
                    amount: parseFloat(bid.amount)
                })),
                asks: orderBook.asks.map(ask => ({
                    price: parseFloat(ask.price),
                    amount: parseFloat(ask.amount)
                })),
                liquidity: {
                    bid: bidLiquidity,
                    ask: askLiquidity,
                    min: minLiquidity,
                    score: Math.min(minLiquidity / 10000, 1)
                },
                midPrice: orderBook.bids[0] && orderBook.asks[0] ? 
                    (parseFloat(orderBook.bids[0].price) + parseFloat(orderBook.asks[0].price)) / 2 : 0
            };

        } catch (error) {
            console.error(`❌ Error fetching order book for ${pair.baseAsset}/${pair.counterAsset}:`, error.message);
            return null;
        }
    }

    /**
     * Build directed graph of trading paths
     */
    buildTradingGraph(orderBooks) {
        const graph = new Map();
        
        orderBooks.forEach(orderBook => {
            const { baseAsset, counterAsset, liquidity, midPrice } = orderBook;
            
            // Add forward edge (base -> counter)
            if (!graph.has(baseAsset)) {
                graph.set(baseAsset, new Map());
            }
            graph.get(baseAsset).set(counterAsset, {
                orderBook,
                price: midPrice,
                liquidity: liquidity.min,
                direction: 'forward'
            });
            
            // Add reverse edge (counter -> base)
            if (!graph.has(counterAsset)) {
                graph.set(counterAsset, new Map());
            }
            graph.get(counterAsset).set(baseAsset, {
                orderBook,
                price: 1 / midPrice,
                liquidity: liquidity.min,
                direction: 'reverse'
            });
        });
        
        return graph;
    }

    /**
     * Find arbitrage opportunities using graph theory
     */
    findArbitrageOpportunitiesFast(graph) {
        const opportunities = [];
        const assets = Array.from(graph.keys());
        
        // Find 3-step arbitrage loops (A -> B -> C -> A)
        for (let i = 0; i < assets.length; i++) {
            for (let j = 0; j < assets.length; j++) {
                if (i === j) continue;
                
                for (let k = 0; k < assets.length; k++) {
                    if (k === i || k === j) continue;
                    
                    const assetA = assets[i];
                    const assetB = assets[j];
                    const assetC = assets[k];
                    
                    // Check if all edges exist: A->B, B->C, C->A
                    if (graph.has(assetA) && graph.get(assetA).has(assetB) &&
                        graph.has(assetB) && graph.get(assetB).has(assetC) &&
                        graph.has(assetC) && graph.get(assetC).has(assetA)) {
                        
                        const opportunity = this.checkArbitrageLoop(
                            [assetA, assetB, assetC, assetA],
                            graph
                        );
                        
                        if (opportunity) {
                            opportunities.push(opportunity);
                        }
                    }
                }
            }
        }
        
        return opportunities;
    }

    /**
     * Check if arbitrage loop is profitable
     */
    checkArbitrageLoop(loop, graph) {
        try {
            const path = [];
            let currentAmount = 1000; // Start with 1000 units
            let profitRatio = 1;
            
            // Calculate profit ratio for the loop
            for (let i = 0; i < loop.length - 1; i++) {
                const fromAsset = loop[i];
                const toAsset = loop[i + 1];
                
                const edge = graph.get(fromAsset).get(toAsset);
                if (!edge) return null;
                
                const { price, liquidity } = edge;
                
                // Calculate amount after this step
                const amountOut = currentAmount * price;
                
                // Check if we have enough liquidity
                if (amountOut > liquidity * 0.1) { // Use max 10% of liquidity
                    return null;
                }
                
                profitRatio *= price;
                path.push({
                    from: fromAsset,
                    to: toAsset,
                    price,
                    amountIn: currentAmount,
                    amountOut,
                    liquidity
                });
                
                currentAmount = amountOut;
            }
            
            // Check if profitable (profit ratio > 1)
            if (profitRatio <= 1) return null;
            
            // Calculate maximum executable amount
            const maxExecutableAmount = Math.min(
                ...path.map(step => step.liquidity * 0.1)
            );
            
            const profitPercent = (profitRatio - 1) * 100;
            
            return {
                loop: loop.slice(0, -1), // Remove duplicate last element
                path,
                profitRatio,
                profitPercent,
                maxExecutableAmount,
                expectedProfit: maxExecutableAmount * (profitRatio - 1),
                liquidity: {
                    score: Math.min(...path.map(step => step.liquidity / 10000), 1),
                    min: Math.min(...path.map(step => step.liquidity))
                },
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error checking arbitrage loop:', error.message);
            return null;
        }
    }

    /**
     * Calculate fees and final profits
     */
    async calculateFeesAndProfits(opportunities) {
        const STELLAR_FEE = 0.00001; // 0.00001 XLM per operation
        const DEX_FEE = 0.003; // 0.3% DEX fee per trade
        
        return opportunities.map(opportunity => {
            const numTrades = opportunity.path.length;
            const totalDexFees = opportunity.maxExecutableAmount * DEX_FEE * numTrades;
            const totalStellarFees = STELLAR_FEE * numTrades;
            const totalFees = totalDexFees + totalStellarFees;
            
            const netProfit = opportunity.expectedProfit - totalFees;
            const netProfitPercent = (netProfit / opportunity.maxExecutableAmount) * 100;
            
            return {
                ...opportunity,
                fees: {
                    dex: totalDexFees,
                    stellar: totalStellarFees,
                    total: totalFees
                },
                netProfit,
                netProfitPercent,
                totalFees,
                isProfitableAfterFees: netProfit > 0
            };
        }).filter(opp => opp.isProfitableAfterFees);
    }

    /**
     * Get asset issuer for non-native assets
     */
    getAssetIssuer(assetCode) {
        const issuers = {
            'USDC': 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            'USDT': 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROQDIEDF43RLHOPUZQX3MK2V',
            'BTC': 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF',
            'ETH': 'GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYEFLFKRQ76D6D3RSPZXHESM6YGFU',
            'AQUA': 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',
            'yXLM': 'GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55',
            'SHX': 'GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH',
            'VELO': 'GAB7STHVD5BDH3EEYXPI3OM7PCS4VZPYR6VEX3RPKHYN5S4TVM6XGQ2O',
            'XRP': 'GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYEFLFKRQ76D6D3RSPZXHESM6YGFU'
        };
        
        return issuers[assetCode] || null;
    }

    /**
     * Validate opportunity is still profitable
     */
    async validateOpportunity(opportunity) {
        try {
            // Re-fetch current prices for the path
            const currentPrices = await this.getCurrentPrices(opportunity.loop);
            
            // Recalculate profit with current prices
            let currentProfitRatio = 1;
            for (let i = 0; i < opportunity.loop.length; i++) {
                const fromAsset = opportunity.loop[i];
                const toAsset = opportunity.loop[(i + 1) % opportunity.loop.length];
                
                const price = currentPrices[`${fromAsset}_${toAsset}`];
                if (!price) return false;
                
                currentProfitRatio *= price;
            }
            
            const currentProfitPercent = (currentProfitRatio - 1) * 100;
            const profitDifference = Math.abs(currentProfitPercent - opportunity.profitPercent);
            
            // Allow 10% deviation from original profit
            return profitDifference <= opportunity.profitPercent * 0.1;
            
        } catch (error) {
            console.error('❌ Error validating opportunity:', error.message);
            return false;
        }
    }

    /**
     * Get current prices for a trading path
     */
    async getCurrentPrices(path) {
        const prices = {};
        
        for (let i = 0; i < path.length; i++) {
            const fromAsset = path[i];
            const toAsset = path[(i + 1) % path.length];
            
            try {
                const orderBook = await this.fetchOrderBook({
                    baseAsset: fromAsset,
                    counterAsset: toAsset
                });
                
                if (orderBook) {
                    prices[`${fromAsset}_${toAsset}`] = orderBook.midPrice;
                }
            } catch (error) {
                console.error(`❌ Error fetching price for ${fromAsset}/${toAsset}:`, error.message);
            }
        }
        
        return prices;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.flushAll();
        console.log('🗑️ Cleared arbitrage analysis cache');
    }

    /**
     * Get analysis statistics
     */
    getAnalysisStats() {
        const stats = this.cache.getStats();
        return {
            cacheKeys: stats.keys,
            cacheHits: stats.hits,
            cacheMisses: stats.misses,
            hitRate: stats.hits / (stats.hits + stats.misses) * 100,
            memoryUsage: process.memoryUsage()
        };
    }
}

module.exports = FastArbitrageService;
