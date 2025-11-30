const express = require('express');
const RealtimeController = require('../controllers/realtimeController');

const router = express.Router();
const realtimeController = new RealtimeController();

/**
 * @route GET /api/realtime/market-data/:pair
 * @desc Get real-time market data for a trading pair
 * @access Public
 */
router.get('/market-data/:pair', (req, res) => {
    realtimeController.getMarketData(req, res);
});

/**
 * @route GET /api/realtime/order-book/:pair
 * @desc Get real-time order book for a trading pair
 * @access Public
 */
router.get('/order-book/:pair', (req, res) => {
    realtimeController.getOrderBook(req, res);
});

/**
 * @route GET /api/realtime/arbitrage-opportunities
 * @desc Get real-time arbitrage opportunities
 * @access Public
 */
router.get('/arbitrage-opportunities', (req, res) => {
    realtimeController.getArbitrageOpportunities(req, res);
});

/**
 * @route GET /api/realtime/websocket-info
 * @desc Get WebSocket connection information
 * @access Public
 */
router.get('/websocket-info', (req, res) => {
    realtimeController.getWebSocketInfo(req, res);
});

/**
 * @route GET /api/realtime/cache-stats
 * @desc Get cache statistics
 * @access Public
 */
router.get('/cache-stats', (req, res) => {
    realtimeController.getCacheStats(req, res);
});

/**
 * @route DELETE /api/realtime/cache
 * @desc Clear cache (optional type parameter)
 * @access Public
 */
router.delete('/cache', (req, res) => {
    realtimeController.clearCache(req, res);
});

/**
 * @route POST /api/realtime/start
 * @desc Start real-time updates
 * @access Public
 */
router.post('/start', (req, res) => {
    realtimeController.startRealtimeUpdates(req, res);
});

/**
 * @route POST /api/realtime/stop
 * @desc Stop real-time updates
 * @access Public
 */
router.post('/stop', (req, res) => {
    realtimeController.stopRealtimeUpdates(req, res);
});

/**
 * @route POST /api/realtime/broadcast
 * @desc Broadcast message to WebSocket clients
 * @access Public
 */
router.post('/broadcast', (req, res) => {
    realtimeController.broadcastMessage(req, res);
});

/**
 * @route GET /api/realtime/system-status
 * @desc Get real-time system status
 * @access Public
 */
router.get('/system-status', (req, res) => {
    realtimeController.getSystemStatus(req, res);
});

/**
 * @route GET /api/realtime/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
    realtimeController.healthCheck(req, res);
});

module.exports = router;
