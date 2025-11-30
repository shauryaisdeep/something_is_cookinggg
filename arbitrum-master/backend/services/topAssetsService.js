const axios = require('axios');
const NodeCache = require('node-cache');

class TopAssetsService {
    constructor() {
        // Cache TTLs for different data types
        this.cache = new NodeCache({
            stdTTL: 300, // 5 minutes default
            checkperiod: 60 // Check for expired keys every minute
        });
        
        this.CACHE_TTL = {
            topAssets: 1800,        // 30 minutes (rarely change)
            liquidity: 300,         // 5 minutes (moderate frequency)
            orderBooks: 60,         // 1 minute (high frequency)
            validPairs: 600,        // 10 minutes (computed data)
            arbitrageResults: 120   // 2 minutes (market dependent)
        };
        
        this.STELLAR_EXPERT_API = 'https://api.stellar.expert/explorer/public';
        this.HORIZON_API = 'https://horizon.stellar.org'; // Use mainnet for real data
        this.STELLARX_API = 'https://api.stellarx.com/api';
        
        // 25 Most popular trading pairs based on real Stellar DEX activity
        this.popularPairs = [
            // XLM pairs (most liquid)
            { 
                base: 'XLM', 
                counter: 'USDC', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'Stellar Lumens / USD Coin'
            },
            { 
                base: 'XLM', 
                counter: 'USDT', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V',
                description: 'Stellar Lumens / Tether USD'
            },
            { 
                base: 'XLM', 
                counter: 'BTC', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF',
                description: 'Stellar Lumens / Bitcoin'
            },
            { 
                base: 'XLM', 
                counter: 'ETH', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GBVOL67TUCLERAHCNUWBA4MGXOKFW5XWQ3LPW4OW4NTB6QO2XLVQU2A5',
                description: 'Stellar Lumens / Ethereum'
            },
            { 
                base: 'XLM', 
                counter: 'AQUA', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',
                description: 'Stellar Lumens / Aqua'
            },
            { 
                base: 'XLM', 
                counter: 'YUSDC', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GDGTVWSM4MGS4T7Z6W4RPWOCHE2I6RDFCIFZGS3DOA63LWQTRNZNTTFF',
                description: 'Stellar Lumens / YieldBlox USDC'
            },
            { 
                base: 'XLM', 
                counter: 'SLT', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DTHW3X2X3VPVDOTMCC',
                description: 'Stellar Lumens / Smartlands'
            },
            { 
                base: 'XLM', 
                counter: 'RMT', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT',
                description: 'Stellar Lumens / RemiMe'
            },
            
            // Stablecoin pairs
            { 
                base: 'USDC', 
                counter: 'USDT', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                counterIssuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V',
                description: 'USD Coin / Tether USD'
            },
            { 
                base: 'USDC', 
                counter: 'XLM', 
                baseType: 'credit_alphanum4',
                counterType: 'native',
                baseIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'USD Coin / Stellar Lumens'
            },
            { 
                base: 'USDT', 
                counter: 'XLM', 
                baseType: 'credit_alphanum4',
                counterType: 'native',
                baseIssuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V',
                description: 'Tether USD / Stellar Lumens'
            },
            
            // Popular altcoins
            { 
                base: 'BTC', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'Bitcoin / USD Coin'
            },
            { 
                base: 'ETH', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GBVOL67TUCLERAHCNUWBA4MGXOKFW5XWQ3LPW4OW4NTB6QO2XLVQU2A5',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'Ethereum / USD Coin'
            },
            { 
                base: 'BTC', 
                counter: 'XLM', 
                baseType: 'credit_alphanum4',
                counterType: 'native',
                baseIssuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF',
                description: 'Bitcoin / Stellar Lumens'
            },
            { 
                base: 'ETH', 
                counter: 'XLM', 
                baseType: 'credit_alphanum4',
                counterType: 'native',
                baseIssuer: 'GBVOL67TUCLERAHCNUWBA4MGXOKFW5XWQ3LPW4OW4NTB6QO2XLVQU2A5',
                description: 'Ethereum / Stellar Lumens'
            },
            
            // Additional popular Stellar ecosystem tokens
            { 
                base: 'AQUA', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'Aqua / USD Coin'
            },
            { 
                base: 'YUSDC', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GDGTVWSM4MGS4T7Z6W4RPWOCHE2I6RDFCIFZGS3DOA63LWQTRNZNTTFF',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'YieldBlox USDC / USD Coin'
            },
            { 
                base: 'SLT', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DTHW3X2X3VPVDOTMCC',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'Smartlands / USD Coin'
            },
            { 
                base: 'RMT', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'RemiMe / USD Coin'
            },
            { 
                base: 'MOBI', 
                counter: 'XLM', 
                baseType: 'credit_alphanum4',
                counterType: 'native',
                baseIssuer: 'GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT',
                description: 'Mobius / Stellar Lumens'
            },
            
            // Additional popular Stellar ecosystem tokens
            { 
                base: 'XLM', 
                counter: 'SLT', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DTHW3X2X3VPVDOTMCC',
                description: 'Stellar Lumens / Smartlands'
            },
            { 
                base: 'XLM', 
                counter: 'RMT', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT',
                description: 'Stellar Lumens / RemiMe'
            },
            { 
                base: 'XLM', 
                counter: 'MOBI', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT',
                description: 'Stellar Lumens / Mobius'
            },
            { 
                base: 'XLM', 
                counter: 'KIN', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR',
                description: 'Stellar Lumens / Kin'
            },
            { 
                base: 'XLM', 
                counter: 'REPO', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GCZNF24HPMYTV6NOEHI7Q5RJFFUI23JKUKY3H3XTQAFBQIBOHD5OXG3B',
                description: 'Stellar Lumens / Repo'
            },
            { 
                base: 'XLM', 
                counter: 'TFT', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GBOVQKJYHXRR3DX6NOX2RRYFRCUMSADGDESTDNBDS6CDVLGVESRTAC47',
                description: 'Stellar Lumens / ThreeFold'
            },
            { 
                base: 'XLM', 
                counter: 'WSD', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GDSVWEA7XV6M5XNLODVTPCGMAJTNBLZBXOFNQD3BNPNYALEYBNT6CE2V',
                description: 'Stellar Lumens / WSD'
            },
            { 
                base: 'XLM', 
                counter: 'LSP', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GAB7STHVD5BDH3EEYXPI3OM7PCS4V443PYB5FNT6CFGJVPDLMKDM24WK',
                description: 'Stellar Lumens / Lumenswap'
            },
            { 
                base: 'XLM', 
                counter: 'BEAR', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GBAUUA74H4XOQYRSOW2RZUA4Q5J3PAX6RO6NKLOM6IAISNHJ3JPPKB5P',
                description: 'Stellar Lumens / Bear'
            },
            { 
                base: 'XLM', 
                counter: 'BULL', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GBAUUA74H4XOQYRSOW2RZUA4Q5J3PAX6RO6NKLOM6IAISNHJ3JPPKB5P',
                description: 'Stellar Lumens / Bull'
            },
            { 
                base: 'XLM', 
                counter: 'DOGET', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GDOEVDDBU6OBWKL7VHDAOKD77UP4DKHQYKOKJJT5PR3WRDBTX35HUEUX',
                description: 'Stellar Lumens / DogeToken'
            },
            { 
                base: 'XLM', 
                counter: 'SHIB', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GD6WU64OEP5C4LRBH6NK3MHYIA2ADN6K2IIWEETF7XHECN46QZ2AWF5K',
                description: 'Stellar Lumens / Shiba Inu'
            },
            { 
                base: 'XLM', 
                counter: 'FLOKI', 
                baseType: 'native',
                counterType: 'credit_alphanum4',
                counterIssuer: 'GDOEVDDBU6OBWKL7VHDAOKD77UP4DKHQYKOKJJT5PR3WRDBTX35HUEUX',
                description: 'Stellar Lumens / Floki'
            },
            
            // Cross-trading pairs
            { 
                base: 'AQUA', 
                counter: 'USDT', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',
                counterIssuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V',
                description: 'Aqua / Tether USD'
            },
            { 
                base: 'SLT', 
                counter: 'USDT', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DTHW3X2X3VPVDOTMCC',
                counterIssuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V',
                description: 'Smartlands / Tether USD'
            },
            { 
                base: 'YUSDC', 
                counter: 'USDT', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GDGTVWSM4MGS4T7Z6W4RPWOCHE2I6RDFCIFZGS3DOA63LWQTRNZNTTFF',
                counterIssuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V',
                description: 'YieldBlox USDC / Tether USD'
            },
            { 
                base: 'RMT', 
                counter: 'USDT', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT',
                counterIssuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V',
                description: 'RemiMe / Tether USD'
            },
            { 
                base: 'MOBI', 
                counter: 'USDT', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT',
                counterIssuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V',
                description: 'Mobius / Tether USD'
            },
            { 
                base: 'KIN', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'Kin / USD Coin'
            },
            { 
                base: 'TFT', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GBOVQKJYHXRR3DX6NOX2RRYFRCUMSADGDESTDNBDS6CDVLGVESRTAC47',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'ThreeFold / USD Coin'
            },
            { 
                base: 'WSD', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GDSVWEA7XV6M5XNLODVTPCGMAJTNBLZBXOFNQD3BNPNYALEYBNT6CE2V',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'WSD / USD Coin'
            },
            { 
                base: 'LSP', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GAB7STHVD5BDH3EEYXPI3OM7PCS4V443PYB5FNT6CFGJVPDLMKDM24WK',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'Lumenswap / USD Coin'
            },
            { 
                base: 'BEAR', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GBAUUA74H4XOQYRSOW2RZUA4Q5J3PAX6RO6NKLOM6IAISNHJ3JPPKB5P',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'Bear / USD Coin'
            },
            { 
                base: 'BULL', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GBAUUA74H4XOQYRSOW2RZUA4Q5J3PAX6RO6NKLOM6IAISNHJ3JPPKB5P',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'Bull / USD Coin'
            },
            { 
                base: 'DOGET', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GDOEVDDBU6OBWKL7VHDAOKD77UP4DKHQYKOKJJT5PR3WRDBTX35HUEUX',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'DogeToken / USD Coin'
            },
            { 
                base: 'SHIB', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GD6WU64OEP5C4LRBH6NK3MHYIA2ADN6K2IIWEETF7XHECN46QZ2AWF5K',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'Shiba Inu / USD Coin'
            },
            { 
                base: 'FLOKI', 
                counter: 'USDC', 
                baseType: 'credit_alphanum4',
                counterType: 'credit_alphanum4',
                baseIssuer: 'GDOEVDDBU6OBWKL7VHDAOKD77UP4DKHQYKOKJJT5PR3WRDBTX35HUEUX',
                counterIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                description: 'Floki / USD Coin'
            }
        ];

        // Priority assets for analysis
        this.PRIORITY_ASSETS = [
            'XLM',    // Native Stellar asset
            'USDC',   // Major stablecoin
            'USDT',   // Major stablecoin
            'BTC',    // Major cryptocurrency
            'ETH',    // Major cryptocurrency
            'AQUA',   // Popular Stellar token
            'YUSDC',  // YieldBlox USDC
            'SLT',    // Smartlands
            'RMT',    // RemiMe
            'MOBI',   // Mobius
            'KIN',    // Kin
            'REPO',   // Repo
            'TFT',    // ThreeFold
            'WSD',    // WSD
            'LSP',    // Lumenswap
            'BEAR',   // Bear
            'BULL',   // Bull
            'DOGET',  // DogeToken
            'SHIB',   // Shiba Inu
            'FLOKI'   // Floki
        ];
    }

    /**
     * Calculate liquidity score based on bid/ask amounts and spread
     */
    calculateLiquidityScore(bidAmount, askAmount, spreadPercent) {
        if (bidAmount === 0 || askAmount === 0) return 0;
        
        // Base score from available liquidity
        const liquidityScore = Math.min(bidAmount + askAmount, 10000) / 100; // Max 100 points
        
        // Spread penalty (tighter spreads = higher score)
        const spreadPenalty = Math.max(0, spreadPercent - 0.1) * 10; // Penalty for spreads > 0.1%
        
        // Balance bonus (more balanced bid/ask = higher score)
        const balanceRatio = Math.min(bidAmount, askAmount) / Math.max(bidAmount, askAmount);
        const balanceBonus = balanceRatio * 20; // Up to 20 bonus points
        
        return Math.max(0, Math.min(100, liquidityScore - spreadPenalty + balanceBonus));
    }

    /**
     * Make HTTP request with timeout and error handling
     */
    async makeRequest(url, timeout = 15000) {
        try {
            const response = await axios.get(url, { 
                timeout,
                headers: {
                    'User-Agent': 'Stellar-Arbitrage-Bot/1.0.0'
                }
            });
            return response.data;
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                throw new Error(`Request timeout: ${url}`);
            }
            throw new Error(`HTTP ${error.response?.status || 'Unknown'}: ${error.message}`);
        }
    }

    /**
     * Get volume from Stellar Expert API
     */
    async getVolumeFromStellarExpert(pair) {
        try {
            const expertData = await this.makeRequest(`${this.STELLAR_EXPERT_API}/market?limit=100`);
            
            if (expertData._embedded && expertData._embedded.records.length > 0) {
                // Find matching market
                const matchingMarket = expertData._embedded.records.find(market => {
                    const assets = market.asset || [];
                    const baseAsset = assets[0] || '';
                    const counterAsset = assets[1] ? assets[1].split('-')[0] : '';
                    return baseAsset === pair.base && counterAsset === pair.counter;
                });
                
                if (matchingMarket && matchingMarket.counterVolume24h) {
                    // Stellar Expert returns volume in stroops (1 XLM = 10,000,000 stroops)
                    // Convert to actual USD value - divide by 100M to get reasonable volume
                    const volume24h = parseFloat(matchingMarket.counterVolume24h) / 100000000;
                    return volume24h;
                }
            }
            return 0;
        } catch (error) {
            console.log(`Could not fetch Stellar Expert volume for ${pair.base}/${pair.counter}: ${error.message}`);
            return 0;
        }
    }

    /**
     * Test order book for a specific pair
     */
    async testOrderBook(pair) {
        try {
            // Build order book endpoint
            let endpoint = `/order_book?selling_asset_type=${pair.baseType}&buying_asset_type=${pair.counterType}`;
            
            if (pair.baseType === 'credit_alphanum4') {
                endpoint += `&selling_asset_code=${pair.base}&selling_asset_issuer=${pair.baseIssuer}`;
            }
            
            if (pair.counterType === 'credit_alphanum4') {
                endpoint += `&buying_asset_code=${pair.counter}&buying_asset_issuer=${pair.counterIssuer}`;
            }
            
            const orderBook = await this.makeRequest(`${this.HORIZON_API}${endpoint}`);
            
            // Calculate market data
            const bestBid = orderBook.bids[0] ? parseFloat(orderBook.bids[0].price) : 0;
            const bestAsk = orderBook.asks[0] ? parseFloat(orderBook.asks[0].price) : 0;
            const midPrice = (bestBid + bestAsk) / 2;
            const spread = bestAsk - bestBid;
            const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;
            
            // Calculate total liquidity and amounts
            const bidLiquidity = orderBook.bids.reduce((sum, bid) => sum + parseFloat(bid.amount), 0);
            const askLiquidity = orderBook.asks.reduce((sum, ask) => sum + parseFloat(ask.amount), 0);
            const totalLiquidity = bidLiquidity + askLiquidity;
            
            // Get best bid/ask amounts
            const bestBidAmount = orderBook.bids[0] ? parseFloat(orderBook.bids[0].amount) : 0;
            const bestAskAmount = orderBook.asks[0] ? parseFloat(orderBook.asks[0].amount) : 0;
            
            // Get recent trades for volume
            const tradesEndpoint = `/trades?base_asset_type=${pair.baseType}&counter_asset_type=${pair.counterType}&limit=100${pair.baseType === 'credit_alphanum4' ? `&base_asset_code=${pair.base}&base_asset_issuer=${pair.baseIssuer}` : ''}${pair.counterType === 'credit_alphanum4' ? `&counter_asset_code=${pair.counter}&counter_asset_issuer=${pair.counterIssuer}` : ''}`;
            
            const trades = await this.makeRequest(`${this.HORIZON_API}${tradesEndpoint}`);
            
            // Get volume from Stellar Expert API (more accurate)
            let volume24h = await this.getVolumeFromStellarExpert(pair);
            let priceChange24h = 0;
            
            // If no volume from Stellar Expert, calculate from trades as fallback
            if (volume24h === 0) {
                const now = new Date();
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                
                let firstPrice = null;
                let lastPrice = null;
                
                trades._embedded.records.forEach(trade => {
                    const tradeTime = new Date(trade.ledger_close_time);
                    if (tradeTime >= yesterday) {
                        // Handle price as object (n/d format) or number
                        let price;
                        if (typeof trade.price === 'object' && trade.price.n && trade.price.d) {
                            price = parseFloat(trade.price.n) / parseFloat(trade.price.d);
                        } else {
                            price = parseFloat(trade.price);
                        }
                        
                        const amount = parseFloat(trade.base_amount);
                        volume24h += amount * price;
                        
                        if (!firstPrice) firstPrice = price;
                        lastPrice = price;
                    }
                });
                
                if (firstPrice && lastPrice) {
                    priceChange24h = ((lastPrice - firstPrice) / firstPrice) * 100;
                }
            }
            
            // Get detailed bid/ask data
            const bidLevels = orderBook.bids.slice(0, 5).map((bid, index) => ({
                level: index + 1,
                price: parseFloat(bid.price),
                amount: parseFloat(bid.amount),
                total: parseFloat(bid.price) * parseFloat(bid.amount)
            }));

            const askLevels = orderBook.asks.slice(0, 5).map((ask, index) => ({
                level: index + 1,
                price: parseFloat(ask.price),
                amount: parseFloat(ask.amount),
                total: parseFloat(ask.price) * parseFloat(ask.amount)
            }));

            // Calculate market depth
            const marketDepth = {
                bids: {
                    levels: bidLevels,
                    totalAmount: bidLiquidity,
                    totalValue: bidLevels.reduce((sum, bid) => sum + bid.total, 0),
                    averagePrice: bidLiquidity > 0 ? bidLevels.reduce((sum, bid) => sum + bid.total, 0) / bidLiquidity : 0
                },
                asks: {
                    levels: askLevels,
                    totalAmount: askLiquidity,
                    totalValue: askLevels.reduce((sum, ask) => sum + ask.total, 0),
                    averagePrice: askLiquidity > 0 ? askLevels.reduce((sum, ask) => sum + ask.total, 0) / askLiquidity : 0
                }
            };

            // Calculate additional metrics
            const priceImpact = {
                buy1Percent: askLevels.length > 0 ? (askLevels[0].price - midPrice) / midPrice * 100 : 0,
                sell1Percent: bidLevels.length > 0 ? (midPrice - bidLevels[0].price) / midPrice * 100 : 0
            };

            return {
                pair: `${pair.base}/${pair.counter}`,
                description: pair.description,
                
                // Price data
                price: midPrice,
                bestBid: bestBid,
                bestAsk: bestAsk,
                bestBidPrice: bestBid,
                bestAskPrice: bestAsk,
                spread: spread,
                spreadPercent: spreadPercent,
                
                // Amount data
                bestBidAmount: bestBidAmount,
                bestAskAmount: bestAskAmount,
                bidLiquidity: bidLiquidity,
                askLiquidity: askLiquidity,
                totalLiquidity: totalLiquidity,
                
                // Order book data
                totalBids: orderBook.bids.length,
                totalAsks: orderBook.asks.length,
                totalOrders: orderBook.bids.length + orderBook.asks.length,
                bidLevels: bidLevels,
                askLevels: askLevels,
                marketDepth: marketDepth,
                
                // Volume and trading data
                volume24h: volume24h,
                priceChange24h: priceChange24h,
                recentTrades: trades._embedded.records.length,
                
                // Market quality metrics
                priceImpact: priceImpact,
                hasLiquidity: bestBidAmount > 0 && bestAskAmount > 0,
                liquidityScore: this.calculateLiquidityScore(bestBidAmount, bestAskAmount, spreadPercent),
                
                // Metadata
                timestamp: new Date().toISOString(),
                baseAsset: pair.base,
                counterAsset: pair.counter,
                baseType: pair.baseType,
                counterType: pair.counterType,
                baseIssuer: pair.baseIssuer,
                counterIssuer: pair.counterIssuer,
                
                // Raw data for advanced analysis
                raw: orderBook
            };
            
        } catch (error) {
            return {
                pair: `${pair.base}/${pair.counter}`,
                description: pair.description,
                error: error.message,
                timestamp: new Date().toISOString(),
                hasLiquidity: false
            };
        }
    }

    /**
     * Get top 20 assets with real market data
     */
    async getTopAssets() {
        const cacheKey = 'top_assets_real_data';
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            console.log('🔍 Fetching real market data for popular trading pairs...');
            
            const results = [];
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < this.popularPairs.length; i++) {
                const pair = this.popularPairs[i];
                console.log(`🔍 [${i + 1}/${this.popularPairs.length}] Testing ${pair.base}/${pair.counter}...`);
                
                const result = await this.testOrderBook(pair);
                results.push(result);
                
                if (result.error) {
                    console.log(`  ❌ Error: ${result.error}`);
                    errorCount++;
                } else {
                    const liquidityStatus = result.hasLiquidity ? '✅ LIQUID' : '⚠️  ILLIQUID';
                    console.log(`  ${liquidityStatus} Price: $${result.price.toFixed(6)} | Orders: ${result.totalOrders} | Spread: ${result.spreadPercent.toFixed(2)}%`);
                    successCount++;
                }
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Filter for liquid pairs only
            const liquidPairs = results.filter(r => !r.error && r.hasLiquidity);
            
            // Extract unique assets from liquid pairs
            const assets = new Set();
            liquidPairs.forEach(pair => {
                const [base, counter] = pair.pair.split('/');
                assets.add(base);
                assets.add(counter);
            });

            const topAssets = Array.from(assets).map(asset => ({
                code: asset,
                volume: liquidPairs.reduce((sum, pair) => {
                    const [base, counter] = pair.pair.split('/');
                    return sum + (base === asset || counter === asset ? pair.volume24h : 0);
                }, 0)
            })).sort((a, b) => b.volume - a.volume).slice(0, 20);

            const data = {
                assets: topAssets,
                liquidPairs: liquidPairs,
                totalPairs: results.length,
                liquidPairsCount: liquidPairs.length,
                errorPairsCount: errorCount,
                timestamp: new Date().toISOString()
            };

            this.cache.set(cacheKey, data, this.CACHE_TTL.topAssets);
            return data;

        } catch (error) {
            console.error('Error fetching top assets:', error);
            throw new Error(`Failed to fetch top assets: ${error.message}`);
        }
    }

    /**
     * Get comprehensive DEX data
     */
    async getDEXData() {
        const cacheKey = 'dex_data_comprehensive';
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const topAssetsData = await this.getTopAssets();
            
            const dexData = {
                topAssets: topAssetsData.assets,
                validTradingPairs: topAssetsData.liquidPairs,
                marketStats: {
                    totalPairs: topAssetsData.totalPairs,
                    liquidPairs: topAssetsData.liquidPairsCount,
                    errorPairs: topAssetsData.errorPairsCount,
                    liquidityRatio: topAssetsData.liquidPairsCount / topAssetsData.totalPairs
                },
                timestamp: new Date().toISOString()
            };

            this.cache.set(cacheKey, dexData, this.CACHE_TTL.validPairs);
            return dexData;

        } catch (error) {
            console.error('Error fetching DEX data:', error);
            throw new Error(`Failed to fetch DEX data: ${error.message}`);
        }
    }

    /**
     * Check if a trading pair has sufficient liquidity
     */
    async checkPairLiquidity(baseAsset, counterAsset, minLiquidity = 1000) {
        const cacheKey = `liquidity_${baseAsset}_${counterAsset}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            // Find the pair in our popular pairs
            const pair = this.popularPairs.find(p => 
                p.base === baseAsset && p.counter === counterAsset
            );

            if (!pair) {
                return {
                    hasLiquidity: false,
                    reason: 'Pair not found in popular pairs',
                    liquidity: 0
                };
            }

            const result = await this.testOrderBook(pair);
            
            const liquidityData = {
                hasLiquidity: result.hasLiquidity && result.totalLiquidity >= minLiquidity,
                liquidity: result.totalLiquidity || 0,
                bestBidAmount: result.bestBidAmount || 0,
                bestAskAmount: result.bestAskAmount || 0,
                spread: result.spreadPercent || 0,
                error: result.error || null
            };

            this.cache.set(cacheKey, liquidityData, this.CACHE_TTL.liquidity);
            return liquidityData;

        } catch (error) {
            console.error(`Error checking liquidity for ${baseAsset}/${counterAsset}:`, error);
            return {
                hasLiquidity: false,
                reason: error.message,
                liquidity: 0
            };
        }
    }

    /**
     * Generate valid trading pairs with sufficient liquidity
     */
    async generateValidTradingPairs(minLiquidity = 1000) {
        const cacheKey = 'valid_trading_pairs';
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const dexData = await this.getDEXData();
            const validPairs = dexData.validTradingPairs.filter(pair => 
                pair.totalLiquidity >= minLiquidity
            );

            const data = {
                pairs: validPairs,
                count: validPairs.length,
                minLiquidity: minLiquidity,
                timestamp: new Date().toISOString()
            };

            this.cache.set(cacheKey, data, this.CACHE_TTL.validPairs);
            return data;

        } catch (error) {
            console.error('Error generating valid trading pairs:', error);
            throw new Error(`Failed to generate valid trading pairs: ${error.message}`);
        }
    }

    /**
     * Get market overview with key statistics
     */
    async getMarketOverview() {
        try {
            const dexData = await this.getDEXData();
            const validPairs = await this.generateValidTradingPairs();

            return {
                totalAssets: dexData.topAssets.length,
                totalPairs: dexData.marketStats.totalPairs,
                liquidPairs: dexData.marketStats.liquidPairs,
                validPairs: validPairs.count,
                liquidityRatio: dexData.marketStats.liquidityRatio,
                topAssets: dexData.topAssets.slice(0, 10),
                mostActivePairs: dexData.validTradingPairs
                    .sort((a, b) => b.totalOrders - a.totalOrders)
                    .slice(0, 10),
                tightestSpreads: dexData.validTradingPairs
                    .filter(p => p.spreadPercent > 0)
                    .sort((a, b) => a.spreadPercent - b.spreadPercent)
                    .slice(0, 10),
                highestVolume: dexData.validTradingPairs
                    .sort((a, b) => b.volume24h - a.volume24h)
                    .slice(0, 10),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error getting market overview:', error);
            throw new Error(`Failed to get market overview: ${error.message}`);
        }
    }

    /**
     * Clear cache for specific data type
     */
    clearCache(dataType = null) {
        if (dataType) {
            this.cache.del(dataType);
        } else {
            this.cache.flushAll();
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            keys: this.cache.keys(),
            stats: this.cache.getStats(),
            ttl: this.CACHE_TTL
        };
    }
}

module.exports = TopAssetsService;