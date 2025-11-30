module.exports = {
    // Stellar Network Configuration
    network: {
        // Testnet configuration (default)
        testnet: {
            horizonUrl: 'https://horizon-testnet.stellar.org',
            networkPassphrase: 'Test SDF Network ; September 2015',
            friendbotUrl: 'https://friendbot.stellar.org',
            sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
            sorobanNetworkPassphrase: 'Test SDF Network ; September 2015'
        },
        
        // Mainnet configuration
        mainnet: {
            horizonUrl: 'https://horizon.stellar.org',
            networkPassphrase: 'Public Global Stellar Network ; September 2015',
            sorobanRpcUrl: 'https://soroban-mainnet.stellar.org',
            sorobanNetworkPassphrase: 'Public Global Stellar Network ; September 2015'
        }
    },
    
    // Current network (change to 'mainnet' for production)
    currentNetwork: process.env.STELLAR_NETWORK || 'testnet',
    
    // Asset Configuration
    assets: {
        // Native Stellar asset
        XLM: {
            code: 'XLM',
            type: 'native',
            issuer: null,
            decimals: 7
        },
        
        // Major assets with their issuers
        USDC: {
            code: 'USDC',
            type: 'credit_alphanum4',
            issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            decimals: 7
        },
        
        USDT: {
            code: 'USDT',
            type: 'credit_alphanum4',
            issuer: 'GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROQDIEDF43RLHOPUZQX3MK2V',
            decimals: 7
        },
        
        BTC: {
            code: 'BTC',
            type: 'credit_alphanum4',
            issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF',
            decimals: 7
        },
        
        ETH: {
            code: 'ETH',
            type: 'credit_alphanum4',
            issuer: 'GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYEFLFKRQ76D6D3RSPZXHESM6YGFU',
            decimals: 7
        },
        
        AQUA: {
            code: 'AQUA',
            type: 'credit_alphanum4',
            issuer: 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',
            decimals: 7
        },
        
        yXLM: {
            code: 'yXLM',
            type: 'credit_alphanum4',
            issuer: 'GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55',
            decimals: 7
        },
        
        SHX: {
            code: 'SHX',
            type: 'credit_alphanum4',
            issuer: 'GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH',
            decimals: 7
        },
        
        VELO: {
            code: 'VELO',
            type: 'credit_alphanum4',
            issuer: 'GAB7STHVD5BDH3EEYXPI3OM7PCS4VZPYR6VEX3RPKHYN5S4TVM6XGQ2O',
            decimals: 7
        },
        
        XRP: {
            code: 'XRP',
            type: 'credit_alphanum4',
            issuer: 'GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYEFLFKRQ76D6D3RSPZXHESM6YGFU',
            decimals: 7
        }
    },
    
    // DEX Configuration
    dex: {
        // StellarX API endpoints
        stellarX: {
            apiUrl: 'https://api.stellarx.com/api',
            marketsEndpoint: '/markets',
            assetsEndpoint: '/assets',
            orderBookEndpoint: '/orderbook'
        },
        
        // Stellar Expert API
        stellarExpert: {
            apiUrl: 'https://api.stellar.expert/explorer/public',
            marketsEndpoint: '/markets',
            assetsEndpoint: '/assets',
            statsEndpoint: '/stats'
        },
        
        // Minimum liquidity thresholds
        liquidity: {
            minLiquidity: 1000, // Minimum liquidity units
            minOrderBookDepth: 10, // Minimum order book depth
            maxSlippage: 0.01, // 1% maximum slippage
            liquidityScoreThreshold: 0.1 // Minimum liquidity score
        }
    },
    
    // Arbitrage Configuration
    arbitrage: {
        // Profit thresholds
        minProfitThreshold: 0.001, // 0.1% minimum profit
        minProfitXLM: 0.1, // Minimum profit in XLM
        
        // Trading limits
        maxTradeAmount: 10000, // Maximum trade amount in XLM
        maxExecutableAmount: 1000, // Maximum executable amount per trade
        
        // Analysis settings
        maxPathLength: 4, // Maximum arbitrage path length
        analysisTimeout: 30000, // 30 seconds analysis timeout
        priceUpdateInterval: 5000, // 5 seconds price update interval
        
        // Risk management
        maxSlippage: 0.01, // 1% maximum slippage
        maxGasPrice: 0.001, // Maximum gas price in XLM
        maxExecutionTime: 60000, // 60 seconds maximum execution time
    },
    
    // Soroban Configuration
    soroban: {
        // Contract addresses (testnet)
        contracts: {
            arbitrage: process.env.ARBITRAGE_CONTRACT_ADDRESS || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3X3E',
            token: process.env.TOKEN_CONTRACT_ADDRESS || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3X3E'
        },
        
        // Transaction settings
        transaction: {
            baseFee: 100000, // 0.1 XLM base fee
            timeout: 30, // 30 seconds timeout
            maxRetries: 3,
            retryDelay: 1000 // 1 second retry delay
        },
        
        // Function names
        functions: {
            executeArbitrage: 'execute_arbitrage_with_slippage',
            getBalance: 'balance',
            transfer: 'transfer'
        }
    },
    
    // API Configuration
    api: {
        // Rate limiting
        rateLimits: {
            general: {
                windowMs: 60000, // 1 minute
                maxRequests: 100
            },
            arbitrage: {
                windowMs: 300000, // 5 minutes
                maxRequests: 10
            },
            trading: {
                windowMs: 60000, // 1 minute
                maxRequests: 5
            }
        },
        
        // Timeouts
        timeouts: {
            request: 30000, // 30 seconds
            analysis: 60000, // 60 seconds
            execution: 120000 // 2 minutes
        }
    },
    
    // Cache Configuration
    cache: {
        // TTL settings (in seconds)
        ttl: {
            topAssets: 1800, // 30 minutes
            liquidity: 300, // 5 minutes
            orderBooks: 60, // 1 minute
            arbitrage: 120, // 2 minutes
            trades: 300, // 5 minutes
            marketData: 30 // 30 seconds
        },
        
        // Memory limits
        memory: {
            maxSize: 100 * 1024 * 1024, // 100MB
            compressionThreshold: 1024 // 1KB
        }
    },
    
    // WebSocket Configuration
    websocket: {
        port: 5000,
        path: '/ws',
        heartbeatInterval: 30000, // 30 seconds
        clientTimeout: 60000, // 60 seconds
        maxClients: 100
    },
    
    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        directory: './logs',
        maxFiles: 7, // Keep 7 days of logs
        maxSize: '10MB'
    },
    
    // Security Configuration
    security: {
        // JWT settings
        jwt: {
            secret: process.env.JWT_SECRET || 'your-secret-key',
            expiresIn: '24h'
        },
        
        // CORS settings
        cors: {
            origin: process.env.NODE_ENV === 'production' ? 
                ['https://yourdomain.com'] : 
                ['http://localhost:3000', 'http://127.0.0.1:3000'],
            credentials: true
        },
        
        // Rate limiting
        rateLimit: {
            windowMs: 60000, // 1 minute
            maxRequests: 100
        }
    },
    
    // Database Configuration
    database: {
        mongodb: {
            uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/stellar-arbitrage-bot',
            options: {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000
            }
        }
    },
    
    // Environment Configuration
    environment: {
        isProduction: process.env.NODE_ENV === 'production',
        isDevelopment: process.env.NODE_ENV === 'development',
        isTest: process.env.NODE_ENV === 'test',
        port: process.env.PORT || 5000,
        host: process.env.HOST || 'localhost'
    },
    
    // Feature Flags
    features: {
        realtimeUpdates: true,
        websocketSupport: true,
        databaseLogging: true,
        emailNotifications: false,
        advancedAnalytics: true,
        riskManagement: true,
        autoExecution: false
    }
};
