const express = require('express');
const FastArbitrageController = require('../controllers/fastArbitrageController');

const router = express.Router();
const fastArbitrageController = new FastArbitrageController();

/**
 * @route POST /api/fast-arbitrage/run
 * @desc Run fast arbitrage analysis
 * @access Public
 */
router.post('/run', (req, res) => {
    fastArbitrageController.runAnalysis(req, res);
});

/**
 * @route GET /api/fast-arbitrage/opportunities
 * @desc Get cached arbitrage opportunities
 * @access Public
 */
router.get('/opportunities', (req, res) => {
    fastArbitrageController.getOpportunities(req, res);
});

/**
 * @route POST /api/fast-arbitrage/validate
 * @desc Validate a specific arbitrage opportunity
 * @access Public
 */
router.post('/validate', (req, res) => {
    fastArbitrageController.validateOpportunity(req, res);
});

/**
 * @route POST /api/fast-arbitrage/prices
 * @desc Get current prices for a trading path
 * @access Public
 */
router.post('/prices', (req, res) => {
    fastArbitrageController.getCurrentPrices(req, res);
});

/**
 * @route GET /api/fast-arbitrage/status
 * @desc Get analysis status and statistics
 * @access Public
 */
router.get('/status', (req, res) => {
    fastArbitrageController.getAnalysisStatus(req, res);
});

/**
 * @route GET /api/fast-arbitrage/config
 * @desc Get analysis configuration
 * @access Public
 */
router.get('/config', (req, res) => {
    fastArbitrageController.getConfig(req, res);
});

/**
 * @route PUT /api/fast-arbitrage/config
 * @desc Update analysis configuration
 * @access Public
 */
router.put('/config', (req, res) => {
    fastArbitrageController.updateConfig(req, res);
});

/**
 * @route GET /api/fast-arbitrage/history
 * @desc Get analysis history
 * @access Public
 */
router.get('/history', (req, res) => {
    fastArbitrageController.getAnalysisHistory(req, res);
});

/**
 * @route DELETE /api/fast-arbitrage/cache
 * @desc Clear arbitrage cache
 * @access Public
 */
router.delete('/cache', (req, res) => {
    fastArbitrageController.clearCache(req, res);
});

/**
 * @route GET /api/fast-arbitrage/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
    fastArbitrageController.healthCheck(req, res);
});

module.exports = router;
