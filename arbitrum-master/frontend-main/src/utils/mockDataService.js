/**
 * Mock Data Service for MVP Arbitrage Bot
 * Provides realistic mock data for testing and demonstration
 */

// Mock assets with realistic Stellar DEX assets
const MOCK_ASSETS = [
    { code: 'XLM', name: 'Stellar Lumens', issuer: null, type: 'native' },
    { code: 'USDC', name: 'USD Coin', issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', type: 'credit' },
    { code: 'USDT', name: 'Tether USD', issuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROQIIO6HDWHDASUYRY6A5QSW', type: 'credit' },
    { code: 'BTC', name: 'Bitcoin', issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF', type: 'credit' },
    { code: 'ETH', name: 'Ethereum', issuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR', type: 'credit' },
    { code: 'DOGE', name: 'Dogecoin', issuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROQIIO6HDWHDASUYRY6A5QSW', type: 'credit' },
    { code: 'ADA', name: 'Cardano', issuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR', type: 'credit' },
    { code: 'DOT', name: 'Polkadot', issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF', type: 'credit' },
    { code: 'LINK', name: 'Chainlink', issuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR', type: 'credit' },
    { code: 'UNI', name: 'Uniswap', issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF', type: 'credit' },
    { code: 'AAVE', name: 'Aave', issuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR', type: 'credit' },
    { code: 'SUSHI', name: 'SushiSwap', issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF', type: 'credit' },
    { code: 'YFI', name: 'Yearn Finance', issuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR', type: 'credit' },
    { code: 'COMP', name: 'Compound', issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF', type: 'credit' },
    { code: 'MKR', name: 'Maker', issuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR', type: 'credit' },
    { code: 'SNX', name: 'Synthetix', issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF', type: 'credit' },
    { code: 'CRV', name: 'Curve DAO', issuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR', type: 'credit' },
    { code: '1INCH', name: '1inch', issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF', type: 'credit' },
    { code: 'BAL', name: 'Balancer', issuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR', type: 'credit' },
    { code: 'LTC', name: 'Litecoin', issuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROQIIO6HDWHDASUYRY6A5QSW', type: 'credit' },
    { code: 'BCH', name: 'Bitcoin Cash', issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF', type: 'credit' },
    { code: 'XRP', name: 'Ripple', issuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROQIIO6HDWHDASUYRY6A5QSW', type: 'credit' },
    { code: 'SOL', name: 'Solana', issuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR', type: 'credit' },
    { code: 'MATIC', name: 'Polygon', issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF', type: 'credit' },
    { code: 'AVAX', name: 'Avalanche', issuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR', type: 'credit' }
];

// Mock DEX pools with realistic liquidity and spreads
const MOCK_POOLS = [
    // XLM pairs (most liquid)
    { base: 'XLM', counter: 'USDC', liquidity: 2500000, spread: 0.001, volume24h: 5000000 },
    { base: 'XLM', counter: 'USDT', liquidity: 1800000, spread: 0.0012, volume24h: 3200000 },
    { base: 'XLM', counter: 'BTC', liquidity: 800000, spread: 0.002, volume24h: 1200000 },
    { base: 'XLM', counter: 'ETH', liquidity: 950000, spread: 0.0018, volume24h: 1800000 },
    
    // USDC pairs
    { base: 'USDC', counter: 'USDT', liquidity: 3200000, spread: 0.0005, volume24h: 8000000 },
    { base: 'USDC', counter: 'BTC', liquidity: 1200000, spread: 0.0015, volume24h: 2000000 },
    { base: 'USDC', counter: 'ETH', liquidity: 1500000, spread: 0.0012, volume24h: 2500000 },
    { base: 'USDC', counter: 'DOGE', liquidity: 400000, spread: 0.003, volume24h: 600000 },
    { base: 'USDC', counter: 'ADA', liquidity: 350000, spread: 0.0025, volume24h: 500000 },
    { base: 'USDC', counter: 'DOT', liquidity: 280000, spread: 0.0028, volume24h: 400000 },
    
    // USDT pairs
    { base: 'USDT', counter: 'BTC', liquidity: 1100000, spread: 0.0016, volume24h: 1800000 },
    { base: 'USDT', counter: 'ETH', liquidity: 1400000, spread: 0.0013, volume24h: 2200000 },
    { base: 'USDT', counter: 'DOGE', liquidity: 380000, spread: 0.0032, volume24h: 550000 },
    { base: 'USDT', counter: 'ADA', liquidity: 320000, spread: 0.0027, volume24h: 450000 },
    { base: 'USDT', counter: 'DOT', liquidity: 250000, spread: 0.003, volume24h: 350000 },
    
    // BTC pairs
    { base: 'BTC', counter: 'ETH', liquidity: 600000, spread: 0.0025, volume24h: 800000 },
    { base: 'BTC', counter: 'DOGE', liquidity: 200000, spread: 0.004, volume24h: 300000 },
    { base: 'BTC', counter: 'ADA', liquidity: 180000, spread: 0.0035, volume24h: 250000 },
    { base: 'BTC', counter: 'DOT', liquidity: 150000, spread: 0.0038, volume24h: 200000 },
    
    // ETH pairs
    { base: 'ETH', counter: 'DOGE', liquidity: 220000, spread: 0.0035, volume24h: 320000 },
    { base: 'ETH', counter: 'ADA', liquidity: 200000, spread: 0.003, volume24h: 280000 },
    { base: 'ETH', counter: 'DOT', liquidity: 170000, spread: 0.0033, volume24h: 230000 },
    { base: 'ETH', counter: 'LINK', liquidity: 120000, spread: 0.004, volume24h: 150000 },
    { base: 'ETH', counter: 'UNI', liquidity: 100000, spread: 0.0042, volume24h: 130000 },
    
    // DeFi token pairs
    { base: 'LINK', counter: 'UNI', liquidity: 80000, spread: 0.005, volume24h: 100000 },
    { base: 'AAVE', counter: 'COMP', liquidity: 60000, spread: 0.0055, volume24h: 80000 },
    { base: 'SUSHI', counter: 'YFI', liquidity: 50000, spread: 0.006, volume24h: 60000 },
    { base: 'MKR', counter: 'SNX', liquidity: 45000, spread: 0.0065, volume24h: 50000 },
    { base: 'CRV', counter: '1INCH', liquidity: 40000, spread: 0.007, volume24h: 45000 },
    { base: 'BAL', counter: 'LTC', liquidity: 35000, spread: 0.0075, volume24h: 40000 },
    
    // Additional pairs for more opportunities
    { base: 'LTC', counter: 'BCH', liquidity: 30000, spread: 0.008, volume24h: 35000 },
    { base: 'XRP', counter: 'SOL', liquidity: 25000, spread: 0.0085, volume24h: 30000 },
    { base: 'MATIC', counter: 'AVAX', liquidity: 20000, spread: 0.009, volume24h: 25000 },
    { base: 'DOGE', counter: 'ADA', liquidity: 180000, spread: 0.002, volume24h: 250000 },
    { base: 'ADA', counter: 'DOT', liquidity: 120000, spread: 0.0025, volume24h: 150000 }
];

// Generate realistic price data with small variations
const generatePriceData = () => {
    const prices = {};
    
    // Base prices (in XLM)
    const basePrices = {
        'XLM': 1.0,
        'USDC': 0.15,
        'USDT': 0.15,
        'BTC': 0.0000035,
        'ETH': 0.000055,
        'DOGE': 0.0000008,
        'ADA': 0.00012,
        'DOT': 0.00018,
        'LINK': 0.00025,
        'UNI': 0.00035,
        'AAVE': 0.00045,
        'SUSHI': 0.00015,
        'YFI': 0.000008,
        'COMP': 0.0004,
        'MKR': 0.00012,
        'SNX': 0.00022,
        'CRV': 0.0003,
        '1INCH': 0.0002,
        'BAL': 0.00025,
        'LTC': 0.000004,
        'BCH': 0.000003,
        'XRP': 0.00008,
        'SOL': 0.0004,
        'MATIC': 0.0001,
        'AVAX': 0.0006
    };
    
    // Add small random variations (±2%)
    Object.keys(basePrices).forEach(asset => {
        const variation = (Math.random() - 0.5) * 0.04; // ±2%
        prices[asset] = basePrices[asset] * (1 + variation);
    });
    
    return prices;
};

// Generate mock arbitrage opportunities
const generateArbitrageOpportunities = (prices, pools) => {
    const opportunities = [];
    const maxOpportunities = Math.floor(Math.random() * 8) + 3; // 3-10 opportunities
    
    for (let i = 0; i < maxOpportunities; i++) {
        // Create a 3-step arbitrage loop
        const assets = ['XLM', 'USDC', 'USDT', 'BTC', 'ETH', 'DOGE', 'ADA', 'DOT', 'LINK', 'UNI'];
        const loop = [];
        
        // Start with XLM
        loop.push('XLM');
        
        // Add 2-3 more assets
        const numSteps = Math.floor(Math.random() * 2) + 2; // 2-3 additional steps
        const availableAssets = assets.filter(a => a !== 'XLM');
        
        for (let j = 0; j < numSteps; j++) {
            const randomAsset = availableAssets[Math.floor(Math.random() * availableAssets.length)];
            if (!loop.includes(randomAsset)) {
                loop.push(randomAsset);
            }
        }
        
        // Ensure we end back at XLM
        if (loop[loop.length - 1] !== 'XLM') {
            loop.push('XLM');
        }
        
        // Calculate max executable amount based on liquidity first
        const minLiquidity = Math.min(...loop.slice(0, -1).map((asset, idx) => {
            const nextAsset = loop[idx + 1];
            const pool = pools.find(p => 
                (p.base === asset && p.counter === nextAsset) ||
                (p.base === nextAsset && p.counter === asset)
            );
            return pool ? pool.liquidity * 0.2 : 2000; // Use 20% of pool liquidity
        }));
        
        const maxExecutableAmount = Math.max(Math.min(minLiquidity, 10000), 1); // Cap at 10k XLM, min 1 XLM
        
        // Generate step-by-step path with realistic arbitrage opportunities
        const path = [];
        let currentAmount = maxExecutableAmount;
        let totalMultiplier = 1.0;
        
        // Create realistic arbitrage opportunities by introducing small price discrepancies
        for (let k = 0; k < loop.length - 1; k++) {
            const fromAsset = loop[k];
            const toAsset = loop[k + 1];
            const pool = pools.find(p => 
                (p.base === fromAsset && p.counter === toAsset) ||
                (p.base === toAsset && p.counter === fromAsset)
            );
            
            // Base price from mock data
            const basePrice = prices[toAsset] / prices[fromAsset];
            
            // Introduce small arbitrage opportunity (0.1% to 0.3% better rate)
            const arbitrageBonus = 1 + (Math.random() * 0.002 + 0.001); // 0.1% to 0.3% bonus
            const effectivePrice = basePrice * arbitrageBonus;
            
            // Apply small DEX fee (0.03%)
            const amountOut = currentAmount * effectivePrice * (1 - 0.0003);
            
            path.push({
                from: fromAsset,
                to: toAsset,
                amountIn: currentAmount,
                amountOut: amountOut,
                price: effectivePrice,
                liquidity: pool ? pool.liquidity : 50000,
                arbitrageBonus: arbitrageBonus - 1 // Store the bonus for display
            });
            
            currentAmount = amountOut;
            totalMultiplier *= effectivePrice * (1 - 0.0003);
        }
        
        // Calculate actual profit
        const finalAmount = currentAmount;
        const totalProfit = finalAmount - maxExecutableAmount;
        const profitPercent = (totalProfit / maxExecutableAmount) * 100;
        
        // Calculate fees
        const dexFees = loop.length * 0.0003; // 0.03% per trade
        const stellarFees = 0.00001 * loop.length; // 0.00001 XLM per operation
        const totalFees = dexFees + stellarFees;
        
        // Net profit after fees
        const netProfitAmount = totalProfit - (maxExecutableAmount * totalFees);
        const netProfitPercent = (netProfitAmount / maxExecutableAmount) * 100;
        
        // Only show if we end up with more XLM than we started (net positive)
        const isProfitable = netProfitAmount > 0.01; // At least 0.01 XLM profit
        
        if (isProfitable) {
            
            opportunities.push({
                id: `opp_${i}_${Date.now()}`,
                loop: loop,
                path: path,
                profitPercent: profitPercent,
                netProfitPercent: netProfitPercent,
                expectedProfit: totalProfit,
                netProfit: netProfitAmount,
                finalAmount: finalAmount,
                maxExecutableAmount: maxExecutableAmount,
                totalFees: totalFees,
                fees: {
                    dex: dexFees,
                    stellar: stellarFees,
                    total: totalFees
                },
                liquidity: {
                    score: Math.min(1, maxExecutableAmount / 1000),
                    total: maxExecutableAmount
                },
                isProfitableAfterFees: true,
                timestamp: new Date().toISOString(),
                confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
            });
        }
    }
    
    // Sort by profit percentage
    return opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
};

// Main mock data service
export const mockDataService = {
    /**
     * Get mock DEX data
     */
    getDEXData: () => {
        const prices = generatePriceData();
        const pools = MOCK_POOLS.map(pool => ({
            ...pool,
            price: prices[pool.counter] / prices[pool.base],
            lastUpdated: new Date().toISOString()
        }));
        
        return {
            assets: MOCK_ASSETS,
            pools: pools,
            prices: prices,
            totalLiquidity: pools.reduce((sum, pool) => sum + pool.liquidity, 0),
            totalVolume24h: pools.reduce((sum, pool) => sum + pool.volume24h, 0),
            lastUpdated: new Date().toISOString()
        };
    },
    
    /**
     * Get mock arbitrage analysis
     */
    getArbitrageAnalysis: () => {
        const prices = generatePriceData();
        const opportunities = generateArbitrageOpportunities(prices, MOCK_POOLS);
        
        return {
            opportunities: opportunities,
            analysisTime: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
            totalPairsAnalyzed: MOCK_POOLS.length,
            totalOpportunitiesFound: opportunities.length,
            profitableOpportunities: opportunities.filter(opp => opp.isProfitableAfterFees).length,
            timestamp: new Date().toISOString()
        };
    },
    
    /**
     * Simulate trade execution
     */
    executeTrade: async (opportunity, walletAddress) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        
        // Simulate success/failure (90% success rate)
        const success = Math.random() > 0.1;
        
        if (success) {
            return {
                success: true,
                transactionHash: `tx_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
                profit: opportunity.netProfit,
                fees: opportunity.totalFees,
                executedAt: new Date().toISOString(),
                status: 'success'
            };
        } else {
            throw new Error('Transaction failed: Insufficient liquidity');
        }
    },
    
    /**
     * Get mock execution history
     */
    getExecutionHistory: () => {
        const history = [];
        const numTrades = Math.floor(Math.random() * 20) + 5; // 5-24 trades
        
        for (let i = 0; i < numTrades; i++) {
            const success = Math.random() > 0.15; // 85% success rate
            const profit = success ? Math.random() * 2 + 0.1 : 0; // 0.1-2.1 XLM profit (realistic)
            
            history.push({
                id: `trade_${i}_${Date.now()}`,
                status: success ? 'success' : 'failed',
                profit: profit,
                fees: Math.random() * 0.1 + 0.05, // 0.05-0.15 XLM fees (realistic)
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                opportunity: {
                    loop: ['XLM', 'USDC', 'BTC', 'XLM'],
                    profitPercent: Math.random() * 0.3 + 0.1 // 0.1-0.4% profit (realistic)
                }
            });
        }
        
        return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
};

export default mockDataService;
