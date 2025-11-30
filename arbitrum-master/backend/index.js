const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');

// Import services
const WebSocketService = require('./services/websocketService');
const RealtimeCacheService = require('./services/realtimeCacheService');

// Import controllers
const RealtimeController = require('./controllers/realtimeController');

// Import routes
const topAssetsRoutes = require('./routes/topAssetsRoutes');
const fastArbitrageRoutes = require('./routes/fastArbitrageRoutes');
const sorobanRoutes = require('./routes/sorobanRoutes');
const realtimeRoutes = require('./routes/realtimeRoutes');

// Import utilities
const logger = require('./utils/logger');
const rateLimiter = require('./utils/rateLimiter');
const cacheManager = require('./utils/cache');

class StellarArbitrageBot {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = process.env.PORT || 5000;
        this.isProduction = process.env.NODE_ENV === 'production';
        
        // Services
        this.websocketService = null;
        this.cacheService = null;
        this.realtimeController = null;
        
        // Database
        this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stellar-arbitrage-bot';
        
        this.initialize();
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            logger.info('🚀 Initializing Stellar Arbitrage Bot...');
            
            // Setup middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Initialize services
            await this.initializeServices();
            
            // Connect to database
            await this.connectDatabase();
            
            // Start server
            await this.startServer();
            
            logger.info('✅ Stellar Arbitrage Bot initialized successfully');
            
        } catch (error) {
            logger.error('❌ Failed to initialize application:', error);
            process.exit(1);
        }
    }

    /**
     * Setup middleware
     */
    setupMiddleware() {
        logger.info('🔧 Setting up middleware...');
        
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "ws:", "wss:", "https://horizon-testnet.stellar.org", "https://api.stellar.expert"]
                }
            }
        }));
        
        // CORS configuration
        this.app.use(cors({
            origin: this.isProduction ? 
                ['https://yourdomain.com'] : 
                ['http://localhost:3000', 'http://127.0.0.1:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));
        
        // Compression
        this.app.use(compression());
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Request logging
        this.app.use((req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                logger.logRequest(req, res, duration);
            });
            
            next();
        });
        
        // Rate limiting
        this.app.use('/api/', rateLimiter.apiLimiter());
        this.app.use('/api/fast-arbitrage/run', rateLimiter.arbitrageLimiter());
        this.app.use('/api/soroban/submit-transaction', rateLimiter.tradeLimiter());
        
        // Trust proxy for accurate IP addresses
        this.app.set('trust proxy', 1);
        
        logger.info('✅ Middleware setup complete');
    }

    /**
     * Setup routes
     */
    setupRoutes() {
        logger.info('🛣️ Setting up routes...');
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });
        
        // API routes
        this.app.use('/api/top-assets', topAssetsRoutes);
        this.app.use('/api/fast-arbitrage', fastArbitrageRoutes);
        this.app.use('/api/soroban', sorobanRoutes);
        this.app.use('/api/realtime', realtimeRoutes);
        
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Stellar Arbitrage Bot API',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    topAssets: '/api/top-assets',
                    arbitrage: '/api/fast-arbitrage',
                    soroban: '/api/soroban',
                    realtime: '/api/realtime',
                    websocket: '/ws'
                },
                documentation: 'https://github.com/your-repo/stellar-arbitrage-bot',
                timestamp: new Date().toISOString()
            });
        });
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                message: `The endpoint ${req.originalUrl} does not exist`,
                timestamp: new Date().toISOString()
            });
        });
        
        logger.info('✅ Routes setup complete');
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        logger.info('🛡️ Setting up error handling...');
        
        // Global error handler
        this.app.use((error, req, res, next) => {
            logger.error('Unhandled error:', {
                error: error.message,
                stack: error.stack,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip
            });
            
            res.status(error.status || 500).json({
                success: false,
                error: this.isProduction ? 'Internal server error' : error.message,
                ...(this.isProduction ? {} : { stack: error.stack }),
                timestamp: new Date().toISOString()
            });
        });
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
        
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
        
        logger.info('✅ Error handling setup complete');
    }

    /**
     * Initialize services
     */
    async initializeServices() {
        logger.info('🔧 Initializing services...');
        
        // Initialize cache service
        this.cacheService = new RealtimeCacheService();
        this.cacheService.startOptimization();
        
        // Initialize WebSocket service
        this.websocketService = new WebSocketService(this.server);
        this.websocketService.initialize();
        
        // Initialize realtime controller with WebSocket service
        this.realtimeController = new RealtimeController();
        this.realtimeController.setWebSocketService(this.websocketService);
        
        // Initialize application caches
        cacheManager.initializeApplicationCaches();
        
        // Setup WebSocket event handlers
        this.setupWebSocketEvents();
        
        logger.info('✅ Services initialized');
    }

    /**
     * Setup WebSocket event handlers
     */
    setupWebSocketEvents() {
        this.websocketService.on('clientConnected', (client) => {
            logger.info(`🔗 Client connected: ${client.id}`);
        });
        
        this.websocketService.on('clientDisconnected', (client) => {
            logger.info(`🔌 Client disconnected: ${client.id}`);
        });
        
        this.websocketService.on('clientSubscribed', (data) => {
            logger.info(`📡 Client ${data.clientId} subscribed to: ${data.channel}`);
        });
        
        this.websocketService.on('clientUnsubscribed', (data) => {
            logger.info(`📡 Client ${data.clientId} unsubscribed from: ${data.channel}`);
        });
        
        this.websocketService.on('error', (error) => {
            logger.error('WebSocket error:', error);
        });
    }

    /**
     * Connect to database
     */
    async connectDatabase() {
        try {
            logger.info('🗄️ Connecting to MongoDB...');
            
            await mongoose.connect(this.mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            
            logger.info('✅ Connected to MongoDB');
            
            // Setup database event handlers
            mongoose.connection.on('error', (error) => {
                logger.error('MongoDB connection error:', error);
            });
            
            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
            });
            
            mongoose.connection.on('reconnected', () => {
                logger.info('MongoDB reconnected');
            });
            
        } catch (error) {
            logger.error('❌ Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    /**
     * Start server
     */
    async startServer() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (error) => {
                if (error) {
                    logger.error('❌ Failed to start server:', error);
                    reject(error);
                } else {
                    logger.info(`🚀 Server running on port ${this.port}`);
                    logger.info(`📊 API available at: http://localhost:${this.port}`);
                    logger.info(`🔌 WebSocket available at: ws://localhost:${this.port}/ws`);
                    logger.info(`🌐 Environment: ${this.isProduction ? 'production' : 'development'}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        logger.info('🛑 Shutting down server...');
        
        try {
            // Close WebSocket connections
            if (this.websocketService) {
                this.websocketService.shutdown();
            }
            
            // Close cache service
            if (this.cacheService) {
                this.cacheService.shutdown();
            }
            
            // Close database connection
            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.close();
                logger.info('✅ Database connection closed');
            }
            
            // Close HTTP server
            this.server.close(() => {
                logger.info('✅ Server shutdown complete');
                process.exit(0);
            });
            
            // Force exit after 10 seconds
            setTimeout(() => {
                logger.error('❌ Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
            
        } catch (error) {
            logger.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }

    /**
     * Get server statistics
     */
    getStats() {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            websocket: this.websocketService ? this.websocketService.getStats() : null,
            cache: this.cacheService ? this.cacheService.getCacheStats() : null,
            database: {
                readyState: mongoose.connection.readyState,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                name: mongoose.connection.name
            }
        };
    }
}

// Create and start the application
const app = new StellarArbitrageBot();

// Export for testing
module.exports = app;
